import { beforeEach, describe, expect, it, vi } from "vitest";

/* The booking flow end to end through processInboundMessage: the agent confirms the booking to the customer, then the
   chat goes to the team with what the customer has told us. The model is a stub; the database is a small in-memory
   stand-in; sends go to the mock provider, never to WhatsApp. */

const state = vi.hoisted(() => ({
  conversation: { id: "v1", status: "AI" as "AI" | "HUMAN" | "CLOSED" },
  handoffs: [] as { reason: string; triggeredBy: string }[],
  lead: { travelDates: "Ramadan 2027", travelers: 2, budgetGbp: null, departureCity: "Manchester", hotelTier: null, packagePreference: null } as Record<string, unknown> | null,
  pipelineInput: null as unknown,
  result: null as unknown,
}));

vi.mock("@/lib/db", () => ({
  db: {
    waMessage: { findUnique: async () => null, create: async () => ({}), findFirst: async () => null, findMany: async () => [] },
    waWhatsAppAccount: { findFirst: async () => ({ agencyId: "a1", encryptedAccessToken: null, lastError: null }) },
    waAgency: { findUnique: async () => ({ id: "a1", name: "Al Noor Travel", status: "LIVE", memberships: [], agentSettings: null }) },
    waContact: { upsert: async () => ({ id: "c1", optOut: false }), update: async () => ({}) },
    waConversation: {
      findFirst: async () => state.conversation,
      create: async () => state.conversation,
      update: async ({ data }: { data: { status?: "AI" | "HUMAN" | "CLOSED" } }) => void (data.status && (state.conversation.status = data.status)),
    },
    waHandoff: { create: async ({ data }: { data: { reason: string; triggeredBy: string } }) => void state.handoffs.push(data) },
    waPromptRun: { createMany: async () => ({}) },
    waLead: { findFirst: async () => state.lead, create: async () => ({ id: "l1", status: "HOT" }), update: async () => ({ id: "l1", status: "HOT" }) },
    waLeadEvent: { create: async () => ({}) },
  },
}));
vi.mock("@/lib/secrets", () => ({ decryptSecret: () => "token" }));
vi.mock("@/lib/outreach-mail", () => ({ sendPlainEmail: vi.fn(), sendAdminAlert: vi.fn() }));
vi.mock("./entitlements", () => ({ withinCap: async () => ({ withinCap: true, used: 0, cap: 100, planCap: 100 }), recordAiReply: async () => {} }));
vi.mock("./send-failure", () => ({ trackSend: async () => {}, noteSendFailure: async () => {} }));
vi.mock("./handoff-alerts", () => ({ alertHandoff: vi.fn(), alertWaitingCustomer: vi.fn() }));
vi.mock("./agent/pipeline", () => ({
  runAgentPipeline: async (input: unknown) => {
    state.pipelineInput = input;
    return state.result;
  },
}));

import { processInboundMessage } from "./inbound";
import { alertHandoff } from "./handoff-alerts";
import { BOOKING_READY_REASON } from "./agent/reasons";
import { MockWhatsAppProvider } from "./provider/mock";

const msg = { phoneNumberId: "555", from: "447700900000", waMessageId: "wamid.1", timestamp: "1", contactName: "Sam", body: "ok i'll take the ramadan one" };
const reply = (over: Record<string, unknown> = {}) => ({ action: "reply", text: "Wonderful, our team will take it from here.", language: "en", intent: "booking_interest", leadFields: { packagePreference: "Ramadan Umrah 2027" }, model: "m", guardsTriggered: [], promptRuns: [], sources: [], ...over });

beforeEach(() => {
  state.conversation = { id: "v1", status: "AI" };
  state.handoffs = [];
  state.lead = { travelDates: "Ramadan 2027", travelers: 2, budgetGbp: null, departureCity: "Manchester", hotelTier: null, packagePreference: null };
  state.pipelineInput = null;
  vi.mocked(alertHandoff).mockClear();
});

describe("a customer who commits to booking", () => {
  it("gets the agent's confirmation, then the chat goes to the team with the details already known", async () => {
    state.result = reply({ readyToBook: true });
    const provider = new MockWhatsAppProvider();
    await processInboundMessage(msg, provider);
    expect(provider.sent).toEqual([{ kind: "text", to: "447700900000", body: "Wonderful, our team will take it from here." }]);
    expect(state.conversation.status).toBe("HUMAN");
    expect(state.handoffs).toHaveLength(1);
    expect(state.handoffs[0]).toMatchObject({ reason: BOOKING_READY_REASON, triggeredBy: "AUTO" });
    expect(alertHandoff).toHaveBeenCalledWith(expect.objectContaining({ reason: BOOKING_READY_REASON, summary: "2 travellers, Ramadan 2027, from Manchester, interested in Ramadan Umrah 2027" }));
  });

  it("is not handed over for an ordinary answer", async () => {
    state.result = reply({ readyToBook: false, intent: "pricing" });
    await processInboundMessage(msg, new MockWhatsAppProvider());
    expect(state.conversation.status).toBe("AI");
    expect(state.handoffs).toEqual([]);
    expect(alertHandoff).not.toHaveBeenCalled();
  });
});

describe("memory", () => {
  it("gives the agent what the lead record already holds, so it is not asked for again", async () => {
    state.result = reply({ readyToBook: false });
    await processInboundMessage(msg, new MockWhatsAppProvider());
    expect(state.pipelineInput).toMatchObject({ knownDetails: "2 travellers, Ramadan 2027, from Manchester" });
  });

  it("passes nothing for a brand new customer", async () => {
    state.lead = null;
    state.result = reply({ readyToBook: false });
    await processInboundMessage(msg, new MockWhatsAppProvider());
    expect(state.pipelineInput).toMatchObject({ knownDetails: "" });
  });
});
