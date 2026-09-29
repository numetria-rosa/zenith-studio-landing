"""Booking Agent: a bounded tool loop that finds a slot and books it, safely.

Three safeguards, each one a lesson from the course:
1. The model can only book a slot that `check_availability` returned in THIS conversation (validate before you execute).
2. A booking for the same person and time is created once, even if the model calls the tool twice (idempotency).
3. The loop stops after `max_steps` model calls (a hard step limit).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

from core.config import ClientConfig
from core.llm import AnthropicLLM, LLMResult


class Calendar(Protocol):
    def slots(self, event_type_id: int, start_utc: str, end_utc: str) -> list[str]: ...

    def book(
        self, event_type_id: int, start: str, name: str, email: str, time_zone: str, metadata: dict[str, str] | None = None
    ) -> dict[str, Any]: ...


# `strict: true` guarantees the model's arguments match the schema (all properties required, no extras).
TOOLS: list[dict[str, Any]] = [
    {
        "name": "check_availability",
        "description": "List open appointment slots between two UTC instants. Call this before offering or booking any time.",
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "start_utc": {"type": "string", "description": "ISO 8601 UTC, e.g. 2026-10-05T00:00:00Z"},
                "end_utc": {"type": "string", "description": "ISO 8601 UTC, after start_utc"},
            },
            "required": ["start_utc", "end_utc"],
            "additionalProperties": False,
        },
    },
    {
        "name": "book_slot",
        "description": "Book one slot that check_availability returned. Only call after the customer confirmed the time, name and email.",
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "start": {"type": "string", "description": "A slot start exactly as returned by check_availability"},
                "name": {"type": "string"},
                "email": {"type": "string"},
                "time_zone": {"type": "string", "description": "IANA zone, e.g. Europe/London"},
            },
            "required": ["start", "name", "email", "time_zone"],
            "additionalProperties": False,
        },
    },
]


@dataclass
class BookingState:
    offered: set[str] = field(default_factory=set)
    booked: dict[tuple[str, str], dict[str, Any]] = field(default_factory=dict)  # (email, start) -> booking


class BookingAgent:
    def __init__(self, client: ClientConfig, llm: AnthropicLLM, calendar: Calendar, max_steps: int = 6):
        if client.booking_event_type_id is None:
            raise ValueError("client config needs booking_event_type_id")
        self.client, self.llm, self.calendar, self.max_steps = client, llm, calendar, max_steps
        self.state = BookingState()

    # --- tool handlers -------------------------------------------------
    def check_availability(self, args: dict[str, Any]) -> dict[str, Any]:
        slots = self.calendar.slots(self.client.booking_event_type_id, args["start_utc"], args["end_utc"])  # type: ignore[arg-type]
        self.state.offered.update(slots)
        return {"slots": slots[:20], "timezone_note": "times are ISO 8601 with offsets"}

    def book_slot(self, args: dict[str, Any]) -> dict[str, Any]:
        if args["start"] not in self.state.offered:
            raise ValueError("that time was not offered by check_availability; check availability first")
        key = (args["email"].lower(), args["start"])
        if key in self.state.booked:  # the model repeated itself: return the first booking, don't create a second
            return {**self.state.booked[key], "duplicate": True}
        booking = self.calendar.book(
            self.client.booking_event_type_id,  # type: ignore[arg-type]
            args["start"],
            args["name"],
            args["email"],
            args["time_zone"],
            {"source": "booking_agent"},
        )
        self.state.booked[key] = {"uid": booking.get("uid"), "start": booking.get("start"), "status": booking.get("status")}
        return self.state.booked[key]

    # --- conversation --------------------------------------------------
    def system(self) -> str:
        return f"""You book appointments for {self.client.business_name}. Tone: {self.client.tone}. Reply in the customer's language.
Process: understand the day or time they want, call check_availability, offer at most 3 slots, then confirm the time, their full name and email before calling book_slot.
Never book a time you have not confirmed, never invent availability, and never ask for payment details. After booking, repeat the time back in the customer's own time zone."""

    def reply(self, history: list[dict[str, Any]]) -> LLMResult:
        return self.llm.run_tools(
            self.system(),
            history,
            TOOLS,
            {"check_availability": self.check_availability, "book_slot": self.book_slot},
            max_steps=self.max_steps,
        )
