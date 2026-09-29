import type { Prisma, PrismaClient, WaPlan } from "@prisma/client";

type Tx = PrismaClient | Prisma.TransactionClient;

/** Resolves a Whop plan id to the WA plan it grants. Starter and its
    Founding-offer variant (see scripts/create-whatsapp-umrah-whop-product.mjs)
    are the same WaPlan (STARTER) at two different prices - foundingOffer is
    tracked separately on WaSubscription, not as its own WaPlan value. */
export function waPlanForWhopPlanId(planId: string | null | undefined): { plan: WaPlan; foundingOffer: boolean } | null {
  if (!planId) return null;
  if (planId === process.env.WHATSAPP_UMRAH_STARTER_PLAN_ID) return { plan: "STARTER", foundingOffer: false };
  if (planId === process.env.WHATSAPP_UMRAH_FOUNDING_PLAN_ID) return { plan: "STARTER", foundingOffer: true };
  return null;
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
  const existing = await tx.waSubscription.findUnique({ where: { whopMembershipId: params.whopMembershipId }, select: { agencyId: true } });
  if (existing) return { isNew: false, agencyId: existing.agencyId };

  const baseName = params.userName?.trim() || params.userEmail?.split("@")[0] || "New agency";
  const displayName = `${baseName}'s Umrah Agency`;
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
