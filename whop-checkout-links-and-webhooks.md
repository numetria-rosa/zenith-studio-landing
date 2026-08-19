# Whop Checkout Links & Webhooks — Developer Reference

This is a working reference for integrating **checkout links** (and their sibling, **embedded checkout**) with **Whop**, and for reliably handling the **webhooks** that fire when a checkout completes. Compiled from `docs.whop.com` (developer guides + API reference) as of August 2026.

---

## 1. Two ways to accept payments on Whop

| | Checkout link | Embedded checkout |
|---|---|---|
| Effort | Low | Medium |
| Customization | Limited | Full control |
| Best for | Sharing a URL, quick setup | Custom UX, dynamic pricing on your own site |
| Server code required | No (dashboard) / Yes (API) | Yes |

This doc focuses on **checkout links**, then covers **webhooks** in depth since that's how your server actually finds out a purchase happened.

---

## 2. Checkout links

A checkout link is a URL (`purchase_url`) that sends a buyer straight to a Whop-hosted payment page for one specific **plan**, instead of routing them through a Discover/marketplace page. Whop auto-selects from 100+ payment methods across 195 countries based on the buyer's location.

Checkout links are attached to a **plan**, not directly to a product — a plan is the pricing configuration (one-time price, recurring price, trial, stock limits, etc.) that belongs to a product (`access_pass`). Creating a plan is what gives you the shareable `purchase_url`.

### 2.1 Creating a checkout link — Dashboard

1. Go to **Dashboard → Checkout links**
2. Click **+ Create checkout link**
3. Select a product and configure pricing (free / one-time / recurring)
4. Click **Create checkout link**

The generated link can be shared directly or embedded on your site. Only Sales Managers, Admins, and Owners can create/edit checkout links (all team roles can view them).

### 2.2 Creating a checkout link — API

A checkout link is created by creating a **plan**. The response includes `purchase_url`.

```typescript
import Whop from "@whop/sdk";

const client = new Whop({
  apiKey: "Company API Key",
});

// company_id: Dashboard > Settings
// access_pass_id: Dashboard > Products
const plan = await client.plans.create({
  company_id: "biz_xxxxxxxxxxxxx",
  access_pass_id: "pass_xxxxxxxxxxxxx",
  initial_price: 10.0,
  plan_type: "one_time",
});

console.log(plan.purchase_url); // -> share this link
```

```python
from whop_sdk import Whop

client = Whop(api_key="Company API Key")

plan = client.plans.create(
    company_id="biz_xxxxxxxxxxxxx",
    access_pass_id="pass_xxxxxxxxxxxxx",
    initial_price=10.0,
    plan_type="one_time",
)

print(plan.purchase_url)
```

Redirect (or link) customers to `purchase_url` to complete payment on a Whop-hosted page.

