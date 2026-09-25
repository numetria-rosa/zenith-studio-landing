// Zenith HQ one-off backfill: fills the new ServiceCatalog columns (Slice
// "zenith_hq_fields") from the real source of truth for each value.
// Pricing (list/monthly/quarterly) is pulled LIVE from Whop's Plans API
// (client.plans.retrieve) rather than trusted from code comments - Whop is
// the real source of truth for money, not a hardcoded guess. Everything
// else (freeSetup/trial/sla/landingPageUrl) mirrors the real business rules
// already documented in services.ts / DESIGN.md.
//
// Safe to re-run: upserts by slug, only touches the new columns.
// Usage: node --env-file=.env scripts/backfill-zenith-hq-catalog.mjs

import { PrismaClient } from "@prisma/client";
import Whop from "@whop/sdk";

const db = new PrismaClient();
const whop = new Whop({ apiKey: process.env.WHOP_API_KEY });

const SERVICES = [
  {
    slug: "ai-inbox-manager",
    title: "AI Inbox Manager",
    pitch: "Wake up to an inbox that is already handled.",
    description:
      "Sorts and prioritizes email, then drafts replies to the routine ones so your day starts with decisions, not admin.",
    whopMonthlyPlanId: "plan_Qvl24MqIyHNfQ",
    freeSetup: false,
    trialEnabled: false,
    acceptingNewClients: true,
    slaHours: 96,
    landingPageUrl: "/demo/ai-inbox-manager",
  },
  {
    slug: "ai-lead-capture",
    title: "AI Lead Capture & Follow-Up",
    pitch: "Never lose a lead to a slow reply again.",
    description:
      "Captures every enquiry, qualifies it, and follows up by email and SMS until they book. The business that answers first wins the job.",
    whopMonthlyPlanId: "plan_EKCkv5lP6CSPP",
    freeSetup: false,
    trialEnabled: false,
    acceptingNewClients: true,
    slaHours: 48,
    landingPageUrl: "/demo/ai-lead-capture-follow-up",
  },
  {
    slug: "ai-receptionist",
    title: "AI Receptionist & Booking",
    pitch: "Answers and books while you are on the job.",
    description:
      "Handles enquiries around the clock, books straight into your calendar, and sends the reminders that cut no-shows.",
    whopMonthlyPlanId: "plan_CJyNkObEaPquA",
    freeSetup: false,
    trialEnabled: false,
    acceptingNewClients: true,
    slaHours: 48,
    landingPageUrl: "/demo/ai-receptionist",
  },
  {
    slug: "law-firms",
    title: "Law Firm AI Team",
    pitch: "Your firm works 49 hours a week and bills 37.",
    description:
      "An AI Missed Call Text-Back, Follow-Up Clerk, and Billing Clerk as one team: texts back every unanswered call in seconds, works the leads that didn't retain, and reconstructs billable time before the write-down window closes.",
    whopMonthlyPlanId: "plan_kTlL5gBlJTsqy",
    whopQuarterlyPlanId: "plan_IY3eOH5sH5FD0",
    quarterlyCheckoutUrl: "https://whop.com/checkout/plan_IY3eOH5sH5FD0",
    listPriceCents: 120000,
    freeSetup: true,
    trialEnabled: true,
    acceptingNewClients: true,
    slaHours: 24,
    landingPageUrl: "/demo/law-firm-ai-team",
  },
  {
    slug: "brokerages",
    title: "Brokerage AI Team",
    pitch: "Your agents are not leaving for a better split.",
    description:
      "An AI Inside Sales Agent, Transaction Coordinator, and Database Manager as one team: answers new leads in seconds, tracks every file to close, and wakes up the dormant contacts already sitting in your CRM.",
    whopMonthlyPlanId: "plan_m3i6RwMYvMATE",
    whopQuarterlyPlanId: "plan_apcRrrvFpvnWl",
    quarterlyCheckoutUrl: "https://whop.com/checkout/plan_apcRrrvFpvnWl",
    listPriceCents: 120000,
    freeSetup: true,
    trialEnabled: true,
    acceptingNewClients: true,
    slaHours: 24,
    landingPageUrl: "/demo/brokerage-ai-team",
  },
  {
    slug: "insurance-ai-team",
    title: "Insurance Account Manager Bundle",
    pitch: "Your front office, on autopilot.",
    description:
      "An Intake Agent, Document Audit, CRM & Logging, and Renewal Reminders as one team: texts back every quote request, reads policy documents in seconds, logs every lead automatically, and reminds clients before their policy renews. No access to your AMS required.",
    whopMonthlyPlanId: "plan_aW9AIh13BCZPV",
    whopQuarterlyPlanId: "plan_LzUY3p0RRbU3N",
    quarterlyCheckoutUrl: "https://whop.com/checkout/plan_LzUY3p0RRbU3N",
    listPriceCents: 120000,
    freeSetup: true,
    trialEnabled: true,
    acceptingNewClients: true,
    slaHours: 24,
    landingPageUrl: "/demo/insurance-ai-team",
  },
];

async function realMonthlyPriceCents(planId) {
  if (!planId) return null;
  const plan = await whop.plans.retrieve(planId);
  // renewal_price is in whole currency units (e.g. 1080 for $1,080), per
  // the Plans API - Payments API's own amounts are also whole units, same
  // convention.
  return Math.round(plan.renewal_price * 100);
}

for (const svc of SERVICES) {
  const monthlyPriceCents = await realMonthlyPriceCents(svc.whopMonthlyPlanId);
  const quarterlyTotalCents = await realMonthlyPriceCents(svc.whopQuarterlyPlanId);
  const quarterlyPriceCentsPerMonth = quarterlyTotalCents != null ? Math.round(quarterlyTotalCents / 3) : null;

  const shared = {
    monthlyPriceCents: monthlyPriceCents ?? undefined,
    whopMonthlyPlanId: svc.whopMonthlyPlanId,
    listPriceCents: svc.listPriceCents ?? undefined,
    quarterlyPriceCentsPerMonth,
    whopQuarterlyPlanId: svc.whopQuarterlyPlanId ?? undefined,
    quarterlyCheckoutUrl: svc.quarterlyCheckoutUrl ?? undefined,
    freeSetup: svc.freeSetup,
    trialEnabled: svc.trialEnabled,
    acceptingNewClients: svc.acceptingNewClients,
    slaHours: svc.slaHours,
    landingPageUrl: svc.landingPageUrl,
  };
  await db.serviceCatalog.upsert({
    where: { slug: svc.slug },
    update: shared,
    create: { slug: svc.slug, title: svc.title, pitch: svc.pitch, description: svc.description, ...shared },
  });
  console.log(
    `${svc.slug}: monthly=$${(monthlyPriceCents ?? 0) / 100} quarterly/mo=${quarterlyPriceCentsPerMonth != null ? "$" + quarterlyPriceCentsPerMonth / 100 : "n/a"}`
  );
}

await db.$disconnect();
