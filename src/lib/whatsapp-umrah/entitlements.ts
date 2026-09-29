import { db } from "@/lib/db";
import type { WaPlan } from "@prisma/client";

/* Shared entitlement/usage functions - see spec section 6: "Entitlement
   checks go through one function can(agency, feature) and one usage
   check within_cap(agency)." Only Starter is launched (CLAUDE.md), so
   Growth/Pro-only features all return false for now - flip PLAN_FEATURES
   as each plan actually ships, no caller needs to change. */

export type Feature =
  | "followUpSequences"
  | "broadcastTemplates"
  | "documentChecklist"
  | "bookingStatusReplies"
  | "paymentReminders"
  | "groupTags"
  | "sheetsExport"
  | "voiceTranscription"
  | "imageReading"
  | "upsellPrompts"
  | "multiBranch"
  | "instagramFacebookDms";

const PLAN_FEATURES: Record<WaPlan, Set<Feature>> = {
  STARTER: new Set(),
  // Growth/Pro feature sets, filled in as each is actually built and
  // launched - listing them now documents the intended shape (see the
  // pricing table in the original spec) without granting anything yet.
  GROWTH: new Set(),
  PRO: new Set(),
};

const PLAN_REPLY_CAP: Record<WaPlan, number> = { STARTER: 1000, GROWTH: 4000, PRO: 10000 };
const PLAN_NUMBER_CAP: Record<WaPlan, number> = { STARTER: 1, GROWTH: 1, PRO: 3 };
const PLAN_SEAT_CAP: Record<WaPlan, number> = { STARTER: 1, GROWTH: 3, PRO: 10 };

export function can(plan: WaPlan, feature: Feature): boolean {
  return PLAN_FEATURES[plan].has(feature);
}

export function replyCapFor(plan: WaPlan): number {
  return PLAN_REPLY_CAP[plan];
}
export function numberCapFor(plan: WaPlan): number {
  return PLAN_NUMBER_CAP[plan];
}
export function seatCapFor(plan: WaPlan): number {
  return PLAN_SEAT_CAP[plan];
}

export function currentBillingPeriodStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
function billingPeriodEnd(periodStart: Date): Date {
  return new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 0));
}

export type CapCheck = { withinCap: true; used: number; cap: number } | { withinCap: false; used: number; cap: number };

/** Reads the agency's plan and this month's AI reply usage in one place -
    every caller (the webhook, the simulator's cap-aware messaging, an
    admin page) reads the same number the same way. */
export async function withinCap(agencyId: string): Promise<CapCheck> {
  const subscription = await db.waSubscription.findUnique({ where: { agencyId }, select: { plan: true } });
  const plan = subscription?.plan ?? "STARTER";
  const periodStart = currentBillingPeriodStart();
  const usage = await db.waUsageCounter.findUnique({
    where: { agencyId_periodStart: { agencyId, periodStart } },
    select: { aiReplies: true, overagePacks: true },
  });
  // Each paid £5 overage pack (WaUsageCounter.overagePacks, see
  // src/lib/whatsapp-umrah/overage.ts) adds 1,000 replies to THIS period's
  // cap on top of the plan's base allowance.
  const cap = replyCapFor(plan) + (usage?.overagePacks ?? 0) * 1000;
  const used = usage?.aiReplies ?? 0;
  return used < cap ? { withinCap: true, used, cap } : { withinCap: false, used, cap };
}

/** Increments this month's AI reply counter, creating the row if this is
    the agency's first reply of the period. */
export async function recordAiReply(agencyId: string): Promise<void> {
  const periodStart = currentBillingPeriodStart();
  await db.waUsageCounter.upsert({
    where: { agencyId_periodStart: { agencyId, periodStart } },
    create: { agencyId, periodStart, periodEnd: billingPeriodEnd(periodStart), aiReplies: 1 },
    update: { aiReplies: { increment: 1 } },
  });
}
