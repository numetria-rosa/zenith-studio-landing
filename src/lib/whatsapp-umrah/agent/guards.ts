import type { AgentDraft, GuardFailure } from "./types";
import { HARD_HANDOFF_INTENTS } from "./types";
import { toAsciiDigits } from "./digits";

/* Post-guards, run on every draft before it can be sent - see CLAUDE.md
   3.1 and the spec's pipeline step 6 ("Post-guards: grounding check on
   numbers and dates, fiqh/legal/visa filter, scope guard, length and
   tone check"). Any failure here means retry-once-on-Claude, then
   handoff - see pipeline.ts. Pure functions: given a draft and the KB
   text it was grounded against, no I/O. */

/** Numeric tokens worth checking: £-prefixed amounts and any bare 2+
    digit number (catches "10 nights", "150 metres", "£950" alike).
    Single digits are skipped - too many false positives ("a 5-star
    hotel" isn't a fact that needs grounding on its own) for the safety
    this buys. */
const CURRENCY_TOKEN = /£\s?[\d,]+(?:\.\d+)?/g;
const BARE_NUMBER_TOKEN = /\b\d[\d,]*\d\b/g; // "1,295" is one number, not "1" and "295"

function extractNumericClaims(raw: string): string[] {
  const text = toAsciiDigits(raw);
  const currency = text.match(CURRENCY_TOKEN) ?? [];
  const bare = text.replace(CURRENCY_TOKEN, " ").match(BARE_NUMBER_TOKEN) ?? [];
  const normalize = (s: string) => s.replace(/[£,\s]/g, "");
  return [...new Set([...currency.map(normalize), ...bare.map(normalize)])];
}

/** Arithmetic the agent is expected to do for the customer, so its answers can pass without being in the KB
    verbatim: a £ price times a party size or number of nights (2 to 20), sums and differences of £ amounts
    (child + adult, price minus deposit), a £ price divided by nights, and sums and differences of small numbers
    (a start day plus nights is the end day). Every operand still comes from the KB or the customer's message. */
const MAX_MULTIPLIER = 20;
const MAX_PARTY = 8;
function derivedNumbers(raw: string): string[] {
  const texts = toAsciiDigits(raw);
  const money = [...new Set((texts.match(CURRENCY_TOKEN) ?? []).map((s) => Number(s.replace(/[£,\s]/g, ""))))];
  const small = [...new Set((texts.replace(CURRENCY_TOKEN, " ").match(BARE_NUMBER_TOKEN) ?? []).map((s) => Number(s.replace(/,/g, ""))).filter((n) => n >= 1 && n <= 90))];
  const out: number[] = [];
  for (let k = 2; k <= MAX_MULTIPLIER; k++) for (const m of money) out.push(m * k);
  for (const a of money) for (const b of money) out.push(a + b, Math.abs(a - b));
  // A mixed party: some travellers at one price and some at another (2 adults and 1 child: 2a + 1b).
  for (const a of money) for (const b of money) for (let k = 1; k <= MAX_PARTY; k++) for (let m = 1; m <= MAX_PARTY; m++) out.push(a * k + b * m);
  for (const m of money) for (const n of [...small, ...Array.from({ length: MAX_MULTIPLIER - 1 }, (_, i) => i + 2)]) out.push(m / n, Math.round(m / n), Math.floor(m / n));
  for (const a of small) for (const b of small) out.push(a + b, Math.abs(a - b));
  return out.map((n) => String(Math.round(n * 100) / 100));
}

/** Every price/date-shaped number the draft states must come from the KB text it was given, from the customer's
    own message (a year, a headcount are theirs, not invented), or from arithmetic on those (derivedNumbers).
    Doesn't try to understand which number means what: a reply quoting ANY other number fails, the safe direction
    (a false failure costs one retry; a false pass ships an invented fact). */
export function groundingCheck(draft: AgentDraft, kbContextText: string, customerMessage = "", extraText = ""): GuardFailure | null {
  const claimed = extractNumericClaims(draft.reply);
  // extraText (the worked-out quotes table, the occasions calendar, what the customer already told us) may be quoted as
  // it is, but is not a base for further arithmetic: only the knowledge base and the customer's message are.
  const kbNumbers = new Set([...extractNumericClaims(kbContextText), ...extractNumericClaims(customerMessage), ...extractNumericClaims(extraText), ...derivedNumbers(`${kbContextText}\n${customerMessage}`)]);
  const ungrounded = claimed.filter((n) => !kbNumbers.has(n));
  if (ungrounded.length === 0) return null;
  return { guard: "grounding", detail: `reply states number(s) not found in retrieved KB text: ${ungrounded.join(", ")}` };
}

/** The model's own self-reported intent, independent of what the reply
    text says - see CLAUDE.md 3.1. A model that follows the system
    prompt's instruction to classify correctly gets caught here even if
    it also (against instructions) tried to half-answer in the reply
    text. */
export function scopeGuard(draft: AgentDraft): GuardFailure | null {
  if (HARD_HANDOFF_INTENTS.includes(draft.intent)) {
    return { guard: "scope", detail: `intent "${draft.intent}" always hands off, regardless of reply content` };
  }
  if (draft.intent === "off_topic") {
    return { guard: "scope", detail: "off-topic general chat, must refuse per Meta's AI provider policy (see CLAUDE.md)" };
  }
  return null;
}

