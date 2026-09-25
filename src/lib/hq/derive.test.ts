import { describe, it, expect } from "vitest";
import { mrrOf, totalMrrCents, attentionQueue, fmtHours, fmtMoney } from "./derive";
import type { HqClient } from "./types";

function client(overrides: Partial<HqClient> = {}): HqClient {
  return {
    id: "c1",
    name: "Test Co",
    contactName: "Dana",
    contactEmail: "dana@test.co",
    service: "law-firms",
    status: "active",
    billingCycle: "monthly",
    since: new Date("2026-01-01"),
    health: 90,
    paymentOk: true,
    nextChargeAt: null,
    setupStage: null,
    setupReadyBy: null,
    trialEndsAt: null,
    agents: [],
    adminNote: "",
    priceCents: 108000,
    slaHours: 24,
    ...overrides,
  };
}

describe("mrrOf", () => {
  it("counts only active clients", () => {
    expect(mrrOf(client({ status: "active", priceCents: 1000 }))).toBe(1000);
    expect(mrrOf(client({ status: "trial", priceCents: 1000 }))).toBe(0);
    expect(mrrOf(client({ status: "setup", priceCents: 1000 }))).toBe(0);
    expect(mrrOf(client({ status: "paused", priceCents: 1000 }))).toBe(0);
  });
});

describe("totalMrrCents", () => {
  it("sums active clients only", () => {
    const clients = [client({ status: "active", priceCents: 500 }), client({ status: "trial", priceCents: 900 }), client({ status: "active", priceCents: 300 })];
    expect(totalMrrCents(clients)).toBe(800);
  });
});

describe("attentionQueue", () => {
  const now = new Date("2026-09-25T12:00:00Z");

  it("sorts red before amber before cyan", () => {
    const clients = [
      client({ id: "trial1", status: "trial", trialEndsAt: new Date("2026-09-26T00:00:00Z") }), // cyan, 12h out
      client({ id: "pay1", paymentOk: false }), // red
      client({ id: "health1", status: "active", health: 30 }), // amber
    ];
    const q = attentionQueue(clients, [], now);
    expect(q.map((i) => i.severity)).toEqual(["red", "amber", "cyan"]);
  });

  it("excludes a healthy, fully-paid, non-trial client entirely", () => {
    const q = attentionQueue([client()], [], now);
    expect(q).toHaveLength(0);
  });

  it("flags a real agent that needs attention as a red item", () => {
    const q = attentionQueue([client({ agents: [{ id: "a1", name: "Billing Clerk", tone: "need", stateLabel: "waiting on you", todayLabel: "x", todayValue: 1, real: true }] })], [], now);
    expect(q).toHaveLength(1);
    expect(q[0].severity).toBe("red");
    expect(q[0].title).toContain("Billing Clerk");
  });

  it("ignores a non-real agent's tone (never fabricates urgency for an unbuilt agent)", () => {
    const q = attentionQueue([client({ agents: [{ id: "a1", name: "Unbuilt", tone: "dim", stateLabel: "not set up", todayLabel: "x", todayValue: 0, real: false }] })], [], now);
    expect(q).toHaveLength(0);
  });
});

describe("formatting", () => {
  it("fmtHours switches to days at 48h", () => {
    expect(fmtHours(47)).toBe("47h");
    expect(fmtHours(48)).toBe("2 days");
    expect(fmtHours(96)).toBe("4 days");
  });
  it("fmtMoney formats whole dollars with no decimals", () => {
    expect(fmtMoney(108000)).toBe("$1,080");
  });
});
