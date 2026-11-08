# Unit economics — WhatsApp AI Agent for Umrah/Hajj agencies

Numbers below are computed from verified provider pricing (checked
2026-09-28), not the original spec's working assumption. Re-run this
calculation against real `WaPromptRun` data once agencies are live — this
is a starting estimate, not a promise. FX used throughout: $1 ≈ £0.78,
itself an estimate — use the real rate when this actually matters (e.g.
setting prices), not for a rough monthly cost projection.

## Per-reply LLM cost (revised 2026-11-07)

The first version of this document assumed a reply is ~800 input and ~150 output tokens. That stopped being true:
every message now carries the whole system prompt (14 rules), **every package** of the agency, the worked-out
quotes table, the occasions calendar, up to 12 messages of history and what the lead already told us. Measured on a
four-package agency that is about 13,200 characters, **~4,600 input tokens** with the JSON schema, and a reply of
~300 output tokens. The quotes table grows with every package (about 460 characters each), so a 30-package agency
(the most we put in one prompt) is ~12,500 input tokens.

Prices ($ per million tokens, checked 2026-11-07 against third-party trackers that agree with the figures verified on
2026-09-28; confirm on the providers' own pages before they decide a price): Groq gpt-oss-20b $0.075 in / $0.30 out;
Claude Haiku 4.5 $1 in / $5 out. Dollars to pounds at 0.80 (deliberately above the ~0.78 market rate).

```
Groq draft, every reply, 4 packages:  4,600 x 0.075/1e6 + 300 x 0.30/1e6 = $0.000435  (£0.00035)
Claude escalation, when a guard fails: 4,600 x 1/1e6      + 300 x 5/1e6   = $0.0061    (£0.0049)

Escalation rate is unmeasured. The guards are stricter than before (grounding, prompt leak, unsupported promise),
so plan on 35%, not the old 10%:

Planning cost per reply = £0.00035 + 0.35 x £0.0049 = £0.0021, rounded up to £0.0025 for the query-translation call.
Worst case, every reply escalates:  4 packages £0.0053, 30 packages £0.012.
```

The planning figure is `PLANNING_COST_PER_REPLY_GBP` in `economics.ts`. Replace it with the real average from
`WaPromptRun.costEstimateCents` once there is traffic.

## The 80% margin rule and how it is enforced

Rule (the owner's, 2026-11-07): every plan keeps at least **80% of its price** after what it costs us. Meta bills the
agency directly, so it is not our cost. What is: Whop's fee, a share of hosting, and the AI calls. Only the AI calls
move with usage, so each plan gets a monthly **AI budget**:

```
budget = (20% of price - Whop fee - hosting share) x 0.9 safety, rounded down to 50p
Starter £49  : 9.80 -  3.76 - 1.00 = 5.04 -> £4.50
Growth  £99  : 19.80 - 7.36 - 1.50 = 10.94 -> £9.50
Pro     £199 : 39.80 - 14.56 - 2.00 = 23.24 -> £20.50
```

Two limits then apply, whichever bites first (`withinCap` in `entitlements.ts`):

1. **The AI budget, a hard stop.** The agent pauses when this month's estimated AI spend for the agency (the sum of
   `WaPromptRun.costEstimateCents`, real chats and Simulator tests) reaches the budget. Because it is measured in
   money, a month of long conversations, a big knowledge base or lots of Claude escalations cannot push the margin
   under 80%. At the budget the margin is still >= 80% (`economics.test.ts` fails if prices, caps or budgets are
   changed so that it is not).
2. **The reply count, the promise.** Starter 1,000 replies, Growth 3,500, Pro 8,000 a month. Sized so the count
   times the planning cost fits inside the budget (Starter 1,000 x £0.0025 = £2.50 of a £4.50 budget). An agency may
   set its own lower limit in Settings; it can never raise it above the plan's, because the plan limit is what our
   cost is sized to.

At the planning cost a Starter agency spends about £2.50 of AI a month, margin ~ 85% (hosting included); the budget only binds in an
unusual month. Growth and Pro were previously 4,000 and 10,000 replies; those were lowered so the count fits the
budget (neither plan is on sale yet).

The Simulator runs the real model, so it counts too: its runs are saved without a conversation and add to the
monthly spend, and it is limited to 60 test messages a day.

Not covered by the estimate: the query-translation call (a few hundred tokens, in the 10% safety), and any run on a
model other than the two priced defaults (it logs no cost, so it would not count: price a new model in
`pipeline.ts` before switching to it).

## Embeddings cost (Voyage AI)

`voyage-4-lite`, $0.02/1M tokens. **The first 200 million tokens are free
for the whole account**, shared across every agency, not per-agency — so
this cost is genuinely $0 until cumulative usage across all agencies
crosses 200M tokens, which at the volumes below would take well over 100
agency-months. Modelled here anyway, for when that changes:

- KB content (ingestion + edits): ~20,000 tokens/agency/month, a
  generous estimate for an agency actively updating packages.
- Query embeddings: one short embed call per customer message that needs
  KB retrieval, ~100 tokens each — roughly one per AI reply.

| Plan | Reply cap | Query tokens/mo | + KB tokens | Total tokens/mo | Cost (post-free-tier) |
|---|---|---|---|---|---|
| Starter | 1,000 | 100,000 | 20,000 | 120,000 | $0.0024 (£0.002) |
| Growth | 4,000 | 400,000 | 20,000 | 420,000 | $0.0084 (£0.007) |
| Pro | 10,000 | 1,000,000 | 20,000 | 1,020,000 | $0.0204 (£0.016) |

## Whop's fee — the real cost driver, not AI

Confirmed from Whop's own fee docs: base card processing is 2.7% + $0.30
per transaction, +1.5% for a non-domestic card, +1% for currency
conversion. **Not fully confirmed:** Whop's docs don't clearly separate a
platform fee from the processing fee, and don't explicitly state whether
these rates differ for recurring subscription charges vs. one-time
charges, or whether the optional "tax & remittance" fee (2%, the service
that makes Whop the UK VAT merchant of record) is mandatory once VAT
collection is switched on for a product. **Verify the exact effective
rate directly with Whop for a UK GBP recurring subscription before this
number goes into real pricing decisions.**

Working estimate used below, until that's confirmed: **2.7% + 1.5%
(non-domestic card) + 1% (currency conversion) + 2% (VAT remittance) =
7.2%, plus a $0.30 (≈£0.23) fixed fee per charge.**

## All-in monthly cost and margin per client

At the planning cost and at the plan's reply count (typical month), and at the AI budget (the worst month allowed):

| Plan | Price/mo | Whop fee (est.) | Hosting | AI, typical (count x £0.0025) | Margin, typical | AI, at budget | Margin, at budget |
|---|---|---|---|---|---|---|---|
| Starter | £49 | £3.76 | £1.00 | £2.50 | **85.2%** | £4.50 | **81.1%** |
| Growth | £99 | £7.36 | £1.50 | £8.75 | **82.2%** | £9.50 | **81.5%** |
| Pro | £199 | £14.56 | £2.00 | £20.00 | **81.6%** | £20.50 | **81.4%** |

Embeddings are free (see above) and not in the table. Re-run this once Whop's exact rate is confirmed and once real
`WaPromptRun` data replaces the 35% escalation assumption. If Whop's fee turns out higher, lower the budgets in
`economics.ts` (the test will tell you which plans no longer clear 80%).

## Starter in other currencies (2026-11-08)

Starter is also sold in US, Canadian, Australian and South African currency, each its own Whop plan on the same product
(a plan has one currency, and subscriptions cannot use Whop's adaptive pricing, which is one-time payments only:
https://docs.whop.com/payments-and-billing/fees/adaptive-pricing). Prices: USD 52, CAD 83, AUD 85, ZAR 900. At a
strong-pound rate those are worth about £37.50, £43.50, £41 and £40, below the £49 UK price, so each currency gets an AI
budget sized from its own price (`STARTER_PRICE_GBP_EQUIV` in `economics.ts`): £3.00 for USD, £3.50 for CAD, AUD and ZAR,
against £4.50 for GBP. 1,000 replies still fit (about £2.50 at the planning cost), but there is less headroom, so a heavy
month on a Claude-heavy agency reaches the budget sooner and the agent pauses. `economics.test.ts` checks all five.
Whop's fee for foreign-currency cards may be higher than the 7.2% working figure; confirm it on a real payment and lower
the budgets if so.
