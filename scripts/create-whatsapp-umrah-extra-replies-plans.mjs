// One-off script: creates the one-time plans (Whop calls them variants, ids start with plan_) for the extra AI reply pack,
// one per currency, on the hidden "Extra AI replies" product. Prices come from EXTRA_PACK_PRICE_LOCAL in
// src/lib/whatsapp-umrah/economics.ts. The GBP plan already exists (made when the checkout was first tested), so it is
// looked up through that checkout instead of being created twice. Put the printed ids in EXTRA_PACK_PLAN_IDS in
// src/lib/whatsapp-umrah/extra-replies.ts.
//
// Usage: node --env-file=.env scripts/create-whatsapp-umrah-extra-replies-plans.mjs

import Whop from "@whop/sdk";

const PRODUCT_ID = "prod_cdUFAHRqgjvTU";
const EXISTING_GBP_CHECKOUT = "ch_FmspoKGd56yTd9H";
const PLANS = [
  { currency: "USD", price: 9 },
  { currency: "CAD", price: 12 },
  { currency: "AUD", price: 13 },
  { currency: "ZAR", price: 140 },
];

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;
if (!apiKey || !companyId) {
  console.error("Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/create-whatsapp-umrah-extra-replies-plans.mjs");
  process.exit(1);
}
const client = new Whop({ apiKey });

const gbp = (await client.checkoutConfigurations.retrieve(EXISTING_GBP_CHECKOUT)).plan;
console.log(`GBP 6: ${gbp.id} (${gbp.currency} ${gbp.initial_price} ${gbp.plan_type} ${gbp.visibility})`);

for (const p of PLANS) {
  const plan = await client.plans.create({
    account_id: companyId,
    product_id: PRODUCT_ID,
    plan_type: "one_time",
    release_method: "buy_now",
    currency: p.currency.toLowerCase(),
    visibility: "hidden",
    title: `500 replies ${p.currency}`,
    description: "500 more AI replies for the rest of this month. One-time, does not renew.",
    initial_price: p.price,
    renewal_price: 0,
    adaptive_pricing_enabled: false,
  });
  console.log(`${p.currency} ${p.price}: ${plan.id} (${plan.currency} ${plan.initial_price} ${plan.plan_type} ${plan.visibility})`);
}
