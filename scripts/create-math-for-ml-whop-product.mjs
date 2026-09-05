// One-off script: creates the real Whop product + plan for Mathematics for
// Machine Learning ONLY.
//
// Same pattern as scripts/create-data-science-whop-product.mjs — scoped to
// this one course so nothing already live (the other 4 courses' products)
// is touched.
//
// Usage:
//   node --env-file=.env scripts/create-math-for-ml-whop-product.mjs
//
// Requires WHOP_API_KEY and WHOP_COMPANY_ID in .env.
//
// Pricing: regular price is $85, launched at 75% off ($21.25) through
// 2026-09-07, matching the site-wide launch-sale deadline the other 4
// courses use (src/app/lab/courses-data.ts, discountDeadline
// "2026-09-07T23:59:59-00:00"). Whop's Plans API has no built-in
// "price changes on this date" field, so this creates ONE plan at the
// $21.25 launch price. After Sept 7, raise it back to $85 by hand (Whop
// dashboard, or client.plans.update) rather than re-running this file,
// which would create a second, duplicate product.

import Whop from "@whop/sdk";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;

if (!apiKey || !companyId) {
  console.error(
    "Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/create-math-for-ml-whop-product.mjs"
  );
  process.exit(1);
}

const client = new Whop({ apiKey });
const accountId = companyId;

const PRODUCT = {
  envPrefix: "WHOP_MATH_FOR_ML",
  title: "Mathematics for Machine Learning",
  headline: "From vectors to attention, built to actually teach the math",
  description:
    "From mathematical foundations to understanding how modern machine learning actually works: vectors, transformations, PCA, calculus and optimization, probability, information theory, and the math behind neural networks and attention. Built as a real interactive computational lab, not a video series. No prior calculus or linear algebra required.",
  plan: {
    // Whop plan titles are capped at 30 characters — this is the exact
    // string the other 4 courses' plans already use successfully.
    title: "Founding Access, 75% Off",
    description:
      "75% off through Sept 7. Full course access, lifetime updates. Regular price $85.",
    plan_type: "one_time",
    initial_price: 21.25,
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
  // file already holds the record of the previously-created products.
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
