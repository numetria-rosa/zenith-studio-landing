// One-off script: creates the real Whop products + plans for every offer on
// the site that doesn't have a checkout link yet, using the live Whop API.
// Not a seed script — this hits your real Whop account and creates real,
// purchasable products. Safe to re-run only in the sense that Whop will
// create DUPLICATE products/plans each time; it does not check for
// existing ones first.
//
// Usage:
//   node --env-file=.env scripts/create-whop-products.mjs
//
// Requires WHOP_API_KEY and WHOP_COMPANY_ID in .env (a Company API key with
// at least: Products [Read, Create, Update], Plans [Read, Create, Update]).
//
// Output: prints every created product/plan, its purchase_url, and the
// exact .env lines to paste in — and writes the same as JSON to
// whop-created-products.json in this project's scratchpad-equivalent (the
// repo root, gitignored alongside .env) so nothing here needs to be
// re-typed by hand.

import Whop from "@whop/sdk";
import { writeFileSync } from "node:fs";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;

if (!apiKey || !companyId) {
  console.error(
    "Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/create-whop-products.mjs"
  );
  process.exit(1);
}

const client = new Whop({ apiKey });

// account_id is what this SDK version (@whop/sdk 0.0.42) actually calls the
// company/business identifier on both products.create() and plans.create()
// — confirmed against node_modules/@whop/sdk/resources/{products,plans}.d.ts,
// which differs from what docs.whop.com's REST examples currently show
// (company_id). Passed explicitly rather than relying on the "defaults to
// caller's account" fallback, so it's unambiguous which account this runs
// against.
const accountId = companyId;

const PRODUCTS = [
  {
    envPrefix: "WHOP_AI_ENGINEERING",
    title: "AI Engineering",
    headline: "Build real products with language models",
    description:
      "An 8-week accelerated program, ~10 hours a week: prompting, retrieval, agents, tool use, structured outputs, and evaluation. The exact stack behind VoyAI and SmartRevise. Basic programming logic required, no prior Python needed.",
    plans: [
      {
        key: "", // single-plan product — env vars have no SETUP/MONTHLY suffix
        title: "Founding Access",
        description: "Founding cohort price. Lifetime access and updates.",
        plan_type: "one_time",
        initial_price: 99,
      },
    ],
  },
  {
    envPrefix: "WHOP_DATA_SCIENCE",
    title: "Data Science & Analysis",
    headline: "Spreadsheets through a full capstone analysis",
    description:
      "Twelve weeks, three entry tracks, spreadsheets through a full capstone analysis. Real messy data, real statistics, real dashboards, and a Career Path Edition built around actually getting paid. No prior coding required.",
    plans: [
      {
        // Regular price is $120; launched at 75% off ($30) through 2026-08-31.
        // NOT automated — after the deadline, update this plan's price via
        // scripts/update-data-science-price.mjs (or client.plans.update in the
        // Whop dashboard) rather than re-running this file, which would create
        // a second, duplicate product.
        key: "",
        title: "Founding Access, 75% off through Aug 31",
        description: "Regular price $120. Founding-cohort launch price through August 31, then reverts to $120. Lifetime access and updates.",
        plan_type: "one_time",
        initial_price: 30,
      },
    ],
  },
  {
    envPrefix: "WHOP_AI_INBOX_MANAGER",
    title: "AI Inbox Manager",
    headline: "Wake up to an inbox that is already handled",
    description:
      "Sorts and prioritizes email, then drafts replies to the routine ones so your day starts with decisions, not admin.",
    plans: [
      {
        key: "SETUP",
        title: "Setup",
        description: "One-time setup. Founding client price (35% off $800).",
        plan_type: "one_time",
        initial_price: 520,
      },
      {
        key: "MONTHLY",
        title: "Monthly",
        description: "Hosting, monitoring, and improvements, billed monthly.",
        plan_type: "renewal",
        // initial_price is an EXTRA one-time fee Whop stacks on top of the
        // first renewal_price charge, not "the first month's amount" — 0
        // means day-one charge is exactly renewal_price, nothing doubled.
        // Learned this the hard way; see scripts/fix-whop-renewal-prices.mjs.
        initial_price: 0,
        renewal_price: 150,
        billing_period: 30,
      },
    ],
  },
  {
    envPrefix: "WHOP_AI_LEAD_CAPTURE",
    title: "AI Lead Capture & Follow-Up",
    headline: "Never lose a lead to a slow reply again",
    description:
      "Captures every enquiry, qualifies it, and follows up by email and SMS until they book. The business that answers first wins the job.",
    plans: [
      {
        key: "SETUP",
        title: "Setup",
        description: "One-time setup. Founding client price (35% off $1,000).",
        plan_type: "one_time",
        initial_price: 650,
      },
      {
        key: "MONTHLY",
        title: "Monthly",
        description: "Hosting, monitoring, and improvements, billed monthly.",
        plan_type: "renewal",
        initial_price: 0, // see the note on the Inbox Manager monthly plan above
        renewal_price: 200,
        billing_period: 30,
      },
    ],
  },
  {
    envPrefix: "WHOP_AI_RECEPTIONIST",
    title: "AI Receptionist & Booking",
    headline: "Answers and books while you are on the job",
    description:
      "Handles enquiries around the clock, books straight into your calendar, and sends the reminders that cut no-shows.",
    plans: [
      {
        key: "SETUP",
        title: "Setup",
        description: "One-time setup. Founding client price (35% off $1,500).",
        plan_type: "one_time",
        initial_price: 975,
      },
      {
        key: "MONTHLY",
        title: "Monthly",
        description: "Hosting, monitoring, and improvements, billed monthly.",
        plan_type: "renewal",
        initial_price: 0, // see the note on the Inbox Manager monthly plan above
        renewal_price: 300,
        billing_period: 30,
      },
    ],
  },
  {
    envPrefix: "WHOP_LAW_FIRM_AI_TEAM",
    title: "AI Team — Law Firms",
    headline: "Your firm works 49 hours a week and bills 37",
    description:
      "The Intake Coordinator + Follow-Up Clerk, as one team: answers every call and enquiry around the clock, qualifies against your case criteria, runs a conflicts pre-check, books the consult, and opens the matter, then works the leads that didn't retain on the first call. Billing recovery (the AI Billing Clerk) is priced separately, on what it recovers.",
    plans: [
      {
        key: "",
        title: "Monthly",
        description: "AI Intake Coordinator + AI Follow-Up Clerk, billed monthly.",
        plan_type: "renewal",
        initial_price: 0, // see the note on the Inbox Manager monthly plan above
        renewal_price: 1200,
        billing_period: 30,
      },
    ],
  },
  {
    envPrefix: "WHOP_BROKERAGE_AI_TEAM",
    title: "AI Team — Brokerages",
    headline: "Your agents are not leaving for a better split",
    description:
      "The Inside Sales Agent + Database Manager, as one team: answers new leads in seconds, qualifies motivation/timeline/financing, books the appointment, and wakes up the dormant contacts and past clients already sitting in your CRM. Transaction Coordination is billed separately, per file.",
    plans: [
      {
        key: "",
        title: "Monthly",
        description: "AI Inside Sales Agent + AI Database Manager, billed monthly.",
        plan_type: "renewal",
        initial_price: 0, // see the note on the Inbox Manager monthly plan above
        renewal_price: 1200,
        billing_period: 30,
      },
    ],
  },
];

