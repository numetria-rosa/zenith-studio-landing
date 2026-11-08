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

/** The Starter plan is sold in five currencies, each its own Whop plan (see scripts/create-whatsapp-umrah-country-plans.mjs).
    What the owner charges in each, and what that is worth in pounds at a strong-pound exchange rate (1.37 USD, 1.90 CAD,
    2.07 AUD, 22.5 ZAR to the pound, rounded down to 50p), so the margin rule holds even if the pound is strong. The AI budget
    for a currency is worked out from its pound value, not from 49, because the other currencies are priced below it. */
export type PlanCurrency = "GBP" | "USD" | "CAD" | "AUD" | "ZAR";
export const STARTER_PRICE_LOCAL: Record<PlanCurrency, number> = { GBP: 49, USD: 52, CAD: 83, AUD: 85, ZAR: 900 };
export const STARTER_PRICE_GBP_EQUIV: Record<PlanCurrency, number> = { GBP: 49, USD: 37.5, CAD: 43.5, AUD: 41, ZAR: 40 };

/** What the plan is worth to us in pounds, in the currency it was bought in (only Starter is sold in other currencies). */
export function planPriceGbp(plan: WaPlan, currency: PlanCurrency = "GBP"): number {
  return plan === "STARTER" ? STARTER_PRICE_GBP_EQUIV[currency] : PLAN_PRICE_GBP[plan];
}

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

export function whopFeeGbp(plan: WaPlan, currency: PlanCurrency = "GBP"): number {
  return planPriceGbp(plan, currency) * WHOP_FEE_RATE + WHOP_FEE_FIXED_GBP;
}

/** Monthly AI spend a plan can carry and still keep MIN_MARGIN, in pounds, rounded down to 50p. */
export function aiBudgetGbp(plan: WaPlan, currency: PlanCurrency = "GBP"): number {
  const room = planPriceGbp(plan, currency) * (1 - MIN_MARGIN) - whopFeeGbp(plan, currency) - INFRA_PER_AGENCY_GBP[plan];
  return Math.max(0, Math.floor(room * SAFETY * 2) / 2);
}

/** The budget in US cents, the unit WaPromptRun.costEstimateCents is stored in. */
export function aiBudgetUsdCents(plan: WaPlan, currency: PlanCurrency = "GBP"): number {
  return (aiBudgetGbp(plan, currency) / USD_TO_GBP) * 100;
}

/** Margin on the plan's price if the agency spends `aiSpendGbp` of AI in a month. */
export function marginAt(plan: WaPlan, aiSpendGbp: number, currency: PlanCurrency = "GBP"): number {
  const price = planPriceGbp(plan, currency);
  return (price - whopFeeGbp(plan, currency) - INFRA_PER_AGENCY_GBP[plan] - aiSpendGbp) / price;
}

/* Extra replies: an owner who needs more than the plan's monthly replies buys them in packs, one-time, and they never
   expire: they are used up, oldest pack first, only once the plan's replies for the month are gone (decided 2026-11-08,
   reversing the 2026-11-07 removal of the add-on; first made month-only, then made to carry over the same day). Packs carry a 60% margin,
   not the 80% the plans keep: the agency already pays for hosting and the plan, so a pack is only the Whop fee and the
   AI calls. Each extra reply raises the month's cap by one and its AI budget by a pack's budget divided by EXTRA_PACK_REPLIES, so the
   agent still pauses when the extra spend runs out, whatever the reply count. */
export const EXTRA_PACK_REPLIES = 500;
export const EXTRA_PACK_MIN_MARGIN = 0.6;
export const EXTRA_PACK_PRICE_LOCAL: Record<PlanCurrency, number> = { GBP: 6, USD: 9, CAD: 12, AUD: 13, ZAR: 140 };
/** What a pack is worth in pounds at a strong-pound rate (1.37 USD, 1.90 CAD, 2.07 AUD, 22.5 ZAR), rounded down to 50p. */
export const EXTRA_PACK_PRICE_GBP_EQUIV: Record<PlanCurrency, number> = { GBP: 6, USD: 6.5, CAD: 6, AUD: 6, ZAR: 6 };

/** AI spend one pack can carry and still keep EXTRA_PACK_MIN_MARGIN, in pounds, rounded down to 25p. */
export function extraPackBudgetGbp(currency: PlanCurrency = "GBP"): number {
  const price = EXTRA_PACK_PRICE_GBP_EQUIV[currency];
  const room = price * (1 - EXTRA_PACK_MIN_MARGIN) - (price * WHOP_FEE_RATE + WHOP_FEE_FIXED_GBP);
  return Math.max(0, Math.floor(room * SAFETY * 4) / 4);
}
export function extraPackBudgetUsdCents(currency: PlanCurrency = "GBP"): number {
  return (extraPackBudgetGbp(currency) / USD_TO_GBP) * 100;
}
/** Margin on one pack if its AI budget is spent in full. */
export function extraPackMarginAt(aiSpendGbp: number, currency: PlanCurrency = "GBP"): number {
  const price = EXTRA_PACK_PRICE_GBP_EQUIV[currency];
  return (price - (price * WHOP_FEE_RATE + WHOP_FEE_FIXED_GBP) - aiSpendGbp) / price;
}
