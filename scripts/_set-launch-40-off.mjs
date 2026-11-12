// One-off (2026-11-12): puts the four courses still on the expired "75% off through Sept 7" Whop price at
// 40% off list, the same offer as AI Engineering (scripts/_update-ai-engineering-price.mjs), and re-prices both
// bundles to 15% off the new live prices. Keep the numbers in sync with src/app/lab/courses-data.ts and src/lib/bundles.ts.
//
// Usage: node --env-file=.env scripts/_set-launch-40-off.mjs

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
if (!apiKey) {
  console.error("Missing WHOP_API_KEY. Run with: node --env-file=.env scripts/_set-launch-40-off.mjs");
  process.exit(1);
}
const client = new Whop({ apiKey });

const COURSES = [
  { name: "Data Science & Analysis", id: "plan_ysRjmrPzOn9j1", list: 120 },
  { name: "AI Automation", id: "plan_ED9yF9ehN2RIa", list: 149 },
  { name: "AI-Assisted Software Engineering", id: "plan_ximKlnIKYO7Bx", list: 99 },
  { name: "Mathematics for Machine Learning", id: "plan_3kAXjmfXopjpa", list: 85 },
];
const round = (n) => Math.round(n * 100) / 100;

const BUNDLES = [
  { name: "AI Engineering + AI Automation", id: "plan_NFGFagPrJyNM5", price: round((72 + round(149 * 0.6)) * 0.85) },
  { name: "AI-Assisted SWE + AI Engineering", id: "plan_GnqESzu68VSrz", price: round((72 + round(99 * 0.6)) * 0.85) },
];

for (const c of COURSES) {
  const before = await client.plans.retrieve(c.id);
  const after = await client.plans.update(c.id, {
    title: "Launch Access, 40% Off", // Whop caps plan titles at 30 characters
    description: `40% off for a limited time. Full course access, lifetime updates. Regular price $${c.list}.`,
    initial_price: round(c.list * 0.6),
  });
  console.log(`${c.name}: ${before.formatted_price} -> ${after.formatted_price}`);
}
for (const b of BUNDLES) {
  const after = await client.plans.update(b.id, { initial_price: b.price });
  console.log(`Bundle ${b.name}: ${after.formatted_price}`);
}
