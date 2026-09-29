"""Support Agent: answers customer questions from the client's own knowledge base, or hands off.

Pipeline (each step is a course module):
  sensitive-data check -> retrieve -> draft -> grounding check -> (retry once) -> send or hand off
"""

from __future__ import annotations

from dataclasses import dataclass, field

from core.config import ClientConfig
from core.guardrails import contains_sensitive, mentions_forbidden, ungrounded_numbers
from core.llm import LLM, Usage
from core.retrieval import Retriever

from .prompts import HANDOFF_LINE, system_prompt, user_prompt


@dataclass
class Answer:
    text: str
    handoff: bool
    reason: str = ""
    sources: list[str] = field(default_factory=list)
    usage: Usage = field(default_factory=Usage)


class SupportAgent:
    def __init__(self, client: ClientConfig, llm: LLM, retriever: Retriever, escalation_llm: LLM | None = None):
        self.client, self.llm, self.retriever, self.escalation_llm = client, llm, retriever, escalation_llm

    def answer(self, question: str, history: list[dict[str, str]] | None = None) -> Answer:
        if contains_sensitive(question):
            return Answer(
                "Thanks. For your security please don't send card or passport details here; "
                "our team will collect documents securely.",
                handoff=True,
                reason="sensitive data",
            )

        chunks = self.retriever.search(question)
        excerpts = [c.text for c in chunks]
        sources = sorted({c.source for c in chunks})
        if not excerpts:
            return Answer(HANDOFF_LINE, handoff=True, reason="nothing relevant in the knowledge base")

        usage = Usage()
        messages = [*(history or []), {"role": "user", "content": user_prompt(question, excerpts)}]
        system = system_prompt(self.client)

        for attempt in range(2):  # one retry, on the stronger model when configured
            model = self.escalation_llm if attempt == 1 and self.escalation_llm else self.llm
            result = model.complete(system, messages)
            usage.add(result.usage)
            draft = result.text.strip()
            if draft == HANDOFF_LINE:
                return Answer(draft, handoff=True, reason="model said it could not answer", sources=sources, usage=usage)
            bad = ungrounded_numbers(draft, [question, *excerpts])
            if not bad and not mentions_forbidden(draft, self.client.forbidden_phrases):
                return Answer(draft, handoff=False, sources=sources, usage=usage)

        return Answer(HANDOFF_LINE, handoff=True, reason="draft failed the grounding check twice", sources=sources, usage=usage)
