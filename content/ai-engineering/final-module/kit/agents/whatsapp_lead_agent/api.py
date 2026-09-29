"""WhatsApp webhook: GET verifies the subscription, POST receives messages.

Rules from Meta's webhook docs: verify the signature on EVERY POST, answer 200 fast, process after responding,
and dedupe by message id because Meta retries.
"""

from __future__ import annotations

import json
import os
from typing import Callable

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request, Response

from core.webhooks import MemorySeenStore, SeenStore, verify_sha256_signature

from .agent import LeadAgent
from .whatsapp import Inbound, WhatsAppClient, extract_inbound_text

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

_seen: SeenStore = MemorySeenStore()
# Wire these up at startup (see app.py): one agent per client, keyed by the client's WhatsApp phone number id.
agents: dict[str, LeadAgent] = {}
senders: dict[str, WhatsAppClient] = {}
on_handoff: Callable[[str, str], None] = lambda customer, summary: None  # e.g. email the client's escalation address


def process(msg: Inbound) -> None:
    agent, sender = agents.get(msg.phone_number_id), senders.get(msg.phone_number_id)
    if not agent or not sender:
        return
    sender.note_inbound(msg.sender, msg.timestamp)
    outcome = agent.handle(msg.sender, msg.text)
    sender.send_text(msg.sender, outcome.reply)
    if outcome.handoff:
        on_handoff(msg.sender, json.dumps(outcome.lead.model_dump()))


@router.get("/webhook")
def verify(
    mode: str = Query(alias="hub.mode"),
    token: str = Query(alias="hub.verify_token"),
    challenge: str = Query(alias="hub.challenge"),
) -> Response:
    if mode == "subscribe" and token == os.environ.get("WHATSAPP_VERIFY_TOKEN"):
        return Response(challenge, media_type="text/plain")
    raise HTTPException(403, "verification failed")


@router.post("/webhook")
async def receive(request: Request, background: BackgroundTasks) -> dict[str, str]:
    raw = await request.body()
    if not verify_sha256_signature(raw, request.headers.get("X-Hub-Signature-256"), os.environ["WHATSAPP_APP_SECRET"]):
        raise HTTPException(401, "bad signature")
    for msg in extract_inbound_text(json.loads(raw)):
        if _seen.first_time(msg.message_id):
            background.add_task(process, msg)
    return {"status": "ok"}
