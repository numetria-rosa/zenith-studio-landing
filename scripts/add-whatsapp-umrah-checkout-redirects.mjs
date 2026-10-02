// Same two-mechanism fix as add-whop-checkout-redirects.mjs +
// set-whop-product-redirects.mjs, applied to the WhatsApp Umrah product's
// the Starter plan (the Founding offer was removed) - see those scripts' own comments for why
// both a per-plan Checkout Configuration AND the product's own
// redirect_purchase_url are needed. Found missing during the 2026-09-29
// "does the marketing->checkout->dashboard handoff actually work" audit:
// a real buyer had no way back into their own new dashboard.
//
// Usage: node --env-file=.env scripts/add-whatsapp-umrah-checkout-redirects.mjs
// Requires WHOP_API_KEY, WHOP_COMPANY_ID.

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;
const SITE_URL = process.env.SITE_URL || "https://zenith-studio.site";
const REDIRECT_URL = `${SITE_URL}/api/auth/claim`;

if (!apiKey || !companyId) {
  console.error("Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/add-whatsapp-umrah-checkout-redirects.mjs");
  process.exit(1);
}

const client = new Whop({ apiKey });
const PRODUCT_ID = "prod_XAv74ApRLkBNO";
const PLANS = [
  { label: "Starter", id: "plan_e2E6hZwmNsuTR" },
];

async function main() {
  console.log(`Redirect target: ${REDIRECT_URL}\n`);

  for (const { label, id } of PLANS) {
    process.stdout.write(`${label} (${id}) ... `);
    const existing = await client.checkoutConfigurations.list({ account_id: companyId, plan_id: id });
    const already = existing.data?.find((c) => c.redirect_url === REDIRECT_URL);
    if (already) {
      console.log(`already has this redirect: ${already.purchase_url}`);
      continue;
    }
    const config = await client.checkoutConfigurations.create({ account_id: companyId, plan_id: id, redirect_url: REDIRECT_URL });
    console.log(`created ${config.id} -> ${config.purchase_url}`);
  }

  process.stdout.write(`\nProduct ${PRODUCT_ID} redirect_purchase_url ... `);
  const res = await fetch(`https://api.whop.com/api/v1/products/${PRODUCT_ID}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${apiKey}`, "Api-Version-Date": "2026-08-21-1", "Content-Type": "application/json" },
    body: JSON.stringify({ redirect_purchase_url: REDIRECT_URL }),
  });
  const text = await res.text();
  console.log(res.ok ? "OK" : `FAILED: ${res.status} ${text}`);

  console.log("\nPaste the new checkout URLs above into public/demos/uk/whatsapp-umrah-agent.html in place of the bare whop.com/checkout/plan_xxx links.");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
