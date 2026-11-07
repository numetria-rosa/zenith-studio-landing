import { DRAFT_SYSTEM_PROMPT_VERSION } from "../../../../prompts/whatsapp-umrah/draft-system-v4";
import { loadKbChunks, type RetrievedChunk } from "../kb/retrieve";
import { loadOccasions, occasionsPrompt } from "../occasions";
import { loadQuotes } from "../kb/quotes";
import { quoteRequest } from "../kb/quote-sentence";
import { containsSensitiveData, isIdentityQuestion, isOptOutMessage } from "./pre-guards";
import { plainHandoffReason, TECHNICAL_PROBLEM_REASON } from "./reasons";
import { guessLanguage } from "./language";
import { applyPersona, LANGUAGE_NAMES, loadPersona, personaPrompt, replyLanguageAllowed, type Persona } from "./persona";
import { HOLDING_FOLLOW_UPS, HOLDING_MESSAGES, identityReply, OFF_TOPIC_REPLIES, SENSITIVE_DATA_REPLIES } from "./fixed-replies";
import { draftReply, type DraftResult } from "./draft";
import { escalateDraft } from "./escalate";
import { runGuards } from "./guards";
import { db } from "@/lib/db";
import { HARD_HANDOFF_INTENTS, type AgentDraft, type LeadFields, type GuardFailure, type KbSource, type Language, type PipelineResult, type PromptRunRecord } from "./types";

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
  /** Which model writes the first draft. Groq by default; "claude" is for comparing the two (the retry is always Claude). */
  firstDrafter?: "groq" | "claude";
  knownFields?: LeadFields; // the same facts, structured (package preference, travellers), to price from
  knownDetails?: string; // what earlier turns of this chat already told us, e.g. "2 travellers, Ramadan 2027" (see leadSummaryLine)
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

  const persona = await loadPersona(input.agencyId);
  if (isIdentityQuestion(input.customerMessage)) {
    const language = input.detectedLanguage ?? guessLanguage(input.customerMessage);
    return fixedReplyResult(identityReply(language, persona.agentName, persona.agencyName), language, "identity_question", "identity_question", persona, []);
  }

  const retrieval = await loadKbChunks(input.agencyId, input.customerMessage);
  const kbContext = retrieval.ok ? formatKbContext(retrieval.chunks) : "";
  // Everything the model may use besides the knowledge base chunks: the worked-out quotes table, the agency's
  // occasions calendar, and what this customer has already told us. All of it is the agency's or the customer's own
  // facts, so a reply may quote it (it joins the text the grounding check reads).
  const known = input.knownDetails ? `WHAT THE CUSTOMER HAS ALREADY TOLD US (do not ask for these again): ${input.knownDetails}.` : "";
  const quotes = await loadQuotes(input.agencyId);
  // When the message and what we already know name a package and a party size, the quote is worked out here and the
  // model is told to use exactly it (and the guards check the reply against the same numbers).
  const request = quoteRequest({ message: input.customerMessage, knownPackage: input.knownFields?.packagePreference, knownTravellers: input.knownFields?.travelers }, quotes.packages);
  const quoteLine = request ? `QUOTE FOR THIS CUSTOMER (worked out in code: when you state a total, deposit or balance for them, use exactly these figures): ${request.sentence}` : "";
  const extraContext = [quotes.text, quoteLine, occasionsPrompt(await loadOccasions(input.agencyId)), known].filter(Boolean).join("\n\n");
  const draftInput = { customerMessage: input.customerMessage, kbContext, extraContext, conversationHistory: input.conversationHistory ?? "", persona: personaPrompt(persona) };
  const promptRuns: PromptRunRecord[] = [];

  let drafter: "groq" | "claude" = input.firstDrafter ?? "groq";
  let drafterModel = drafter === "claude" ? CLAUDE_MODEL() : GROQ_MODEL();
  let first = drafter === "claude" ? await escalateDraft(draftInput, []) : await draftReply(draftInput);
  // Groq is the cheap first drafter, but it can be down or rate limited (its free tier allows ~200,000 tokens a day,
  // about 40 of our messages). A customer must never get a "technical problem" because of that: Claude drafts instead.
  // Both failing is the only case that hands off. The failed Groq call is still logged, for the owner's stats and ours.
  if (!first.ok && drafter === "groq") {
    promptRuns.push(toPromptRunRecord("DRAFT", drafterModel, first, ["draft_error"]));
    console.error("[whatsapp-umrah pipeline] Groq draft failed, drafting with Claude instead:", first.error);
    drafterModel = CLAUDE_MODEL();
    first = await escalateDraft(draftInput, []);
    drafter = "claude";
  }
  if (!first.ok) {
    promptRuns.push(toPromptRunRecord("DRAFT", drafterModel, first, ["draft_error"]));
    console.error("[whatsapp-umrah pipeline] draft failed:", first.error); // the detail is for us; the owner gets a plain reason
    return handoffResult(TECHNICAL_PROBLEM_REASON, fallbackLanguage, ["draft_error"], null, promptRuns);
  }
  const firstFailures = runGuards(first.draft, kbContext, input.customerMessage, extraContext, quotes.perPerson, quotes.packages);
  promptRuns.push(toPromptRunRecord("DRAFT", drafterModel, first, guardNames(firstFailures)));
  // A language the agency has switched off goes to a person (no retry: a second draft would be in the same language).
  if (!replyLanguageAllowed(first.draft.language, persona)) return languageOffResult(first.draft, persona, promptRuns);
  // Two kinds of message are answered by fixed text, not by what the model wrote: "are you a bot?" (never claim to
  // be human) and anything off-topic (a polite refusal, because Meta bans open-ended chat). Neither hands off.
  const lang = first.draft.language;
  if (first.draft.intent === "identity_question") return fixedReplyResult(identityReply(lang, persona.agentName, persona.agencyName), lang, "identity_question", "identity_question", persona, promptRuns);
  if (first.draft.intent === "off_topic") return fixedReplyResult(OFF_TOPIC_REPLIES[lang], lang, "off_topic", "off_topic", persona, promptRuns);
  if (firstFailures.length === 0) {
    return replyResult(first.draft, `${drafter}:${drafterModel}`, [], promptRuns, persona, await resolveSources(input.agencyId, first.draft.kbIdsUsed));
  }

  const escalated = await escalateDraft(draftInput, firstFailures);
  if (!escalated.ok) {
    promptRuns.push(toPromptRunRecord("ESCALATION", CLAUDE_MODEL(), escalated, guardNames(firstFailures)));
    // Groq's draft itself still carries real lead info even though it
    // failed a guard (e.g. a booking request that correctly hands off but
    // still stated the customer's budget/dates) - see leads.ts on why
    // this must not be thrown away.
    console.error("[whatsapp-umrah pipeline] escalation failed:", escalated.error);
    return handoffResult(plainHandoffReason(first.draft, firstFailures), first.draft.language, guardNames(firstFailures), first.draft, promptRuns);
  }
  const secondFailures = runGuards(escalated.draft, kbContext, input.customerMessage, extraContext, quotes.perPerson, quotes.packages);
  promptRuns.push(toPromptRunRecord("ESCALATION", CLAUDE_MODEL(), escalated, guardNames(secondFailures)));
  if (secondFailures.length === 0) {
    return replyResult(escalated.draft, "claude:" + CLAUDE_MODEL(), guardNames(firstFailures), promptRuns, persona, await resolveSources(input.agencyId, escalated.draft.kbIdsUsed));
  }

  return handoffResult(
    plainHandoffReason(escalated.draft, secondFailures),
    escalated.draft.language,
    [...guardNames(firstFailures), ...guardNames(secondFailures)],
    escalated.draft,
    promptRuns
  );
}

