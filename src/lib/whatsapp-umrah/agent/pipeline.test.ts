import { describe, expect, it, vi } from "vitest";

vi.mock("../kb/retrieve", () => ({ retrieveKbChunks: async () => ({ ok: true, chunks: [] }) }));
const model = vi.hoisted(() => ({ draft: null as null | Record<string, unknown>, settings: null as null | Record<string, unknown> }));
vi.mock("@/lib/db", () => ({ db: { waAgency: { findUnique: async () => ({ name: "Al Noor Travel", agentSettings: model.settings }) } } }));
vi.mock("./draft", () => ({
  draftReply: async () => (model.draft ? { ok: true, draft: model.draft, latencyMs: 1 } : { ok: false, error: "the model must not run", latencyMs: 0 }),
}));
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

describe("the agency's settings reach the reply", () => {
  const draft = (over: Record<string, unknown> = {}) => ({ reply: "Welcome 😊 How can I help?", language: "en", intent: "other", leadFields: null, handoffReason: null, confidence: 0.9, kbIdsUsed: [], ...over });
  const settings = { agentName: "Layla", tone: "FORMAL", emojiEnabled: false, signOff: "The Al Noor team", languagesEnabled: ["en", "ar"] };

  it("strips emoji and adds the sign-off", async () => {
    model.draft = draft();
    model.settings = settings;
    const r = await runAgentPipeline({ agencyId: "a1", customerMessage: "hello" });
    expect(r).toMatchObject({ action: "reply", text: "Welcome How can I help?\n\nThe Al Noor team" });
  });

  it("hands off, in the customer's language, when they write in one the agency switched off", async () => {
    model.draft = draft({ language: "tr", reply: "Merhaba" });
    model.settings = settings;
    const r = await runAgentPipeline({ agencyId: "a1", customerMessage: "merhaba" });
    expect(r).toMatchObject({ action: "handoff", language: "tr", guardsTriggered: ["language_disabled"] });
    expect(r.action === "handoff" && r.reason).toMatch(/Turkish.*not enabled/);
  });
});
