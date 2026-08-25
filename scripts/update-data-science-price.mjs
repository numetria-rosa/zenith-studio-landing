// Run this on or after August 31, 2026 to end the Data Science & Analysis
// launch discount: raises the real Whop plan price from $30 back to $120,
// and updates the plan's title/description to drop the "75% off" framing.
//
// This is a manual step on purpose: Whop's Plans API has no scheduled-
// price-change field (confirmed against the SDK's PlanCreateParams/
// PlanUpdateParams types), so nothing can flip this automatically. The
// /lab page's countdown and price display already switch to $120 on their
// own once the deadline in src/app/lab/courses-data.ts passes, client-side,
// with no code change needed there, that part is already handled. Only the
// actual amount Whop charges at checkout needs this script (or the
// equivalent manual edit in the Whop dashboard) run once.
//
// Usage:
//   node --env-file=.env scripts/update-data-science-price.mjs
//
// Requires WHOP_API_KEY in .env.

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
if (!apiKey) {
  console.error("Missing WHOP_API_KEY. Run with: node --env-file=.env scripts/update-data-science-price.mjs");
  process.exit(1);
}

const client = new Whop({ apiKey });
const PLAN_ID = "plan_ysRjmrPzOn9j1";

async function main() {
  const before = await client.plans.retrieve(PLAN_ID);
  console.log(`Current: "${before.title}", initial_price=${before.initial_price}`);

  if (before.initial_price === 120) {
    console.log("Already $120, nothing to do.");
    return;
  }

  const updated = await client.plans.update(PLAN_ID, {
    title: "Data Science & Analysis",
    description: "Full course access. Lifetime updates.",
    initial_price: 120,
  });
  console.log(`Updated: "${updated.title}", initial_price=${updated.initial_price}`);
  console.log("\nDone. The real Whop checkout now charges $120.");
  console.log(
    "The /lab page already displays $120 on its own once the countdown in courses-data.ts expires, no site code change needed for that part."
  );
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
