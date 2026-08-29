import { db } from "@/lib/db";
import { getWhopClient } from "@/lib/whop";
import type { ProposalItem, ProposalItemKind } from "@prisma/client";

/* Whop plan creation for approved Proposals. See the ProposalPaymentMode
   enum's own doc comment in prisma/schema.prisma for the SPLIT vs BUNDLED
   distinction. Every plan created here attaches to one shared, hidden Whop
   product (created once via scripts/create-proposal-whop-product.mjs) —
   proposal amounts are per-client and custom, so unlike services.ts's
   per-service products there's nothing to browse; the product exists only
   as the required container Whop's API makes every plan belong to. */

const PROPOSAL_WHOP_PRODUCT_ID = "prod_wSRdxsXN2isTC";

/** Whop's checkout link is always this exact shape for any plan id —
    confirmed against a real created plan's own purchase_url, both
    one_time and renewal. Deriving it from a stored plan id (rather than
    also persisting purchase_url) keeps the DB schema down to the one
    identifier that actually matters, matching services.ts's own plan_id
    ->checkout-URL convention. */
export function whopCheckoutUrl(planId: string): string {
  return `https://whop.com/checkout/${planId}`;
}

/** Splits a proposal's core items + whichever add-ons the client actually
    selected into a one-time ("setup") bucket and a recurring ("monthly")
    bucket. Mirrors computeProposalAmountBreakdown's own bucketing (MONTHLY
    kind -> recurring, everything else -> one-time) but, unlike that
    function, counts SELECTED add-ons too — computeProposalAmountBreakdown
    skips all add-ons unconditionally because it backs the admin/public
    "core vs add-on" display, not an approved-and-paid-for total. */
export function computeApprovedTotals(
  items: Pick<ProposalItem, "id" | "amountCents" | "isOptionalAddOn" | "kind">[],
  selectedAddOnItemIds: string[]
): { setupCents: number; monthlyCents: number } {
  const selected = new Set(selectedAddOnItemIds);
  let setupCents = 0;
  let monthlyCents = 0;
  for (const item of items) {
    if (item.isOptionalAddOn && !selected.has(item.id)) continue;
    if (item.kind === "MONTHLY") monthlyCents += item.amountCents;
    else setupCents += item.amountCents;
  }
  return { setupCents, monthlyCents };
}

export type ProposalItemLike = Pick<ProposalItem, "id" | "amountCents" | "isOptionalAddOn" | "kind" | "label">;

type CheckoutResult = {
  setupCheckoutUrl: string | null;
  monthlyCheckoutUrl: string | null;
};

/** Creates the Whop plan(s) for a just-approved proposal and persists their
    ids on the Proposal row. Called once, from recordClientResponse's
    APPROVED branch — never re-run for an already-approved proposal (the
    caller checks whopSetupPlanId is still null first). setupCents === 0 is
    not handled here — a proposal that approves at $0 has nothing to
    charge, so the caller skips calling this entirely in that case. */
export async function createProposalCheckout(
  proposalId: string,
  reference: string,
  setupCents: number,
  monthlyCents: number,
  paymentMode: "SPLIT" | "BUNDLED"
): Promise<CheckoutResult> {
  const whop = getWhopClient();

  if (monthlyCents === 0) {
    // No recurring component at all — a plain one-time plan regardless of
    // the client's chosen mode (the mode only matters when there's a
    // monthly amount to sequence).
    const plan = await whop.plans.create({
      product_id: PROPOSAL_WHOP_PRODUCT_ID,
      title: `Proposal ZS-${reference}`, // 20 chars — Whop plan titles cap at 30
      plan_type: "one_time",
      initial_price: setupCents / 100,
      visibility: "hidden",
    });
    await db.proposal.update({ where: { id: proposalId }, data: { whopSetupPlanId: plan.id } });
    return { setupCheckoutUrl: plan.purchase_url, monthlyCheckoutUrl: null };
  }

  if (paymentMode === "BUNDLED") {
    // One plan, one checkout: initial_price charges the setup amount right
    // away, renewal_price then bills the monthly amount every
    // billing_period days starting from that same checkout — no second
    // checkout step for the client at all.
    const plan = await whop.plans.create({
      product_id: PROPOSAL_WHOP_PRODUCT_ID,
      title: `Proposal ZS-${reference} Combo`, // 26 chars — Whop's 30-char plan title cap (confirmed live: "Title is too long" at 39 chars during verification)
      plan_type: "renewal",
      initial_price: setupCents / 100,
      renewal_price: monthlyCents / 100,
      billing_period: 30,
      visibility: "hidden",
    });
    await db.proposal.update({ where: { id: proposalId }, data: { whopSetupPlanId: plan.id } });
    return { setupCheckoutUrl: plan.purchase_url, monthlyCheckoutUrl: null };
  }

  // SPLIT: only the setup plan is created now. The monthly plan is created
  // later by createDeferredMonthlyCheckout, once an admin moves the
  // resulting ServiceProject to stage LIVE.
  const plan = await whop.plans.create({
    product_id: PROPOSAL_WHOP_PRODUCT_ID,
    title: `Proposal ZS-${reference} Setup`, // 26 chars
    plan_type: "one_time",
    initial_price: setupCents / 100,
    visibility: "hidden",
  });
  await db.proposal.update({ where: { id: proposalId }, data: { whopSetupPlanId: plan.id } });
  return { setupCheckoutUrl: plan.purchase_url, monthlyCheckoutUrl: null };
}

