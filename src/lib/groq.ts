/* Thin client for Groq's OpenAI-compatible chat completions endpoint,
   used only to draft billing narratives (billing-clerk.ts). Chosen over
   OpenAI/Anthropic per the user's explicit "cheapest at scale" call.
   ponytail: model id below is Groq's current flagship general model as of
   this writing, verify against console.groq.com/docs/models before
   relying on it, model availability on Groq changes faster than most
   providers. */

const GROQ_API_BASE = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "llama-3.3-70b-versatile";

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
