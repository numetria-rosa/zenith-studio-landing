// One-off script: creates the real Whop product + plan for Data Science &
// Analysis ONLY.
//
// Deliberately NOT run through create-whop-products.mjs's main PRODUCTS loop:
// that script creates every entry in its array on every run with no dedup
// check, and the other 6 entries in it (AI Engineering + 5 service
// offerings) are already live, real, purchased-from products on this Whop
// account (see whop-created-products.json). Re-running that file today would
// create 6 duplicate live products alongside them. This script reuses the
// exact same Whop SDK calls and account_id resolution, just scoped to the
// one new product, so nothing already live is touched.
//
// The Data Science entry has ALSO been added to create-whop-products.mjs's
// own PRODUCTS array, for documentation/consistency (that file is the
// intended long-term catalog of what should exist) — but it is not executed
// from there today for the reason above.
//
// Usage:
//   node --env-file=.env scripts/create-data-science-whop-product.mjs
//
// Requires WHOP_API_KEY and WHOP_COMPANY_ID in .env.
//
// Pricing: regular price is $120, launched at 75% off ($30) through
// 2026-08-31. Whop's Plans API has no built-in "price changes on this date"
// field, so this creates ONE plan at the $30 launch price. After Aug 31,
// run scripts/update-data-science-price.mjs (or update it by hand in the
// Whop dashboard) to raise it back to $120 — this is a deliberate manual
// step, not automated, since it changes a live, real payment amount.

import Whop from "@whop/sdk";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;

if (!apiKey || !companyId) {
  console.error(
    "Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/create-data-science-whop-product.mjs"
  );
  process.exit(1);
}

const client = new Whop({ apiKey });
const accountId = companyId;

const PRODUCT = {
  envPrefix: "WHOP_DATA_SCIENCE",
  title: "Data Science & Analysis",
  headline: "Spreadsheets through a full capstone analysis",
  description:
    "Twelve weeks, three entry tracks, spreadsheets through a full capstone analysis. Real messy data, real statistics, real dashboards, and a Career Path Edition built around actually getting paid. No prior coding required.",
  plan: {
    title: "Founding Access, 75% off through Aug 31",
    description:
      "Regular price $120. Founding-cohort launch price through August 31, then reverts to $120. Lifetime access and updates.",
    plan_type: "one_time",
    initial_price: 30,
  },
};

async function main() {
  console.log(`\n=== ${PRODUCT.title} ===`);
  const product = await client.products.create({
    account_id: accountId,
    title: PRODUCT.title,
    headline: PRODUCT.headline,
    description: PRODUCT.description,
    visibility: "visible",
  });
  console.log(`Product created: ${product.id}`);

  const plan = PRODUCT.plan;
  const createdPlan = await client.plans.create({
    account_id: accountId,
    product_id: product.id,
    plan_type: plan.plan_type,
    release_method: "buy_now",
    currency: "usd",
    visibility: "visible",
    title: plan.title,
    description: plan.description,
    initial_price: plan.initial_price,
  });
  console.log(`  Plan "${plan.title}" created: ${createdPlan.id}`);
  console.log(`    ${createdPlan.purchase_url}`);

  const entry = {
    title: PRODUCT.title,
    productId: product.id,
    plans: [{ title: plan.title, planId: createdPlan.id, checkoutUrl: createdPlan.purchase_url }],
  };

  console.log("\n\n=== .env lines (paste into .env and Vercel env vars) ===\n");
  console.log(`${PRODUCT.envPrefix}_ACCESS_PASS_ID="${product.id}"`);
  console.log(`${PRODUCT.envPrefix}_PLAN_ID="${createdPlan.id}"`);
  console.log(`${PRODUCT.envPrefix}_CHECKOUT_URL="${createdPlan.purchase_url}"`);

  // Merge into whop-created-products.json rather than overwrite it — that
  // file already holds the record of the 6 previously-created products.
  const path = "whop-created-products.json";
  const existing = existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : [];
  existing.push(entry);
  writeFileSync(path, JSON.stringify(existing, null, 2));
  console.log(`\nMerged into ${path} (${existing.length} products on record now).`);
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
