// One-off script: adds one Starter plan per extra country to the existing Whop product "WhatsApp AI Agent for Travel
// Agencies" (the UK plan, GBP 49, already lives on it). Each plan is in the country's own currency.
//
// Why separate plans and not one plan: a Whop plan (the API now calls it a "variant", ids still start with plan_) has
// exactly one currency, and Whop's adaptive pricing, which shows local currency at checkout, only works for one-time
// payments, "recurring subscriptions continue to bill in the original checkout currency"
// (https://docs.whop.com/payments-and-billing/fees/adaptive-pricing). So a subscription needs one plan per currency, all
// attached to one product. Plans are hidden: reachable only from the country demo page, not listed on the store page.
//
// Usage: node --env-file=.env scripts/create-whatsapp-umrah-country-plans.mjs
// Prints the plan ids and checkout links. Put the ids in COUNTRY_STARTER_PLAN_IDS (src/lib/whatsapp-umrah/whop-plans.ts) so the
// webhook recognises them; no environment variable is needed.

import Whop from "@whop/sdk";

const PRODUCT_ID = "prod_XAv74ApRLkBNO"; // WhatsApp AI Agent for Travel Agencies (same product as the UK plan)
const PLANS = [
  { cc: "US", currency: "usd", price: 52 },
  { cc: "CA", currency: "cad", price: 83 },
  { cc: "AU", currency: "aud", price: 85 },
  { cc: "ZA", currency: "zar", price: 900 },
];

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;
if (!apiKey || !companyId) {
  console.error("Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/create-whatsapp-umrah-country-plans.mjs");
  process.exit(1);
}
const client = new Whop({ apiKey });

for (const p of PLANS) {
  const plan = await client.plans.create({
    account_id: companyId,
    product_id: PRODUCT_ID,
    plan_type: "renewal",
    release_method: "buy_now",
    currency: p.currency,
    visibility: "hidden",
    title: `Starter ${p.cc}`,
    description: "1 WhatsApp number, 1 team seat, 1,000 AI replies a month.",
    initial_price: 0, // the first renewal_price charge is the full price, nothing doubled on day one
    renewal_price: p.price,
    billing_period: 30,
    adaptive_pricing_enabled: false,
  });
  console.log(`${p.cc} ${p.currency.toUpperCase()} ${p.price}: ${plan.id}`);
  console.log(`  currency ${plan.currency}, renewal ${plan.renewal_price}, period ${plan.billing_period}, visibility ${plan.visibility}`);
  console.log(`  ${plan.purchase_url}`);
}
