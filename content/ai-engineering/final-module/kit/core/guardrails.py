"""Checks that run on every draft BEFORE it is sent. Prompts ask the model to behave; these make it so."""

from __future__ import annotations

import re

NUMBER = re.compile(r"(?<![\w.])(?:[$£€]\s?)?\d[\d,]*(?:\.\d+)?%?")
CARD_LIKE = re.compile(r"\b(?:\d[ -]?){13,19}\b")
PASSPORT_LIKE = re.compile(r"\b(?=[A-Z0-9]{8,9}\b)(?=[A-Z0-9]*\d)[A-Z0-9]{8,9}\b")


def _norm(n: str) -> str:
    return re.sub(r"[^\d.]", "", n)


def ungrounded_numbers(draft: str, sources: list[str]) -> list[str]:
    """Numbers (prices, dates, percentages) in `draft` that appear in none of the `sources`.

    An agent that quotes a price it was never given is the most expensive failure there is, so a
    non-empty result means: do not send, hand off to a person."""
    allowed = {_norm(n) for s in sources for n in NUMBER.findall(s)}
    return [n for n in NUMBER.findall(draft) if _norm(n) and _norm(n) not in allowed]


def _luhn(digits: str) -> bool:
    total, alt = 0, False
    for ch in reversed(digits):
        d = int(ch)
        if alt:
            d = d * 2 - 9 if d * 2 > 9 else d * 2
        total += d
        alt = not alt
    return total % 10 == 0


def contains_sensitive(text: str) -> bool:
    """True if the text looks like a payment card number or a passport number.

    Agents never ask for these. If a customer sends one anyway, do not store or repeat it: reply that a
    person will collect documents securely and hand off."""
    for m in CARD_LIKE.findall(text):
        digits = re.sub(r"\D", "", m)
        if 13 <= len(digits) <= 19 and _luhn(digits):
            return True
    return bool(PASSPORT_LIKE.search(text))


def mentions_forbidden(draft: str, phrases: list[str]) -> bool:
    low = draft.lower()
    return any(p.lower() in low for p in phrases)
