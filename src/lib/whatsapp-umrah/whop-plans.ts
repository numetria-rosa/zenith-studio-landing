import type { Prisma, PrismaClient, WaPlan } from "@prisma/client";
import { syncAgencyLive } from "./live";
import type { PlanCurrency } from "./economics";

type Tx = PrismaClient | Prisma.TransactionClient;

/** Resolves a Whop plan id to the WA plan it grants. Starter and its
    Founding-offer variant (see scripts/create-whatsapp-umrah-whop-product.mjs)
    are the same WaPlan (STARTER) at two different prices - foundingOffer is
    tracked separately on WaSubscription, not as its own WaPlan value. */
export function waPlanForWhopPlanId(planId: string | null | undefined): { plan: WaPlan; foundingOffer: boolean } | null {
  if (!planId) return null;
  if (planId === process.env.WHATSAPP_UMRAH_STARTER_PLAN_ID) return { plan: "STARTER", foundingOffer: false };
  if (currencyForWhopPlanId(planId) !== "GBP") return { plan: "STARTER", foundingOffer: false };
  if (planId === process.env.WHATSAPP_UMRAH_FOUNDING_PLAN_ID) return { plan: "STARTER", foundingOffer: true };
  return null;
}

/** The Starter plan exists once per currency, each its own Whop plan on the same product (a plan has one currency and
    subscriptions can't use adaptive pricing: https://docs.whop.com/payments-and-billing/fees/adaptive-pricing). The UK
    plan is WHATSAPP_UMRAH_STARTER_PLAN_ID; the others are listed here, created by
    scripts/create-whatsapp-umrah-country-plans.mjs. Plan ids are public (they are in checkout links), so they live in
    code and the webhook needs no setup. Anything not listed is GBP. */
export const COUNTRY_STARTER_PLAN_IDS: Record<Exclude<PlanCurrency, "GBP">, string> = {
  USD: "plan_MhE10jwPePZ0C",
  CAD: "plan_EJqJLamM10oue",
  AUD: "plan_wUxGQaV27I2j0",
  ZAR: "plan_PBW3VzzefZNSU",
};

export function currencyForWhopPlanId(planId: string | null | undefined): PlanCurrency {
  if (!planId) return "GBP";
  for (const [currency, id] of Object.entries(COUNTRY_STARTER_PLAN_IDS)) if (planId === id) return currency as PlanCurrency;
  return "GBP";
}

/** The market an agency signed up in, read from the Whop plan it first bought: UK/GBP, US/USD, CA/CAD, AU/AUD, ZA/ZAR.
    Null when the agency has no Whop plan on record (for example one an admin created by hand), so no tag is shown
    rather than a wrong one. The extra-replies pack is priced in the same currency (extra-replies.ts). */
const MARKET_FOR_CURRENCY: Record<PlanCurrency, string> = { GBP: "UK", USD: "US", CAD: "CA", AUD: "AU", ZAR: "ZA" };
export function marketForWhopPlanId(planId: string | null | undefined): { market: string; currency: PlanCurrency } | null {
  if (!planId) return null;
  if (planId !== process.env.WHATSAPP_UMRAH_STARTER_PLAN_ID && currencyForWhopPlanId(planId) === "GBP") return null;
  const currency = currencyForWhopPlanId(planId);
  return { market: MARKET_FOR_CURRENCY[currency], currency };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** New agency, first purchase: creates the WaAgency (ONBOARDING - inbound.ts
    only replies once status is LIVE, set when the owner connects WhatsApp),
    the owner's membership, and the subscription row together. Idempotent on
    whopMembershipId, the same guard used for services/courses, since Whop
    can send payment.succeeded and membership.activated for the same
    subscribe and either may arrive first or twice (at-least-once delivery). */
export async function provisionWaAgency(
  tx: Tx,
  params: { userId: string; userName: string | null; userEmail: string | null; whopMembershipId: string; whopPlanId: string; plan: WaPlan; foundingOffer: boolean }
): Promise<{ isNew: boolean; agencyId: string }> {
  const existing = await tx.waSubscription.findUnique({ where: { whopMembershipId: params.whopMembershipId }, select: { agencyId: true, status: true } });
  if (existing) {
    // A payment succeeding on a subscription that was past due (or cancelled and re-subscribed) restores it, and
    // an agency that billing paused goes live again once it is otherwise ready (see live.ts).
    if (existing.status !== "ACTIVE") await tx.waSubscription.update({ where: { agencyId: existing.agencyId }, data: { status: "ACTIVE" } });
    await syncAgencyLive(existing.agencyId, tx);
    return { isNew: false, agencyId: existing.agencyId };
  }

  const baseName = params.userName?.trim() || params.userEmail?.split("@")[0] || "New agency";
  const displayName = `${baseName}'s Travel Agency`;
  const slugBase = slugify(baseName) || "agency";
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const agency = await tx.waAgency.create({
    data: {
      name: displayName,
      slug,
      status: "ONBOARDING",
      memberships: { create: { userId: params.userId, role: "OWNER" } },
      subscription: {
        create: {
          whopMembershipId: params.whopMembershipId,
          whopPlanId: params.whopPlanId,
          plan: params.plan,
          status: "ACTIVE",
          foundingOffer: params.foundingOffer,
        },
      },
    },
    select: { id: true },
  });
  return { isNew: true, agencyId: agency.id };
}

/** Payment failure or subscription cancellation: same "pause everything
    downstream" shape as handlePaymentFailed's service-side branch -
    inbound.ts refuses to reply once agency.status isn't LIVE, so this alone
    stops the agent without touching anything else. */
export async function pauseWaAgencyByMembership(tx: Tx, whopMembershipId: string, subscriptionStatus: "PAST_DUE" | "CANCELLED"): Promise<void> {
  const subscription = await tx.waSubscription.findUnique({ where: { whopMembershipId }, select: { agencyId: true } });
  if (!subscription) return;
  await tx.waSubscription.update({ where: { agencyId: subscription.agencyId }, data: { status: subscriptionStatus } });
  await tx.waAgency.update({ where: { id: subscription.agencyId }, data: { status: "PAUSED" } });
}
