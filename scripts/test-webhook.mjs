// Local-only test: constructs a real Standard-Webhooks-signed payment.succeeded
// event using a throwaway secret, POSTs it to the local dev webhook endpoint,
// and checks: valid signature accepted, tampered signature rejected, duplicate
// delivery is idempotent, unknown product is safely ignored (no entitlement).
import { Webhook } from "standardwebhooks";
import { randomUUID } from "node:crypto";

const WEBHOOK_URL = "http://localhost:3000/api/webhooks/whop";
const SECRET_B64 = process.env.TEST_WHOP_WEBHOOK_SECRET_B64; // set to match server's WHOP_WEBHOOK_SECRET (base64)
const PRODUCT_ID = process.env.TEST_PRODUCT_ID || "prod_test_ai_engineering";

function buildPayload(overrides = {}) {
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
      product: { id: PRODUCT_ID, title: "AI Engineering" },
      user: { id: "user_test_" + randomUUID().slice(0, 8), email: "webhook-test@example.com", name: "Webhook Test" },
      membership: { id: "mem_" + randomUUID().slice(0, 8) },
      ...overrides,
    },
  };
}

async function post(payload, { badSignature = false } = {}) {
  const wh = new Webhook(SECRET_B64);
  const body = JSON.stringify(payload);
  const timestamp = new Date();
  const signature = badSignature ? "v1,tampered-signature-not-valid==" : wh.sign(payload.id, timestamp, body);
  const headers = {
    "content-type": "application/json",
    "webhook-id": payload.id,
    "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "webhook-signature": signature,
  };
  const res = await fetch(WEBHOOK_URL, { method: "POST", headers, body });
  return { status: res.status, text: await res.text() };
}

async function main() {
  if (!SECRET_B64) {
    console.log("SKIPPED: set TEST_WHOP_WEBHOOK_SECRET_B64 (base64 of the same value as WHOP_WEBHOOK_SECRET in .env) to run this.");
    process.exit(0);
  }

  const payload = buildPayload();

  console.log("--- 1. Valid signature, known product ---");
  console.log(await post(payload));

  console.log("--- 2. Duplicate delivery (same webhook-id) ---");
  console.log(await post(payload));

  console.log("--- 3. Tampered signature ---");
  const payload2 = buildPayload();
  console.log(await post(payload2, { badSignature: true }));

  console.log("--- 4. Unknown product ---");
  const payload3 = buildPayload();
  payload3.data.product.id = "prod_totally_unknown";
  console.log(await post(payload3));
}

main();
