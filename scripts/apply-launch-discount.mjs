// Applies the "75% off until Sept 7" launch discount to all 4 published
// Zenith Lab course plans in Whop. Companion to revert-launch-discount.mjs,
// which must be run by hand on/after 2026-09-07 (Whop's Plans API has no
// scheduled-price-change field, confirmed against the SDK's
// PlanUpdateParams type — this can't be automated on the Whop side).
//
// The /lab page's price display and countdown (src/app/lab/courses-data.ts)
// already switch back to the original price on their own once
// discountDeadline passes, client-side, with no code change needed there.
// Only the actual amount Whop charges at checkout needs this pair of
// scripts (or the equivalent manual edit in the Whop dashboard).
//
// Usage:
//   node --env-file=.env scripts/apply-launch-discount.mjs

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
if (!apiKey) {
  console.error("Missing WHOP_API_KEY. Run with: node --env-file=.env scripts/apply-launch-discount.mjs");
  process.exit(1);
}

const client = new Whop({ apiKey });

// 75% off, exact math (not rounded) — the "75% off" badge stays literally
// true. originalPrice/discountedPrice must match src/app/lab/courses-data.ts.
const PLANS = [
  { name: "AI Engineering", id: "plan_VSU3hyAITNsNk", originalPrice: 99, discountedPrice: 24.75 },
  { name: "Data Science & Analysis", id: "plan_ysRjmrPzOn9j1", originalPrice: 120, discountedPrice: 30 },
  { name: "AI Automation", id: "plan_ED9yF9ehN2RIa", originalPrice: 149, discountedPrice: 37.25 },
  { name: "AI-Assisted Software Engineering", id: "plan_ximKlnIKYO7Bx", originalPrice: 99, discountedPrice: 24.75 },
];

async function main() {
  for (const plan of PLANS) {
    const before = await client.plans.retrieve(plan.id);
    console.log(`${plan.name}: current "${before.title}", initial_price=${before.initial_price}`);

    if (before.initial_price === plan.discountedPrice) {
      console.log(`  already at $${plan.discountedPrice}, skipping.\n`);
      continue;
    }

    const updated = await client.plans.update(plan.id, {
      // Whop plan titles are capped at 30 characters — this is the exact
      // string data-science's plan already used successfully.
      title: "Founding Access, 75% Off",
      description: `75% off through Sept 7. Full course access, lifetime updates. Regular price $${plan.originalPrice}.`,
      initial_price: plan.discountedPrice,
    });
    console.log(`  updated: "${updated.title}", initial_price=${updated.initial_price}\n`);
  }
  console.log("Done. All 4 plans now charge the discounted price at checkout.");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
