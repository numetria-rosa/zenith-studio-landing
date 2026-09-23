/* Thin client for Anthropic's Messages API, used only by the Insurance
   Document Audit agent. Mirrors groq.ts's shape (fetch-based, no SDK
   dependency). Model is Haiku - cheapest tier, matters here since the test
   account runs on a few dollars of credit. */

const ANTHROPIC_API_BASE = "https://api.anthropic.com/v1";
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_VERSION = "2023-06-01";

function anthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return key;
}

export type AnthropicResult = { ok: true; content: string } | { ok: false; error: string };

export async function anthropicComplete(input: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<AnthropicResult> {
  const res = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": anthropicApiKey(),
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: input.maxTokens ?? 800,
      system: input.systemPrompt,
      messages: [{ role: "user", content: input.userPrompt }],
    }),
  });

  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  const body = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const content = body.content?.find((b) => b.type === "text")?.text;
  if (!content) return { ok: false, error: "empty response from Anthropic" };
  return { ok: true, content };
}
