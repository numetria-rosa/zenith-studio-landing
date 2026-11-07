import { describe, expect, it } from "vitest";
import type { WaPlan } from "@prisma/client";
import { PLANNING_COST_PER_REPLY_GBP, MIN_MARGIN, PLAN_PRICE_GBP, aiBudgetGbp, aiBudgetUsdCents, marginAt } from "./economics";
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
    expect(PLANS.map(aiBudgetGbp)).toEqual([4.5, 9.5, 20.5]);
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
