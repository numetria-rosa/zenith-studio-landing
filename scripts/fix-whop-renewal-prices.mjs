// One-off fix: scripts/create-whop-products.mjs set initial_price equal to
// renewal_price on every renewal-type plan, thinking "first charge = one
// full month, charged immediately." That's wrong — Whop treats initial_price
// as an EXTRA one-time fee stacked on top of the first renewal_price charge,
// so every one of these plans was double-charging on day one (e.g. the
// Brokerage AI Team plan billed $2,400 due today instead of $1,200).
//
// Fix: set initial_price to 0 on every affected renewal plan, so "due
// today" is just the renewal_price, matching what's actually advertised on
// the site. Confirmed correct by reading Whop's own docs example, which
// used initial_price: 0 for an immediate-charge-of-renewal-only plan.
//
// Usage: node --env-file=.env scripts/fix-whop-renewal-prices.mjs

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
if (!apiKey) {
  console.error("Missing WHOP_API_KEY. Run with: node --env-file=.env scripts/fix-whop-renewal-prices.mjs");
  process.exit(1);
}

const client = new Whop({ apiKey });

// Every renewal-type plan created by create-whop-products.mjs — the setup
// (one_time) plans and the AI Engineering plan are unaffected, they never
// had a renewal_price to conflict with.
const AFFECTED_PLANS = [
  { label: "AI Inbox Manager — Monthly", id: "plan_Qvl24MqIyHNfQ" },
  { label: "AI Lead Capture & Follow-Up — Monthly", id: "plan_EKCkv5lP6CSPP" },
  { label: "AI Receptionist & Booking — Monthly", id: "plan_CJyNkObEaPquA" },
  { label: "AI Team — Law Firms — Monthly", id: "plan_kTlL5gBlJTsqy" },
  { label: "AI Team — Brokerages — Monthly", id: "plan_m3i6RwMYvMATE" },
];

async function main() {
  for (const { label, id } of AFFECTED_PLANS) {
    const before = await client.plans.retrieve(id);
    console.log(`\n${label} (${id})`);
    console.log(`  before: initial_price=${before.initial_price} renewal_price=${before.renewal_price} (${before.formatted_price})`);

    const after = await client.plans.update(id, { initial_price: 0 });
    console.log(`  after:  initial_price=${after.initial_price} renewal_price=${after.renewal_price} (${after.formatted_price})`);
  }
  console.log("\nDone. Every renewal plan now charges exactly renewal_price on day one and each month after.");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
