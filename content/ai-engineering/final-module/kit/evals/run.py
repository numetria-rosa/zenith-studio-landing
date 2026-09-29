"""Run an agent's eval cases against the REAL model. This spends API credits, so it is not part of `pytest`.

    python -m evals.run support_agent sunrise-dental

Run it before every deploy and after any prompt, model or knowledge-base change. Add a case every time a real
conversation goes wrong, so the same mistake can never ship twice.
"""

from __future__ import annotations

import sys
from pathlib import Path

from agents.support_agent.agent import SupportAgent
from core.config import load_client
from core.evals import load_cases, run_cases
from core.llm import agent_model, build_llm
from core.retrieval import KeywordRetriever, load_chunks

ROOT = Path(__file__).resolve().parents[1]


def check(case: dict, answer) -> bool:
    expect = case["expect"]
    text = answer.text.lower()
    return (
        answer.handoff == expect["handoff"]
        and all(s.lower() in text for s in expect.get("contains", []))
        and not any(s.lower() in text for s in expect.get("not_contains", []))
    )


def main(agent: str, client_id: str) -> int:
    if agent != "support_agent":
        raise SystemExit("only support_agent has an eval runner so far; copy this file for the others")
    client = load_client(ROOT / "clients" / f"{client_id}.json")
    retriever = KeywordRetriever(load_chunks(ROOT / "clients" / client.kb_dir))
    sa = SupportAgent(client, build_llm(agent_model(agent)), retriever, build_llm(agent_model(agent, "escalation")))
    result = run_cases(load_cases(ROOT / "evals" / f"{agent}.jsonl"), lambda i: sa.answer(i["question"]), check)
    print(f"{result.passed}/{result.total} passed ({result.rate:.0%})")
    for f in result.failures:
        print("FAILED:", f["case"]["input"]["question"], "->", f["output"].text)
    return 0 if result.rate == 1.0 else 1


if __name__ == "__main__":
    raise SystemExit(main(*sys.argv[1:3]))
