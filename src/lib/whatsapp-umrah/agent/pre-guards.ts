/* Cheap, no-LLM checks run before the draft call - see CLAUDE.md 3.1 and
   the spec's pipeline step 3 ("Pre-guards (cheap, no LLM where possible)").
   Pure text functions only; DB-dependent checks (human-active pause, plan
   cap, opt-out lookup) live in pipeline.ts where the DB access already is. */

/** WhatsApp's own opt-out convention plus common variants. Case-insensitive,
    matched as a whole trimmed message (not a substring of a longer
    sentence) - a customer typing "stop worrying, what's the price" should
    not be treated as opting out. */
const OPT_OUT_WORDS = ["stop", "unsubscribe", "opt out", "optout"];
export function isOptOutMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase().replace(/[.!?]+$/, "");
  return OPT_OUT_WORDS.includes(normalized);
}

/** Deliberately loose patterns - false positives here just mean an extra
    "we'll collect documents securely" handoff, which is the safe failure
    direction per CLAUDE.md 3.1. False negatives (missing a real passport
    number) are the failure this exists to prevent. */
const PASSPORT_PATTERN = /\b[A-Za-z]{1,2}\d{6,9}\b/; // most passport number formats: 1-2 letters + 6-9 digits
const CARD_PATTERN = /\b(?:\d[ -]?){13,19}\b/; // digit runs long enough to be a card number, spaces/dashes allowed

export function containsSensitiveData(text: string): boolean {
  return PASSPORT_PATTERN.test(text) || CARD_PATTERN.test(text);
}
