import type { WaPlan } from "@prisma/client";

/* The margin rule, in one place. Every plan must keep at least MIN_MARGIN of its price after what it costs us:
   the payment fee, a share of hosting, and the AI calls (Meta bills the agency directly, so it is not our cost).
   AI spend is the only cost that moves with usage, so each plan gets a monthly AI BUDGET sized so that using all of
   it still leaves MIN_MARGIN. entitlements.ts stops the agent when an agency's estimated AI spend reaches the budget,
   whatever the reply count, which is what makes the margin a guarantee and not a hope (a reply on a 30-package
   agency, or one that escalates to Claude, costs several times a plain one). economics.test.ts fails if a price,
   cap or budget is changed in a way that breaks the rule. Workings: docs/unit-economics.md. */

export const MIN_MARGIN = 0.8;

export const PLAN_PRICE_GBP: Record<WaPlan, number> = { STARTER: 49, GROWTH: 99, PRO: 199 };

/** Whop's fee, the working estimate from docs/unit-economics.md (2.7% + 1.5% + 1% + 2%, plus 30 cents a charge).
    Not yet confirmed with Whop for a UK recurring plan; if it turns out higher, lower the budgets here. */
export const WHOP_FEE_RATE = 0.072;
export const WHOP_FEE_FIXED_GBP = 0.23;

/** A share of Neon, Vercel and email per agency (an allowance, not a measurement). */
export const INFRA_PER_AGENCY_GBP: Record<WaPlan, number> = { STARTER: 1, GROWTH: 1.5, PRO: 2 };

/** Dollars to pounds, set a little against us ($1 was about 0.78 pounds when the model prices were checked). */
export const USD_TO_GBP = 0.8;

/** What one AI reply costs on a typical agency (4 packages, ~4,600 input and 300 output tokens), assuming 35% of
    replies escalate to Claude: Groq 0.00035 + 0.35 x Claude 0.0049, rounded up for the query-translation call. */
export const PLANNING_COST_PER_REPLY_GBP = 0.0025;

/** Share of the budget kept back for calls we don't log (the query-translation step) and for estimate error. */
const SAFETY = 0.9;

export function whopFeeGbp(plan: WaPlan): number {
  return PLAN_PRICE_GBP[plan] * WHOP_FEE_RATE + WHOP_FEE_FIXED_GBP;
}

/** Monthly AI spend a plan can carry and still keep MIN_MARGIN, in pounds, rounded down to 50p. */
export function aiBudgetGbp(plan: WaPlan): number {
  const room = PLAN_PRICE_GBP[plan] * (1 - MIN_MARGIN) - whopFeeGbp(plan) - INFRA_PER_AGENCY_GBP[plan];
  return Math.max(0, Math.floor(room * SAFETY * 2) / 2);
}

/** The budget in US cents, the unit WaPromptRun.costEstimateCents is stored in. */
export function aiBudgetUsdCents(plan: WaPlan): number {
  return (aiBudgetGbp(plan) / USD_TO_GBP) * 100;
}

/** Margin on the plan's price if the agency spends `aiSpendGbp` of AI in a month. */
export function marginAt(plan: WaPlan, aiSpendGbp: number): number {
  const price = PLAN_PRICE_GBP[plan];
  return (price - whopFeeGbp(plan) - INFRA_PER_AGENCY_GBP[plan] - aiSpendGbp) / price;
}
