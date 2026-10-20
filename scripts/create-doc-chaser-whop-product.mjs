// One-off script: creates the Whop product, the monthly plan (created at $500, lowered to $120 on 2026-10-21 via plans.update) and a checkout link (redirecting buyers
// to /api/auth/claim) for the AI Document Chaser. Creates duplicates if re-run.
//
// Usage: node --env-file=.env scripts/create-doc-chaser-whop-product.mjs
// Then paste the printed plan id and checkout url into the "accounting-document-chaser" entry in
// src/lib/services.ts (whopMonthlyPlanId, monthlyCheckoutUrl).

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;
if (!apiKey || !companyId) {
  console.error("Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/create-doc-chaser-whop-product.mjs");
  process.exit(1);
}
const SITE_URL = process.env.SITE_URL || "https://zenith-studio.site";
const client = new Whop({ apiKey });

const product = await client.products.create({
  account_id: companyId,
  title: "AI Document Chaser",
  headline: "Stop chasing clients for paperwork",
  description:
    "Emails each of your clients the exact documents you still need, with a private upload link, and reminds them every few days until everything is in. You review every upload in one dashboard. Set up for you, cancel anytime.",
  visibility: "visible",
  redirect_purchase_url: `${SITE_URL}/api/auth/claim`,
});
console.log("Product:", product.id);

const plan = await client.plans.create({
  account_id: companyId,
  product_id: product.id,
  plan_type: "renewal",
  release_method: "buy_now",
  currency: "usd",
  visibility: "visible",
  title: "Monthly",
  description: "Set up for you, cancel anytime.",
  initial_price: 0, // first renewal_price charge is the full price, nothing doubled on day one
  renewal_price: 120,
  billing_period: 30,
});
console.log("Plan:", plan.id);

const config = await client.checkoutConfigurations.create({ account_id: companyId, plan_id: plan.id, redirect_url: `${SITE_URL}/api/auth/claim` });
console.log("Checkout:", config.purchase_url);
