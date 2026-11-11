// One-off: sets AI Engineering's Whop plan to $72 (40% off the $120 regular
// price, limited time). Was $36 (70% off) until 2026-11-11. Keep in sync with src/app/lab/courses-data.ts.
//
// Usage: node --env-file=.env scripts/_update-ai-engineering-price.mjs

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
if (!apiKey) {
  console.error("Missing WHOP_API_KEY. Run with: node --env-file=.env scripts/_update-ai-engineering-price.mjs");
  process.exit(1);
}

const client = new Whop({ apiKey });
const PLAN_ID = "plan_VSU3hyAITNsNk"; // AI Engineering

async function main() {
  const before = await client.plans.retrieve(PLAN_ID);
  console.log(`Before: "${before.title}" initial_price=${before.initial_price} (${before.formatted_price})`);

  const after = await client.plans.update(PLAN_ID, {
    title: "Launch Access, 40% Off", // Whop caps plan titles at 30 characters
    description: "40% off for a limited time. Full course access, lifetime updates. Regular price $120.",
    initial_price: 72,
  });
  console.log(`After:  "${after.title}" initial_price=${after.initial_price} (${after.formatted_price})`);
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
