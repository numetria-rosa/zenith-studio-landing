import type { AgentDraft, GuardFailure } from "./types";
import { HARD_HANDOFF_INTENTS } from "./types";

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
const BARE_NUMBER_TOKEN = /\b\d{2,}\b/g;

function extractNumericClaims(text: string): string[] {
  const currency = text.match(CURRENCY_TOKEN) ?? [];
  const bare = text.match(BARE_NUMBER_TOKEN) ?? [];
  const normalize = (s: string) => s.replace(/[£,\s]/g, "");
  return [...new Set([...currency.map(normalize), ...bare])];
}

/** Every price/date-shaped number the draft states must appear somewhere
    in the KB text it was given. Doesn't try to understand which number
    means what - a reply that quotes ANY number absent from the retrieved
    KB text fails, which is the safe direction (a false failure costs one
    retry; a false pass ships an invented fact). */
export function groundingCheck(draft: AgentDraft, kbContextText: string): GuardFailure | null {
  const claimed = extractNumericClaims(draft.reply);
  const kbNumbers = new Set(extractNumericClaims(kbContextText));
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
const MAX_REPLY_CHARS = 1000;
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

export function runGuards(draft: AgentDraft, kbContextText: string): GuardFailure[] {
  return [scopeGuard(draft), groundingCheck(draft, kbContextText), lengthCheck(draft), confidenceCheck(draft), hedgeCheck(draft), noKbSourceCheck(draft)].filter(
    (f): f is GuardFailure => f !== null
  );
}