**Endpoint:** `POST https://api.whop.com/api/v1/plans`
**Required permission:** `plan:create` (plus `access_pass:create`/`access_pass:update` if you're also creating the product in the same flow)

### 2.3 Key plan fields (what defines a checkout link)

| Field | Notes |
|---|---|
| `company_id` | Your company ID (`biz_...`), found in Dashboard > Settings |
| `access_pass_id` / `product_id` | The product this plan sells |
| `plan_type` | `"one_time"` or `"renewal"` (subscription) |
| `initial_price` | The amount charged at purchase |
| `renewal_price` | Recurring charge amount (renewal plans) |
| `billing_period` | Interval length for renewal plans |
| `expiration_days` | For fixed-length access plans |
| `trial_period_days` | Free trial before first charge |
| `title` / `description` | Shown to the customer on the product page |
| `visibility` | `"visible"` or hidden from public/business view |
| `stock` / `unlimited_stock` | Limits units available for purchase |
| `release_method` | How the business sells this plan (e.g. `"buy_now"`) |
| `currency` | Currency identifier |
| `purchase_url` | **The checkout link itself** — returned by the API, not settable |

A plan can be retrieved later with `GET /api/v1/plans/{id}` or listed with `GET /api/v1/plans`, both of which also return `purchase_url`.

### 2.4 Embedded checkout (alternative to a bare link)

If you want the payment UI on your own site instead of redirecting to Whop, create a **checkout configuration** (a session tied to an inline plan) and render it with a component or script tag.

```typescript
const checkoutConfig = await client.checkoutConfigurations.create({
  company_id: "biz_xxxxxxxxxxxxx",
  plan: {
    initial_price: 10.0,
    plan_type: "one_time",
  },
  metadata: {
    order_id: "order_12345", // flows through to webhooks later
  },
});

console.log(checkoutConfig.id);        // ch_xxxxxxxxxxxxx (session id)
console.log(checkoutConfig.plan?.id);  // plan_xxxxxxxxxxxxx
```

React:

```tsx
import { WhopCheckoutEmbed } from "@whop/checkout/react";

export function Checkout({ sessionId }: { sessionId: string }) {
  return (
    <WhopCheckoutEmbed
      sessionId={sessionId}
      returnUrl="https://yoursite.com/checkout/complete"
      onComplete={(paymentId) => console.log("Payment complete:", paymentId)}
    />
  );
}
```

Plain HTML:

```html
<script async defer src="https://js.whop.com/static/checkout/loader.js"></script>

<div
  data-whop-checkout-plan-id="plan_XXXXXXXXX"
  data-whop-checkout-session="ch_XXXXXXXXX"
  data-whop-checkout-return-url="https://yoursite.com/checkout/complete"
></div>
```

You must supply `returnUrl`/`data-whop-checkout-return-url` for redirects from external payment providers (e.g. bank redirects). After redirect, read the `status` query param on your return URL:
- `success` → payment succeeded, render a success page from the receipt data
- `error` → payment failed or was canceled, remount the checkout so the customer can retry

Customization options (`theme`, `hidePrice`, `themeOptions.accentColor`, etc.) are on the embedded-checkout reference page — not needed for a bare checkout link.

**The critical point for both flows:** the checkout link/embed only gets money moving. Your server finds out what happened — and does the actual fulfillment (granting access, updating your DB, sending a receipt) — via **webhooks**.

---

## 3. Webhooks

### 3.1 What a webhook is

A webhook is a `POST` request Whop sends to a URL you register, fired when something happens on Whop (a payment succeeds, a membership activates, a dispute opens, etc.). You subscribe to specific event types; Whop delivers a signed JSON payload for each occurrence.

Whop webhooks follow the **Standard Webhooks** spec. The official SDKs verify the signature and parse the event in a single call.

**Anatomy of a delivery:**

```http
POST /webhooks/whop HTTP/1.1
content-type: application/json
webhook-id: msg_bQPHmO2eBnHYtWWuxAN9K3Xd
webhook-timestamp: 1786381404
webhook-signature: v1,K5oZfzN95Z9UVu1EsfQmfVNQhnkZ2pCPljWFR61G0P0=
```

```json
{
  "id": "msg_bQPHmO2eBnHYtWWuxAN9K3Xd",
  "type": "payment.succeeded",
  "api_version": "v1",
  "api_version_date": "2025-01-01",
  "timestamp": "2026-08-10T17:03:24.291Z",
  "company_id": "biz_XXXXXXXX",
  "data": {
    "id": "pay_XXXXXXXX",
    "...": "the full payment object"
  }
}
```

### 3.2 Creating a webhook

**Via API:**

```bash
curl -X POST "https://api.whop.com/api/v1/webhooks" \
  -H "Authorization: Bearer $WHOP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/webhooks/whop",
    "events": ["payment.succeeded"]
  }'
```

Required permission: `developer:manage_webhook`.

The response includes `webhook_secret` (`whsec_...`). **This is shown only once** — store it immediately (e.g. `WHOP_WEBHOOK_SECRET`).

**Via dashboard:**

1. Open **Developer tab → Create webhook**
2. Enter your endpoint URL, select events
3. Copy the signing secret from the **Secret** column, store as `WHOP_WEBHOOK_SECRET`

**Create-webhook request fields:**

| Field | Type | Notes |
|---|---|---|
| `url` | string, required | Destination endpoint |
| `events` | array of event strings | What to subscribe to |
| `api_version` | `"v1"` \| `"v2"` \| `"v5"` | Use `v1` for anything new |
| `api_version_date` | string \| null | Pins the payload shape of `data` (see §3.6). Only applies to `v1` |
| `resource_id` | string \| null | Company or app to attach the webhook to (defaults to current company) |
| `child_resource_events` | boolean \| null | If set on a company webhook, sends events **only** from that company's sub-merchants (child companies) |
| `enabled` | boolean \| null | Active/inactive |

The URL **must be publicly reachable** — Whop rejects `localhost` and private-network addresses. For local dev, tunnel with [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) and register the tunnel URL.

### 3.3 Verifying and handling events

Always verify the signature before trusting a payload — don't act on an unverified `POST` body.

**Set up the SDK client with your secret:**

```typescript
import { Whop } from "@whop/sdk";

export const whopsdk = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  webhookKey: btoa(process.env.WHOP_WEBHOOK_SECRET || ""),
});
```

```python
import base64, os
from whop_sdk import Whop

whopsdk = Whop(
    api_key=os.environ["WHOP_API_KEY"],
    webhook_key=base64.b64encode(os.environ["WHOP_WEBHOOK_SECRET"].encode()).decode(),
)
```

**Handle events (verify + parse in one call):**

```typescript
// Next.js
import { waitUntil } from "@vercel/functions";
import type { Payment } from "@whop/sdk/resources.js";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(request: NextRequest): Promise<Response> {
  // Pass the RAW body — parsing it first breaks signature verification.
  const requestBodyText = await request.text();
  const headers = Object.fromEntries(request.headers);
  const event = whopsdk.webhooks.unwrap(requestBodyText, { headers });

  if (event.type === "payment.succeeded") {
    waitUntil(handlePaymentSucceeded(event.data));
  }

  // Respond within 5 seconds or Whop will retry.
  return new Response("OK", { status: 200 });
}

async function handlePaymentSucceeded(payment: Payment) {
  console.log("[PAYMENT SUCCEEDED]", payment);
}
```

```python
# FastAPI
from fastapi import BackgroundTasks, FastAPI, Request, Response
from lib.whop_sdk import whopsdk

app = FastAPI()

@app.post("/api/webhooks/whop")
async def whop_webhook(request: Request, background: BackgroundTasks):
    body = (await request.body()).decode()
    event = whopsdk.webhooks.unwrap(body, headers=dict(request.headers))

    if event.type == "payment.succeeded":
        background.add_task(handle_payment_succeeded, event.data)

    return Response(status_code=200)
```

If the signature is invalid, `unwrap()` throws — your handler simply never receives a bad payload.

**Do minimal work before responding**: verify, hand off to a background task/queue, return `200` immediately. Use `waitUntil` (Vercel), your framework's background-task mechanism, or a job queue — don't do slow fulfillment work inline in the request handler.

### 3.4 Verifying signatures manually (no SDK)

Whop signs the string:

```
{webhook-id}.{webhook-timestamp}.{raw request body}
```

using **HMAC-SHA256** with your `ws_...` / `whsec_...` secret. The result is base64-encoded and sent as `webhook-signature: v1,<signature>`.

To verify:
1. Compute HMAC-SHA256 over the raw body using the exact string above
2. Base64-encode the result
3. Compare to the header value using a **constant-time comparison**
4. **Reject** if `webhook-timestamp` is more than 5 minutes from current time (prevents replay attacks — SDK verifiers do this automatically)

### 3.5 Testing your endpoint

- **Send a test event:** dashboard → webhook menu → select a test event, or `POST /api/v1/webhooks/{id}/test`. Whop sends a sample payload and shows you the response status/body your server returned.
- **Inspect deliveries:** Whop retains each delivery for **30 days** (request, response code, response body, timing) — viewable in the dashboard or via `GET /api/v1/webhooks/{id}/deliveries`.

### 3.6 Versioning

Two independent version knobs:

- **`api_version`** — the envelope format. Use `"v1"`. Legacy `v2`/`v5` exist for old integrations and don't use Standard Webhooks signatures — don't use them for new work.
- **`api_version_date`** — pins the *shape of `data`* to a specific dated API version, the same way the `Api-Version-Date` header pins a REST read. Set it at webhook-creation time so payload shape doesn't drift when the API changes. Unpinned webhooks keep their initial payload shape, except for resources that only exist on the current API (cards, plans, transfers, swaps, deposits, exports), which always get the latest shape.

### 3.7 Delivery guarantees & retry behavior — read this before you build fulfillment logic

- **Respond `2xx` within 5 seconds.** Anything else (timeout, error status, redirect — Whop does not follow redirects) counts as a failed attempt.
- **At-least-once delivery.** The same event can arrive more than once. **Make your handler idempotent** — store the `webhook-id` and skip duplicates. Retries of the same delivery reuse the same `webhook-id`.
- **Retry schedule:** on failure, Whop retries **12 times over ~3 days** (~71 hours total) with increasing delays: 30s, 2m, 8m, 30m, 1h, 3h, 6h, then every 12h.
- **No ordering guarantee.** A newer event can arrive before an older one. Process events independently; if sequence matters, re-read current state from the API rather than trusting arrival order.
- **Auto-disable on sustained failure:** if all deliveries fail for 24h, Whop emails a warning. If failures continue for 72h with 10+ failed deliveries, Whop **disables the webhook** and sends a second email. Re-enable via dashboard or `PATCH /api/v1/webhooks/{id}` with `{"enabled": true}` — this resets the failure history. **Events that occurred while disabled are not resent**; you must read the API to backfill.

### 3.8 Events reference — checkout/payment-relevant

| Event | Fires when |
|---|---|
| `payment.created` | A payment attempt is initiated |
| `payment.pending` | Payment is processing (e.g. bank redirect in progress) |
| `payment.succeeded` | Payment collected successfully — **use this to fulfill the order** |
| `payment.failed` | Payment attempt failed |
| `membership.activated` | Access granted — membership becomes valid (checkout completed or membership created) |
| `membership.deactivated` | Membership goes invalid (failed payment, cancellation, or the user leaving) |
| `membership.trial_ending_soon` | A free trial ends within ~72 hours |
| `membership.cancel_at_period_end_changed` | Auto-renew toggle changed |
| `entry.created` / `entry.approved` / `entry.denied` / `entry.deleted` | Waitlist entry events |
| `refund.created` / `refund.updated` | A payment is refunded |
| `dispute.created` / `dispute.updated` | A buyer opens/updates a chargeback |
| `setup_intent.succeeded` / `.requires_action` / `.canceled` | Payment method saved for later off-session charges |
| `invoice.created` / `.paid` / `.past_due` / `.voided` / `.marked_uncollectible` | Invoice lifecycle |

(Full event catalog also covers payouts, cards, chat, courses, disputes, verifications, etc. — see `/api-reference/webhooks/webhook` for the complete `WebhookEvent` enum.)

**Common pairing:** subscribe to `payment.succeeded` (fulfillment) + `payment.failed` (notify the customer) + `membership.activated` (grant access) together.

### 3.9 The `payment.succeeded` payload, in detail

Full example:

```json
{
  "id": "msg_xxxxxxxxxxxxx",
  "api_version": "v1",
  "type": "payment.succeeded",
  "timestamp": "2026-05-12T18:42:11.041Z",
  "company_id": "biz_xxxxxxxxxxxxx",
  "data": {
    "id": "pay_xxxxxxxxxxxxx",
    "status": "succeeded",
    "amount_after_fees": 9.71,
    "currency": "usd",
    "paid_at": "2026-05-12T18:42:10Z",
    "payment_method_type": "card",
    "card_brand": "visa",
    "card_last4": "4242",
    "member": { "id": "mem_xxxxxxxxxxxxx" },
    "metadata": {
      "order_id": "order_12345"
    }
  }
}
```

A more complete `data.payment` object (from the API reference) also includes: `substatus`, `refundable`, `retryable`, `voidable`, `created_at`, `last_payment_attempt`, `next_payment_attempt`, `dispute_alerted_at`, `refunded_at`, `plan`, `product` (`id`, `title`, `route`), `user` (`id`, `name`, `username`, `email`), `membership` (`id`, `status`), `payment_method`, promo-code/discount fields (`promo_code`, discount amount/type), and tax-inclusivity fields.

**Key mechanism: `metadata` round-trips.** Anything you set as `metadata` when creating the plan or the checkout configuration (e.g. `order_id`) is echoed back in `data.metadata` on the webhook — that's your hook for mapping the payment back to your own order record.

**Required permissions to receive this webhook's full payload:**
`payment:basic:read`, `plan:basic:read`, `access_pass:basic:read`, `member:email:read`, `member:basic:read`, `member:phone:read`, `promo_code:basic:read`, `payment:dispute:read`, `payment:resolution_center_case:read`, `webhook_receive:payments`

### 3.10 End-to-end test in sandbox

1. Switch your SDK/checkout to the **sandbox** environment and run a checkout with a test card (sandbox guide covers URL changes + test cards for every outcome: succeeded, failed, requires-action).
2. Confirm your webhook handler receives `payment.succeeded` shaped as above, and that `data.metadata.order_id` matches what you set.
3. Confirm the charge appears in the sandbox dashboard: `https://sandbox.whop.com/dashboard/<your_company_id>/payments`.
4. Once both the dashboard row and the webhook line up, switch your SDK and webhook URL to production.

---

## 4. Minimal end-to-end flow (checkout link + webhook fulfillment)

1. **Create a plan** via API (or dashboard) → get `purchase_url`. Attach `metadata` if using a checkout configuration, so you have an order reference to reconcile against.
2. **Share `purchase_url`** with the customer (email, page redirect, button, etc.).
3. **Register a webhook** for `payment.succeeded` (and typically `payment.failed`, `membership.activated`) pointing at a public HTTPS endpoint. Store `webhook_secret`.
4. **On delivery:** verify the signature using the raw body (`unwrap()` or manual HMAC-SHA256 check), respond `200` fast, do fulfillment work (grant access, update DB, send receipt) in the background.
5. **Be idempotent** — dedupe on `webhook-id` since delivery is at-least-once.
6. **Handle failures gracefully** — expect retries for ~3 days on your own downtime; re-enable a disabled webhook if you see the warning emails, and backfill via the API for anything missed while disabled.

---

## 5. Reference links

- Accept payments guide: `https://docs.whop.com/developer/guides/accept-payments`
- Webhooks guide: `https://docs.whop.com/developer/guides/webhooks`
- Webhooks API reference (create/retrieve/test/deliveries): `https://docs.whop.com/api-reference/webhooks/webhook`
- Create webhook: `https://docs.whop.com/api-reference/webhooks/create-webhook`
- Create plan: `https://docs.whop.com/api-reference/plans/create-plan`
- Create checkout configuration: `https://docs.whop.com/api-reference/checkout-configurations/create-checkout-configuration`
- `payment.succeeded` payload reference: `https://docs.whop.com/api-reference/payments/payment-succeeded`
- Standard Webhooks spec: `https://github.com/standard-webhooks/standard-webhooks`
- Full docs index: `https://docs.whop.com/llms.txt`
