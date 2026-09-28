import { groqChatCompletion } from "@/lib/groq";

/* Translate-then-retrieve: normalizes a customer's message (which may be
   in Roman Urdu, Urdu script, Bengali, Arabic, Gujarati, or English)
   toward plain English before it's embedded for KB search. This exists
   specifically because retrieval quality for Roman Urdu (a transliteration,
   not a standard written language with its own training corpus) and
   Gujarati isn't established for any embedding model - see CLAUDE.md and
   docs/unit-economics.md. The customer's ORIGINAL message is still what
   gets shown to the language-detection/reply-drafting step; this
   normalized version is only ever used as the retrieval query. Fails
   open (returns not-ok) rather than throwing, since a normalization
   failure should never block retrieval on the raw message instead. */

const SYSTEM_PROMPT = `Translate the customer message to plain English for a search query. Keep any proper nouns (hotel names, package names) as written. Output only the translation, nothing else. If it's already in English, return it unchanged.`;

export async function normalizeForRetrieval(message: string): Promise<{ ok: true; text: string } | { ok: false }> {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false };
  const result = await groqChatCompletion({ systemPrompt: SYSTEM_PROMPT, userPrompt: trimmed });
  if (!result.ok || !result.content.trim()) return { ok: false };
  return { ok: true, text: result.content.trim() };
}
