"""HTTP surface for the Support Agent: POST /support/{client_id}/ask, ready to sit behind a website chat widget."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.config import load_client
from core.llm import agent_model, build_llm
from core.retrieval import KeywordRetriever, load_chunks

from .agent import SupportAgent

router = APIRouter(prefix="/support", tags=["support"])
CLIENTS_DIR = Path(__file__).resolve().parents[2] / "clients"


class Ask(BaseModel):
    question: str
    history: list[dict[str, str]] = []


class Reply(BaseModel):
    text: str
    handoff: bool
    reason: str = ""


def _agent(client_id: str) -> SupportAgent:
    path = CLIENTS_DIR / f"{client_id}.json"
    if not path.exists():
        raise HTTPException(404, "unknown client")
    client = load_client(path)
    retriever = KeywordRetriever(load_chunks(CLIENTS_DIR / client.kb_dir))
    return SupportAgent(
        client,
        build_llm(agent_model("support_agent")),
        retriever,
        build_llm(agent_model("support_agent", "escalation")),
    )


@router.post("/{client_id}/ask", response_model=Reply)
def ask(client_id: str, body: Ask) -> Reply:
    answer = _agent(client_id).answer(body.question, body.history)
    return Reply(text=answer.text, handoff=answer.handoff, reason=answer.reason)
