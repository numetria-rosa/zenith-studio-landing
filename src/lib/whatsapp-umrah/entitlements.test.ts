import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ plan: "STARTER", limit: null as number | null, replies: 0, spendCents: 0 as number | null, simulatorToday: 0, extraRemaining: 0, drawn: 0 }));
vi.mock("@/lib/db", () => ({
  db: {
    waSubscription: { findUnique: async () => ({ plan: state.plan }) },
    waAgentSettings: { findUnique: async () => ({ monthlyReplyLimit: state.limit }) },
    waUsageCounter: { findUnique: async () => ({ aiReplies: state.replies }), upsert: async () => ({ aiReplies: ++state.replies }) },
    waExtraReplies: {
      aggregate: async () => ({ _sum: { remaining: state.extraRemaining || null } }),
      findFirst: async () => (state.extraRemaining > 0 ? { id: "p1" } : null),
      update: async () => void (state.drawn++, state.extraRemaining--),
    },
    waPromptRun: { aggregate: async () => ({ _sum: { costEstimateCents: state.spendCents } }), count: async () => state.simulatorToday },
  },
}));
import { effectiveCap, recordAiReply, simulatorBlocked, SIMULATOR_DAILY_LIMIT, withinCap } from "./entitlements";
import { aiBudgetUsdCents } from "./economics";

describe("effectiveCap", () => {
  it("uses the plan cap when the agency set no limit", () => {
    expect(effectiveCap(1000, null)).toBe(1000);
    expect(effectiveCap(1000, undefined)).toBe(1000);
  });
  it("lowers the cap to the agency's own limit", () => {
    expect(effectiveCap(1000, 300)).toBe(300);
  });
  it("never raises it above the plan cap", () => {
    expect(effectiveCap(1000, 5000)).toBe(1000);
  });
  it("adds extra replies on top, past even the agency's own lower limit", () => {
    expect(effectiveCap(1000, null, 500)).toBe(1500);
    expect(effectiveCap(1000, 300, 500)).toBe(800);
  });
  it("ignores a zero or negative limit", () => {
    expect(effectiveCap(1000, 0)).toBe(1000);
    expect(effectiveCap(1000, -5)).toBe(1000);
  });
});

describe("withinCap: the reply count and the AI budget", () => {
  const reset = () => Object.assign(state, { plan: "STARTER", limit: null, replies: 0, spendCents: 0, simulatorToday: 0, extraRemaining: 0, drawn: 0 });

  it("lets the agent answer while both are under their limits", async () => {
    reset();
    state.replies = 400;
    state.spendCents = 100;
    expect(await withinCap("a1")).toMatchObject({ withinCap: true, limit: null, cap: 1000, used: 400 });
  });

  it("stops at the reply cap", async () => {
    reset();
    state.replies = 1000;
    expect(await withinCap("a1")).toMatchObject({ withinCap: false, limit: "replies" });
  });

  it("stops at the agency's own, lower limit", async () => {
    reset();
    state.limit = 200;
    state.replies = 200;
    expect(await withinCap("a1")).toMatchObject({ withinCap: false, limit: "replies", cap: 200 });
  });

  it("stops at the AI budget even with replies to spare, which is what protects the margin", async () => {
    reset();
    state.replies = 50;
    state.spendCents = aiBudgetUsdCents("STARTER");
    expect(await withinCap("a1")).toMatchObject({ withinCap: false, limit: "budget" });
  });

  it("extra replies keep the agent going past the plan's replies, and the AI budget grows with them", async () => {
    reset();
    state.replies = 1000;
    state.extraRemaining = 500;
    expect(await withinCap("a1")).toMatchObject({ withinCap: true, cap: 1500, planCap: 1500, extraReplies: 500, extraRemaining: 500, limit: null });
    const withExtras = (await withinCap("a1")).budgetUsdCents;
    expect(withExtras).toBeGreaterThan(aiBudgetUsdCents("STARTER"));
    state.spendCents = withExtras;
    expect(await withinCap("a1")).toMatchObject({ withinCap: false, limit: "budget" });
  });

  it("the cap stays put while extras are being used, and stops when they run out", async () => {
    reset();
    state.replies = 1200; // 200 of the 500 already used
    state.extraRemaining = 300;
    expect(await withinCap("a1")).toMatchObject({ withinCap: true, cap: 1500, extraReplies: 500, extraRemaining: 300 });
    state.replies = 1500;
    state.extraRemaining = 0;
    expect(await withinCap("a1")).toMatchObject({ withinCap: false, limit: "replies", cap: 1500 });
  });

  it("unused extras carry over into the next month", async () => {
    reset();
    state.replies = 0; // a new month
    state.extraRemaining = 400;
    expect(await withinCap("a1")).toMatchObject({ withinCap: true, cap: 1400, extraReplies: 400, extraRemaining: 400 });
  });

  it("treats a month with no priced runs as zero spend", async () => {
    reset();
    state.spendCents = null;
    expect(await withinCap("a1")).toMatchObject({ withinCap: true, spendUsdCents: 0 });
  });
});

describe("simulatorBlocked", () => {
  const reset = () => Object.assign(state, { plan: "STARTER", limit: null, replies: 0, spendCents: 0, simulatorToday: 0, extraRemaining: 0, drawn: 0 });
  it("allows tests under the daily limit", async () => {
    reset();
    state.simulatorToday = SIMULATOR_DAILY_LIMIT - 1;
    expect(await simulatorBlocked("a1")).toBeNull();
  });
  it("refuses once today's tests are used up", async () => {
    reset();
    state.simulatorToday = SIMULATOR_DAILY_LIMIT;
    expect(await simulatorBlocked("a1")).toMatch(/daily limit/);
  });
  it("refuses when the month's AI budget is gone", async () => {
    reset();
    state.spendCents = aiBudgetUsdCents("STARTER") + 1;
    expect(await simulatorBlocked("a1")).toMatch(/allowance/);
  });
});

describe("recordAiReply and the extra packs", () => {
  it("does not touch the packs while the plan's own replies last", async () => {
    Object.assign(state, { plan: "STARTER", limit: null, replies: 10, extraRemaining: 500, drawn: 0 });
    await recordAiReply("a1");
    expect(state.drawn).toBe(0);
    expect(state.extraRemaining).toBe(500);
  });

  it("takes each reply past the plan's own out of a pack", async () => {
    Object.assign(state, { plan: "STARTER", limit: null, replies: 1000, extraRemaining: 500, drawn: 0 });
    await recordAiReply("a1");
    await recordAiReply("a1");
    expect(state.drawn).toBe(2);
    expect(state.extraRemaining).toBe(498);
  });

  it("does nothing if there is no pack to draw from", async () => {
    Object.assign(state, { plan: "STARTER", limit: null, replies: 1000, extraRemaining: 0, drawn: 0 });
    await recordAiReply("a1");
    expect(state.drawn).toBe(0);
  });
});
