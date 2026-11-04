import { beforeEach, describe, expect, it, vi } from "vitest";

/* The inbound flows that never reach the model: photos and voice notes, STOP and START. The database is a
   small in-memory stand-in covering only what these paths touch; sends go to the mock provider, never to
   WhatsApp (CLAUDE.md: no real messages during development). */

const state = vi.hoisted(() => ({
  contact: { id: "c1", optOut: false },
  conversation: { id: "v1", status: "AI" as "AI" | "HUMAN" | "CLOSED" },
  messages: [] as { direction: string; type: string; body: string | null }[],
  handoffs: [] as { reason: string; triggeredBy: string }[],
  lastInboundText: null as string | null,
  pipelineCalls: 0,
}));

vi.mock("@/lib/db", () => ({
  db: {
    waMessage: {
      findUnique: async () => null,
      create: async ({ data }: { data: { direction: string; type: string; body: string | null } }) => void state.messages.push(data),
      findFirst: async () => (state.lastInboundText ? { body: state.lastInboundText } : null),
    },
    waWhatsAppAccount: { findFirst: async () => ({ agencyId: "a1", encryptedAccessToken: null, lastError: null }) },
    waAgency: { findUnique: async () => ({ id: "a1", name: "Al Noor Travel", status: "LIVE", memberships: [], agentSettings: null }) },
    waContact: {
      upsert: async () => state.contact,
      update: async ({ data }: { data: { optOut: boolean } }) => void (state.contact.optOut = data.optOut),
    },
    waConversation: {
      findFirst: async () => (state.conversation.status === "CLOSED" ? null : state.conversation),
      create: async () => state.conversation,
      update: async ({ data }: { data: { status?: "AI" | "HUMAN" | "CLOSED" } }) => void (data.status && (state.conversation.status = data.status)),
    },
    waHandoff: { create: async ({ data }: { data: { reason: string; triggeredBy: string } }) => void state.handoffs.push(data) },
  },
}));
vi.mock("@/lib/secrets", () => ({ decryptSecret: () => "token" }));
vi.mock("@/lib/outreach-mail", () => ({ sendPlainEmail: vi.fn(), sendAdminAlert: vi.fn() }));
vi.mock("./entitlements", () => ({ withinCap: async () => ({ withinCap: true, used: 0, cap: 100, planCap: 100 }), recordAiReply: async () => {} }));
vi.mock("./send-failure", () => ({ trackSend: async () => {}, noteSendFailure: async () => {} }));
vi.mock("./handoff-alerts", () => ({ alertHandoff: vi.fn(), alertWaitingCustomer: vi.fn() }));
vi.mock("./leads", () => ({ upsertLeadFromDraft: async () => null, notifyOwnerOfHotLead: async () => {} }));
vi.mock("./agent/pipeline", () => ({
  runAgentPipeline: async () => {
    state.pipelineCalls++;
    throw new Error("the model must not run for these messages");
  },
}));

import { processInboundMedia, processInboundMessage } from "./inbound";
import { alertHandoff, alertWaitingCustomer } from "./handoff-alerts";
import { MockWhatsAppProvider } from "./provider/mock";
import { OPT_IN_REPLIES, OPT_OUT_REPLIES, SENSITIVE_DATA_REPLIES, VOICE_NOTE_REPLIES } from "./agent/fixed-replies";

const base = { phoneNumberId: "555", from: "447700900000", waMessageId: "wamid.1", timestamp: "1", contactName: "Sam" };
const text = (body: string) => ({ ...base, body });

beforeEach(() => {
  state.contact = { id: "c1", optOut: false };
  state.conversation = { id: "v1", status: "AI" };
  state.messages = [];
  state.handoffs = [];
  state.lastInboundText = null;
  state.pipelineCalls = 0;
  vi.mocked(alertHandoff).mockClear();
  vi.mocked(alertWaitingCustomer).mockClear();
});

describe("photos, documents and voice notes", () => {
  it("answers a photo with the secure-documents message and hands the chat to a person, storing no content", async () => {
    const provider = new MockWhatsAppProvider();
    await processInboundMedia({ ...base, type: "IMAGE", reply: "security" }, provider);
    expect(provider.sent).toEqual([{ kind: "text", to: "447700900000", body: SENSITIVE_DATA_REPLIES.en }]);
    expect(state.messages[0]).toMatchObject({ direction: "IN", type: "IMAGE", body: null });
    expect(state.conversation.status).toBe("HUMAN");
    expect(state.handoffs).toHaveLength(1);
    expect(state.handoffs[0]).toMatchObject({ reason: "customer sent a photo, document or video", triggeredBy: "AUTO" });
    expect(state.pipelineCalls).toBe(0);
    expect(alertHandoff).toHaveBeenCalledWith({ agencyId: "a1", conversationId: "v1", reason: "customer sent a photo, document or video", message: null });
  });

  it("answers a voice note in the language of the customer's last text message", async () => {
    state.lastInboundText = "كم سعر العمرة";
    const provider = new MockWhatsAppProvider();
    await processInboundMedia({ ...base, type: "AUDIO", reply: "voice" }, provider);
    expect(provider.sent[0]).toMatchObject({ body: VOICE_NOTE_REPLIES.ar });
    expect(state.handoffs[0]?.reason).toMatch(/voice note/);
  });

  it("stays quiet if a person already has the chat", async () => {
    state.conversation.status = "HUMAN";
    const provider = new MockWhatsAppProvider();
    await processInboundMedia({ ...base, type: "IMAGE", reply: "security" }, provider);
    expect(provider.sent).toEqual([]);
    expect(state.messages).toHaveLength(1);
    expect(alertHandoff).not.toHaveBeenCalled();
    expect(alertWaitingCustomer).toHaveBeenCalledWith({ agencyId: "a1", conversationId: "v1", message: null });
  });

  it("tells the team when the customer writes again in a chat that is waiting on a person", async () => {
    state.conversation.status = "HUMAN";
    const provider = new MockWhatsAppProvider();
    await processInboundMessage(text("Hello? Is anyone there?"), provider);
    expect(provider.sent).toEqual([]);
    expect(alertWaitingCustomer).toHaveBeenCalledWith({ agencyId: "a1", conversationId: "v1", message: "Hello? Is anyone there?" });
  });
});

describe("STOP and START", () => {
  it("STOP opts the contact out for good, confirms once, closes the chat and never calls the model", async () => {
    const provider = new MockWhatsAppProvider();
    await processInboundMessage(text("STOP"), provider);
    expect(state.contact.optOut).toBe(true);
    expect(provider.sent).toEqual([{ kind: "text", to: "447700900000", body: OPT_OUT_REPLIES.en }]);
    expect(state.conversation.status).toBe("CLOSED");
    expect(state.pipelineCalls).toBe(0);
  });

  it("sends nothing at all to an opted-out contact, whatever they write", async () => {
    state.contact.optOut = true;
    const provider = new MockWhatsAppProvider();
    await processInboundMessage(text("how much is Umrah in March?"), provider);
    await processInboundMedia({ ...base, waMessageId: "wamid.2", type: "IMAGE", reply: "security" }, provider);
    expect(provider.sent).toEqual([]);
    expect(state.messages).toEqual([]);
  });

  it("START brings them back with a welcome in their language", async () => {
    state.contact.optOut = true;
    const provider = new MockWhatsAppProvider();
    await processInboundMessage(text("START"), provider);
    expect(state.contact.optOut).toBe(false);
    expect(provider.sent).toEqual([{ kind: "text", to: "447700900000", body: OPT_IN_REPLIES.en }]);
  });
});
