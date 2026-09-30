// One-off script: creates the Whop product and plans for the WhatsApp AI
// Agent for Umrah/Hajj agencies (Starter, GBP). Growth/Pro aren't launched
// yet (waitlist only, see CLAUDE.md) so no plans are created for them here.
// Founding offer's "first 10 agencies" cap is tracked in our own DB
// (WaSubscription.foundingOffer), not Whop-side - Whop has no built-in
// remaining-seats counter for a plan.
//
// Currency: Whop's plan currency field is a free ISO 4217 string (checked
// against @whop/sdk's types, not documented as an enum) - "gbp" used here,
// matching this product's GBP pricing throughout.
//
// Usage:
//   node --env-file=.env scripts/create-whatsapp-umrah-whop-product.mjs

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;

if (!apiKey || !companyId) {
  console.error("Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/create-whatsapp-umrah-whop-product.mjs");
  process.exit(1);
}

const client = new Whop({ apiKey });

const product = await client.products.create({
  account_id: companyId,
  title: "WhatsApp AI Agent for Umrah Agencies",
  headline: "Every Umrah enquiry answered on WhatsApp, instantly, in the customer's language",
  description:
    "An AI agent on your own WhatsApp number that answers from your packages and FAQs, captures leads, and hands off to your team - live within days, no contract, cancel anytime. Meta's own WhatsApp message charges are billed to your agency's own Meta account, separately from this plan.",
  visibility: "visible",
});
console.log("Product created:", product.id);

const plans = [
  {
    title: "Starter",
    description: "1 WhatsApp number, 1 team seat, 1,000 AI replies a month.",
    renewal_price: 49,
  },
  {
    title: "Starter — Founding offer",
    description: "Locked-in founding price for the first 10 agencies, in exchange for a testimonial and a feedback call. Same Starter plan otherwise.",
    renewal_price: 9,
  },
];

const created = [];
for (const plan of plans) {
  const body = {
    account_id: companyId,
    product_id: product.id,
    plan_type: "renewal",
    release_method: "buy_now",
    currency: "gbp",
    visibility: "visible",
    title: plan.title,
    description: plan.description,
    initial_price: 0, // first renewal_price charge is the full price, nothing doubled on day one
    renewal_price: plan.renewal_price,
    billing_period: 30,
  };
  const createdPlan = await client.plans.create(body);
  console.log(`Plan "${plan.title}" created: ${createdPlan.id}`);
  console.log(`  ${createdPlan.purchase_url}`);
  created.push({ title: plan.title, planId: createdPlan.id, purchaseUrl: createdPlan.purchase_url });
}

console.log("\nPaste these into the WhatsApp Umrah pricing page / lib:");
for (const c of created) {
  const constName = c.title.includes("Founding") ? "WHATSAPP_UMRAH_FOUNDING_PLAN_ID" : "WHATSAPP_UMRAH_STARTER_PLAN_ID";
  console.log(`export const ${constName} = "${c.planId}";`);
  console.log(`// checkout: ${c.purchaseUrl}`);
}
