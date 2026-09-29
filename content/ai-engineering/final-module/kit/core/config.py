"""Per-client configuration.

Every agent takes a `ClientConfig`. Onboarding a new client means writing one JSON file (see
`clients/`), not editing code: business facts, tone, escalation contact, hours and knowledge base.
"""

from __future__ import annotations

import json
from pathlib import Path

from pydantic import BaseModel, Field


class BusinessHours(BaseModel):
    timezone: str = "America/New_York"
    # weekday (mon..sun) -> [open, close] in 24h "HH:MM"; a missing day means closed
    weekly: dict[str, tuple[str, str]] = Field(default_factory=dict)


class ClientConfig(BaseModel):
    client_id: str
    business_name: str
    niche: str
    languages: list[str] = ["en"]
    tone: str = "warm, brief and professional"
    escalation_email: str
    hours: BusinessHours = Field(default_factory=BusinessHours)
    # Plain-text knowledge base: one file per topic under this directory, split into chunks on blank lines.
    kb_dir: str = "kb"
    # Things the agent must never promise (added to the system prompt AND checked before sending).
    never_promise: list[str] = ["pricing not in the knowledge base", "medical, legal or financial advice"]
    # Literal phrases that make a draft fail the pre-send filter (e.g. "guaranteed", "100% safe").
    forbidden_phrases: list[str] = []
    booking_event_type_id: int | None = None
    whatsapp_phone_number_id: str | None = None
    # Meta template used to re-open a conversation after the 24-hour service window has closed.
    whatsapp_reopen_template: str | None = None


def load_client(path: str | Path) -> ClientConfig:
    return ClientConfig.model_validate(json.loads(Path(path).read_text(encoding="utf8")))
