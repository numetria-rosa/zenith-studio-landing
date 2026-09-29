"""The one interface the Inbox Manager needs from a mail provider. Gmail and Microsoft 365 implement it."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


@dataclass
class Email:
    id: str
    sender: str
    subject: str
    body: str  # plain text
    thread_id: str = ""
    message_id: str = ""  # RFC 5322 Message-ID header
    references: str = ""
    extra: dict[str, str] = field(default_factory=dict)


class Mailbox(Protocol):
    def unread(self, limit: int = 20) -> list[Email]: ...

    def save_draft(self, email: Email, body: str) -> str:
        """Create a reply DRAFT in the same thread. Returns the draft id. Never sends."""
        ...
