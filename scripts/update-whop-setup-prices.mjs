// One-off: lowers the founding-client setup fee on the three AI Systems
// one_time setup plans, from the original 35%-off numbers ($520/$650/$975)
// to $190/$270/$360 — a deliberate pricing decision (not a bug fix like
// fix-whop-renewal-prices.mjs): as a not-yet-established provider, the goal
// is maximizing client count for the recurring monthly base, not setup
// revenue, so the setup fee only needs to cover build cost + filter serious
// leads. Matches src/app/page.tsx's aiSystems[].founding fields exactly —
// keep both in sync if this changes again.
//
// Usage: node --env-file=.env scripts/update-whop-setup-prices.mjs

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
if (!apiKey) {
  console.error("Missing WHOP_API_KEY. Run with: node --env-file=.env scripts/update-whop-setup-prices.mjs");
  process.exit(1);
}

const client = new Whop({ apiKey });

const SETUP_PLANS = [
  { label: "AI Inbox Manager — Setup", id: "plan_AUhS9tvz8KrJC", newPrice: 190 },
  { label: "AI Lead Capture & Follow-Up — Setup", id: "plan_l6f3sCRsCR2Em", newPrice: 270 },
  { label: "AI Receptionist & Booking — Setup", id: "plan_ts3JwXpFBKKMp", newPrice: 360 },
];

async function main() {
  for (const { label, id, newPrice } of SETUP_PLANS) {
    const before = await client.plans.retrieve(id);
    console.log(`\n${label} (${id})`);
    console.log(`  before: initial_price=${before.initial_price} (${before.formatted_price})`);

    const after = await client.plans.update(id, { initial_price: newPrice });
    console.log(`  after:  initial_price=${after.initial_price} (${after.formatted_price})`);
  }
  console.log("\nDone. All three setup plans now charge the new founding price.");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
