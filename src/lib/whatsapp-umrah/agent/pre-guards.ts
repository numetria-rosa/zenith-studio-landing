/* Cheap, no-LLM checks run before the draft call - see CLAUDE.md 3.1 and
   the spec's pipeline step 3 ("Pre-guards (cheap, no LLM where possible)").
   Pure text functions only; DB-dependent checks (human-active pause, plan
   cap, opt-out lookup) live in pipeline.ts where the DB access already is. */

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/[.!?]+$/, "");
}

/** WhatsApp's own opt-out convention plus common variants, in the four languages we answer in. Matched as a
    whole trimmed message (not a substring of a longer sentence) - a customer typing "stop worrying, what's
    the price" should not be treated as opting out. */
const OPT_OUT_WORDS = ["stop", "unsubscribe", "opt out", "optout", "إيقاف", "ايقاف", "توقف", "إلغاء الاشتراك", "durdur", "abonelikten çık", "بند کریں"];
export function isOptOutMessage(text: string): boolean {
  return OPT_OUT_WORDS.includes(normalize(text));
}

/** The way back in after STOP. Same whole-message rule. */
const OPT_IN_WORDS = ["start", "unstop", "subscribe"];
export function isOptInMessage(text: string): boolean {
  return OPT_IN_WORDS.includes(normalize(text));
}

/** Deliberately loose passport pattern - false positives just mean an extra "we'll collect documents
    securely" handoff, which is the safe failure direction per CLAUDE.md 3.1. False negatives (missing a real
    passport number) are the failure this exists to prevent. */
const PASSPORT_PATTERN = /\b[A-Za-z]{1,2}\d{6,9}\b/; // most passport number formats: 1-2 letters + 6-9 digits
const DIGIT_RUN = /\b(?:\d[ -]?){13,19}\b/g; // digit runs long enough to be a card number, spaces/dashes allowed

/** Luhn checksum: every real card number passes it, so a phone number in international form (00447...) or a
    booking reference of the same length mostly doesn't get mistaken for one. */
function passesLuhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function containsSensitiveData(text: string): boolean {
  if (PASSPORT_PATTERN.test(text)) return true;
  return (text.match(DIGIT_RUN) ?? []).some((run) => {
    const digits = run.replace(/\D/g, "");
    return digits.length >= 13 && digits.length <= 19 && passesLuhn(digits);
  });
}

/** "Am I talking to a real person or a bot?" / "are you AI" / "is this a robot". English only: other languages
    reach the model, which has an identity_question intent for them. It needs the question form straight away
    ("are you a ..."), so "can I speak to a real person" and "are you able to put me through to a person" stay
    requests for a person. */
const IDENTITY_QUESTION = /\b(?:are you|r u|is this|am i (?:talking|speaking|chatting|texting|messaging) (?:to|with))\s+(?:(?:a|an|the|really|actually)\s+)*(?:real\s+|actual\s+|live\s+)?(?:person|human|bot|robot|chatbot|ai|machine)\b/i;
export function isIdentityQuestion(text: string): boolean {
  return IDENTITY_QUESTION.test(text);
}
