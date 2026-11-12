# WhatsApp AI Agent for Umrah/Hajj Agencies — CLAUDE.md

Re-read this file at the start of every session touching the `whatsapp-umrah`
product. It is not the whole spec; it is the parts that are load-bearing:
the corrected market facts, the platform constraints that are easy to get
wrong, the hard rules the agent must never break, and the security baseline.
Full history and open decisions live in the planning conversation; the
architecture decisions below are settled.

## Stack (settled, do not re-litigate without asking)

This lives inside the `zenith-studio` repo. TypeScript throughout. **No
Python, no FastAPI, no Supabase, no Stripe.** Reuses this repo's existing
infrastructure:

- Next.js App Router for everything: marketing pages, dashboard, webhook,
  agent pipeline. No separate worker process/language.
- Postgres on Neon via Prisma, same database as the rest of the app.
  pgvector extension for KB embeddings, via `Unsupported("vector(n)")`
  columns and raw SQL (`$queryRaw`/`$executeRaw`) for embedding writes and
  cosine-similarity search — Prisma has no native vector type.
- Auth.js, same session system every other part of this app uses. One
  Zenith Studio account can be a WhatsApp Umrah agency owner and/or a
  regular service client.
- Billing: Whop. Whop is merchant of record for UK/EU VAT (confirmed via
  Whop's own tax docs — it registers, collects and remits VAT, and can
  show VAT-inclusive UK pricing). No Stripe anywhere in this product.
- Tenant isolation: **application-level scoping**, not database RLS —
  matches every other multi-tenant service in this codebase. Every query
  touching agency data is filtered by `agencyId`. The isolation test (an
  agency cannot read another agency's data) is a query-scoping test, not a
  Postgres policy test.
- Groq for bulk drafting (`GROQ_MODEL`, default `openai/gpt-oss-20b`).
  Claude for the one escalation step (`CLAUDE_MODEL`, default Claude Haiku
  4.5). Both are env-configurable. Verify current model ids and prices
  against `console.groq.com/docs/models` and `claude.com/pricing` before
  changing either default — do not guess.
- Product still lives under the Zenith Studio brand: listed as a normal
  service card on `/services` (public/services-catalog.html) and the
  landing page, linking out to its own marketing/demo pages at
  `/whatsapp-umrah` and `/demo/[country]/[serviceName]` (country is a
  dynamic segment: `uk`, plus `us`, `ca`, `au` and `za` generated from the UK page by
  `scripts/build-umrah-country-demos.mjs` with local currency; more countries are added
  without new routes).
- Dashboard UI reuses this repo's existing design system components
  (ui.module.css tokens, Icon, card/eyebrow patterns) rather than
  reinventing them, in the spirit of the "Your Dashboard" tour section of
  the halo prototype (`halo/demo_page_design_system/whatsapp-umrah-agent-
  uk.html`) — well-organized, everything the agency owner needs visible,
  not a literal port of that static HTML.

## 1. Market corrections (UK, not the original Saudi Arabia spec)

- Prices in GBP. Checkout via Whop (cards, Apple/Google Pay where Whop
  supports them). No SAR, no mada.
- Data protection is **UK GDPR**, not PDPL. PECR applies to marketing
  sends specifically (not to transactional/service replies inside an open
  WhatsApp conversation).
- Customer languages: English, Arabic, Turkish, Urdu (standard script —
  no Roman Urdu, Bengali, or Gujarati; the user narrowed this list
  2026-09-28) and French (added by the user 2026-11-13, for the French
  market; the French wording has not been reviewed by a native speaker). Detect and reply in whatever
  the customer used for *that message*, not a conversation-level
  setting.
- UK agencies are ATOL-protected. The agent may relay an agency's own ATOL
  number if it's in the knowledge base. It never claims protection itself
  and never states or implies ATOL coverage that isn't explicitly in the
  KB.

## 2. WhatsApp/Meta constraints (verified against Meta's current docs — do not guess)

- **24-hour customer service window.** Free-form (non-template) replies
  only inside 24h of the customer's last message. A template is required
  outside that window. Enforce in code: a send attempted outside the
  window without a template must fail loudly, not silently drop or
  auto-substitute.
- **Billing reality, verified 2026-09-28:** non-template ("service")
  messages inside the open window were free only until **1 October
  2026**. From that date, service messages bill at the same per-market
  rate as utility/authentication messages, no volume tiers. Agencies
  without a payment method on file by 30 Sep 2026 simply stop having
  service messages delivered. The 72h Click-to-WhatsApp free entry-point
  window is unchanged. This is Meta billing the *agency's own* WhatsApp
  Business Account directly — the agency adds its own payment method in
  Meta Business Suite. Our software price is pure margin; we carry no
  Meta cost risk. State this plainly in onboarding and on the pricing
  page. Usage meter must count Meta-billable messages (`messages.type` /
  template sends / service-message sends) separately from `ai_replies`.
  Source: developers.facebook.com/documentation/business-messaging/
  whatsapp/pricing and .../pricing/non-template-messages.
- **AI provider policy, verified 2026-09-28:** since 15 Jan 2026 (effective
  immediately for accounts created after 15 Oct 2025), Meta bans
  general-purpose AI assistants / open-ended chat on the WhatsApp Business
  Platform. Structured, business-scoped bots (customer service, bookings,
  order tracking, notifications) remain explicitly allowed. Our agent must
  stay in the allowed category: it only discusses the agency's own
  business (packages, dates, policies) and refuses open-ended general
  chat ("write me a poem", "what's the capital of France"). The scope
  guard (3.1 below) is what keeps the WhatsApp Business Account compliant,
  not a nice-to-have.
- **Onboarding path.** Meta Embedded Signup requires us to be an approved
  Tech Provider (business verification + app review). Default onboarding
  cap is 10 new business customers per rolling 7 days until Business
  Verification + App Review + Access Verification are all complete, which
  raises it to 200/7 days. Build a `WhatsAppProvider` interface with a
  `MetaCloudProvider` implementation and a `MockProvider` for tests. First
  agencies connect manually via the admin dashboard (paste WABA ID, phone
  number ID, token). Embedded Signup behind a feature flag. We ARE an approved
  Tech Provider now (confirmed by the owner, 2026-11-12) and Embedded Signup is on. Note: Embedded Signup v2/v3 deprecate 15 Oct 2026 — if
  built, it must be v4.
- **Webhook security.** Verify `X-Hub-Signature-256` on every inbound
  webhook. Dedupe by `wa_message_id`, idempotent handling. Respond 200
  fast, process async.
- **Free entry points.** Customers arriving via a Click-to-WhatsApp ad get
  a 72h free window. Record `entry_point` on the conversation.
- **`smb_message_echoes` webhook.** A separate subscribable field from
  `messages` - fires when a staff member sends a message from the
  agency's own WhatsApp Business app rather than through our API. Must
  be subscribed on the WABA alongside `messages` for auto-pause-on-human-
  reply to actually fire; confirmed shape at developers.facebook.com/
  documentation/business-messaging/whatsapp/webhooks/reference/
  smb_message_echoes.

## 3.1 Hard rules — in the system prompt AND enforced by a pre-send filter

The agent:

- Answers only from the agency's own knowledge base (packages, prices,
  dates, hotels, distance to the Haram, inclusions, cancellation policy,
  payment schedule, ATOL number). **Never invents a price, date, or
  availability.** If it's not in the KB, it says it will check and hands
  off.
