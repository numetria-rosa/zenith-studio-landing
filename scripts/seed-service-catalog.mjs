// One-off seed script for Slice 2 of the service-platform build (2026-08-27):
// upserts the DB-backed ServiceCatalog table from the existing static
// SERVICES array in src/lib/services.ts. Read-through only — SERVICES stays
// the real source of truth for checkout URLs, webhook plan resolution, and
// all current UI; this table exists so its shape can be proven before
// anything is cut over to depend on it (see SERVICE_PLATFORM_ARCHITECTURE.md
// §9, Slice 2).
//
// Safe to re-run: keyed on `slug` (upsert, not insert). Only touches
// ServiceCatalog — never ServiceRequest, CourseEntitlement, User, or any
// other existing table.
//
// Usage:
//   node --env-file=.env scripts/seed-service-catalog.mjs

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Mirrors SERVICES from src/lib/services.ts. Kept as a plain literal here
// (not imported) because that file is TypeScript and this is a plain .mjs
// script run directly with node — same convention as the other seed
// scripts in this directory.
const SERVICES = [
  {
    id: "ai-inbox-manager",
    title: "AI Inbox Manager",
    pitch: "Wake up to an inbox that is already handled.",
    description:
      "Sorts and prioritizes email, then drafts replies to the routine ones so your day starts with decisions, not admin.",
    setupPriceCents: 19000,
    monthlyPriceCents: 15000,
    whopSetupPlanId: "plan_AUhS9tvz8KrJC",
    whopMonthlyPlanId: "plan_Qvl24MqIyHNfQ",
  },
  {
    id: "ai-lead-capture",
    title: "AI Lead Capture & Follow-Up",
    pitch: "Never lose a lead to a slow reply again.",
    description:
      "Captures every enquiry, qualifies it, and follows up by email and SMS until they book. The business that answers first wins the job.",
    setupPriceCents: 27000,
    monthlyPriceCents: 20000,
    whopSetupPlanId: "plan_l6f3sCRsCR2Em",
    whopMonthlyPlanId: "plan_EKCkv5lP6CSPP",
  },
  {
    id: "ai-receptionist",
    title: "AI Receptionist & Booking",
    pitch: "Answers and books while you are on the job.",
    description:
      "Handles enquiries around the clock, books straight into your calendar, and sends the reminders that cut no-shows.",
    setupPriceCents: 36000,
    monthlyPriceCents: 30000,
    whopSetupPlanId: "plan_ts3JwXpFBKKMp",
    whopMonthlyPlanId: "plan_CJyNkObEaPquA",
  },
  {
    id: "law-firms",
    title: "Law Firm AI Team",
    pitch: "Your firm works 49 hours a week and bills 37.",
    description:
      "An AI Intake Coordinator, Follow-Up Clerk, and Billing Clerk as one team: answers and qualifies every enquiry, works the leads that didn't retain, and reconstructs billable time before the write-down window closes.",
    setupPriceCents: null,
    monthlyPriceCents: 120000,
    whopSetupPlanId: null,
    whopMonthlyPlanId: "plan_kTlL5gBlJTsqy",
  },
  {
    id: "brokerages",
    title: "Brokerage AI Team",
    pitch: "Your agents are not leaving for a better split.",
    description:
      "An AI Inside Sales Agent, Transaction Coordinator, and Database Manager as one team: answers new leads in seconds, tracks every file to close, and wakes up the dormant contacts already sitting in your CRM.",
    setupPriceCents: null,
    monthlyPriceCents: 120000,
    whopSetupPlanId: null,
    whopMonthlyPlanId: "plan_m3i6RwMYvMATE",
  },
];

async function main() {
  for (const s of SERVICES) {
    const row = await db.serviceCatalog.upsert({
      where: { slug: s.id },
      create: {
        slug: s.id,
        title: s.title,
        pitch: s.pitch,
        description: s.description,
        setupPriceCents: s.setupPriceCents,
        monthlyPriceCents: s.monthlyPriceCents,
        whopSetupPlanId: s.whopSetupPlanId,
        whopMonthlyPlanId: s.whopMonthlyPlanId,
      },
      update: {
        title: s.title,
        pitch: s.pitch,
        description: s.description,
        setupPriceCents: s.setupPriceCents,
        monthlyPriceCents: s.monthlyPriceCents,
        whopSetupPlanId: s.whopSetupPlanId,
        whopMonthlyPlanId: s.whopMonthlyPlanId,
      },
    });
    console.log(`Upserted: ${row.slug} (${row.id})`);
  }

  const total = await db.serviceCatalog.count();
  console.log(`\nDone. ${total} ServiceCatalog rows total.`);
}

main().finally(() => db.$disconnect());
