// Local-only test: a setup-plan purchase followed by a monthly-plan purchase
// for the same user+service, then a membership.deactivated for the monthly
// membership — confirms one ServiceRequest, status untouched by billing
// events, monthlyStatus tracked independently.
import { Webhook } from "standardwebhooks";
import { randomUUID } from "node:crypto";

const WEBHOOK_URL = "http://localhost:3000/api/webhooks/whop";
const SECRET_B64 = process.env.TEST_WHOP_WEBHOOK_SECRET_B64;
const SETUP_PLAN_ID = process.env.TEST_SETUP_PLAN_ID || "plan_test_inbox_setup";
const MONTHLY_PLAN_ID = process.env.TEST_MONTHLY_PLAN_ID || "plan_test_inbox_monthly";
const EMAIL = "webhook-service-test@example.com";

function buildPayload(planId, overrides = {}) {
  const id = "msg_" + randomUUID().replace(/-/g, "");
  return {
    id,
    api_version: "v1",
    type: "payment.succeeded",
    timestamp: new Date().toISOString(),
    company_id: "biz_test",
    data: {
      id: "pay_" + randomUUID().replace(/-/g, ""),
      status: "succeeded",
      plan: { id: planId },
      product: { id: "prod_test_unrelated" }, // deliberately not a course product
      user: { id: "user_svc_test", email: EMAIL, name: "Webhook Service Test" },
      membership: { id: "mem_" + randomUUID().slice(0, 8) },
      ...overrides,
    },
  };
}

async function postPayment(payload) {
  const wh = new Webhook(SECRET_B64);
  const body = JSON.stringify(payload);
  const ts = new Date();
  const sig = wh.sign(payload.id, ts, body);
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": payload.id,
      "webhook-timestamp": String(Math.floor(ts.getTime() / 1000)),
      "webhook-signature": sig,
    },
    body,
  });
  return { status: res.status, text: await res.text() };
}

async function postDeactivation(membershipId) {
  const wh = new Webhook(SECRET_B64);
  const payload = {
    id: "msg_" + randomUUID().replace(/-/g, ""),
    api_version: "v1",
    type: "membership.deactivated",
    timestamp: new Date().toISOString(),
    company_id: "biz_test",
    data: { id: membershipId, status: "inactive" },
  };
  const body = JSON.stringify(payload);
  const ts = new Date();
  const sig = wh.sign(payload.id, ts, body);
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": payload.id,
      "webhook-timestamp": String(Math.floor(ts.getTime() / 1000)),
      "webhook-signature": sig,
    },
    body,
  });
  return { status: res.status, text: await res.text() };
}

async function main() {
  if (!SECRET_B64) {
    console.log("SKIPPED: set TEST_WHOP_WEBHOOK_SECRET_B64.");
    process.exit(0);
  }

  console.log("--- 1. Setup plan purchase ---");
  console.log(await postPayment(buildPayload(SETUP_PLAN_ID)));

  console.log("--- 2. Monthly plan purchase, same user, same service ---");
  const monthlyPayload = buildPayload(MONTHLY_PLAN_ID);
  console.log(await postPayment(monthlyPayload));

  console.log("--- 3. Monthly membership deactivated ---");
  console.log(await postDeactivation(monthlyPayload.data.membership.id));
}

main();
