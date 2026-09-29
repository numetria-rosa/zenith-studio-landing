import hashlib
import hmac
import json
from types import SimpleNamespace

import httpx
import pytest
from pydantic import BaseModel

from core.guardrails import contains_sensitive, ungrounded_numbers
from core.http import request_json
from core.llm import AnthropicLLM, FakeLLM, ModelSpec, Usage, agent_model, model_spec, strict_schema
from core.retrieval import Chunk, KeywordRetriever
from core.webhooks import MemorySeenStore, verify_sha256_signature


def test_ungrounded_numbers_flags_invented_prices():
    src = ["Cleaning is $95 and takes 45 minutes."]
    assert ungrounded_numbers("A cleaning is $95.", src) == []
    assert ungrounded_numbers("A cleaning is $85.", src) == ["$85"]
    assert ungrounded_numbers("It takes 45 minutes and costs $1,200.", src) == ["$1,200"]


def test_contains_sensitive_uses_luhn_for_cards():
    assert contains_sensitive("my card is 4242 4242 4242 4242")
    assert not contains_sensitive("call me on 614 555 0142 tomorrow")  # not Luhn-valid
    assert contains_sensitive("passport X1234567 thanks")
    assert not contains_sensitive("I would like a cleaning next week")


def test_retriever_ranks_relevant_paragraph_first():
    r = KeywordRetriever([Chunk("a", "Teeth whitening costs $350."), Chunk("b", "Parking is free behind the building.")])
    assert r.search("how much is whitening")[0].source == "a"
    assert r.search("zzz nothing") == []


def test_signature_verification():
    body = b'{"a":1}'
    good = "sha256=" + hmac.new(b"secret", body, hashlib.sha256).hexdigest()
    assert verify_sha256_signature(body, good, "secret")
    assert not verify_sha256_signature(body, good, "other")
    assert not verify_sha256_signature(body, None, "secret")
    assert not verify_sha256_signature(b'{"a": 1}', good, "secret")  # re-serialised body must fail


def test_seen_store_dedupes():
    s = MemorySeenStore()
    assert s.first_time("m1") and not s.first_time("m1")


def test_model_registry_and_env_override(monkeypatch):
    assert model_spec("claude-haiku-4-5").id == "claude-haiku-4-5-20251001"
    assert agent_model("booking_agent").id == "claude-sonnet-5-5"
    monkeypatch.setenv("SUPPORT_AGENT_MODEL", "groq-gpt-oss-20b")
    assert agent_model("support_agent").provider == "groq"


def test_usage_cost():
    spec = model_spec("claude-haiku-4-5")
    assert Usage(1_000_000, 1_000_000).cost(spec) == pytest.approx(6.0)  # $1 in + $5 out


def test_strict_schema_requires_every_property():
    class M(BaseModel):
        a: str
        b: int | None = None

    s = strict_schema(M.model_json_schema())
    assert s["required"] == ["a", "b"] and s["additionalProperties"] is False


class _Client:
    """Stands in for anthropic.Anthropic and records the request."""

    def __init__(self, response):
        self.calls, self._response = [], response
        self.messages = SimpleNamespace(create=self._create, parse=self._create)

    def _create(self, **kw):
        self.calls.append(kw)
        return self._response


def _resp(text="ok", stop="end_turn"):
    return SimpleNamespace(
        content=[SimpleNamespace(type="text", text=text)],
        stop_reason=stop,
        usage=SimpleNamespace(input_tokens=10, output_tokens=5),
        parsed_output=None,
    )


def test_anthropic_llm_omits_effort_for_haiku_and_sends_it_for_sonnet():
    haiku, sonnet = _Client(_resp()), _Client(_resp())
    AnthropicLLM(model_spec("claude-haiku-4-5"), haiku).complete("s", [{"role": "user", "content": "hi"}])
    AnthropicLLM(model_spec("claude-sonnet-5-5"), sonnet).complete("s", [{"role": "user", "content": "hi"}])
    assert "output_config" not in haiku.calls[0]
    assert sonnet.calls[0]["output_config"] == {"effort": "medium"}
    assert sonnet.calls[0]["model"] == "claude-sonnet-5-5"


def test_fake_llm_scripts_replies():
    llm = FakeLLM().say("one")
    assert llm.complete("s", []).text == "one"
    with pytest.raises(AssertionError):
        llm.complete("s", [])


def test_request_json_retries_only_retryable_statuses():
    calls = []

    def handler(req):
        calls.append(1)
        return httpx.Response(429 if len(calls) < 3 else 200, json={"ok": True}, headers={"retry-after": "0"})

    c = httpx.Client(transport=httpx.MockTransport(handler))
    assert request_json(c, "GET", "http://x/", backoff=0) == {"ok": True} and len(calls) == 3

    bad = httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(400, json={})))
    with pytest.raises(httpx.HTTPStatusError):
        request_json(bad, "GET", "http://x/", backoff=0)
