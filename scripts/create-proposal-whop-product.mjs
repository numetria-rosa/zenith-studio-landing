// One-off script: creates the single shared Whop product that every
// approved Proposal's dynamically-created plans attach to. Proposal amounts
// are custom per client, so unlike services.ts's per-service products this
// is ONE container product created once — new PLANS get created under it
// per approved proposal (see src/lib/proposal-payments.ts), not new
// products. Hits the real Whop API; not idempotent, do not re-run once the
// product exists — the resulting product_id gets hardcoded into
// src/lib/proposal-payments.ts, matching services.ts's own
// "IDs are literal values, not env vars" convention.
//
// Usage:
//   node --env-file=.env scripts/create-proposal-whop-product.mjs

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;

if (!apiKey || !companyId) {
  console.error("Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/create-proposal-whop-product.mjs");
  process.exit(1);
}

const client = new Whop({ apiKey });

const product = await client.products.create({
  account_id: companyId,
  title: "Zenith Studio Proposal",
  headline: "Custom automation proposal",
  description: "A one-off, custom-priced proposal for AI automation work. Plans under this product are created per client and reflect exactly what was quoted and approved.",
  visibility: "hidden", // never meant to be discovered/browsed on Whop — only reached via the exact checkout link generated per proposal
});

console.log("Created product:", product.id);
console.log("\nPaste this into src/lib/proposal-payments.ts:");
console.log(`const PROPOSAL_WHOP_PRODUCT_ID = "${product.id}";`);
