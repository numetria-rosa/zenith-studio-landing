// One-off script (2026-11-13): adds the France market to the WhatsApp AI Agent: one hidden Starter plan at EUR 45 a month on
// the existing product "WhatsApp AI Agent for Travel Agencies", and one hidden one-time plan for the 500-reply extra pack at
// EUR 8 on the hidden "Extra AI replies" product. Same shape as scripts/create-whatsapp-umrah-country-plans.mjs and
// scripts/create-whatsapp-umrah-extra-replies-plans.mjs (a Whop plan has one currency, and subscriptions cannot use adaptive
// pricing: https://docs.whop.com/payments-and-billing/fees/adaptive-pricing).
//
// Usage: node --env-file=.env scripts/create-whatsapp-umrah-fr-plans.mjs
// Put the printed ids in COUNTRY_STARTER_PLAN_IDS (src/lib/whatsapp-umrah/whop-plans.ts) and EXTRA_PACK_PLAN_IDS (extra-replies.ts).

import Whop from "@whop/sdk";

const STARTER_PRODUCT_ID = "prod_XAv74ApRLkBNO";
const EXTRA_PRODUCT_ID = "prod_cdUFAHRqgjvTU";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;
if (!apiKey || !companyId) {
  console.error("Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/create-whatsapp-umrah-fr-plans.mjs");
  process.exit(1);
}
const client = new Whop({ apiKey });

const starter = await client.plans.create({
  account_id: companyId,
  product_id: STARTER_PRODUCT_ID,
  plan_type: "renewal",
  release_method: "buy_now",
  currency: "eur",
  visibility: "hidden",
  title: "Starter FR",
  description: "1 WhatsApp number, 1 team seat, 1,000 AI replies a month.",
  initial_price: 0, // the first renewal_price charge is the full price, nothing doubled on day one
  renewal_price: 45,
  billing_period: 30,
  adaptive_pricing_enabled: false,
});
console.log(`Starter FR EUR 45: ${starter.id} (${starter.currency} renewal ${starter.renewal_price}, ${starter.visibility})\n  ${starter.purchase_url}`);

const pack = await client.plans.create({
  account_id: companyId,
  product_id: EXTRA_PRODUCT_ID,
  plan_type: "one_time",
  release_method: "buy_now",
  currency: "eur",
  visibility: "hidden",
  title: "500 replies EUR",
  description: "500 more AI replies for the rest of this month. One-time, does not renew.",
  initial_price: 8,
  renewal_price: 0,
  adaptive_pricing_enabled: false,
});
console.log(`Extra pack EUR 8: ${pack.id} (${pack.currency} ${pack.initial_price}, ${pack.visibility})\n  ${pack.purchase_url}`);
