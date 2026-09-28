import { DRAFT_SYSTEM_PROMPT_V1 } from "../../../../prompts/whatsapp-umrah/draft-system-v1";
import { INTENTS, LANGUAGES, type AgentDraft } from "./types";

/* Draft step: Groq, strict JSON schema mode (constrained decoding - the
   model literally cannot emit a schema-violating response, confirmed
   against console.groq.com/docs/structured-outputs 2026-09-28). Uses a
   dedicated fetch rather than the shared groqChatCompletion helper in
   src/lib/groq.ts, since that helper only exposes loose json_object mode,
   not a schema - this pipeline's grounding/hard-rule enforcement depends
   on the output always being well-formed. Strict mode requires every
   property in "required" and no field omitted - optional fields are
   nullable types instead, per Groq's own documented constraint. */

const GROQ_API_BASE = "https://api.groq.com/openai/v1";
const DRAFT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const LEAD_FIELDS_SCHEMA = {
  type: ["object", "null"],
  properties: {
    travelDates: { type: ["string", "null"] },
    travelers: { type: ["integer", "null"] },
    budgetGbp: { type: ["integer", "null"] },
    departureCity: { type: ["string", "null"] },
    hotelTier: { type: ["string", "null"] },
    packagePreference: { type: ["string", "null"] },
  },
  required: ["travelDates", "travelers", "budgetGbp", "departureCity", "hotelTier", "packagePreference"],
  additionalProperties: false,
} as const;

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    language: { type: "string", enum: LANGUAGES },
    intent: { type: "string", enum: INTENTS },
    leadFields: LEAD_FIELDS_SCHEMA,
    handoffReason: { type: ["string", "null"] },
    confidence: { type: "number" },
    kbIdsUsed: { type: "array", items: { type: "string" } },
  },
  required: ["reply", "language", "intent", "leadFields", "handoffReason", "confidence", "kbIdsUsed"],
  additionalProperties: false,
} as const;

export type DraftInput = {
  customerMessage: string;
  kbContext: string; // formatted "[chunk-id] content" blocks, see pipeline.ts
  conversationHistory: string; // formatted recent turns, may be empty
};

export type DraftResult = { ok: true; draft: AgentDraft; promptTokens?: number; completionTokens?: number } | { ok: false; error: string };

function apiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");
  return key;
}

async function callGroq(userPrompt: string, model: string): Promise<Response> {
  return fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: DRAFT_SYSTEM_PROMPT_V1 },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_schema", json_schema: { name: "agent_draft", strict: true, schema: DRAFT_SCHEMA } },
    }),
  });
}

export async function draftReply(input: DraftInput, model = DRAFT_MODEL): Promise<DraftResult> {
  const userPrompt = `KNOWLEDGE BASE:\n${input.kbContext || "(nothing retrieved for this question)"}\n\nRECENT CONVERSATION:\n${input.conversationHistory || "(no prior messages)"}\n\nCUSTOMER MESSAGE:\n${input.customerMessage}`;

  try {
    let res = await callGroq(userPrompt, model);
    // A rate limit here is a real, expected condition on a normal (not
    // enterprise) Groq account under real traffic, not just a test
    // artifact - one retry after Groq's own suggested wait, then give up
    // to escalation/handoff rather than blocking the customer indefinitely.
    if (res.status === 429) {
      const body = await res.clone().json().catch(() => null);
      const waitMs = Math.min(Number(body?.error?.message?.match(/try again in ([\d.]+)s/)?.[1] ?? 2) * 1000, 8000);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      res = await callGroq(userPrompt, model);
    }
    if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return { ok: false, error: "empty response from Groq" };
    const parsed = JSON.parse(content) as AgentDraft;
    return { ok: true, draft: parsed, promptTokens: body.usage?.prompt_tokens, completionTokens: body.usage?.completion_tokens };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Groq draft request failed" };
  }
}