- Grounding check: every price, date, or number in a draft reply must
  appear in the retrieved KB text used for that reply, or the draft is
  rejected, retried once, then handed off.
- **Never answers fiqh/ritual questions** beyond what the agency's own
  guide text literally contains. Hands off or points to the agency's
  guide.
- **Never gives visa, legal, or immigration advice.** Only relays what the
  agency explicitly configured.
- **Never asks for or accepts passport numbers, passport images, or
  payment card details.** If a customer sends them anyway, the reply says
  the team will collect documents securely, and hands off. The sensitive
  content itself is not stored in the searchable KB or logs beyond the
  raw message record (see §7).
- Refuses off-topic general chat (the scope guard required by Meta's
  policy above).
- Never claims to be human if asked directly. States it is the agency's
  virtual assistant.
- Resists prompt injection ("ignore your instructions", etc.) — part of
  the required eval suite, not optional.

## 7. Security, privacy, compliance

- Multi-tenant isolation via app-level `agencyId` scoping on every query
  (see Stack section). Proven by a test: agency A cannot read agency B's
  data.
- No passport or payment data stored in v1. If detected in an inbound
  message (passport-number-shaped pattern, card-number pattern), the
  message record exists (for audit) but the content is excluded from the
  searchable KB and from any log beyond that one message record, and the
  conversation hands off.
- UK GDPR basics: privacy policy and DPA template pages, per-contact data
  export and delete, a per-agency retention setting (default 12 months)
  with a scheduled purge job, consent wording for WhatsApp opt-in. The
  agency is the data controller, we are the processor.
- WhatsApp access tokens encrypted at rest (reuse this repo's existing
  `encryptSecret`/`decryptSecret` pattern from oauth-connections.ts, its
  own env-keyed secret, not shared with unrelated secrets).
- Secrets in env only, rotate-able. Rate limit the webhook and any public
  API. Audit log for admin actions (manual WABA connect/reconnect,
  overrides).

## Open decisions not yet made — check before assuming

- **Embeddings provider.** Neither Groq nor Anthropic offers a text
  embeddings API. Nothing has been chosen yet. Do not default to OpenAI
  (a third paid LLM provider) without asking first, per the "ask before
  adding paid services" rule. The KB vector column is scaffolded at 1536
  dimensions as a placeholder pending this decision.
- **Reply limits and margin (decided 2026-11-07, add-on reinstated 2026-11-08).** Agencies pay Meta
  directly, but WE pay for the AI calls, so the owner's own limit in Settings can only lower the plan's, never raise
  it. An owner who needs more than the plan's replies buys extra packs: 500 replies each, one-time, never expiring (GBP 6, USD 9, CAD 12, AUD 13, ZAR 140), at a 60% margin on the pack (not 80%). They are used up, oldest pack first, only
  after the plan's replies for the month, and each extra reply brings its share of a pack's AI budget. See extra-replies.ts and economics.ts (EXTRA_PACK_*). Every plan must keep at least 80% margin: each plan has a monthly AI budget (economics.ts) and the agent
  pauses when an agency's estimated AI spend reaches it, whatever the reply count. Reply caps: Starter 1,000,
  Growth 3,500, Pro 8,000. Workings and assumptions in docs/unit-economics.md; economics.test.ts enforces the rule.

## Rules for whoever is building this

- Never guess Meta, Whop, Groq, or Anthropic API details. Read the
  current official docs and cite the page in a code comment near the call
  site.
- Ask before adding a paid service or a heavy dependency.
- Never send real WhatsApp messages to real numbers during development.
  Use the mock provider or Meta's test number.
- Small commits, a test with every feature, no dead code.
- When something here conflicts with Meta's current policy or docs, stop
  and say so instead of working around it.
