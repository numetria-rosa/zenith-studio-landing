// One-off: raises AI Engineering's Whop plan price from $24.75 to $28.75
// (still 75% off the corrected $115 regular price, up from $99) to match
// the corrected originalPrice in src/app/lab/courses-data.ts and the
// regenerated Instagram ad. Regular price at scripts/revert-launch-discount.mjs
// also needs its AI Engineering originalPrice bumped from 99 to 115 to stay
// in sync for the Sep 5 revert.
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
  console.log(`Before: initial_price=${before.initial_price} (${before.formatted_price})`);

  const after = await client.plans.update(PLAN_ID, { initial_price: 28.75 });
  console.log(`After:  initial_price=${after.initial_price} (${after.formatted_price})`);
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
