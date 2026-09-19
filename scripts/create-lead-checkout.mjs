// Creates a hidden, one-off Whop checkout link for a single no-website
// cold-outreach lead. Mirrors src/lib/lead-checkout.ts exactly (that file
// is what the running app would call if this ever needs to happen from
// code instead of the CLI) - kept as a plain .mjs script since this repo
// has no TS script runner set up (see the other scripts/*.mjs files).
//
// Usage:
//   node --env-file=.env scripts/create-lead-checkout.mjs "<lead-slug>" "<Business Name>"
//
// Example:
//   node --env-file=.env scripts/create-lead-checkout.mjs "ls-mobile-automotive" "L&S Mobile Automotive"

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://zenith-studio.site").replace(/\/$/, "");

const LEAD_WEBSITE_WHOP_PRODUCT_ID = "prod_ncw191NzXItqf";
const LEAD_WEBSITE_PRICE_USD = 150;

const [leadSlug, businessName] = process.argv.slice(2);

if (!apiKey || !companyId) {
  console.error("Missing WHOP_API_KEY or WHOP_COMPANY_ID.");
  process.exit(1);
}
if (!leadSlug || !businessName) {
  console.error('Usage: node --env-file=.env scripts/create-lead-checkout.mjs "<lead-slug>" "<Business Name>"');
  process.exit(1);
}

const client = new Whop({ apiKey });

const config = await client.checkoutConfigurations.create({
  account_id: companyId,
  mode: "payment",
  metadata: { lead: leadSlug },
  redirect_url: `${siteUrl}/pay/thanks?lead=${encodeURIComponent(leadSlug)}`,
  plan: {
    product_id: LEAD_WEBSITE_WHOP_PRODUCT_ID,
    title: businessName.slice(0, 30),
    description:
      "One-time website build, $150 after 40 percent off our regular $250 rate. No monthly fees. Deployment included once you provide or purchase a domain.",
    plan_type: "one_time",
    currency: "usd",
    initial_price: LEAD_WEBSITE_PRICE_USD,
    visibility: "hidden",
    force_create_new_plan: true,
  },
});

if (!config.purchase_url) {
  console.error("No purchase_url returned:", config);
  process.exit(1);
}

console.log(`Checkout link for ${businessName}:`);
console.log(config.purchase_url);
