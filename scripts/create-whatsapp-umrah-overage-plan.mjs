// One-off script: creates the £5 "Extra 1,000 AI replies" one-time add-on
// plan under the existing WhatsApp Umrah product (see
// create-whatsapp-umrah-whop-product.mjs for the product itself).
// plan_type "one_time" confirmed against @whop/sdk/resources/plans.d.ts
// ("renewal" (recurring) or "one_time" (single payment)).
//
// Usage:
//   node --env-file=.env scripts/create-whatsapp-umrah-overage-plan.mjs <productId>

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;
const productId = process.argv[2];

if (!apiKey || !companyId || !productId) {
  console.error(
    "Usage: node --env-file=.env scripts/create-whatsapp-umrah-overage-plan.mjs <productId>\n" +
      "Missing WHOP_API_KEY / WHOP_COMPANY_ID or productId argument."
  );
  process.exit(1);
}

const client = new Whop({ apiKey });

const plan = await client.plans.create({
  account_id: companyId,
  product_id: productId,
  plan_type: "one_time",
  release_method: "buy_now",
  currency: "gbp",
  visibility: "visible",
  title: "Extra 1,000 AI replies",
  description: "One-off top-up: 1,000 more AI replies for this billing period.",
  initial_price: 5,
  billing_period: null,
});

console.log(`Plan "Extra 1,000 AI replies" created: ${plan.id}`);
console.log(`  ${plan.purchase_url}`);
console.log(`\nAdd to .env / Vercel env:`);
console.log(`WHATSAPP_UMRAH_OVERAGE_PLAN_ID=${plan.id}`);
