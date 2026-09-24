"""One-shot: append 8 detective cases to practice-tasks.js from _aise_judgment_tasks.py."""
from __future__ import annotations

import json
import re
from pathlib import Path

from _aise_judgment_tasks import DETECTIVE_TASKS

ROOT = Path(__file__).resolve().parents[1]
TASKS_JS = ROOT / "courses" / "ai-assisted-software-engineering" / "practice-tasks.js"
SKILL_JS = ROOT / "courses" / "ai-assisted-software-engineering" / "skill-map.js"


def flatten(raw: dict) -> dict:
    case = raw["case"]
    return {
        "id": raw["id"],
        "skill": raw["skill"],
        "tool": "detective",
        "level": raw["level"],
        "kind": "detective",
        "title": raw["title"],
        "prompt": case.get("ask", ""),
        "ticket": case.get("ticket", ""),
        "author": case.get("author", "Written by the coding agent"),
        "ask": case.get("ask", ""),
        "lang": case.get("lang", "js"),
        "code": case.get("code", ""),
        "findings": case.get("findings", []),
        "fix": case.get("fix"),
        "prerequisite": [],
    }


def js_literal(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=None)


def main() -> None:
    cases = [flatten(t) for t in DETECTIVE_TASKS]

    text = TASKS_JS.read_text(encoding="utf-8")
    if '"id": "det-01"' in text or '"id":"det-01"' in text:
        print("practice-tasks.js already has det-01")
    else:
        insert = ",\n  " + ",\n  ".join(js_literal(c) for c in cases) + "\n"
        idx = text.rfind("];\nglobal.AISE_TASKS")
        if idx < 0:
            raise SystemExit("close not found")
        text = text[:idx] + insert + text[idx:]
        TASKS_JS.write_text(text, encoding="utf-8")
        print("appended", len(cases), "detective tasks")

    skill = SKILL_JS.read_text(encoding="utf-8")
    if "det-01" not in skill:
        rows = ",\n".join(
            f'    {{ id: "{c["id"]}", skill: "ai-failure-detection", tool: "detective", level: "{c["level"]}" }}'
            for c in cases
        )
        skill = skill.replace(
            '    { id: "ct-15", skill: "integrated-flow", tool: "integrated", level: "mastery" },\n  ];',
            '    { id: "ct-15", skill: "integrated-flow", tool: "integrated", level: "mastery" },\n'
            + rows + ",\n  ];",
        )
        skill = skill.replace(
            '    review: "practice-review.html", python: "practice-python.html", integrated: "practice-integrated.html"\n  };',
            '    review: "practice-review.html", python: "practice-python.html", integrated: "practice-integrated.html",\n'
            '    detective: "practice-detective.html"\n  };',
        )
        skill = skill.replace(
            '    "integrated-flow": { id: "integrated-flow", label: "Integrated judgment" },',
            '    "integrated-flow": { id: "integrated-flow", label: "Integrated judgment" },\n'
            '    "ai-failure-detection": { id: "ai-failure-detection", label: "Finding defects in AI output" },',
        )
        skill = skill.replace(
            '    { id: "m-review", label: "Reviewing AI diffs", category: "Agent", members: ["review-judgment"], simulation: true },',
            '    { id: "m-review", label: "Reviewing AI diffs", category: "Agent", members: ["review-judgment"], simulation: true },\n'
            '    { id: "m-det", label: "AI Code Detective", category: "Agent", members: ["ai-failure-detection"] },',
        )
        skill = skill.replace(
            '    { id: "m-int", label: "End-to-end judgment", category: "Integration", members: ["integrated-flow"] },',
            '    { id: "m-int", label: "End-to-end judgment", category: "Integration", members: ["integrated-flow"], simulation: true },',
        )
        SKILL_JS.write_text(skill, encoding="utf-8")
        print("updated skill-map.js")
    else:
        print("skill-map already has det-01")


if __name__ == "__main__":
    main()
