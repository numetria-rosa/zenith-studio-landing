"""Cal.com API v2 client.

Verified against Cal.com's docs on 2026-09-29:
- GET  https://api.cal.com/v2/slots     header `cal-api-version: 2024-09-04`; query eventTypeId, start, end (ISO 8601, UTC).
  Returns available slots grouped by date.
- POST https://api.cal.com/v2/bookings  header `cal-api-version: 2026-02-25`; body: start (ISO 8601 UTC), attendee
  {name, email, timeZone}, and eventTypeId; optional metadata (max 50 keys). Returns 201 with the booking (id, uid, start, end...).
- Authorization: `Bearer <API key starting cal_>`.
Each endpoint pins its own API version: keep the two constants below in one place and re-check them when Cal.com ships a new one.
Docs: https://cal.com/docs/api-reference/v2/bookings/create-a-booking
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any

import httpx

from core.http import request_json

API = "https://api.cal.com/v2"
SLOTS_VERSION = "2024-09-04"
BOOKINGS_VERSION = "2026-02-25"


def flatten_slots(data: dict[str, Any]) -> list[str]:
    """`data` is {"2026-10-05": [{"start": "..."}, ...], ...}; return every slot start, sorted."""
    starts = [s["start"] for day in data.values() for s in day]
    return sorted(starts)


class CalComClient:
    def __init__(self, api_key: str | None = None, http: httpx.Client | None = None):
        self.api_key = api_key or os.environ["CALCOM_API_KEY"]
        self.http = http or httpx.Client(timeout=20)

    def _headers(self, version: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}", "cal-api-version": version}

    def slots(self, event_type_id: int, start_utc: str, end_utc: str) -> list[str]:
        body = request_json(
            self.http,
            "GET",
            f"{API}/slots",
            headers=self._headers(SLOTS_VERSION),
            params={"eventTypeId": event_type_id, "start": start_utc, "end": end_utc},
        )
        return flatten_slots(body["data"])

    def book(
        self, event_type_id: int, start: str, name: str, email: str, time_zone: str, metadata: dict[str, str] | None = None
    ) -> dict[str, Any]:
        datetime.fromisoformat(start.replace("Z", "+00:00"))  # fail early on a malformed time
        body = request_json(
            self.http,
            "POST",
            f"{API}/bookings",
            headers=self._headers(BOOKINGS_VERSION),
            json={
                "start": start,
                "eventTypeId": event_type_id,
                "attendee": {"name": name, "email": email, "timeZone": time_zone},
                **({"metadata": metadata} if metadata else {}),
            },
        )
        return body["data"]
