import { DRAFT_SYSTEM_PROMPT_VERSION } from "../../../../prompts/whatsapp-umrah/draft-system-v1";
import { retrieveKbChunks, type RetrievedChunk } from "../kb/retrieve";
import { containsSensitiveData, isOptOutMessage } from "./pre-guards";
import { guessLanguage } from "./language";
import { HOLDING_MESSAGES, SENSITIVE_DATA_REPLIES } from "./fixed-replies";
import { draftReply, type DraftResult } from "./draft";
import { escalateDraft } from "./escalate";
import { runGuards } from "./guards";
import type { AgentDraft, GuardFailure, Language, PipelineResult, PromptRunRecord } from "./types";

const GROQ_MODEL = () => process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const CLAUDE_MODEL = () => process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

// $/1M tokens, verified against console.groq.com/docs/models and
// claude.com/pricing (2026-09-28, see docs/unit-economics.md) - only for
// the two default models this product actually ships with. An
// env-configured different model just gets no cost estimate rather than a
// silently wrong one guessed from these numbers.
const KNOWN_PRICES_PER_1M: Record<string, { input: number; output: number }> = {
  "openai/gpt-oss-20b": { input: 0.075, output: 0.3 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};

function estimateCostCents(model: string, inputTokens?: number, outputTokens?: number): number | undefined {
  const price = KNOWN_PRICES_PER_1M[model];
  if (!price || inputTokens === undefined || outputTokens === undefined) return undefined;
  const usd = (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
  return Math.round(usd * 100 * 100) / 100; // cents, 2 decimal places - these calls cost fractions of a cent
}

function toPromptRunRecord(stage: "DRAFT" | "ESCALATION", model: string, result: DraftResult, guardsTriggered: string[]): PromptRunRecord {
  const inputTokens = result.ok ? result.promptTokens : undefined;
  const outputTokens = result.ok ? result.completionTokens : undefined;
  return {
    stage,
    model,
    promptVersion: DRAFT_SYSTEM_PROMPT_VERSION,
    inputTokens,
    outputTokens,
    latencyMs: result.latencyMs,
    costEstimateCents: estimateCostCents(model, inputTokens, outputTokens),
    guardsTriggered,
    error: result.ok ? undefined : result.error,
  };
}

/* Orchestrates one inbound message: pre-guards -> retrieval -> Groq draft
   -> post-guards -> Claude escalation on failure -> handoff if still
   failing. See CLAUDE.md and the spec's pipeline section. Callers (the
   webhook, the simulator) own everything DB-specific - conversation
   history lookup, usage metering, sending the result, logging
   WaPromptRun - this module is pure orchestration over already-fetched
   inputs, so the simulator can call it with zero WhatsApp involvement. */

function formatKbContext(chunks: RetrievedChunk[]): string {
  return chunks.map((c) => `[${c.id}] ${c.content}`).join("\n\n");
}

export type PipelineInput = {
  agencyId: string;
  customerMessage: string;
  conversationHistory?: string; // caller-formatted, e.g. "Customer: ...\nAI: ..."
  detectedLanguage?: Language; // fallback if a guard fires before the model reports one
};

export async function runAgentPipeline(input: PipelineInput): Promise<PipelineResult> {
  const fallbackLanguage: Language = input.detectedLanguage ?? "en";

  // Pre-guards: cheap, no LLM.
  if (isOptOutMessage(input.customerMessage)) {
    return { action: "handoff", reason: "customer opted out", holdingMessage: "", language: fallbackLanguage, intent: null, leadFields: null, guardsTriggered: ["opt_out"], promptRuns: [] };
  }
  if (containsSensitiveData(input.customerMessage)) {
    // CLAUDE.md 3.1: say the team will collect it securely, and hand off. In the customer's own language, read
    // from the message itself since the model hasn't run.
    const language = input.detectedLanguage ?? guessLanguage(input.customerMessage);
    return {
      action: "handoff",
      reason: "customer sent what looks like a passport or card number",
      holdingMessage: SENSITIVE_DATA_REPLIES[language],
      language,
      intent: "other",
      leadFields: null,
      guardsTriggered: ["sensitive_data"],
      promptRuns: [],
    };
  }

  const retrieval = await retrieveKbChunks(input.agencyId, input.customerMessage);
  const kbContext = retrieval.ok ? formatKbContext(retrieval.chunks) : "";
  const draftInput = { customerMessage: input.customerMessage, kbContext, conversationHistory: input.conversationHistory ?? "" };
  const promptRuns: PromptRunRecord[] = [];

  const first = await draftReply(draftInput);
  if (!first.ok) {
    promptRuns.push(toPromptRunRecord("DRAFT", GROQ_MODEL(), first, ["draft_error"]));
    return handoffResult("draft failed: " + first.error, fallbackLanguage, ["draft_error"], null, promptRuns);
  }
  const firstFailures = runGuards(first.draft, kbContext);
  promptRuns.push(toPromptRunRecord("DRAFT", GROQ_MODEL(), first, guardNames(firstFailures)));
  if (firstFailures.length === 0) {
    return replyResult(first.draft, "groq:" + GROQ_MODEL(), [], promptRuns);
  }

  const escalated = await escalateDraft(draftInput, firstFailures);
  if (!escalated.ok) {
    promptRuns.push(toPromptRunRecord("ESCALATION", CLAUDE_MODEL(), escalated, guardNames(firstFailures)));
    // Groq's draft itself still carries real lead info even though it
    // failed a guard (e.g. a booking request that correctly hands off but
    // still stated the customer's budget/dates) - see leads.ts on why
    // this must not be thrown away.
    return handoffResult("escalation failed: " + escalated.error, first.draft.language, guardNames(firstFailures), first.draft, promptRuns);
  }
  const secondFailures = runGuards(escalated.draft, kbContext);
  promptRuns.push(toPromptRunRecord("ESCALATION", CLAUDE_MODEL(), escalated, guardNames(secondFailures)));
  if (secondFailures.length === 0) {
    return replyResult(escalated.draft, "claude:" + CLAUDE_MODEL(), guardNames(firstFailures), promptRuns);
  }

  return handoffResult(
    escalated.draft.handoffReason || secondFailures.map((f) => f.detail).join("; "),
    escalated.draft.language,
    [...guardNames(firstFailures), ...guardNames(secondFailures)],
    escalated.draft,
    promptRuns
  );
}

function guardNames(failures: GuardFailure[]): string[] {
  return failures.map((f) => f.guard);
}

function replyResult(draft: AgentDraft, model: string, guardsTriggered: string[], promptRuns: PromptRunRecord[]): PipelineResult {
  return { action: "reply", text: draft.reply, language: draft.language, intent: draft.intent, leadFields: draft.leadFields, model, guardsTriggered, promptRuns };
}

function handoffResult(reason: string, language: Language, guardsTriggered: string[], draft: AgentDraft | null, promptRuns: PromptRunRecord[]): PipelineResult {
  return {
    action: "handoff",
    reason,
    holdingMessage: HOLDING_MESSAGES[language],
    language,
    intent: draft?.intent ?? null,
    leadFields: draft?.leadFields ?? null,
    guardsTriggered,
    promptRuns,
  };
}
