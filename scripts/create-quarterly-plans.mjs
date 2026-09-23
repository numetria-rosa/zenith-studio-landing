// One-off: creates real quarterly (90-day) plans for all three AI Team
// bundles as a stand-in for real annual billing, which Whop rejects for
// this account until the $2,500/purchase cap is raised (see
// sync-details-page-pricing.mjs). Every price below stays safely under
// that cap with a real buffer, not a razor-thin one.
//
//   Law Firm AI Team:       $1,080/mo x3, 25% off -> $2,430/quarter
//   Insurance Bundle:         $850/mo x3, 25% off -> $1,912.50/quarter
//   Brokerage AI Team:      $1,200/mo x3, 32% off -> $2,448/quarter
//
// Usage: node --env-file=.env scripts/create-quarterly-plans.mjs

import Whop from "@whop/sdk";
import { writeFileSync } from "node:fs";

const apiKey = process.env.WHOP_API_KEY;
const companyId = process.env.WHOP_COMPANY_ID;
if (!apiKey || !companyId) {
  console.error("Missing WHOP_API_KEY or WHOP_COMPANY_ID.");
  process.exit(1);
}

const client = new Whop({ apiKey });
const accountId = companyId;

const PLANS = [
  {
    label: "Law Firm AI Team — Quarterly",
    product_id: "prod_At0P1t5f04lzI",
    title: "Quarterly",
    description: "AI Billing Clerk, Missed Call Text-Back, and Follow-Up Clerk, billed quarterly (25% off monthly).",
    renewal_price: 2430,
  },
  {
    label: "Insurance Account Manager Bundle — Quarterly",
    product_id: "prod_HdCmHgbriMWDk",
    title: "Quarterly",
    description: "Intake Agent, Document Audit, CRM & Logging, and Renewal Reminders, billed quarterly (25% off monthly).",
    renewal_price: 1912.5,
  },
  {
    label: "Brokerage AI Team — Quarterly",
    product_id: "prod_Qd3Xw3cx8MBSp",
    title: "Quarterly",
    description: "Inside Sales Agent, Transaction Coordinator, and Database Manager, billed quarterly (32% off monthly).",
    renewal_price: 2448,
  },
];

async function main() {
  const out = {};
  for (const p of PLANS) {
    console.log(`\n=== ${p.label} ===`);
    const plan = await client.plans.create({
      account_id: accountId,
      product_id: p.product_id,
      plan_type: "renewal",
      release_method: "buy_now",
      currency: "usd",
      visibility: "visible",
      title: p.title,
      description: p.description,
      initial_price: 0,
      renewal_price: p.renewal_price,
      billing_period: 90,
    });
    console.log(`  ${plan.id}: ${plan.formatted_price}`);
    console.log(`  ${plan.purchase_url}`);
    out[p.label] = { id: plan.id, checkoutUrl: plan.purchase_url };
  }
  writeFileSync("whop-quarterly-plans-result.json", JSON.stringify(out, null, 2));
  console.log("\nDone. Full details written to whop-quarterly-plans-result.json");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
