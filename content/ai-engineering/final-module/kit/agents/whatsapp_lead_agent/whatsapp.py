"""WhatsApp Cloud API client and payload helpers.

Verified against Meta's docs on 2026-09-29:
- Send a message: POST https://graph.facebook.com/{version}/{phone_number_id}/messages with
  `Authorization: Bearer <token>` and a body containing `messaging_product: "whatsapp"`.
  https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
- Graph API v26.0 is the latest version (v25.0 is valid until 2028-07-29):
  https://developers.facebook.com/docs/graph-api/changelog
- 24-hour customer service window: free-form messages only within 24h of the customer's last message,
  otherwise a pre-approved template is required.
- Webhook verification handshake and `X-Hub-Signature-256`:
  https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any

import httpx

from core.http import request_json

WINDOW_SECONDS = 24 * 60 * 60


class WindowClosed(RuntimeError):
    """A free-form send was attempted more than 24h after the customer's last message.

    Failing loudly is deliberate: silently dropping the message or silently swapping in a template would both hide a real problem."""


@dataclass(frozen=True)
class Inbound:
    phone_number_id: str
    sender: str  # the customer's WhatsApp number, no leading +
    message_id: str
    timestamp: int
    text: str
    name: str | None = None


def extract_inbound_text(payload: dict[str, Any]) -> list[Inbound]:
    """Every inbound TEXT message in one webhook POST. Meta batches several changes per request, and status
    updates, images and other types are skipped. Never raises on an unfamiliar shape: it just yields nothing,
    so the endpoint can still answer 200 quickly."""
    out: list[Inbound] = []
    for entry in payload.get("entry", []) or []:
        for change in entry.get("changes", []) or []:
            if change.get("field") != "messages":
                continue
            value = change.get("value") or {}
            phone_number_id = (value.get("metadata") or {}).get("phone_number_id")
            names = {c.get("wa_id"): (c.get("profile") or {}).get("name") for c in value.get("contacts", []) or []}
            for msg in value.get("messages", []) or []:
                if msg.get("type") != "text" or not phone_number_id:
                    continue
                out.append(
                    Inbound(
                        phone_number_id=phone_number_id,
                        sender=msg["from"],
                        message_id=msg["id"],
                        timestamp=int(msg.get("timestamp", 0)),
                        text=(msg.get("text") or {}).get("body", ""),
                        name=names.get(msg["from"]),
                    )
                )
    return out


class WhatsAppClient:
    def __init__(self, phone_number_id: str, token: str | None = None, http: httpx.Client | None = None, now=time.time):
        self.phone_number_id = phone_number_id
        self.token = token or os.environ["WHATSAPP_TOKEN"]
        self.http = http or httpx.Client(timeout=20)
        self.now = now
        self.base = f"https://graph.facebook.com/{os.environ.get('GRAPH_API_VERSION', 'v26.0')}"
        self._last_inbound: dict[str, float] = {}

    def note_inbound(self, customer: str, timestamp: int | None = None) -> None:
        """Call for every inbound message: it (re)opens the 24-hour window."""
        self._last_inbound[customer] = float(timestamp) if timestamp else self.now()

    def window_open(self, customer: str) -> bool:
        last = self._last_inbound.get(customer)
        return last is not None and self.now() - last < WINDOW_SECONDS

    def _send(self, body: dict[str, Any]) -> str:
        data = request_json(
            self.http,
            "POST",
            f"{self.base}/{self.phone_number_id}/messages",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"messaging_product": "whatsapp", **body},
        )
        return data["messages"][0]["id"]

    def send_text(self, to: str, text: str) -> str:
        if not self.window_open(to):
            raise WindowClosed(f"24h window closed for {to}; send a template instead")
        return self._send({"recipient_type": "individual", "to": to, "type": "text", "text": {"body": text}})

    def send_template(self, to: str, name: str, language: str, params: list[str] | None = None) -> str:
        template: dict[str, Any] = {"name": name, "language": {"code": language}}
        if params:
            template["components"] = [{"type": "body", "parameters": [{"type": "text", "text": p} for p in params]}]
        return self._send({"to": to, "type": "template", "template": template})
