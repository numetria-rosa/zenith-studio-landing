"""One FastAPI app that serves every agent for every client. Run: uvicorn app:app --host 0.0.0.0 --port 8000

Clients are files in clients/*.json. Adding a client means adding a file and restarting, not changing code.
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI

from agents.support_agent.api import router as support_router
from agents.whatsapp_lead_agent import api as whatsapp_api
from agents.whatsapp_lead_agent.agent import LeadAgent
from agents.whatsapp_lead_agent.whatsapp import WhatsAppClient
from core.config import load_client
from core.llm import agent_model, build_llm
from core.retrieval import KeywordRetriever, load_chunks

CLIENTS_DIR = Path(__file__).parent / "clients"

app = FastAPI(title="Zenith agent kit")
app.include_router(support_router)
app.include_router(whatsapp_api.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def wire_whatsapp() -> None:
    """One LeadAgent + sender per client that has a WhatsApp phone number id (skipped when no token is configured)."""
    if not os.environ.get("WHATSAPP_TOKEN"):
        return
    for path in sorted(CLIENTS_DIR.glob("*.json")):
        client = load_client(path)
        if not client.whatsapp_phone_number_id:
            continue
        retriever = KeywordRetriever(load_chunks(CLIENTS_DIR / client.kb_dir))
        whatsapp_api.agents[client.whatsapp_phone_number_id] = LeadAgent(client, build_llm(agent_model("whatsapp_lead_agent")), retriever)
        whatsapp_api.senders[client.whatsapp_phone_number_id] = WhatsAppClient(client.whatsapp_phone_number_id)


wire_whatsapp()
