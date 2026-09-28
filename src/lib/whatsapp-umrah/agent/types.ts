/* Shared types for the agent pipeline. See CLAUDE.md 3.1 for the hard
   rules this exists to enforce, and section 4 of the original spec
   (draft -> guards -> escalate -> handoff) for the pipeline shape. */

export const LANGUAGES = ["en", "ar", "tr", "ur"] as const;
export type Language = (typeof LANGUAGES)[number];

/* Every intent the model can self-report. The three *_question/emergency
   intents and complaint/payment_dispute are hard handoff triggers
   regardless of what the reply text says - see guards.ts's scope guard.
   This is deliberately redundant with the system prompt telling the model
   not to answer these: a model that ignores the instruction but still
   correctly classifies its own intent still gets caught. */
export const INTENTS = [
  "package_info",
  "pricing",
  "booking_interest",
  "complaint",
  "payment_dispute",
  "fiqh_question",
  "visa_question",
  "emergency",
  "off_topic",
  "person_request",
  "other",
] as const;
export type Intent = (typeof INTENTS)[number];

export const HARD_HANDOFF_INTENTS: readonly Intent[] = [
  "complaint",
  "payment_dispute",
  "fiqh_question",
  "visa_question",
  "emergency",
  "person_request",
];

export type LeadFields = {
  travelDates?: string;
  travelers?: number;
  budgetGbp?: number;
  departureCity?: string;
  hotelTier?: string;
  packagePreference?: string;
};

/* The model's structured output, one call = one of these. kbIdsUsed lets
   the grounding check verify against only the chunks the model claims it
   used, not every retrieved chunk (a model citing a fact from a chunk it
   didn't use would be its own kind of failure, but grounding.ts checks
   the simpler thing: do the numbers in the reply appear anywhere in the
   retrieved text at all). */
export type AgentDraft = {
  reply: string;
  language: Language;
  intent: Intent;
  leadFields: LeadFields | null;
  handoffReason: string | null;
  confidence: number;
  kbIdsUsed: string[];
};

export type GuardFailure = { guard: string; detail: string };

/** One real LLM call worth logging to WaPromptRun - see pipeline.ts and
    CLAUDE.md ("log everything needed to debug: prompt version, model,
    tokens, latency, cost estimate, guards triggered"). Guard checks
    themselves are pure functions with no LLM call, so only DRAFT
    (Groq) and ESCALATION (Claude) stages ever appear here - there is no
    separate GUARD-stage LLM call in this pipeline's design, despite
    WaPromptStage having a GUARD value for a future guard that does call
    an LLM (e.g. a dedicated fiqh/visa classifier). */
export type PromptRunRecord = {
  stage: "DRAFT" | "ESCALATION";
  model: string;
  promptVersion: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  costEstimateCents?: number;
  guardsTriggered: string[];
  error?: string;
};

export type PipelineResult =
  | { action: "reply"; text: string; language: Language; intent: Intent; leadFields: LeadFields | null; model: string; guardsTriggered: string[]; promptRuns: PromptRunRecord[] }
  | {
      action: "handoff";
      reason: string;
      holdingMessage: string;
      language: Language;
      intent: Intent | null;
      leadFields: LeadFields | null;
      guardsTriggered: string[];
      promptRuns: PromptRunRecord[];
    };
