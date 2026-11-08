import { db } from "@/lib/db";
import type { WaPlan } from "@prisma/client";
import { aiBudgetUsdCents } from "./economics";
import { currencyForWhopPlanId } from "./whop-plans";

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

/** Replies a month a plan promises. Sized so that PLANNING_COST_PER_REPLY_GBP x cap fits the plan's AI budget
    (economics.ts); the budget, not this count, is what finally protects the margin. */
const PLAN_REPLY_CAP: Record<WaPlan, number> = { STARTER: 1000, GROWTH: 3500, PRO: 8000 };
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

/** `limit` says what stopped the agent: the reply count (the plan's, or the one the agency set) or the AI budget. */
export type CapCheck = {
  withinCap: boolean;
  used: number;
  cap: number;
  /** The month's allowance: the plan's replies plus any extra packs bought this month. */
  planCap: number;
  /** Replies bought as extra packs this month (already included in planCap and cap). */
  extraReplies: number;
  spendUsdCents: number;
  budgetUsdCents: number;
  limit: "replies" | "budget" | null;
};

/** The plan's cap, lowered to the agency's own monthly limit when it set one. Never raised: the plan cap
    is what covers our AI cost per reply. */
export function effectiveCap(planCap: number, agencyLimit: number | null | undefined, extraReplies = 0): number {
  // Extra replies were paid for on top, so the agency's own lower limit applies to the plan's replies only.
  return (agencyLimit && agencyLimit > 0 ? Math.min(planCap, agencyLimit) : planCap) + extraReplies;
}

/** Reads the agency's plan, its own monthly limit and this month's AI reply usage in one place -
    every caller (the webhook, the simulator's cap-aware messaging, an
    admin page) reads the same number the same way. Each AI reply is one outbound message
    Meta bills the agency for, so the limit also caps their Meta bill. */
export async function withinCap(agencyId: string): Promise<CapCheck> {
  const periodStart = currentBillingPeriodStart();
  const [subscription, settings, usage, spend, extras] = await Promise.all([
    db.waSubscription.findUnique({ where: { agencyId }, select: { plan: true, whopPlanId: true } }),
    db.waAgentSettings.findUnique({ where: { agencyId }, select: { monthlyReplyLimit: true } }),
    db.waUsageCounter.findUnique({ where: { agencyId_periodStart: { agencyId, periodStart } }, select: { aiReplies: true } }),
    // Everything the model cost us for this agency this month, real chats and Simulator tests alike (US cents).
    db.waPromptRun.aggregate({ where: { agencyId, createdAt: { gte: periodStart } }, _sum: { costEstimateCents: true } }),
    // Extra packs bought for this month (one-time, they lapse when the month ends).
    db.waExtraReplies.aggregate({ where: { agencyId, periodStart }, _sum: { replies: true, budgetUsdCents: true } }),
  ]);
  const plan = subscription?.plan ?? "STARTER";
  const extraReplies = extras._sum.replies ?? 0;
  const planCap = replyCapFor(plan) + extraReplies;
  const cap = effectiveCap(replyCapFor(plan), settings?.monthlyReplyLimit, extraReplies);
  const used = usage?.aiReplies ?? 0;
  const spendUsdCents = spend._sum.costEstimateCents ?? 0;
  const budgetUsdCents = aiBudgetUsdCents(plan, currencyForWhopPlanId(subscription?.whopPlanId)) + (extras._sum.budgetUsdCents ?? 0);
  const limit = spendUsdCents >= budgetUsdCents ? "budget" : used >= cap ? "replies" : null;
  return { withinCap: limit === null, used, cap, planCap, extraReplies, spendUsdCents, budgetUsdCents, limit };
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

/** The Simulator runs the real model, so it costs us too. It is metered like real chats (its runs are saved without a
    conversation, so they count toward the monthly AI budget) and capped per day so it can't be used as a free
    chatbot. Returns a short message for the owner when it is refused. */
export const SIMULATOR_DAILY_LIMIT = 60;
export async function simulatorBlocked(agencyId: string, now = new Date()): Promise<string | null> {
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const [today, cap] = await Promise.all([
    db.waPromptRun.count({ where: { agencyId, conversationId: null, stage: "DRAFT", createdAt: { gte: dayStart } } }),
    withinCap(agencyId),
  ]);
  if (cap.limit === "budget") return "This month's AI allowance for your plan is used up, so tests are paused until next month.";
  if (today >= SIMULATOR_DAILY_LIMIT) return `You've run ${SIMULATOR_DAILY_LIMIT} test messages today, which is the daily limit. It resets tomorrow.`;
  return null;
}
