import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ plan: "STARTER", limit: null as number | null, replies: 0, spendCents: 0 as number | null, simulatorToday: 0 }));
vi.mock("@/lib/db", () => ({
  db: {
    waSubscription: { findUnique: async () => ({ plan: state.plan }) },
    waAgentSettings: { findUnique: async () => ({ monthlyReplyLimit: state.limit }) },
    waUsageCounter: { findUnique: async () => ({ aiReplies: state.replies }) },
    waPromptRun: { aggregate: async () => ({ _sum: { costEstimateCents: state.spendCents } }), count: async () => state.simulatorToday },
  },
}));
import { effectiveCap, simulatorBlocked, SIMULATOR_DAILY_LIMIT, withinCap } from "./entitlements";
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
  it("ignores a zero or negative limit", () => {
    expect(effectiveCap(1000, 0)).toBe(1000);
    expect(effectiveCap(1000, -5)).toBe(1000);
  });
});

describe("withinCap: the reply count and the AI budget", () => {
  const reset = () => Object.assign(state, { plan: "STARTER", limit: null, replies: 0, spendCents: 0, simulatorToday: 0 });

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

  it("treats a month with no priced runs as zero spend", async () => {
    reset();
    state.spendCents = null;
    expect(await withinCap("a1")).toMatchObject({ withinCap: true, spendUsdCents: 0 });
  });
});

describe("simulatorBlocked", () => {
  const reset = () => Object.assign(state, { plan: "STARTER", limit: null, replies: 0, spendCents: 0, simulatorToday: 0 });
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
