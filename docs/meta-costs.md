# Meta / WhatsApp costs — verified facts, not assumptions

Verified 2026-09-28 against Meta's own developer documentation. Re-check
before relying on any number here after a few months — Meta has changed
this pricing model multiple times.

## Who pays Meta

**The agency, not us.** Each agency adds its own payment method in Meta
Business Suite, and Meta bills that agency's WhatsApp Business Account
directly for message delivery. Our software price is pure margin on top;
we carry no Meta cost risk. This must be stated plainly during onboarding
and on the pricing page, not buried in a FAQ.

## The 24-hour customer service window

When a customer messages a business, that opens a 24-hour window in which
the business can send free-form ("service") messages at no per-message
restriction on content. Outside that window, only a pre-approved template
message can be sent.

## The October 2026 pricing change (this is imminent, not hypothetical)

Historically, non-template messages sent inside an open 24h window were
free. **That changes 1 October 2026:**

- Service messages sent inside the 24h window become billable, at the
  same per-market rate as utility and authentication messages. No volume
  tiers for service messages.
- Agencies without a payment method on file by 30 September 2026 simply
  stop having service messages delivered once billing starts on 1
  October.
- The 72-hour free entry-point window (Click-to-WhatsApp ads, Facebook
  call-to-action buttons) is **unchanged** — still free for message
  delivery regardless of the above.

Sources:
- https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages

## What this means for the product

- **Onboarding must say this explicitly**, not softly: "From 1 October
  2026, WhatsApp charges for messages your team or AI sends back to
  customers, billed to your own Meta account. Add a payment method in
  Meta Business Suite before going live." Signing up after this date with
  no framing at all would be misleading.
- **The usage meter tracks two separate things**, per `WaUsageCounter`:
  - `aiReplies` — our plan cap, one increment per AI-sent free-form reply.
  - `templateMessages` — informational, not capped by us, since Meta
    bills these to the agency regardless of our plan.
  A service-message send should also be reflected as `metaBillable: true`
  on the `WaMessage` row so an agency can eventually see "this many of
  your replies cost you money at Meta" without us guessing at Meta's
  actual invoice.
- Rate varies by the recipient's country/market — we do not hardcode a
  single GBP figure. If a "roughly £X per message" estimate is shown
  anywhere in the product, it must be labelled as an estimate and sourced
  from Meta's current rate card, not invented.

## The AI provider policy (separate from pricing, also verified 2026-09-28)

Since 15 January 2026 (immediately for WhatsApp Business accounts created
after 15 October 2025), Meta bans general-purpose AI assistants / open-
ended chat on the WhatsApp Business Platform. Structured, business-scoped
bots — customer service, bookings, order tracking, notifications — remain
explicitly permitted. Our agent must stay firmly in the permitted
category: see CLAUDE.md §3.1's scope guard. This is a platform compliance
requirement, not a product-design preference — violating it risks the
WhatsApp Business Account itself being shut down.

Source: confirmed via multiple independent WhatsApp BSP/compliance
write-ups (Turn.io, Digital Watch Observatory) referencing Meta's updated
Business Solution terms; re-verify against Meta's own terms page directly
before relying on this for a compliance decision, since none of those are
Meta's own primary source page.
