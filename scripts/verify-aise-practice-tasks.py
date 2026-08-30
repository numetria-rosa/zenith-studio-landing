"""Structural sweep of AI-Assisted Software Engineering practice tasks.

Proves each id is unique, 1:1 with skill-map.js, and has the grader hook
practice-kit.js actually calls. Does not execute Cursor, Git, or click graders.
"""
from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "courses" / "ai-assisted-software-engineering"
EXPECTED = 200

KIND_HOOKS = {
    "html": ("checks",),
    "css": ("checks",),
    "js": ("functionName", "testCases"),
    "python": ("functionName", "testCases"),
    "testing": ("functionName", "goodImpl", "badImpl"),
    "choice": ("correct",),
}


def extract_array(text: str, marker: str) -> str:
    start = text.find(marker)
    if start < 0:
        raise SystemExit(f"{marker} not found")
    i = text.find("[", start)
    if i < 0:
        raise SystemExit(f"{marker} is not an array")
    depth = 0
    in_str = None
    escape = False
    for j in range(i, len(text)):
        ch = text[j]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_str:
                in_str = None
            continue
        if ch in ("'", '"', "`"):
            in_str = ch
            continue
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return text[i : j + 1]
    raise SystemExit("Unclosed array")


def split_objects(array_src: str) -> list[str]:
    body = array_src.strip()
    if body.startswith("["):
        body = body[1:-1]
    objs = []
    depth = 0
    in_str = None
    escape = False
    start = None
    for j, ch in enumerate(body):
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_str:
                in_str = None
            continue
        if ch in ("'", '"', "`"):
            in_str = ch
            continue
        if ch == "{":
            if depth == 0:
                start = j
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start is not None:
                objs.append(body[start : j + 1])
                start = None
    return objs


def parse_id(block: str) -> str | None:
    m = re.search(r'\bid\s*:\s*"([^"]+)"', block)
    return m.group(1) if m else None


def parse_kind(block: str) -> str | None:
    m = re.search(r'\bkind\s*:\s*"([^"]+)"', block)
    return m.group(1) if m else None


def field_present(block: str, name: str) -> bool:
    return re.search(rf"\b{re.escape(name)}\s*:", block) is not None


def main() -> int:
    tasks_text = (ROOT / "practice-tasks.js").read_text(encoding="utf-8")
    sm_text = (ROOT / "skill-map.js").read_text(encoding="utf-8")
    blocks = split_objects(extract_array(tasks_text, "const TASKS = "))
    sm_ids = [i for i in (parse_id(b) for b in split_objects(extract_array(sm_text, "const TASKS = "))) if i]

    all_ids: list[str] = []
    failures: list[str] = []
    counts: dict[str, int] = {}

    for block in blocks:
        tid = parse_id(block)
        kind = parse_kind(block)
        if not tid:
            failures.append("object without id")
            continue
        all_ids.append(tid)
        if not kind:
            failures.append(f"{tid}: missing kind")
            continue
        counts[kind] = counts.get(kind, 0) + 1
        hooks = KIND_HOOKS.get(kind)
        if not hooks:
            failures.append(f"{tid}: unknown kind {kind}")
            continue
        for hook in hooks:
            if not field_present(block, hook):
                failures.append(f"{tid}: missing {hook}")

    unique = set(all_ids)
    if len(all_ids) != len(unique):
        dups = [k for k, n in Counter(all_ids).items() if n > 1]
        failures.append("duplicate ids: " + ", ".join(dups))
    if unique != set(sm_ids):
        only_lib = sorted(unique - set(sm_ids))
        only_sm = sorted(set(sm_ids) - unique)
        if only_lib:
            failures.append("in tasks but not skill-map: " + ", ".join(only_lib[:20]))
        if only_sm:
            failures.append("in skill-map but not tasks: " + ", ".join(only_sm[:20]))
    if len(unique) != EXPECTED:
        failures.append(f"expected {EXPECTED} unique ids, found {len(unique)}")

    required = ROOT / "starters" / "northline-landing" / "index.html"
    if not required.exists():
        failures.append("missing starters/northline-landing/index.html")

    print("Kind counts:")
    for k, n in sorted(counts.items()):
        print(f"  {k}: {n}")
    print(f"Unique ids: {len(unique)}")
    print(f"Skill-map ids: {len(sm_ids)}")
    if failures:
        print("FAILURES:")
        for f in failures:
            print("  -", f)
        return 1
    print(f"{EXPECTED}/{EXPECTED} tasks unique, mapped, and gradeable.")
    print("Not claimed: live Cursor/GitHub, or a human clicking every grader.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
