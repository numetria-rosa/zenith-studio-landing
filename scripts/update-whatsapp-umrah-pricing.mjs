// One-off: moves the WhatsApp Umrah Starter plan to £49/month and archives the old Founding plan on Whop.
// Dry run by default (prints what it would change); pass --apply to make the change.
//
// Usage:
//   node --env-file=.env scripts/update-whatsapp-umrah-pricing.mjs
//   node --env-file=.env scripts/update-whatsapp-umrah-pricing.mjs --apply
//
// API shape checked against @whop/sdk's types (resources/plans.d.ts: PlanUpdateParams has renewal_price and
// visibility; Shared.Visibility is 'visible' | 'hidden' | 'archived' | 'quick_link').

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
if (!apiKey) {
  console.error("Missing WHOP_API_KEY. Run with: node --env-file=.env scripts/update-whatsapp-umrah-pricing.mjs");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const client = new Whop({ apiKey });

const STARTER = { id: "plan_e2E6hZwmNsuTR", price: 49 };
const FOUNDING = { id: "plan_G6YskaJaQcoJD" };

const starter = await client.plans.retrieve(STARTER.id);
const founding = await client.plans.retrieve(FOUNDING.id);
console.log(`Starter:  renewal_price ${starter.renewal_price} ${starter.currency} -> ${STARTER.price}`);
console.log(`Founding: visibility ${founding.visibility} -> archived`);

if (!apply) {
  console.log("\nDry run. Nothing changed. Re-run with --apply to make these changes.");
  process.exit(0);
}

const s = await client.plans.update(STARTER.id, { renewal_price: STARTER.price });
console.log(`\nStarter is now ${s.renewal_price} ${s.currency}.`);
const f = await client.plans.update(FOUNDING.id, { visibility: "archived" });
console.log(`Founding plan visibility is now ${f.visibility}.`);
