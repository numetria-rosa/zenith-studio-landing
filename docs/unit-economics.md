# Unit economics — WhatsApp AI Agent for Umrah/Hajj agencies

Numbers below are computed from verified provider pricing (checked
2026-09-28), not the original spec's working assumption. Re-run this
calculation against real `WaPromptRun` data once agencies are live — this
is a starting estimate, not a promise. FX used throughout: $1 ≈ £0.78,
itself an estimate — use the real rate when this actually matters (e.g.
setting prices), not for a rough monthly cost projection.

## Per-reply LLM cost (Groq draft + Claude escalation)

Assumed shape of one reply: system prompt + retrieved KB chunks + recent
conversation history ≈ 800 input tokens, ≈ 150 output tokens. Adjust once
real `WaPromptRun.inputTokens`/`outputTokens` data exists.

**Every reply is drafted by Groq first.** Escalation to Claude is a
*second* call on top of that draft, not a replacement for it — the
earlier version of this document treated the two as mutually exclusive,
which understated the true cost. Corrected:

```
Groq openai/gpt-oss-20b (every reply): $0.075/1M in, $0.30/1M out
  = (800/1e6 * 0.075) + (150/1e6 * 0.30) = $0.000105

Claude Haiku 4.5 (only the ~10% that escalate): $1/1M in, $5/1M out
  = (800/1e6 * 1) + (150/1e6 * 5) = $0.00155

Blended cost per reply = $0.000105 + (0.10 * $0.00155)
                        = $0.000105 + $0.000155
                        = $0.00026  (≈ £0.0002)
```

The 90/10 draft/escalation split is a working assumption, not measured —
tune it against real guard-failure/escalation rates once there's traffic.

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

## All-in monthly cost and margin per client, at plan cap

| Plan | Price/mo | AI cost (LLM+embed) | Whop fee (est.) | Total cost | Margin |
|---|---|---|---|---|---|
| Starter | £49.00 | £0.21 | £3.76 | £3.97 | **91.9%** |
| Growth | £99.00 | £0.82 | £7.36 | £8.18 | **91.7%** |
| Pro | £199.00 | £2.04 | £14.56 | £16.60 | **91.7%** |

All comfortably clear the spec's 50% margin floor, even using the higher, unverified Whop fee
estimate. **The AI cost line barely matters** — Groq's current pricing is
cheap enough that inference is a rounding error next to payment
processing. The one number here worth nailing down before it's load-
bearing for real pricing decisions is Whop's exact effective rate.

## Flag: any plan under 50% margin

None, at either the estimated or a conservative worse-case Whop fee.
Re-run this once Whop's exact rate is confirmed and once real
`WaPromptRun` data replaces the 90/10 escalation-rate assumption.
