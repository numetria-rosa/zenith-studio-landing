"""Webhook safety: verify who is calling, and never handle the same event twice."""

from __future__ import annotations

import hashlib
import hmac
from typing import Protocol


def verify_sha256_signature(raw_body: bytes, header: str | None, secret: str) -> bool:
    """Meta signs webhooks as `X-Hub-Signature-256: sha256=<hex HMAC-SHA256 of the RAW body, keyed with the app secret>`.

    Verify against the raw bytes, never a re-serialised JSON object, and compare in constant time.
    https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint"""
    if not header or not header.startswith("sha256="):
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header.removeprefix("sha256="))


class SeenStore(Protocol):
    def first_time(self, event_id: str) -> bool: ...


class MemorySeenStore:
    """Single-process dedupe. Swap for a Redis `SET NX EX` or a unique-key insert when you run more than one worker."""

    def __init__(self, max_size: int = 10_000):
        self._seen: dict[str, None] = {}
        self._max = max_size

    def first_time(self, event_id: str) -> bool:
        if event_id in self._seen:
            return False
        self._seen[event_id] = None
        if len(self._seen) > self._max:
            self._seen.pop(next(iter(self._seen)))
        return True
