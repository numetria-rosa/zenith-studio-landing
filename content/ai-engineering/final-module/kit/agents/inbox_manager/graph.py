"""Microsoft 365 / Outlook as a `Mailbox`, through Microsoft Graph v1.0.

Verified against Microsoft Learn on 2026-09-29:
- List messages: GET /me/messages with $select, $top (1-1000, default 10) and $filter. If you combine $filter and
  $orderby, every $orderby property must also appear in $filter, in the same order, or Graph returns InefficientFilter.
  Bodies come back as HTML unless you send `Prefer: outlook.body-content-type="text"`.
- Create a reply draft: POST /me/messages/{id}/createReply returns 201 with the draft; update the draft's body afterwards
  (PATCH /me/messages/{draftId}). Send is a separate call, which this agent never makes.
- Least-privilege permission for both reading and createReply: Mail.ReadWrite (delegated or application).
  https://learn.microsoft.com/en-us/graph/api/message-createreply
"""

from __future__ import annotations

from typing import Any, Callable

import httpx

from core.http import request_json

from .mailbox import Email

API = "https://graph.microsoft.com/v1.0"
SCOPES = ["Mail.ReadWrite"]


def parse_message(msg: dict[str, Any]) -> Email:
    return Email(
        id=msg["id"],
        thread_id=msg.get("conversationId", ""),
        sender=(msg.get("from") or {}).get("emailAddress", {}).get("address", ""),
        subject=msg.get("subject", ""),
        body=(msg.get("body") or {}).get("content", "") or msg.get("bodyPreview", ""),
        message_id=msg.get("internetMessageId", ""),
    )


class GraphMailbox:
    def __init__(self, access_token: Callable[[], str], http: httpx.Client | None = None, user: str = "me"):
        self.access_token, self.http = access_token, http or httpx.Client(timeout=30)
        self.base = f"{API}/me" if user == "me" else f"{API}/users/{user}"

    def _call(self, method: str, url: str, **kwargs: Any) -> Any:
        headers = {"Authorization": f"Bearer {self.access_token()}", **kwargs.pop("headers", {})}
        return request_json(self.http, method, url, headers=headers, **kwargs)

    def unread(self, limit: int = 20) -> list[Email]:
        data = self._call(
            "GET",
            f"{self.base}/messages",
            params={
                "$filter": "isRead eq false",
                "$select": "id,subject,from,conversationId,internetMessageId,body,bodyPreview",
                "$top": limit,
            },
            headers={"Prefer": 'outlook.body-content-type="text"'},
        )
        return [parse_message(m) for m in data.get("value", [])]

    def save_draft(self, email: Email, body: str) -> str:
        draft = self._call("POST", f"{self.base}/messages/{email.id}/createReply")
        self._call("PATCH", f"{self.base}/messages/{draft['id']}", json={"body": {"contentType": "text", "content": body}})
        return draft["id"]
