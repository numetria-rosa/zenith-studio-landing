import { DRAFT_SYSTEM_PROMPT_VERSION } from "../../../../prompts/whatsapp-umrah/draft-system-v1";
import { retrieveKbChunks, type RetrievedChunk } from "../kb/retrieve";
import { containsSensitiveData, isOptOutMessage } from "./pre-guards";
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

const HOLDING_MESSAGES: Record<Language, string> = {
  en: "Thanks for your message. Someone from our team will get back to you shortly.",
  ar: "شكرًا لرسالتك. سيتواصل معك أحد أفراد فريقنا قريبًا.",
  tr: "Mesajınız için teşekkürler. Ekibimizden biri kısa süre içinde size dönecek.",
  ur: "آپ کے پیغام کا شکریہ۔ ہماری ٹیم کا کوئی رکن جلد آپ سے رابطہ کرے گا۔",
};

const SENSITIVE_DATA_REPLIES: Record<Language, string> = {
  en: "For your security, please don't send documents or card details here. Our team will collect anything needed securely.",
  ar: "لأمانك، يرجى عدم إرسال المستندات أو تفاصيل البطاقة هنا. سيقوم فريقنا بجمع أي شيء مطلوب بشكل آمن.",
  tr: "Güvenliğiniz için lütfen buraya belge veya kart bilgisi göndermeyin. Ekibimiz gerekenleri güvenli şekilde toplayacaktır.",
  ur: "آپ کی حفاظت کے لیے، براہ کرم دستاویزات یا کارڈ کی تفصیلات یہاں نہ بھیجیں۔ ہماری ٹیم محفوظ طریقے سے ضرورت کی چیزیں جمع کرے گی۔",
};

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
    return {
      action: "reply",
      text: SENSITIVE_DATA_REPLIES[fallbackLanguage],
      language: fallbackLanguage,
      intent: "other",
      leadFields: null,
      model: "pre-guard",
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
