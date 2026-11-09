import { DRAFT_SYSTEM_PROMPT } from "../../../../prompts/whatsapp-umrah/draft-system-v8";
import { INTENTS, LANGUAGES, type AgentDraft, type GuardFailure } from "./types";
import { todayLine, type DraftInput, type DraftResult } from "./draft";

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
      readyToBook: { type: "boolean" },
    },
    required: ["reply", "language", "intent", "leadFields", "handoffReason", "confidence", "kbIdsUsed", "readyToBook"],
    additionalProperties: false,
  },
} as const;

export async function escalateDraft(input: DraftInput, previousFailures: GuardFailure[]): Promise<DraftResult> {
  const userPrompt = `${input.persona ? `${input.persona}\n\n` : ""}${todayLine()}\n\nKNOWLEDGE BASE:\n${input.kbContext || "(nothing retrieved for this question)"}\n\n${input.extraContext ? `${input.extraContext}\n\n` : ""}RECENT CONVERSATION:\n${input.conversationHistory || "(no prior messages)"}\n\nCUSTOMER MESSAGE:\n${input.customerMessage}${previousFailures.length > 0 ? `\n\nA FIRST ATTEMPT AT THIS FAILED THESE CHECKS - do not repeat the same mistake:\n${previousFailures.map((f) => `- ${f.guard}: ${f.detail}`).join("\n")}` : ""}`;

  const startedAt = Date.now();
  try {
    const res = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
      method: "POST",
      headers: { "x-api-key": apiKey(), "anthropic-version": ANTHROPIC_VERSION, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ESCALATION_MODEL,
        max_tokens: 800,
        // cache_control: the system prompt (and the tool above it, which sit first in the cached prefix) is identical on every
        // call, so repeat calls within 5 minutes read it at a tenth of the input price. Minimum cacheable size is 512 tokens on
        // Haiku 5.5 and 4,096 on Haiku 4.5 (ours is about 2,600, so on 4.5 this is silently a no-op), per
        // platform.claude.com/docs/en/build-with-claude/prompt-caching, read 2026-11-09.
        system: [{ type: "text", text: DRAFT_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        tools: [AGENT_DRAFT_TOOL],
        tool_choice: { type: "tool", name: "agent_draft" },
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}`, latencyMs: Date.now() - startedAt };
    const body = (await res.json()) as { content?: { type: string; input?: unknown }[]; usage?: { input_tokens?: number; output_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number } };
    const toolUse = body.content?.find((b) => b.type === "tool_use");
    if (!toolUse?.input) return { ok: false, error: "Claude did not return a tool_use block", latencyMs: Date.now() - startedAt };
    return { ok: true, draft: toolUse.input as AgentDraft, // input_tokens excludes cached tokens; count them all at the full input price, so the plan budget is never under-counted
      promptTokens: body.usage ? (body.usage.input_tokens ?? 0) + (body.usage.cache_creation_input_tokens ?? 0) + (body.usage.cache_read_input_tokens ?? 0) : undefined, completionTokens: body.usage?.output_tokens, latencyMs: Date.now() - startedAt };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Claude escalation request failed", latencyMs: Date.now() - startedAt };
  }
}
