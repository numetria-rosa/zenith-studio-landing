# Zenith agent kit

Five agents you can deploy for a paying client, on one shared core.

```
core/                 model interface, retrieval, guardrails, webhook safety, evals (shared by every agent)
agents/
  support_agent/          answers from the client's knowledge base, or hands off
  whatsapp_lead_agent/    WhatsApp Cloud API webhook: reply in seconds, qualify, pass hot leads to a person
  inbox_manager/          triage + reply DRAFTS in Gmail or Microsoft 365 (never sends)
  booking_agent/          bounded tool loop over Cal.com: check availability, book once
  document_extractor/     PDF in, validated JSON out, flagged for review when the numbers don't add up
clients/              one JSON file + one knowledge-base folder per client
evals/                cases you run against the real model before every deploy
app.py                one FastAPI app serving every agent for every client
```

## Run it

```bash
pip install -e ".[dev]"
pytest                       # 50 tests, no network, no API keys needed
cp .env.example .env         # then fill in the keys you need
uvicorn app:app --port 8000
```

## Onboard a client (no code changes)

1. Copy `clients/sunrise-dental.json` to `clients/<client-id>.json` and edit the business facts, tone and escalation email.
2. Put the client's real facts in `clients/<client-id>-kb/*.md`. One paragraph per fact, blank line between them. Prices, hours and policies must be written down here, because the agent is not allowed to say anything that is not.
3. Set `whatsapp_phone_number_id` / `booking_event_type_id` if the client uses those agents.
4. Run `python -m evals.run support_agent <client-id>` and read every failure.
5. Deploy (see the deploy guide for each agent in the course), then watch the first 50 conversations.

## Choose the model

`core/models.json` holds the recommended model per agent (primary, budget, escalation), with prices and the docs each claim
came from. To change one client, set an environment variable, for example `SUPPORT_AGENT_MODEL=groq-gpt-oss-20b`.
To add a provider, implement `complete()` and `parse()` from `core/llm.py`; no agent code changes.

## Rules built into every agent

- Answer only from the client's knowledge base. Every price, date and number in a draft must appear in the retrieved text, or the draft is not sent.
- Never ask for or accept card numbers or passport numbers. If a customer sends one, it is not passed to the model and the conversation goes to a person.
- Say it is a virtual assistant when asked. Ignore instructions written inside customer messages, emails and documents.
- WhatsApp: free-form replies only inside the 24-hour window; outside it, a template or a loud failure, never a silent drop.
- Verify webhook signatures on every request, answer 200 fast, and dedupe by message id.

## Scaling

- One process serves many clients today. For more traffic, run several workers and swap `MemorySeenStore` (core/webhooks.py) for Redis or a unique-key table.
- Swap `KeywordRetriever` for an embeddings retriever behind the same `search()` when a knowledge base outgrows keyword search.
- Backlogs (a new inbox with 5,000 unread emails) belong on the Message Batches API at half price, not in the live path.