/** Basic sanity, not a content check: an empty reply, or one implausibly
    long for a WhatsApp message, is itself a signal something went wrong
    upstream (a truncated/malformed generation) rather than a real answer. */
const MAX_REPLY_CHARS = 1500; // a list of several matching packages is longer than a one-line answer
export function lengthCheck(draft: AgentDraft): GuardFailure | null {
  if (!draft.reply.trim()) return { guard: "length", detail: "empty reply" };
  if (draft.reply.length > MAX_REPLY_CHARS) return { guard: "length", detail: `reply too long (${draft.reply.length} chars)` };
  return null;
}

/** CLAUDE.md 3.1: "If it's not in the KB, it says it will check and hands
    off" - a low-confidence draft (the model itself signalling it
    couldn't fully answer) must actually become a handoff, not just a
    polite "I'll check" reply that nobody ever follows up on. Threshold is
    a starting point, tune once real WaPromptRun confidence data exists. */
const MIN_CONFIDENCE = 0.5;
export function confidenceCheck(draft: AgentDraft): GuardFailure | null {
  if (draft.kbIdsUsed.length > 0) return null; // an answer built from KB text is grounded; the number checks cover the rest
  if (draft.confidence < MIN_CONFIDENCE) return { guard: "confidence", detail: `model reported confidence ${draft.confidence}, below the ${MIN_CONFIDENCE} threshold` };
  return null;
}

/** Belt-and-braces alongside confidenceCheck: the system prompt tells the
    model to hedge in the reply text when it can't find an answer, but a
    model that hedges in words doesn't reliably also report low
    confidence (observed in testing 2026-09-28 - a "let me check and get
    back to you" reply came back with confidence still above the 0.5
    threshold). CLAUDE.md's rule is "hands off", not "politely hedges and
    stops there" - nobody follows up on a reply nobody flagged. Matches
    the reply text itself rather than trusting only the structured field,
    same reasoning as scopeGuard not trusting only reply text. */
// ponytail: English phrases only - confidenceCheck is the only net for a
// hedged reply in Arabic/Turkish/Urdu. Add per-language phrases here if
// real traffic shows the model hedging in those languages without also
// reporting low confidence.
const HEDGE_PHRASES = [/i'm not sure/i, /i don't have that/i, /let me check/i, /i'll check/i, /i will check/i, /not certain/i];
export function hedgeCheck(draft: AgentDraft): GuardFailure | null {
  if (draft.kbIdsUsed.length > 0) return null; // "the team will confirm your dates" after a real answer is fine
  // Models commonly emit typographic apostrophes (U+2019 "'") - normalize
  // to straight ones before matching, or every phrase above silently
  // never matches real output (found in testing 2026-09-28).
  const normalized = draft.reply.replace(/[‘’]/g, "'");
  if (HEDGE_PHRASES.some((p) => p.test(normalized))) return { guard: "hedge", detail: "reply hedges instead of answering - must hand off, not just apologize" };
  return null;
}

/** The more reliable signal than hedgeCheck's phrase-matching (which
    misses paraphrases - found in testing 2026-09-28: "I'm checking the
    details... and will get back to you" cites no KB source and has no
    numbers to fail groundingCheck on, but still isn't a real answer).
    For an info-seeking intent, citing zero KB chunks means the reply is
    either invented or vague filler - unverifiable either way, so it
    hands off per CLAUDE.md's "if it's not in the KB, hands off". Intents
    that are never expected to cite the KB (complaint, off_topic, etc.)
    are exempt - scopeGuard already handles those. */
const INFO_SEEKING_INTENTS: readonly string[] = ["package_info", "pricing", "booking_interest"];
export function noKbSourceCheck(draft: AgentDraft): GuardFailure | null {
  if (INFO_SEEKING_INTENTS.includes(draft.intent) && draft.kbIdsUsed.length === 0) {
    return { guard: "no_kb_source", detail: "answers an info-seeking question but cites no KB chunk - unverifiable, must hand off" };
  }
  return null;
}

/** Prompt injection that works shows up as the model reciting its own instructions or context. A customer-facing
    reply never contains these markers, so one that does is rejected (and retried, then handed off). */
const LEAK_MARKERS = [/RULES, NO EXCEPTIONS/i, /KNOWLEDGE BASE:/i, /AGENCY STYLE/i, /QUOTES \(already/i, /OCCASIONS \(the agency/i, /WHAT THE CUSTOMER HAS ALREADY TOLD US/i, /kbIdsUsed/, /readyToBook/];
export function promptLeakCheck(draft: AgentDraft): GuardFailure | null {
  if (LEAK_MARKERS.some((m) => m.test(draft.reply))) return { guard: "prompt_leak", detail: "reply repeats the assistant's own instructions or context" };
  return null;
}

export function runGuards(draft: AgentDraft, kbContextText: string, customerMessage = "", extraText = ""): GuardFailure[] {
  return [scopeGuard(draft), groundingCheck(draft, kbContextText, customerMessage, extraText), lengthCheck(draft), confidenceCheck(draft), hedgeCheck(draft), noKbSourceCheck(draft), promptLeakCheck(draft)].filter(
    (f): f is GuardFailure => f !== null
  );
}
