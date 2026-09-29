"""A tiny eval harness. Every agent ships cases in `evals/`; run them before each deploy and after every prompt or model change."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable


@dataclass
class EvalResult:
    total: int
    passed: int
    failures: list[dict[str, Any]]

    @property
    def rate(self) -> float:
        return self.passed / self.total if self.total else 0.0


def load_cases(path: str | Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in Path(path).read_text(encoding="utf8").splitlines() if line.strip()]


def run_cases(cases: list[dict[str, Any]], run: Callable[[dict[str, Any]], Any], check: Callable[[dict[str, Any], Any], bool]) -> EvalResult:
    failures = []
    for case in cases:
        output = run(case["input"])
        if not check(case, output):
            failures.append({"case": case, "output": output})
    return EvalResult(len(cases), len(cases) - len(failures), failures)
