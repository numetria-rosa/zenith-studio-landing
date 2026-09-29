"""Gmail as a `Mailbox`.

Verified against Google's docs on 2026-09-29:
- users.messages.list  GET https://gmail.googleapis.com/gmail/v1/users/{userId}/messages  (q, labelIds, maxResults;
  returns only id + threadId, so each message needs users.messages.get)
- users.drafts.create  POST .../users/{userId}/drafts with {"message": {"raw": <base64url RFC 2822>, "threadId": ...}};
  add In-Reply-To and References headers to keep the draft in the thread.
- Push notifications: users.watch with a Cloud Pub/Sub topic; call it at least every 7 days (Google recommends daily);
  the notification carries only emailAddress + historyId, so read changes with users.history.list.
  https://developers.google.com/workspace/gmail/api/guides/push

Least-privilege OAuth scopes: gmail.readonly (read) + gmail.compose (create drafts).
Getting and refreshing the access token is your OAuth layer's job: pass a callable that returns a fresh one.
"""

from __future__ import annotations

import base64
from email.message import EmailMessage
from typing import Any, Callable

import httpx

from core.http import request_json

from .mailbox import Email

API = "https://gmail.googleapis.com/gmail/v1/users/me"
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.compose"]


def _b64url_decode(data: str) -> str:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4)).decode("utf8", errors="replace")


def _find_part(payload: dict[str, Any], mime: str) -> str | None:
    if payload.get("mimeType") == mime and payload.get("body", {}).get("data"):
        return _b64url_decode(payload["body"]["data"])
    for part in payload.get("parts", []) or []:
        found = _find_part(part, mime)
        if found is not None:
            return found
    return None


def _text_body(payload: dict[str, Any]) -> str:
    """The text/plain part anywhere in the message tree; only if there is none, the first text/html part."""
    plain = _find_part(payload, "text/plain")
    if plain is not None:
        return plain
    return _find_part(payload, "text/html") or ""


def parse_message(msg: dict[str, Any]) -> Email:
    headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}
    return Email(
        id=msg["id"],
        thread_id=msg.get("threadId", ""),
        sender=headers.get("from", ""),
        subject=headers.get("subject", ""),
        body=_text_body(msg.get("payload", {})),
        message_id=headers.get("message-id", ""),
        references=headers.get("references", ""),
    )


def build_reply_raw(to: Email, body: str, from_address: str | None = None) -> str:
    msg = EmailMessage()
    msg["To"] = to.sender
    if from_address:
        msg["From"] = from_address
    msg["Subject"] = to.subject if to.subject.lower().startswith("re:") else f"Re: {to.subject}"
    if to.message_id:
        msg["In-Reply-To"] = to.message_id
        msg["References"] = f"{to.references} {to.message_id}".strip()
    msg.set_content(body)
    return base64.urlsafe_b64encode(msg.as_bytes()).decode()


class GmailMailbox:
    def __init__(self, access_token: Callable[[], str], http: httpx.Client | None = None, query: str = "is:unread in:inbox"):
        self.access_token, self.http, self.query = access_token, http or httpx.Client(timeout=30), query

    def _call(self, method: str, path: str, **kwargs: Any) -> Any:
        return request_json(self.http, method, f"{API}{path}", headers={"Authorization": f"Bearer {self.access_token()}"}, **kwargs)

    def unread(self, limit: int = 20) -> list[Email]:
        listing = self._call("GET", "/messages", params={"q": self.query, "maxResults": limit})
        return [parse_message(self._call("GET", f"/messages/{m['id']}", params={"format": "full"})) for m in listing.get("messages", [])]

    def save_draft(self, email: Email, body: str) -> str:
        draft = self._call("POST", "/drafts", json={"message": {"raw": build_reply_raw(email, body), "threadId": email.thread_id}})
        return draft["id"]

    def watch(self, pubsub_topic: str) -> dict[str, Any]:
        """Start push notifications for INBOX changes. Schedule this daily; it expires after 7 days."""
        return self._call("POST", "/watch", json={"topicName": pubsub_topic, "labelIds": ["INBOX"], "labelFilterBehavior": "INCLUDE"})

    def new_message_ids(self, start_history_id: str) -> list[str]:
        """Message ids added since `start_history_id` (from the push notification's previous historyId)."""
        data = self._call("GET", "/history", params={"startHistoryId": start_history_id, "historyTypes": "messageAdded"})
        return [a["message"]["id"] for h in data.get("history", []) for a in h.get("messagesAdded", [])]
