import { describe, expect, it } from "vitest";
import type { WaPlan } from "@prisma/client";
import { PLANNING_COST_PER_REPLY_GBP, MIN_MARGIN, PLAN_PRICE_GBP, STARTER_PRICE_GBP_EQUIV, STARTER_PRICE_LOCAL, aiBudgetGbp, aiBudgetUsdCents, marginAt, type PlanCurrency } from "./economics";
import { replyCapFor } from "./entitlements";

const PLANS: WaPlan[] = ["STARTER", "GROWTH", "PRO"];

describe("the 80% margin rule", () => {
  it.each(PLANS)("%s keeps at least 80% even when its whole AI budget is spent", (plan) => {
    expect(marginAt(plan, aiBudgetGbp(plan))).toBeGreaterThanOrEqual(MIN_MARGIN);
  });

  it.each(PLANS)("%s's promised replies fit inside its AI budget at the planning cost per reply", (plan) => {
    expect(replyCapFor(plan) * PLANNING_COST_PER_REPLY_GBP).toBeLessThanOrEqual(aiBudgetGbp(plan));
  });

  it("budgets are the figures in docs/unit-economics.md", () => {
    expect(PLANS.map((p) => aiBudgetGbp(p))).toEqual([4.5, 9.5, 20.5]);
    expect(PLANS.map((p) => replyCapFor(p))).toEqual([1000, 3500, 8000]);
  });

  it("a typical month costs far less than the budget, so the budget is a backstop and not a limit owners hit", () => {
    expect(replyCapFor("STARTER") * PLANNING_COST_PER_REPLY_GBP).toBeLessThan(aiBudgetGbp("STARTER") * 0.6);
  });

  it("the budget in US cents is what the usage meter compares against", () => {
    expect(aiBudgetUsdCents("STARTER")).toBeCloseTo((4.5 / 0.8) * 100, 5);
  });

  it("prices are the ones the budgets were worked out for", () => {
    expect(PLAN_PRICE_GBP).toEqual({ STARTER: 49, GROWTH: 99, PRO: 199 });
  });
});

// Starter is sold in five currencies, each priced below 49 pounds outside the UK, so each gets a budget sized to its own price.
const CURRENCIES: PlanCurrency[] = ["GBP", "USD", "CAD", "AUD", "ZAR"];
describe("Starter in every currency", () => {
  it.each(CURRENCIES)("%s keeps at least 80% even when its whole AI budget is spent", (currency) => {
    expect(marginAt("STARTER", aiBudgetGbp("STARTER", currency), currency)).toBeGreaterThanOrEqual(MIN_MARGIN);
  });
  it.each(CURRENCIES)("%s's 1,000 promised replies fit inside its AI budget at the planning cost per reply", (currency) => {
    expect(replyCapFor("STARTER") * PLANNING_COST_PER_REPLY_GBP).toBeLessThanOrEqual(aiBudgetGbp("STARTER", currency));
  });
  it("the local prices are the ones set for the demo pages and the Whop plans", () => {
    expect(STARTER_PRICE_LOCAL).toEqual({ GBP: 49, USD: 52, CAD: 83, AUD: 85, ZAR: 900 });
  });
  it("the pound values are no higher than the local prices converted at a strong-pound rate", () => {
    const strongPoundRate = { GBP: 1, USD: 1.37, CAD: 1.9, AUD: 2.07, ZAR: 22.5 };
    for (const c of CURRENCIES) expect(STARTER_PRICE_GBP_EQUIV[c]).toBeLessThanOrEqual(STARTER_PRICE_LOCAL[c] / strongPoundRate[c] + 0.01);
  });
});
