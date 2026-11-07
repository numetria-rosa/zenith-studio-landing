import type { AgentDraft, GuardFailure, Intent } from "./types";

/* Why a chat was handed to a person, in words an agency owner can act on. This text reaches the owner's email and
   the dashboard, so it never carries a raw error, a request id or a guard's internal wording. */

const INTENT_REASONS: Partial<Record<Intent, string>> = {
  complaint: "the customer is making a complaint",
  payment_dispute: "the customer raised a payment or refund problem",
  emergency: "the customer described an emergency",
  person_request: "the customer asked to speak to a person",
  visa_question: "the customer asked about visas or immigration, which the assistant doesn't advise on",
  fiqh_question: "the customer asked a religious ruling question, which the assistant doesn't answer",
};

/** Not a failure: the customer said they want to book, the agent confirmed the details, and the team takes over. */
export const BOOKING_READY_REASON = "the customer is ready to book";

export const TECHNICAL_PROBLEM_REASON = "the assistant had a technical problem and couldn't answer";

/** The reason for a handoff after the checks failed: what the customer asked if that is what triggered it,
    otherwise what was wrong with the answer. */
export function plainHandoffReason(draft: AgentDraft | null, failures: GuardFailure[]): string {
  const byIntent = draft && INTENT_REASONS[draft.intent];
  if (byIntent) return byIntent;
  const guards = new Set(failures.map((f) => f.guard));
  if (guards.has("grounding")) return "the answer needed a price, date or number that isn't in your knowledge base";
  if (guards.has("confidence") || guards.has("hedge") || guards.has("no_kb_source")) return "the answer isn't in your knowledge base";
  if (guards.has("length")) return "the assistant couldn't write a usable answer";
  return "the assistant wasn't sure it could answer safely";
}
