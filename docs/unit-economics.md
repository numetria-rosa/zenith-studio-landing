# Unit economics — WhatsApp AI Agent for Umrah/Hajj agencies

Numbers below are computed from verified provider pricing (2026-09-28),
not the working assumption in the original spec. Re-run this calculation
against real `WaPromptRun` data once agencies are live — this is a
starting estimate, not a promise.

## Per-reply LLM cost (Groq primary + Claude escalation)

Assumed shape of one reply: system prompt + retrieved KB chunks + recent
conversation history ≈ 800 input tokens, ≈ 150 output tokens. Adjust once
real `WaPromptRun.inputTokens`/`outputTokens` data exists.

**Groq `openai/gpt-oss-20b`** (the draft step, handles the large majority
of replies): $0.075/1M input, $0.30/1M output.

```
(800 / 1,000,000 * $0.075) + (150 / 1,000,000 * $0.30)
= $0.00006 + $0.000045
= $0.000105 per reply ≈ £0.00008 per reply
```

**Claude Haiku 4.5** (escalation only, a minority of replies): $1/1M
input, $5/1M output. Same token shape:

```
(800 / 1,000,000 * $1) + (150 / 1,000,000 * $5)
= $0.0008 + $0.00075
= $0.00155 per escalated reply ≈ £0.0012
```

**Blended cost**, assuming (a working estimate, tune once real data
exists) 90% draft-only / 10% escalated:

```
0.9 * £0.00008 + 0.1 * £0.0012 = £0.00019 per reply
```

This is roughly **10x cheaper than the original £0.002/reply planning
assumption**, mostly because Groq's current gpt-oss pricing is well below
what that assumption was likely modelled on (Llama models on Groq are no
longer self-serve priced — see CLAUDE.md). Treat the original £0.002 as a
conservative ceiling until real escalation-rate data replaces the 90/10
assumption above.

## Margin at plan cap (LLM cost only — excludes Whop fees, see below)

| Plan | Price/mo | AI reply cap | LLM cost at cap (blended) | Margin |
|---|---|---|---|---|
| Starter | £14 | 1,000 | £0.19 | 98.6% |
| Growth | £29 | 4,000 | £0.76 | 97.4% |
| Pro | £59 | 10,000 | £1.90 | 96.8% |

All three plans clear the spec's 50% margin floor by a very wide margin
on LLM cost alone — this cost line is not the thing to worry about.

## What actually eats into margin

LLM inference is cheap enough here that it is not the binding cost.
The real costs to model honestly:

- **Whop's payment processing fee** (percentage + fixed per transaction —
  check Whop's current published rate before finalizing pricing copy; not
  verified as part of this document).
- **Embeddings** for KB ingestion and per-message retrieval — **no
  provider chosen yet** (see CLAUDE.md's open decision). This is a
  recurring cost with no verified number until that's settled; do not
  assume it is negligible without checking.
- **Support/ops time**, the real bottleneck for a solo founder at low
  volume — not captured in a per-reply calculation at all.

## Flag: any plan under 50% margin

None currently are, on LLM cost. Re-run this whole document once the
embeddings provider is chosen and once Whop's fee is factored in, and
flag here explicitly if any plan drops under 50% at that point.
