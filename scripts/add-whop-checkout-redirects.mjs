// One-off backfill: every plan below was created by an earlier script
// (create-whop-products.mjs, course/bundle equivalents) before this project
// started setting a post-checkout redirect. A bare plan `purchase_url`
// (https://whop.com/checkout/plan_xxx) never redirects anywhere after
// payment - only a Checkout Configuration (a separate Whop resource, `ch_`
// prefixed) carries a `redirect_url`. Without one, a buyer sees Whop's
// generic receipt page instead of landing on /api/auth/claim, which is what
// actually signs them in and gets them to /welcome (see that route's own
// comment - this project's proposal checkouts had the same gap, fixed at
// the source in src/lib/proposal-payments.ts's new planCheckoutUrl()).
//
// This script is idempotent: for each plan, it lists existing checkout
// configurations for that plan_id first and skips creating a new one if any
// already has redirect_url set to the claim route - safe to re-run.
//
// Usage:
//   node --env-file=.env scripts/add-whop-checkout-redirects.mjs
//
// Requires WHOP_API_KEY (Checkout Configurations [Read, Create]) and
// WHOP_COMPANY_ID in .env. Set SITE_URL below if zenith-studio.site isn't
// right for this run (e.g. testing against a staging domain).
//
// Output: for each plan, either "already has a redirect" (no-op) or the
// newly created configuration's checkout URL - paste those into
// src/lib/services.ts / src/lib/courses.ts / src/lib/bundles.ts in place of
// the current `https://whop.com/checkout/plan_xxx` value for that field, so
// the site actually sends buyers through the new link, not the old bare one.

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;
const SITE_URL = process.env.SITE_URL || "https://zenith-studio.site";
const REDIRECT_URL = `${SITE_URL}/api/auth/claim`;

if (!apiKey || !companyId) {
  console.error(
    "Missing WHOP_API_KEY or WHOP_COMPANY_ID. Run with: node --env-file=.env scripts/add-whop-checkout-redirects.mjs"
  );
  process.exit(1);
}

const client = new Whop({ apiKey });

// label: where this plan_id is used, so the printed output tells you
// exactly which source file/field to update, not just a bare plan id.
const PLANS = [
  { label: "services.ts: ai-inbox-manager, setupCheckoutUrl", id: "plan_AUhS9tvz8KrJC" },
  { label: "services.ts: ai-inbox-manager, monthlyCheckoutUrl", id: "plan_Qvl24MqIyHNfQ" },
  { label: "services.ts: ai-lead-capture, setupCheckoutUrl", id: "plan_l6f3sCRsCR2Em" },
  { label: "services.ts: ai-lead-capture, monthlyCheckoutUrl", id: "plan_EKCkv5lP6CSPP" },
  { label: "services.ts: ai-receptionist, setupCheckoutUrl", id: "plan_ts3JwXpFBKKMp" },
  { label: "services.ts: ai-receptionist, monthlyCheckoutUrl", id: "plan_CJyNkObEaPquA" },
  { label: "services.ts: law-firms, monthlyCheckoutUrl", id: "plan_kTlL5gBlJTsqy" },
  { label: "services.ts: brokerages, monthlyCheckoutUrl", id: "plan_m3i6RwMYvMATE" },
  { label: "courses.ts: AI Engineering, checkoutUrl", id: "plan_VSU3hyAITNsNk" },
  { label: "courses.ts: Data Science & Analysis, checkoutUrl", id: "plan_ysRjmrPzOn9j1" },
  { label: "courses.ts: AI Automation, checkoutUrl", id: "plan_ED9yF9ehN2RIa" },
  { label: "courses.ts: AI-Assisted Software Engineering, checkoutUrl", id: "plan_ximKlnIKYO7Bx" },
  { label: "courses.ts: Mathematics for Machine Learning, checkoutUrl", id: "plan_3kAXjmfXopjpa" },
  { label: "bundles.ts: AI Engineering + AI Automation Bundle, checkoutUrl", id: "plan_NFGFagPrJyNM5" },
  { label: "bundles.ts: AI-Assisted SWE + AI Engineering Bundle, checkoutUrl", id: "plan_GnqESzu68VSrz" },
];

async function main() {
  console.log(`Redirect target for every plan below: ${REDIRECT_URL}\n`);
  const updates = [];

  for (const { label, id } of PLANS) {
    process.stdout.write(`${label} (${id}) ... `);

    const existing = await client.checkoutConfigurations.list({ account_id: companyId, plan_id: id });
    const alreadyRedirects = existing.data?.some((c) => c.redirect_url === REDIRECT_URL);

    if (alreadyRedirects) {
      console.log("already has this redirect, skipped");
      continue;
    }

    const config = await client.checkoutConfigurations.create({
      account_id: companyId,
      plan_id: id,
      redirect_url: REDIRECT_URL,
    });
    console.log(`created ${config.id} -> ${config.purchase_url}`);
    updates.push({ label, id, newUrl: config.purchase_url });
  }

  if (updates.length === 0) {
    console.log("\nNothing to update - every plan already redirects correctly.");
    return;
  }

  console.log("\n\n=== Paste these into their source files, replacing the old checkout URL ===\n");
  for (const u of updates) {
    console.log(`${u.label}\n  ${u.newUrl}\n`);
  }
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