/** Creates the deferred monthly plan for a SPLIT-mode proposal — called
    from updateProjectStage when a project moves to LIVE. A real recurring
    plan (not a single charge): initial_price and renewal_price both equal
    the monthly amount, so the first charge happens at this checkout and it
    then recurs every 30 days, same as the BUNDLED path's renewal leg. */
export async function createDeferredMonthlyCheckout(
  proposalId: string,
  reference: string,
  monthlyCents: number
): Promise<string> {
  const whop = getWhopClient();
  const plan = await whop.plans.create({
    product_id: PROPOSAL_WHOP_PRODUCT_ID,
    title: `Proposal ZS-${reference} Mo`, // 23 chars
    plan_type: "renewal",
    initial_price: monthlyCents / 100,
    renewal_price: monthlyCents / 100,
    billing_period: 30,
    visibility: "hidden",
  });
  await db.proposal.update({ where: { id: proposalId }, data: { whopMonthlyPlanId: plan.id } });
  return plan.purchase_url;
}

/** Resolves an incoming Whop payment's plan id back to the Proposal it
    belongs to, for the webhook handler. Returns which leg (setup or
    monthly) matched — for a BUNDLED plan, the SAME whopSetupPlanId can
    match twice over the plan's lifetime (once for the initial charge, then
    again for every renewal); the caller distinguishes those via
    payment.billing_reason, not via which field matched here. */
export async function resolveProposalByWhopPlanId(
  planId: string | null | undefined
): Promise<{
  proposal: {
    id: string;
    setupPaidAt: Date | null;
    monthlyPaidAt: Date | null;
    paymentMode: "SPLIT" | "BUNDLED" | null;
  };
  leg: "setup" | "monthly";
} | null> {
  if (!planId) return null;

  const select = {
    id: true,
    setupPaidAt: true,
    monthlyPaidAt: true,
    paymentMode: true,
  } as const;

  const bySetup = await db.proposal.findFirst({
    where: { whopSetupPlanId: planId },
    select,
  });
  if (bySetup) return { proposal: bySetup, leg: "setup" };

  const byMonthly = await db.proposal.findFirst({
    where: { whopMonthlyPlanId: planId },
    select,
  });
  if (byMonthly) return { proposal: byMonthly, leg: "monthly" };

  return null;
}

export function isProposalPaymentMode(v: string): v is "SPLIT" | "BUNDLED" {
  return v === "SPLIT" || v === "BUNDLED";
}

/** Which of a Proposal's two amounts a real incoming Whop payment actually
    represents, given which plan field matched (see
    resolveProposalByWhopPlanId) and Whop's own billing_reason. A
    whopMonthlyPlanId match is always the monthly leg — that field only
    ever holds SPLIT mode's deferred monthly-only plan. A whopSetupPlanId
    match needs billing_reason to disambiguate: for a BUNDLED plan, the
    SAME plan id is used for both the initial charge (billing_reason
    "one_time" or "subscription_create" — setup + first month together)
    and every later recurring charge ("subscription_cycle"). The webhook
    handler marks both setupPaidAt and monthlyPaidAt on that first BUNDLED
    charge; later cycles only refresh monthlyPaidAt. */
export function classifyProposalPaymentLeg(
  leg: "setup" | "monthly",
  billingReason: string | null
): "setup" | "monthly" {
  if (leg === "monthly") return "monthly";
  if (billingReason === "subscription_cycle") return "monthly";
  return "setup";
}
