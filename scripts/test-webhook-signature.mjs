// Pure signature-verification test for the Whop webhook handler — no DB
// involved. Proves, with the REAL WHOP_WEBHOOK_SECRET, that:
//   1. A correctly-signed payload is accepted and parsed by unwrap().
//   2. A tampered payload (signed, then body mutated after signing) is
//      rejected.
//   3. A payload with no signature headers at all is rejected.
// This exercises the exact same getWhopClient().webhooks.unwrap() call
// src/app/api/webhooks/whop/route.ts makes, just called directly rather
// than through an HTTP request, since there's no DB available in this
// environment to let the route's transaction commit.
//
// Usage: node --env-file=.env scripts/test-webhook-signature.mjs

import Whop from "@whop/sdk";

const apiKey = process.env.WHOP_API_KEY;
const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
if (!apiKey || !webhookSecret) {
  console.error("Missing WHOP_API_KEY or WHOP_WEBHOOK_SECRET.");
  process.exit(1);
}

const client = new Whop({ apiKey, webhookKey: btoa(webhookSecret) });

// Realistic payment.succeeded payload shaped like src/app/api/webhooks/whop/route.ts expects.
const testEvent = {
  id: "evt_test_" + Date.now(),
  type: "payment.succeeded",
  data: {
    id: "pay_test_" + Date.now(),
    product: { id: "prod_9eVAjfMpwcaX8" },
    plan: { id: "plan_ysRjmrPzOn9j1" },
    membership: { id: "mem_test_123" },
    user: { id: "user_test_123", email: "launch-test@example.com", name: "Launch Test" },
  },
};
const body = JSON.stringify(testEvent);

// Sign it exactly the way Whop itself would (same standardwebhooks library
// the SDK uses internally for verify()).
import { Webhook } from "standardwebhooks";
const signer = new Webhook(btoa(webhookSecret));
const msgId = "msg_test_" + Date.now();
const timestamp = new Date();
const signature = signer.sign(msgId, timestamp, body);

const validHeaders = {
  "webhook-id": msgId,
  "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
  "webhook-signature": signature,
};

console.log("--- Test 1: correctly-signed payload ---");
try {
  const unwrapped = client.webhooks.unwrap(body, { headers: validHeaders });
  console.log("ACCEPTED. Parsed event type:", unwrapped.type, "| product:", unwrapped.data.product.id);
} catch (e) {
  console.log("REJECTED (unexpected):", e.message);
}

console.log("\n--- Test 2: tampered payload (body changed after signing) ---");
const tamperedBody = body.replace('"prod_9eVAjfMpwcaX8"', '"prod_SOMEONE_ELSES_COURSE"');
try {
  client.webhooks.unwrap(tamperedBody, { headers: validHeaders });
  console.log("ACCEPTED (BUG — should have been rejected!)");
} catch (e) {
  console.log("REJECTED as expected:", e.message);
}

console.log("\n--- Test 3: no signature headers at all ---");
try {
  client.webhooks.unwrap(body, { headers: {} });
  console.log("ACCEPTED (BUG — should have been rejected!)");
} catch (e) {
  console.log("REJECTED as expected:", e.message);
}

console.log("\n--- Test 4: wrong secret entirely ---");
const wrongClient = new Whop({ apiKey, webhookKey: btoa("not-the-real-secret-at-all") });
try {
  wrongClient.webhooks.unwrap(body, { headers: validHeaders });
  console.log("ACCEPTED (BUG — should have been rejected!)");
} catch (e) {
  console.log("REJECTED as expected:", e.message);
}