async function main() {
  const results = [];
  const envLines = [];

  for (const p of PRODUCTS) {
    console.log(`\n=== ${p.title} ===`);
    const product = await client.products.create({
      account_id: accountId,
      title: p.title,
      headline: p.headline,
      description: p.description,
      visibility: "visible",
    });
    console.log(`Product created: ${product.id}`);

    const productEntry = { title: p.title, productId: product.id, plans: [] };
    envLines.push(`${p.envPrefix}_ACCESS_PASS_ID="${product.id}"`);

    for (const plan of p.plans) {
      const body = {
        account_id: accountId,
        product_id: product.id,
        plan_type: plan.plan_type,
        release_method: "buy_now",
        currency: "usd",
        visibility: "visible",
        title: plan.title,
        description: plan.description,
        initial_price: plan.initial_price,
      };
      if (plan.plan_type === "renewal") {
        body.renewal_price = plan.renewal_price;
        body.billing_period = plan.billing_period;
      }
      const createdPlan = await client.plans.create(body);
      console.log(`  Plan "${plan.title}" created: ${createdPlan.id}`);
      console.log(`    ${createdPlan.purchase_url}`);

      productEntry.plans.push({
        title: plan.title,
        planId: createdPlan.id,
        checkoutUrl: createdPlan.purchase_url,
      });

      const suffix = plan.key ? `_${plan.key}` : "";
      envLines.push(`${p.envPrefix}${suffix}_PLAN_ID="${createdPlan.id}"`);
      envLines.push(`${p.envPrefix}${suffix}_CHECKOUT_URL="${createdPlan.purchase_url}"`);
    }

    results.push(productEntry);
  }

  console.log("\n\n=== .env lines (paste into .env and Vercel env vars) ===\n");
  console.log(envLines.join("\n"));

  writeFileSync("whop-created-products.json", JSON.stringify(results, null, 2));
  console.log("\nFull details also written to whop-created-products.json");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
