// One-off test: sends a correctly-signed fake payment.succeeded webhook to the
// local dev server, exactly the way Whop would, to verify the whole pipeline
// (signature verification -> event routing -> entitlement/service-request
// write) works end to end WITHOUT needing a real purchase.
//
// Uses the same Webhook class + key transformation as src/lib/whop.ts
// (btoa(WHOP_WEBHOOK_SECRET)) so the signature this script produces verifies
// exactly the way a real Whop-sent signature would.
//
// Usage: node --env-file=.env scripts/test-whop-webhook.mjs [target]
//   target: "setup" (default), "monthly", or "deactivate"

import { Webhook } from "standardwebhooks";
import { randomUUID } from "node:crypto";

const secret = process.env.WHOP_WEBHOOK_SECRET;
if (!secret) {
  console.error("Missing WHOP_WEBHOOK_SECRET. Run with: node --env-file=.env scripts/test-whop-webhook.mjs");
  process.exit(1);
}

const target = process.argv[2] ?? "setup";
const ENDPOINT = "http://localhost:3000/api/webhooks/whop";

const TEST_USER = { id: "user_test123", email: "webhook-test@example.com", name: "Webhook Test" };

function paymentEvent({ productId, planId, membershipId }) {
  return {
    id: `evt_${randomUUID()}`,
    api_version: "v1",
    type: "payment.succeeded",
    timestamp: new Date().toISOString(),
    data: {
      id: `pay_${randomUUID()}`,
      product: { id: productId },
      plan: { id: planId },
      membership: { id: membershipId },
      user: TEST_USER,
    },
  };
}

function deactivateEvent({ membershipId }) {
  return {
    id: `evt_${randomUUID()}`,
    api_version: "v1",
    type: "membership.deactivated",
    timestamp: new Date().toISOString(),
    data: { id: membershipId, status: "deactivated" },
  };
}

const SCENARIOS = {
  // AI Inbox Manager — setup (one_time) plan
  setup: paymentEvent({
    productId: "prod_tfvB7Ab6eE4Qr",
    planId: "plan_AUhS9tvz8KrJC",
    membershipId: "mem_test_setup",
  }),
  // AI Inbox Manager — monthly (renewal) plan
  monthly: paymentEvent({
    productId: "prod_tfvB7Ab6eE4Qr",
    planId: "plan_Qvl24MqIyHNfQ",
    membershipId: "mem_test_monthly",
  }),
  // Cancels the monthly membership created by the "monthly" scenario above
  deactivate: deactivateEvent({ membershipId: "mem_test_monthly" }),
};

const event = SCENARIOS[target];
if (!event) {
  console.error(`Unknown target "${target}". Use: setup | monthly | deactivate`);
  process.exit(1);
}

const payload = JSON.stringify(event);
const msgId = `msg_${randomUUID()}`;
const timestamp = new Date();

const wh = new Webhook(btoa(secret));
const signature = wh.sign(msgId, timestamp, payload);

console.log(`Sending ${event.type} (scenario: ${target}) to ${ENDPOINT}`);
console.log(payload);

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "webhook-id": msgId,
    "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "webhook-signature": signature,
  },
  body: payload,
});

console.log(`\nResponse: ${res.status} ${res.statusText}`);
console.log(await res.text());
