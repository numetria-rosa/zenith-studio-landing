// One-off: syncs real Whop pricing to match what the two approved details
// pages (public/demos/law-firm-ai-team.html, insurance-ai-team.html) show.
// Confirmed via a real read against Whop before running: the law-firms
// monthly plan had 0 active members, so a direct price/trial update was
// safe - no existing subscriber was affected. Insurance had no real product
// at all (it was reusing ai-lead-capture's unrelated $200/mo plan).
//
// RUN RESULT (2026-09-23): law-firms monthly plan update succeeded
// (plan_kTlL5gBlJTsqy -> $1,080/mo, 4-day trial, strike-through $1,200
// shown on Whop's own checkout). Both yearly plan creations FAILED and were
// never created: "Purchases over $2500 USD are not enabled for this
// account" (law-firms yearly would be $10,800, insurance yearly $7,650,
// both over the cap). The insurance product + its $850/mo monthly plan
// were created successfully in a follow-up manual call (not by re-running
// this file - it would duplicate the law-firms monthly update and the
// insurance product). Real ids: insurance product prod_HdCmHgbriMWDk,
// insurance monthly plan_aW9AIh13BCZPV. Neither yearly plan exists yet -
// raise the $2,500 cap with Whop, then create both yearly plans (edit the
// two lawFirmYearly/insuranceYearly blocks below back in, or just call
// client.plans.create directly with the same bodies) and add the results
// to services.ts's whopYearlyPlanId/yearlyCheckoutUrl fields.
//
// Usage: node --env-file=.env scripts/sync-details-page-pricing.mjs

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

async function main() {
  const out = {};

  console.log("=== Law Firm AI Team: updating existing monthly plan ===");
  const lawFirmMonthly = await client.plans.update("plan_kTlL5gBlJTsqy", {
    renewal_price: 1080,
    strike_through_renewal_price: 1200,
    trial_period_days: 4,
  });
  console.log(`  ${lawFirmMonthly.id}: ${lawFirmMonthly.formatted_price}, trial ${lawFirmMonthly.trial_period_days}d`);
  out.lawFirmMonthly = { id: lawFirmMonthly.id, checkoutUrl: lawFirmMonthly.purchase_url };

  console.log("\n=== Law Firm AI Team: creating new yearly plan ===");
  const lawFirmYearly = await client.plans.create({
    account_id: accountId,
    product_id: "prod_At0P1t5f04lzI",
    plan_type: "renewal",
    release_method: "buy_now",
    currency: "usd",
    visibility: "visible",
    title: "Yearly",
    description: "AI Billing Clerk, Missed Call Text-Back, and Follow-Up Clerk, billed yearly (25% off monthly).",
    initial_price: 0,
    renewal_price: 10800,
    billing_period: 365,
    trial_period_days: 4,
  });
  console.log(`  ${lawFirmYearly.id}: ${lawFirmYearly.formatted_price}`);
  console.log(`  ${lawFirmYearly.purchase_url}`);
  out.lawFirmYearly = { id: lawFirmYearly.id, checkoutUrl: lawFirmYearly.purchase_url };

  console.log("\n=== Insurance Account Manager Bundle: creating new product ===");
  const insuranceProduct = await client.products.create({
    account_id: accountId,
    title: "Insurance Account Manager Bundle",
    headline: "Your front office, on autopilot",
    description:
      "Intake Agent, Document Audit, CRM & Logging, and Renewal Reminders for independent insurance agencies. No AMS access required.",
    visibility: "visible",
  });
  console.log(`  Product created: ${insuranceProduct.id}`);
  out.insuranceProductId = insuranceProduct.id;

  console.log("\n=== Insurance Account Manager Bundle: creating monthly plan ===");
  const insuranceMonthly = await client.plans.create({
    account_id: accountId,
    product_id: insuranceProduct.id,
    plan_type: "renewal",
    release_method: "buy_now",
    currency: "usd",
    visibility: "visible",
    title: "Monthly",
    description: "Intake Agent, Document Audit, CRM & Logging, and Renewal Reminders, billed monthly.",
    initial_price: 0,
    renewal_price: 850,
    billing_period: 30,
  });
  console.log(`  ${insuranceMonthly.id}: ${insuranceMonthly.formatted_price}`);
  console.log(`  ${insuranceMonthly.purchase_url}`);
  out.insuranceMonthly = { id: insuranceMonthly.id, checkoutUrl: insuranceMonthly.purchase_url };

  console.log("\n=== Insurance Account Manager Bundle: creating yearly plan ===");
  const insuranceYearly = await client.plans.create({
    account_id: accountId,
    product_id: insuranceProduct.id,
    plan_type: "renewal",
    release_method: "buy_now",
    currency: "usd",
    visibility: "visible",
    title: "Yearly",
    description: "Intake Agent, Document Audit, CRM & Logging, and Renewal Reminders, billed yearly (25% off monthly).",
    initial_price: 0,
    renewal_price: 7650,
    billing_period: 365,
  });
  console.log(`  ${insuranceYearly.id}: ${insuranceYearly.formatted_price}`);
  console.log(`  ${insuranceYearly.purchase_url}`);
  out.insuranceYearly = { id: insuranceYearly.id, checkoutUrl: insuranceYearly.purchase_url };

  writeFileSync("whop-pricing-sync-result.json", JSON.stringify(out, null, 2));
  console.log("\nDone. Full details written to whop-pricing-sync-result.json");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
