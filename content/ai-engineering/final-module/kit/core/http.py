"""HTTP helper shared by the platform clients (WhatsApp, Gmail, Graph, Cal.com)."""

from __future__ import annotations

import time
from typing import Any

import httpx

RETRYABLE = {408, 429, 500, 502, 503, 504}


def request_json(
    client: httpx.Client,
    method: str,
    url: str,
    *,
    retries: int = 3,
    backoff: float = 0.5,
    **kwargs: Any,
) -> Any:
    """Send a request, retry only what a retry can fix (network errors, 429, 5xx), and fail loudly on the rest.

    A 4xx other than 408/429 means the request itself is wrong, so retrying it would only repeat the mistake."""
    for attempt in range(retries + 1):
        try:
            res = client.request(method, url, **kwargs)
        except httpx.TransportError:
            if attempt == retries:
                raise
        else:
            if res.status_code not in RETRYABLE:
                res.raise_for_status()
                return res.json() if res.content else None
            if attempt == retries:
                res.raise_for_status()
            retry_after = res.headers.get("retry-after")
            if retry_after and retry_after.isdigit():
                time.sleep(min(int(retry_after), 30))
                continue
        time.sleep(backoff * (2**attempt))
    raise RuntimeError("unreachable")
