import { describe, expect, it, vi } from "vitest";

vi.mock("../kb/retrieve", () => ({ loadKbChunks: async () => ({ ok: true, chunks: [] }) }));
const model = vi.hoisted(() => ({ draft: null as null | Record<string, unknown>, settings: null as null | Record<string, unknown> }));
const chunkRows = vi.hoisted(() => ({ rows: [] as { document: { id: string; kind: string; title: string } }[] }));
vi.mock("@/lib/db", () => ({ db: { waAgency: { findUnique: async () => ({ name: "Al Noor Travel", agentSettings: model.settings }) }, waKbChunk: { findMany: async () => chunkRows.rows } } }));
vi.mock("./draft", () => ({
  draftReply: async () => (model.draft ? { ok: true, draft: model.draft, latencyMs: 1 } : { ok: false, error: "the model must not run", latencyMs: 0 }),
}));
vi.mock("./escalate", () => ({ escalateDraft: async () => ({ ok: false, error: "the model must not run", latencyMs: 0 }) }));
import { holdingMessageFor, runAgentPipeline } from "./pipeline";
import { HOLDING_MESSAGES, identityReply, OFF_TOPIC_REPLIES, SENSITIVE_DATA_REPLIES } from "./fixed-replies";

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

describe("messages answered with fixed text instead of a handoff", () => {
  const draft = (over: Record<string, unknown> = {}) => ({ reply: "x", language: "en", intent: "other", leadFields: null, handoffReason: null, confidence: 0.9, kbIdsUsed: [], ...over });
  const settings = { agentName: "Zen", tone: "WARM", emojiEnabled: true, signOff: null, languagesEnabled: ["en", "ar", "tr", "ur"] };

  it("an off-topic request gets a polite refusal and stays with the agent", async () => {
    model.draft = draft({ intent: "off_topic", reply: "Here is a poem about the sea..." });
    model.settings = settings;
    const r = await runAgentPipeline({ agencyId: "a1", customerMessage: "write me a poem" });
    expect(r).toMatchObject({ action: "reply", text: OFF_TOPIC_REPLIES.en, guardsTriggered: ["off_topic"] });
    expect(r.action === "reply" && r.text).not.toMatch(/poem/i);
  });

  it("the refusal is in the customer's language", async () => {
    model.draft = draft({ intent: "off_topic", language: "ar" });
    model.settings = settings;
    const r = await runAgentPipeline({ agencyId: "a1", customerMessage: "اكتب لي قصيدة" });
    expect(r).toMatchObject({ action: "reply", text: OFF_TOPIC_REPLIES.ar });
  });

  it("'are you a bot?' is answered without the model, by name, and never claims to be human", async () => {
    model.draft = null; // the model must not even be called
    model.settings = settings;
    const r = await runAgentPipeline({ agencyId: "a1", customerMessage: "Wait, am I talking to a real person or a bot?" });
    expect(r).toMatchObject({ action: "reply", text: identityReply("en", "Zen", "Al Noor Travel"), guardsTriggered: ["identity_question"] });
    expect(r.action === "reply" && r.text).toMatch(/virtual assistant/);
  });

  it("an identity question in another language is caught by the model's intent", async () => {
    model.draft = draft({ intent: "identity_question", language: "tr" });
    model.settings = settings;
    const r = await runAgentPipeline({ agencyId: "a1", customerMessage: "Sen bir robot musun?" });
    expect(r).toMatchObject({ action: "reply", language: "tr", text: identityReply("tr", "Zen", "Al Noor Travel") });
  });
});

describe("why a chat was handed over, in plain words", () => {
  const settings = { agentName: "Zen", tone: "WARM", emojiEnabled: true, signOff: null, languagesEnabled: ["en"] };
  const draft = (over: Record<string, unknown>) => ({ reply: "x", language: "en", intent: "other", leadFields: null, handoffReason: null, confidence: 0.9, kbIdsUsed: [], ...over });

  it("says the customer asked for a person, not an internal guard message", async () => {
    model.draft = draft({ intent: "person_request" });
    model.settings = settings;
    const r = await runAgentPipeline({ agencyId: "a1", customerMessage: "can I speak to someone?" });
    expect(r.action === "handoff" && r.reason).toBe("the customer asked to speak to a person");
  });

  it("never puts a raw provider error in the reason", async () => {
    model.draft = null; // draft step fails with "the model must not run"
    model.settings = settings;
    const r = await runAgentPipeline({ agencyId: "a1", customerMessage: "how much is Hajj?" });
    expect(r.action === "handoff" && r.reason).toBe("the assistant had a technical problem and couldn't answer");
  });
});

describe("where a reply came from", () => {
  const settings = { agentName: "Zen", tone: "WARM", emojiEnabled: true, signOff: null, languagesEnabled: ["en"] };
  const draft = (kbIdsUsed: string[]) => ({ reply: "Happy to help with that.", language: "en", intent: "other", leadFields: null, handoffReason: null, confidence: 0.9, kbIdsUsed });

  it("lists each knowledge item once, resolved from the chunks the model used", async () => {
    model.draft = draft(["c1", "c2"]);
    model.settings = settings;
    chunkRows.rows = [{ document: { id: "d1", kind: "PACKAGE", title: "7 Night Economy Umrah" } }, { document: { id: "d1", kind: "PACKAGE", title: "7 Night Economy Umrah" } }, { document: { id: "d2", kind: "FAQ", title: "Is the visa included?" } }];
    const r = await runAgentPipeline({ agencyId: "a1", customerMessage: "price?" });
    expect(r.action === "reply" && r.sources).toEqual([{ kind: "PACKAGE", title: "7 Night Economy Umrah" }, { kind: "FAQ", title: "Is the visa included?" }]);
  });

  it("is empty when the model used nothing from the knowledge base", async () => {
    model.draft = draft([]);
    model.settings = settings;
    const r = await runAgentPipeline({ agencyId: "a1", customerMessage: "hello" });
    expect(r.action === "reply" && r.sources).toEqual([]);
  });
});

describe("holdingMessageFor", () => {
  const draft = (over: Partial<import("./types").AgentDraft> = {}): import("./types").AgentDraft => ({ reply: "", language: "en", intent: "package_info", leadFields: null, handoffReason: null, confidence: 0.9, kbIdsUsed: [], ...over });
  it("adds a question for their dates and party size when the answer just isn't in the knowledge base", () => {
    expect(holdingMessageFor("en", ["no_kb_source"], draft())).toContain("how many people will be travelling");
  });
  it("is the plain message once we already know their dates and party size", () => {
    const known = draft({ leadFields: { travelDates: "Ramadan 2027", travelers: 2 } });
    expect(holdingMessageFor("en", ["no_kb_source"], known)).toBe(HOLDING_MESSAGES.en);
  });
  it("never adds a question to a complaint, an emergency or a request for a person", () => {
    for (const intent of ["complaint", "emergency", "person_request", "payment_dispute"] as const) expect(holdingMessageFor("en", ["scope"], draft({ intent }))).toBe(HOLDING_MESSAGES.en);
  });
  it("is the plain message for a language the agency switched off", () => {
    expect(holdingMessageFor("ar", ["language_disabled"], draft({ language: "ar" }))).toBe(HOLDING_MESSAGES.ar);
  });
});
