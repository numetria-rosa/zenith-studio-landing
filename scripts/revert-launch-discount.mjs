// Run this on or after September 5, 2026 to end the "75% off" launch
// discount: raises all 4 Zenith Lab plans in Whop back to their regular
// price and restores each plan's normal title/description.
//
// This is a manual step on purpose: Whop's Plans API has no scheduled-
// price-change field (confirmed against the SDK's PlanUpdateParams type),
// so nothing can flip this automatically. The /lab page's countdown and
// price display already switch back to the original price on their own
// once the discountDeadline in src/app/lab/courses-data.ts passes,
// client-side, with no code change needed there. Only the actual amount
// Whop charges at checkout needs this script (or the equivalent manual
// edit in the Whop dashboard) run once.
//
// Usage:
//   node --env-file=.env scripts/revert-launch-discount.mjs

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
if (!apiKey) {
  console.error("Missing WHOP_API_KEY. Run with: node --env-file=.env scripts/revert-launch-discount.mjs");
  process.exit(1);
}

const client = new Whop({ apiKey });

const PLANS = [
  { name: "AI Engineering", id: "plan_VSU3hyAITNsNk", originalPrice: 99, title: "Founding Access", description: "Full course access. Lifetime updates." },
  { name: "Data Science & Analysis", id: "plan_ysRjmrPzOn9j1", originalPrice: 120, title: "Founding Access", description: "Full course access. Lifetime updates." },
  { name: "AI Automation", id: "plan_ED9yF9ehN2RIa", originalPrice: 149, title: "Lifetime Access", description: "Full course access. Lifetime updates." },
  { name: "AI-Assisted Software Engineering", id: "plan_ximKlnIKYO7Bx", originalPrice: 99, title: "Lifetime Access", description: "Full course access. Lifetime updates." },
];

async function main() {
  for (const plan of PLANS) {
    const before = await client.plans.retrieve(plan.id);
    console.log(`${plan.name}: current "${before.title}", initial_price=${before.initial_price}`);

    if (before.initial_price === plan.originalPrice) {
      console.log(`  already at $${plan.originalPrice}, skipping.\n`);
      continue;
    }

    const updated = await client.plans.update(plan.id, {
      title: plan.title,
      description: plan.description,
      initial_price: plan.originalPrice,
    });
    console.log(`  updated: "${updated.title}", initial_price=${updated.initial_price}\n`);
  }
  console.log("Done. All 4 plans now charge full price at checkout.");
  console.log("Remember to also remove/expire the discountPercent/discountDeadline fields in src/app/lab/courses-data.ts if you haven't already.");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
