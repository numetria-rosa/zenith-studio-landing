import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ planId: null as string | null, agencyExists: true, rows: [] as { whopPaymentId: string; replies: number; budgetUsdCents: number; currency: string; agencyId: string }[] }));
vi.mock("@/lib/db", () => ({ db: { waSubscription: { findUnique: async () => ({ whopPlanId: state.planId }) } } }));
vi.mock("@/lib/whop", () => ({ getWhopClient: () => ({}) }));

import { COUNTRY_STARTER_PLAN_IDS } from "./whop-plans";
import { EXTRA_PACK_PLAN_IDS, EXTRA_REPLIES_KIND, extraPackOffer, formatPackPrice, isExtraRepliesPayment, recordExtraRepliesPayment } from "./extra-replies";
import { EXTRA_PACK_REPLIES, extraPackBudgetUsdCents } from "./economics";

const tx = {
  waAgency: { findUnique: async () => (state.agencyExists ? { id: "a1" } : null) },
  waExtraReplies: {
    findUnique: async ({ where }: { where: { whopPaymentId: string } }) => state.rows.find((r) => r.whopPaymentId === where.whopPaymentId) ?? null,
    create: async ({ data }: { data: (typeof state.rows)[number] }) => void state.rows.push(data),
  },
} as never;

const paid = (over: Record<string, unknown> = {}) => ({ id: "pay_1", metadata: { kind: EXTRA_REPLIES_KIND, agencyId: "a1", currency: "GBP" }, currency: "gbp", subtotal: 6, total: 7.2, ...over });

beforeEach(() => {
  state.agencyExists = true;
  state.rows = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("recording a paid pack", () => {
  it("credits one pack with its AI budget", async () => {
    expect(await recordExtraRepliesPayment(tx, paid())).toBe("recorded");
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0]).toMatchObject({ agencyId: "a1", replies: EXTRA_PACK_REPLIES, currency: "GBP", budgetUsdCents: Math.round(extraPackBudgetUsdCents("GBP")) });
  });

  it("a retried webhook never credits the same payment twice", async () => {
    await recordExtraRepliesPayment(tx, paid());
    expect(await recordExtraRepliesPayment(tx, paid())).toBe("duplicate");
    expect(state.rows).toHaveLength(1);
  });

  it("refuses a payment for an unknown agency, a bad currency, or less than the price", async () => {
    state.agencyExists = false;
    expect(await recordExtraRepliesPayment(tx, paid())).toBe("rejected");
    state.agencyExists = true;
    expect(await recordExtraRepliesPayment(tx, paid({ metadata: { kind: EXTRA_REPLIES_KIND, agencyId: "a1", currency: "EUR" } }))).toBe("rejected");
    expect(await recordExtraRepliesPayment(tx, paid({ subtotal: 1, total: 1.2 }))).toBe("rejected");
    expect(await recordExtraRepliesPayment(tx, paid({ currency: "usd" }))).toBe("rejected");
    expect(state.rows).toHaveLength(0);
  });

  it("knows its own payments from every other payment", () => {
    expect(isExtraRepliesPayment({ kind: EXTRA_REPLIES_KIND })).toBe(true);
    expect(isExtraRepliesPayment({ kind: "something else" })).toBe(false);
    expect(isExtraRepliesPayment(null)).toBe(false);
  });
});

describe("the pack follows the plan the agency first bought", () => {
  it("is priced in the currency of the agency's own plan", async () => {
    state.planId = COUNTRY_STARTER_PLAN_IDS.USD;
    expect(await extraPackOffer("a1")).toMatchObject({ currency: "USD", price: 9 });
    state.planId = COUNTRY_STARTER_PLAN_IDS.ZAR;
    expect(await extraPackOffer("a1")).toMatchObject({ currency: "ZAR", price: 140 });
  });
  it("falls back to pounds for the UK plan or no plan on record", async () => {
    state.planId = null;
    expect(await extraPackOffer("a1")).toMatchObject({ currency: "GBP", price: 6 });
  });
});

describe("the Whop plans", () => {
  it("every currency has its own plan id", () => {
    const ids = Object.values(EXTRA_PACK_PLAN_IDS);
    expect(Object.keys(EXTRA_PACK_PLAN_IDS).sort()).toEqual(["AUD", "CAD", "GBP", "USD", "ZAR"]);
    expect(new Set(ids).size).toBe(5);
    for (const id of ids) expect(id).toMatch(/^plan_[A-Za-z0-9]+$/);
  });
});

describe("the price label", () => {
  it("adds the currency code only where the dollar sign is ambiguous", () => {
    expect(formatPackPrice("GBP", 6)).toBe("£6");
    expect(formatPackPrice("USD", 9)).toBe("$9");
    expect(formatPackPrice("CAD", 12)).toBe("$12 CAD");
    expect(formatPackPrice("AUD", 13)).toBe("$13 AUD");
    expect(formatPackPrice("ZAR", 140)).toBe("R140");
  });
});