function guardNames(failures: GuardFailure[]): string[] {
  return failures.map((f) => f.guard);
}

function replyResult(draft: AgentDraft, model: string, guardsTriggered: string[], promptRuns: PromptRunRecord[], persona: Persona, sources: KbSource[]): PipelineResult {
  // A customer who has committed to booking is a booking_interest lead whatever intent the model picked.
  const readyToBook = draft.readyToBook === true;
  return { action: "reply", text: applyPersona(draft.reply, persona), language: draft.language, intent: readyToBook ? "booking_interest" : draft.intent, leadFields: draft.leadFields, model, guardsTriggered, promptRuns, sources, readyToBook };
}

/** The knowledge-base items behind a reply: the chunk ids the model reports using, resolved to their documents,
    scoped to the agency, one entry per document. */
async function resolveSources(agencyId: string, chunkIds: string[]): Promise<KbSource[]> {
  if (chunkIds.length === 0) return [];
  const chunks = await db.waKbChunk.findMany({ where: { id: { in: chunkIds }, agencyId }, select: { document: { select: { id: true, kind: true, title: true } } } });
  const seen = new Set<string>();
  const sources: KbSource[] = [];
  for (const { document } of chunks) {
    if (seen.has(document.id)) continue;
    seen.add(document.id);
    sources.push({ kind: document.kind, title: document.title });
  }
  return sources;
}

function fixedReplyResult(text: string, language: Language, intent: "identity_question" | "off_topic", guard: string, persona: Persona, promptRuns: PromptRunRecord[]): PipelineResult {
  return { action: "reply", text: applyPersona(text, persona), language, intent, leadFields: null, model: "fixed", guardsTriggered: [guard], promptRuns, sources: [] };
}

function languageOffResult(draft: AgentDraft, persona: Persona, promptRuns: PromptRunRecord[]): PipelineResult {
  const names = persona.languages.map((l) => LANGUAGE_NAMES[l]).join(", ");
  return handoffResult(`customer wrote in ${LANGUAGE_NAMES[draft.language]}, which this agency has not enabled (it replies in: ${names})`, draft.language, ["language_disabled"], draft, promptRuns);
}

/** The holding message, plus a question for the customer when the handoff is only a knowledge gap or a technical
    problem (not a complaint, dispute, emergency, request for a person or a disabled language) and we still lack
    their dates or party size. */
export function holdingMessageFor(language: Language, guardsTriggered: string[], draft: AgentDraft | null): string {
  const base = HOLDING_MESSAGES[language];
  const personNeeded = (draft && HARD_HANDOFF_INTENTS.includes(draft.intent)) || guardsTriggered.includes("language_disabled");
  const known = draft?.leadFields;
  if (personNeeded || (known?.travelDates && known?.travelers)) return base;
  return `${base} ${HOLDING_FOLLOW_UPS[language]}`;
}

function handoffResult(reason: string, language: Language, guardsTriggered: string[], draft: AgentDraft | null, promptRuns: PromptRunRecord[]): PipelineResult {
  return {
    action: "handoff",
    reason,
    holdingMessage: holdingMessageFor(language, guardsTriggered, draft),
    language,
    intent: draft?.intent ?? null,
    leadFields: draft?.leadFields ?? null,
    guardsTriggered,
    promptRuns,
  };
}
