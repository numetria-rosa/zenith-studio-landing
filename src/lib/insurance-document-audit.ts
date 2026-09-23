import { groqChatCompletion } from "@/lib/groq";
import { anthropicComplete } from "@/lib/anthropic";

/* Underwriter's Assistant: takes raw policy/ACORD-form text and returns a
   clean structured summary an agent can copy into their AMS by hand - no
   AMS integration, matches the front-office-only scope agreed for this
   bundle. Text in, text out; PDF-to-text happens client-side or is pasted
   in directly, keeping this server function free of a PDF-parsing
   dependency for a feature that's still at the "let me test it" stage.

   Groq first (generous free tier), Claude as a silent fallback if Groq
   errors or is unconfigured - the client should never see or feel a Groq
   outage. */

const MAX_INPUT_CHARS = 8000; // keeps Haiku input (and cost) small

const SYSTEM_PROMPT = `You are an insurance agency back-office assistant. Given the raw text of a policy document, ACORD form, or loss run, extract a clean summary. Respond with ONLY these sections, each on its own line, skipping any that aren't present in the text - do not invent data:

Named Insured:
Policy Type:
Carrier:
Effective Date:
Expiration Date:
Coverage Limits:
Premium:
Red Flags: (anything unusual - lapses, exclusions, missing signatures, mismatched dates)

Keep each line to one sentence. If the text doesn't look like an insurance document, say so plainly instead of guessing.`;

export type DocumentAuditResult = { ok: true; summary: string } | { ok: false; error: string };

export async function auditPolicyDocument(rawText: string): Promise<DocumentAuditResult> {
  const trimmed = rawText.trim();
  if (!trimmed) return { ok: false, error: "no text provided" };

  const input = trimmed.slice(0, MAX_INPUT_CHARS);

  const groqResult = process.env.GROQ_API_KEY
    ? await groqChatCompletion({ systemPrompt: SYSTEM_PROMPT, userPrompt: input })
    : { ok: false as const, error: "GROQ_API_KEY is not set" };
  if (groqResult.ok) return { ok: true, summary: groqResult.content.trim() };

  const anthropicResult = await anthropicComplete({ systemPrompt: SYSTEM_PROMPT, userPrompt: input, maxTokens: 500 });
  if (!anthropicResult.ok) return { ok: false, error: `groq: ${groqResult.error}; anthropic: ${anthropicResult.error}` };
  return { ok: true, summary: anthropicResult.content.trim() };
}
