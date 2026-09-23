/* Thin client for Groq's OpenAI-compatible chat completions endpoint,
   used only to draft billing narratives (billing-clerk.ts). Chosen over
   OpenAI/Anthropic per the user's explicit "cheapest at scale" call.
   ponytail: model id below is Groq's current flagship general model as of
   this writing, verify against console.groq.com/docs/models before
   relying on it, model availability on Groq changes faster than most
   providers. */

const GROQ_API_BASE = "https://api.groq.com/openai/v1";
// llama-3.3-70b-versatile was retired from Groq's standard plan (404
// model_not_found, found 2026-09-21 while wiring up the insurance Document
// Audit agent - every Groq caller in this repo was silently falling back
// to its generic fallback copy since whenever that happened). Swapped to
// gpt-oss-20b over its 120b sibling: half the price ($0.075/$0.30 vs
// $0.15/$0.60 per 1M tokens), 2x the throughput, same 131K context, and
// tested equal output quality on this repo's structured-drafting prompts
// (not deep multi-step reasoning, where 120b would matter more). Verify
// against console.groq.com/docs/models before relying on it further -
// model availability on Groq changes faster than most providers.
const GROQ_MODEL = "openai/gpt-oss-20b";

function groqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");
  return key;
}

export type GroqChatResult = { ok: true; content: string } | { ok: false; error: string };

export async function groqChatCompletion(input: {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
}): Promise<GroqChatResult> {
  const res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt },
      ],
      temperature: 0.3,
      ...(input.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  if (!content) return { ok: false, error: "empty response from Groq" };
  return { ok: true, content };
}
