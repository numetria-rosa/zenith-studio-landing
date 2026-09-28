import { DRAFT_SYSTEM_PROMPT_V1 } from "../../../../prompts/whatsapp-umrah/draft-system-v1";
import { INTENTS, LANGUAGES, type AgentDraft, type GuardFailure } from "./types";
import type { DraftInput, DraftResult } from "./draft";

/* Escalation step: one retry on Claude when Groq's draft fails a guard -
   see CLAUDE.md and the spec's pipeline step ("escalate to the Claude
   model for a second attempt"). Structured output via forced tool use
   with strict: true (guaranteed schema conformance, confirmed against
   platform.claude.com/docs/en/agents-and-tools/tool-use/overview
   2026-09-28) - Claude has no separate JSON-schema response_format like
   Groq/OpenAI, tool use is the documented way to get reliable JSON. */

const ANTHROPIC_API_BASE = "https://api.anthropic.com/v1";
const ANTHROPIC_VERSION = "2023-06-01";
const ESCALATION_MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return key;
}

const AGENT_DRAFT_TOOL = {
  name: "agent_draft",
  description: "The structured reply to send to the customer, plus classification fields for guards and lead capture.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      reply: { type: "string" },
      language: { type: "string", enum: LANGUAGES },
      intent: { type: "string", enum: INTENTS },
      leadFields: {
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
      },
      handoffReason: { type: ["string", "null"] },
      confidence: { type: "number" },
      kbIdsUsed: { type: "array", items: { type: "string" } },
    },
    required: ["reply", "language", "intent", "leadFields", "handoffReason", "confidence", "kbIdsUsed"],
    additionalProperties: false,
  },
} as const;

export async function escalateDraft(input: DraftInput, previousFailures: GuardFailure[]): Promise<DraftResult> {
  const userPrompt = `KNOWLEDGE BASE:\n${input.kbContext || "(nothing retrieved for this question)"}\n\nRECENT CONVERSATION:\n${input.conversationHistory || "(no prior messages)"}\n\nCUSTOMER MESSAGE:\n${input.customerMessage}\n\nA FIRST ATTEMPT AT THIS FAILED THESE CHECKS - do not repeat the same mistake:\n${previousFailures.map((f) => `- ${f.guard}: ${f.detail}`).join("\n")}`;

  try {
    const res = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
      method: "POST",
      headers: { "x-api-key": apiKey(), "anthropic-version": ANTHROPIC_VERSION, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ESCALATION_MODEL,
        max_tokens: 800,
        system: DRAFT_SYSTEM_PROMPT_V1,
        tools: [AGENT_DRAFT_TOOL],
        tool_choice: { type: "tool", name: "agent_draft" },
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
    const body = (await res.json()) as { content?: { type: string; input?: unknown }[]; usage?: { input_tokens?: number; output_tokens?: number } };
    const toolUse = body.content?.find((b) => b.type === "tool_use");
    if (!toolUse?.input) return { ok: false, error: "Claude did not return a tool_use block" };
    return { ok: true, draft: toolUse.input as AgentDraft, promptTokens: body.usage?.input_tokens, completionTokens: body.usage?.output_tokens };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Claude escalation request failed" };
  }
}
