import { describe, expect, it, vi } from "vitest";

vi.mock("../kb/retrieve", () => ({ retrieveKbChunks: async () => ({ ok: true, chunks: [] }) }));
vi.mock("./draft", () => ({ draftReply: async () => ({ ok: false, error: "the model must not run", latencyMs: 0 }) }));
vi.mock("./escalate", () => ({ escalateDraft: async () => ({ ok: false, error: "the model must not run", latencyMs: 0 }) }));
import { runAgentPipeline } from "./pipeline";
import { SENSITIVE_DATA_REPLIES } from "./fixed-replies";

describe("a message carrying a passport or card number", () => {
  it("hands off with the secure-documents message, without running the model", async () => {
    const r = await runAgentPipeline({ agencyId: "a1", customerMessage: "my passport is AB1234567" });
    expect(r).toMatchObject({ action: "handoff", holdingMessage: SENSITIVE_DATA_REPLIES.en, guardsTriggered: ["sensitive_data"], promptRuns: [] });
  });
  it("answers in the language the customer wrote in", async () => {
    const r = await runAgentPipeline({ agencyId: "a1", customerMessage: "جوازي AB1234567" });
    expect(r).toMatchObject({ action: "handoff", language: "ar", holdingMessage: SENSITIVE_DATA_REPLIES.ar });
  });
});
