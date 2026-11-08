// One-off script: creates the hidden Whop product that extra AI reply packs are sold under. Each pack is a one-time plan
// created inline by createExtraRepliesCheckout (src/lib/whatsapp-umrah/extra-replies.ts), so no plans are made here.
// Put the printed product id in EXTRA_REPLIES_PRODUCT_ID in that file.
//
// Usage: node --env-file=.env scripts/create-whatsapp-umrah-extra-replies-product.mjs

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;
if (!apiKey || !companyId) {
  console.error("Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/create-whatsapp-umrah-extra-replies-product.mjs");
  process.exit(1);
}

const client = new Whop({ apiKey });
const product = await client.products.create({
  account_id: companyId,
  title: "Extra AI replies for WhatsApp AI Agent",
  headline: "More AI replies for the rest of this month",
  description: "A one-time pack of extra AI replies for your WhatsApp AI Agent, valid for the current month only. It does not renew. Bought from your dashboard.",
  visibility: "hidden",
});
console.log("Product created:", product.id);
