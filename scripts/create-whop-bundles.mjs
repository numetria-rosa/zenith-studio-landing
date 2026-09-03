// One-off script: creates the two real Whop bundle products + plans decided
// on 2026-09-03, using the live Whop API. Mirrors create-whop-products.mjs's
// pattern exactly, scoped down to just bundles.
//
// A "bundle" here is its own Whop product/access-pass (a pure checkout
// vehicle — nobody is ever granted membership content through it directly),
// with one plan at a discounted price. What it actually unlocks is decided
// entirely by Zenith Studio's own code: src/lib/bundles.ts maps this
// product's id to the real course ids, and the webhook handler
// (src/app/api/webhooks/whop/route.ts) grants a CourseEntitlement row for
// each one when a payment against this product succeeds.
//
// Prices are 15% off the SUM of the current live per-course prices (pulled
// from the real Whop plans right before writing this, not from stale code
// comments — those had drifted from what's actually live):
//   AI Engineering             $28.75  (plan_VSU3hyAITNsNk)
//   AI Automation               $37.25  (plan_ED9yF9ehN2RIa)
//   AI-Assisted Software Eng.   $24.75  (plan_ximKlnIKYO7Bx)
//
// Usage:
//   node --env-file=.env scripts/create-whop-bundles.mjs
//
// Requires WHOP_API_KEY and WHOP_COMPANY_ID in .env (same Company API key
// used by create-whop-products.mjs).
//
// Not idempotent — re-running creates duplicate live products. Output is
// printed and also written to whop-created-bundles.json (gitignored,
// alongside .env) so the resulting ids don't need to be retyped by hand
// into src/lib/bundles.ts.

import Whop from "@whop/sdk";
import { writeFileSync } from "node:fs";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;

if (!apiKey || !companyId) {
  console.error(
    "Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/create-whop-bundles.mjs"
  );
  process.exit(1);
}

const client = new Whop({ apiKey });
const accountId = companyId;

const BUNDLES = [
  {
    id: "ai-engineering-automation",
    title: "AI Engineering + AI Automation Bundle",
    headline: "Both build-focused AI courses, one price",
    description:
      "Full access to AI Engineering (prompting, retrieval, agents, tool use, structured outputs, evaluation) and AI Automation (process mapping, APIs, webhooks, retries, idempotency, bounded AI steps), bundled at 15% off buying them separately.",
    courseIds: ["ai-engineering", "ai-automation"],
    price: 56.1, // (28.75 + 37.25) * 0.85
  },
  {
    id: "swe-ai-engineering",
    title: "AI-Assisted Software Engineering + AI Engineering Bundle",
    headline: "From zero coding to building AI products",
    description:
      "Full access to AI-Assisted Software Engineering (ship real code with an AI pair programmer, no prior experience needed) and AI Engineering (prompting, retrieval, agents, tool use, structured outputs, evaluation), bundled at 15% off buying them separately.",
    courseIds: ["ai-assisted-software-engineering", "ai-engineering"],
    price: 45.48, // (24.75 + 28.75) * 0.85, rounded to the nearest cent
  },
];

async function main() {
  const results = [];

  for (const b of BUNDLES) {
    console.log(`\n=== ${b.title} ===`);
    const product = await client.products.create({
      account_id: accountId,
      title: b.title,
      headline: b.headline,
      description: b.description,
      visibility: "visible",
    });
    console.log(`Product created: ${product.id}`);

    const plan = await client.plans.create({
      account_id: accountId,
      product_id: product.id,
      plan_type: "one_time",
      release_method: "buy_now",
      currency: "usd",
      visibility: "visible",
      title: "Bundle Access",
      description: `Lifetime access to both courses. ${b.description}`,
      initial_price: b.price,
    });
    console.log(`  Plan created: ${plan.id}`);
    console.log(`    ${plan.purchase_url}`);

    results.push({
      id: b.id,
      title: b.title,
      courseIds: b.courseIds,
      price: b.price,
      whopAccessPassId: product.id,
      whopPlanId: plan.id,
      checkoutUrl: plan.purchase_url,
    });
  }

  console.log("\n\n=== Paste this into src/lib/bundles.ts's BUNDLES array ===\n");
  console.log(JSON.stringify(results, null, 2));

  writeFileSync("whop-created-bundles.json", JSON.stringify(results, null, 2));
  console.log("\nAlso written to whop-created-bundles.json");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
