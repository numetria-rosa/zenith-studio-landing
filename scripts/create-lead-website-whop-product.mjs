// One-off script: creates the single shared, hidden Whop product that every
// no-website-lead's website-build checkout configuration attaches to.
// Mirrors create-proposal-whop-product.mjs's own reasoning - this is ONE
// container product created once; individual checkouts are per-lead
// checkoutConfigurations created on demand (see src/lib/lead-checkout.ts),
// not new products. Hits the real Whop API; not idempotent, do not re-run
// once the product exists - the resulting product_id gets hardcoded into
// src/lib/lead-checkout.ts.
//
// Usage:
//   node --env-file=.env scripts/create-lead-website-whop-product.mjs

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;

if (!apiKey || !companyId) {
  console.error("Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/create-lead-website-whop-product.mjs");
  process.exit(1);
}

const client = new Whop({ apiKey });

const product = await client.products.create({
  account_id: companyId,
  title: "Zenith Studio Website Build",
  headline: "One-time small business website build",
  description: "A one-time website build for a local service business found through cold outreach. Checkout configurations under this product are created per lead, one at a time, and are never listed publicly.",
  visibility: "hidden", // never meant to be discovered/browsed on Whop - only reached via the exact checkout link sent to that one lead
});

console.log("Created product:", product.id);
console.log("\nPaste this into src/lib/lead-checkout.ts:");
console.log(`const LEAD_WEBSITE_WHOP_PRODUCT_ID = "${product.id}";`);
