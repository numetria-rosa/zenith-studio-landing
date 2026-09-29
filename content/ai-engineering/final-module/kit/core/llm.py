"""One small interface over the model providers the agents use.

Agents never import a provider SDK. They receive an `LLM` and call `complete()` (text),
`parse()` (validated pydantic object) or `run_tools()` (bounded tool loop). Which model backs an
agent is a config choice (see `models.json` and `build_llm`), so a client on a tight budget can
swap Haiku for Groq without touching agent code.

Docs this file follows:
- Claude Messages API, structured outputs (`messages.parse`), strict tools:
  https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- Groq chat completions (OpenAI-compatible) and strict JSON schema outputs:
  https://console.groq.com/docs/structured-outputs
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Literal, Protocol, TypeVar

import httpx
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

MODELS_FILE = Path(__file__).with_name("models.json")


class ModelSpec(BaseModel):
    provider: Literal["anthropic", "groq"]
    id: str
    label: str
    price_in: float  # USD per million input tokens
    price_out: float  # USD per million output tokens
    effort: Literal["low", "medium", "high"] | None = None


@dataclass
class Usage:
    input_tokens: int = 0
    output_tokens: int = 0

    def add(self, other: "Usage") -> None:
        self.input_tokens += other.input_tokens
        self.output_tokens += other.output_tokens

    def cost(self, spec: ModelSpec) -> float:
        return (self.input_tokens * spec.price_in + self.output_tokens * spec.price_out) / 1_000_000


@dataclass
class LLMResult:
    text: str
    usage: Usage = field(default_factory=Usage)
    stop_reason: str | None = None


class LLMRefusal(RuntimeError):
    """The provider declined the request (Claude `stop_reason == "refusal"`). Hand off to a human."""


class LLM(Protocol):
    spec: ModelSpec

    def complete(self, system: str, messages: list[dict[str, Any]], max_tokens: int = 4096) -> LLMResult: ...

    def parse(
        self, system: str, messages: list[dict[str, Any]], schema: type[T], max_tokens: int = 4096
    ) -> tuple[T, Usage]: ...


def load_registry() -> dict[str, Any]:
    return json.loads(MODELS_FILE.read_text(encoding="utf8"))


def model_spec(key: str) -> ModelSpec:
    entry = load_registry()["models"][key]
    return ModelSpec(**{k: entry[k] for k in ("provider", "id", "label", "price_in", "price_out", "effort")})


def agent_model(agent: str, tier: Literal["primary", "budget", "escalation"] = "primary") -> ModelSpec:
    """The recommended model for an agent. Override per client with an env var, e.g.
    SUPPORT_AGENT_MODEL=groq-gpt-oss-20b."""
    override = os.environ.get(f"{agent.upper()}_MODEL")
    return model_spec(override or load_registry()["agents"][agent][tier])


class AnthropicLLM:
    """Claude via the official SDK. Reads ANTHROPIC_API_KEY from the environment."""

    def __init__(self, spec: ModelSpec, client: Any | None = None):
        self.spec = spec
        if client is None:
            import anthropic

            client = anthropic.Anthropic()
        self.client = client

    def _config(self) -> dict[str, Any]:
        # `effort` is rejected by Haiku 4.5, so only send it when the spec asks for it.
        return {"output_config": {"effort": self.spec.effort}} if self.spec.effort else {}

    @staticmethod
    def _usage(response: Any) -> Usage:
        return Usage(response.usage.input_tokens, response.usage.output_tokens)

    def complete(self, system: str, messages: list[dict[str, Any]], max_tokens: int = 4096) -> LLMResult:
        response = self.client.messages.create(
            model=self.spec.id, max_tokens=max_tokens, system=system, messages=messages, **self._config()
        )
        if response.stop_reason == "refusal":
            raise LLMRefusal("model refused")
        text = "".join(b.text for b in response.content if b.type == "text")
        return LLMResult(text, self._usage(response), response.stop_reason)

    def parse(
        self, system: str, messages: list[dict[str, Any]], schema: type[T], max_tokens: int = 4096
    ) -> tuple[T, Usage]:
        # messages.parse derives the JSON schema from the pydantic model, sends it as
        # output_config.format, and validates the reply locally.
        response = self.client.messages.parse(
            model=self.spec.id,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
            output_format=schema,
            **self._config(),
        )
        if response.stop_reason == "refusal":
            raise LLMRefusal("model refused")
        if response.parsed_output is None:
            raise ValueError(f"no parsed output (stop_reason={response.stop_reason})")
        return response.parsed_output, self._usage(response)

    def run_tools(
        self,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        handlers: dict[str, Callable[[dict[str, Any]], Any]],
        max_steps: int = 6,
        max_tokens: int = 4096,
    ) -> LLMResult:
        """Manual, bounded tool loop. `tool_choice` stays `auto` (forced tool use returns a 400 on
        Sonnet 5.5); the tools are `strict` so arguments always match their schema. The loop stops
        after `max_steps` model calls no matter what the model wants."""
        convo = list(messages)
        total = Usage()
        for _ in range(max_steps):
            response = self.client.messages.create(
                model=self.spec.id,
                max_tokens=max_tokens,
                system=system,
                messages=convo,
                tools=tools,
                **self._config(),
            )
            total.add(self._usage(response))
            if response.stop_reason == "refusal":
                raise LLMRefusal("model refused")
            if response.stop_reason != "tool_use":
                text = "".join(b.text for b in response.content if b.type == "text")
                return LLMResult(text, total, response.stop_reason)
            convo.append({"role": "assistant", "content": response.content})
            results = []
            for block in response.content:
                if block.type != "tool_use":
                    continue
                try:
                    output = handlers[block.name](block.input)
                    results.append({"type": "tool_result", "tool_use_id": block.id, "content": json.dumps(output)})
                except Exception as exc:  # report the failure to the model instead of crashing the loop
                    results.append(
                        {"type": "tool_result", "tool_use_id": block.id, "content": str(exc), "is_error": True}
                    )
            # every tool_result for this turn goes back in ONE user message
            convo.append({"role": "user", "content": results})
        return LLMResult("", total, "max_steps")


class GroqLLM:
    """GPT-OSS on Groq through its OpenAI-compatible endpoint. Reads GROQ_API_KEY.

    Strict JSON schema outputs work on gpt-oss models; Groq does not allow structured outputs
    together with tool use or streaming, so agents that need tools (booking) use Claude."""

    BASE = "https://api.groq.com/openai/v1"

    def __init__(self, spec: ModelSpec, http: httpx.Client | None = None):
        self.spec = spec
        self.http = http or httpx.Client(timeout=60)

    def _post(self, body: dict[str, Any]) -> dict[str, Any]:
        res = self.http.post(
            f"{self.BASE}/chat/completions",
            headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
            json={"model": self.spec.id, **body},
        )
        res.raise_for_status()
        return res.json()

    @staticmethod
    def _usage(data: dict[str, Any]) -> Usage:
        u = data.get("usage", {})
        return Usage(u.get("prompt_tokens", 0), u.get("completion_tokens", 0))

    def complete(self, system: str, messages: list[dict[str, Any]], max_tokens: int = 4096) -> LLMResult:
        data = self._post({"messages": [{"role": "system", "content": system}, *messages], "max_completion_tokens": max_tokens})
        choice = data["choices"][0]
        return LLMResult(choice["message"]["content"] or "", self._usage(data), choice.get("finish_reason"))

    def parse(
        self, system: str, messages: list[dict[str, Any]], schema: type[T], max_tokens: int = 4096
    ) -> tuple[T, Usage]:
        json_schema = strict_schema(schema.model_json_schema())
        data = self._post(
            {
                "messages": [{"role": "system", "content": system}, *messages],
                "max_completion_tokens": max_tokens,
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {"name": schema.__name__, "strict": True, "schema": json_schema},
                },
            }
        )
        content = data["choices"][0]["message"]["content"]
        return schema.model_validate_json(content), self._usage(data)


def strict_schema(schema: dict[str, Any]) -> dict[str, Any]:
    """Groq strict mode needs every property in `required` and `additionalProperties: false`."""
    node = json.loads(json.dumps(schema))

    def walk(n: Any) -> None:
        if isinstance(n, dict):
            if n.get("type") == "object" and "properties" in n:
                n["required"] = list(n["properties"].keys())
                n["additionalProperties"] = False
            for v in n.values():
                walk(v)
        elif isinstance(n, list):
            for v in n:
                walk(v)

    walk(node)
    return node


class FakeLLM:
    """Scripted model for tests and demos. Queue replies with `say()` / `say_object()`."""

    def __init__(self, spec: ModelSpec | None = None):
        self.spec = spec or ModelSpec(provider="anthropic", id="fake", label="Fake", price_in=0, price_out=0)
        self.replies: list[Any] = []
        self.calls: list[dict[str, Any]] = []

    def say(self, text: str) -> "FakeLLM":
        self.replies.append(text)
        return self

    def say_object(self, obj: BaseModel) -> "FakeLLM":
        self.replies.append(obj)
        return self

    def _next(self) -> Any:
        if not self.replies:
            raise AssertionError("FakeLLM has no scripted reply left")
        return self.replies.pop(0)

    def complete(self, system: str, messages: list[dict[str, Any]], max_tokens: int = 4096) -> LLMResult:
        self.calls.append({"system": system, "messages": messages})
        return LLMResult(str(self._next()))

    def parse(
        self, system: str, messages: list[dict[str, Any]], schema: type[T], max_tokens: int = 4096
    ) -> tuple[T, Usage]:
        self.calls.append({"system": system, "messages": messages, "schema": schema})
        obj = self._next()
        return (obj if isinstance(obj, schema) else schema.model_validate(obj)), Usage()


def build_llm(spec: ModelSpec) -> LLM:
    return AnthropicLLM(spec) if spec.provider == "anthropic" else GroqLLM(spec)
