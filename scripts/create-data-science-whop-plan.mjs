// Recovery follow-up to create-data-science-whop-product.mjs: that script's
// product.create() succeeded (prod_9eVAjfMpwcaX8) but plans.create() then
// failed with "Title is too long (maximum is 30 characters)" on the original
// 39-character plan title, leaving the product with no plan. This creates
// ONLY the plan, attached to that same existing product, so no second
// duplicate product gets created.
//
// Usage:
//   node --env-file=.env scripts/create-data-science-whop-plan.mjs

import Whop from "@whop/sdk";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;

if (!apiKey || !companyId) {
  console.error("Missing WHOP_API_KEY or WHOP_COMPANY_ID.");
  process.exit(1);
}

const client = new Whop({ apiKey });
const accountId = companyId;
const PRODUCT_ID = "prod_9eVAjfMpwcaX8";

const plan = {
  title: "Founding Access, 75% Off", // 24 chars, within Whop's 30-char plan title limit
  description:
    "Regular price $120. Founding-cohort launch price through August 31, then reverts to $120. Lifetime access and updates.",
  plan_type: "one_time",
  initial_price: 30,
};

async function main() {
  const createdPlan = await client.plans.create({
    account_id: accountId,
    product_id: PRODUCT_ID,
    plan_type: plan.plan_type,
    release_method: "buy_now",
    currency: "usd",
    visibility: "visible",
    title: plan.title,
    description: plan.description,
    initial_price: plan.initial_price,
  });
  console.log(`Plan "${plan.title}" created: ${createdPlan.id}`);
  console.log(`  ${createdPlan.purchase_url}`);

  console.log("\n=== .env lines ===\n");
  console.log(`WHOP_DATA_SCIENCE_ACCESS_PASS_ID="${PRODUCT_ID}"`);
  console.log(`WHOP_DATA_SCIENCE_PLAN_ID="${createdPlan.id}"`);
  console.log(`WHOP_DATA_SCIENCE_CHECKOUT_URL="${createdPlan.purchase_url}"`);

  const path = "whop-created-products.json";
  const existing = existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : [];
  existing.push({
    title: "Data Science & Analysis",
    productId: PRODUCT_ID,
    plans: [{ title: plan.title, planId: createdPlan.id, checkoutUrl: createdPlan.purchase_url }],
  });
  writeFileSync(path, JSON.stringify(existing, null, 2));
  console.log(`\nMerged into ${path} (${existing.length} products on record now).`);
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
