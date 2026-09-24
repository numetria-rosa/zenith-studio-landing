// One-off: adds a 3-day free trial to the Law Firm AI Team renewal plan.
// Usage: node --env-file=.env scripts/add-lawfirm-trial.mjs
import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
if (!apiKey) {
  console.error("Missing WHOP_API_KEY. Run with: node --env-file=.env scripts/add-lawfirm-trial.mjs");
  process.exit(1);
}

const client = new Whop({ apiKey });
const PLAN_ID = "plan_kTlL5gBlJTsqy"; // AI Team — Law Firms — Monthly

async function main() {
  const before = await client.plans.retrieve(PLAN_ID);
  console.log(`Before: trial_period_days=${before.trial_period_days} renewal_price=${before.renewal_price}`);

  const after = await client.plans.update(PLAN_ID, { trial_period_days: 3 });
  console.log(`After:  trial_period_days=${after.trial_period_days} renewal_price=${after.renewal_price}`);
  console.log(`purchase_url: ${after.purchase_url}`);
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
