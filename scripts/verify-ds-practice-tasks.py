"""Structural sweep of every Data Science practice task.

This does not execute Tableau/Power BI Desktop or click 315 graders in a
browser. It proves each catalog id is unique, 1:1 with skill-map.js, and
has the grader hook that library actually calls.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "courses" / "data-science"
EXPECTED = 315

LIBRARIES = {
    "practice-sql.html": ("sql", ("referenceSql",)),
    "practice-excel.html": ("excel", ("referenceFormula",)),
    "practice-python.html": ("python", ("functionName",)),
    "practice-statistics.html": ("statistics", ("functionName",)),
    "practice-automation.html": ("automation", ("functionName",)),
    "practice-tableau.html": ("tableau", ("build",)),
    "practice-powerbi.html": ("powerbi", ("build",)),
    "practice-integrated.html": ("integrated", ("build",)),
}

def extract_tasks_array(text: str) -> str:
    marker = "const TASKS = ["
    start = text.find(marker)
    if start < 0:
        raise SystemExit("const TASKS = [ not found")
    i = start + len("const TASKS = ")
    if text[i] != "[":
        raise SystemExit("TASKS is not an array")
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
    raise SystemExit("Unclosed TASKS array")


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


def field_present(block: str, name: str) -> bool:
    return re.search(rf"\b{re.escape(name)}\s*[:(]", block) is not None


def parse_id(block: str) -> str | None:
    m = re.search(r'\bid\s*:\s*"([^"]+)"', block)
    return m.group(1) if m else None


def skillmap_ids(text: str) -> list[str]:
    arr = extract_tasks_array(text)
    return [i for i in (parse_id(b) for b in split_objects(arr)) if i]


def gradeable(tool: str, block: str) -> str | None:
    if tool == "sql" and not field_present(block, "referenceSql"):
        return "missing referenceSql"
    if tool == "excel" and not field_present(block, "referenceFormula"):
        return "missing referenceFormula"
    if tool in ("python", "statistics", "automation"):
        if not field_present(block, "functionName"):
            return "missing functionName"
        if tool == "python" and not any(field_present(block, k) for k in ("testCases", "checks", "referenceCode")):
            return "missing testCases/checks/referenceCode"
        if tool == "statistics" and not any(field_present(block, k) for k in ("refCode", "checks", "referenceCode")):
            return "missing refCode/checks"
        if tool == "automation" and not any(field_present(block, k) for k in ("testCases", "checks", "referenceCode")):
            return "missing testCases/checks"
    if tool in ("tableau", "powerbi", "integrated") and not field_present(block, "build"):
        return "missing build()"
    return None


def main() -> int:
    all_ids: list[str] = []
    failures: list[str] = []
    counts: dict[str, int] = {}

    for filename, (tool, _req) in LIBRARIES.items():
        path = ROOT / filename
        text = path.read_text(encoding="utf-8")
        blocks = split_objects(extract_tasks_array(text))
        counts[tool] = len(blocks)
        for block in blocks:
            tid = parse_id(block)
            if not tid:
                failures.append(f"{filename}: object without id")
                continue
            all_ids.append(tid)
            why = gradeable(tool, block)
            if why:
                failures.append(f"{filename} {tid}: {why}")

    sm_ids = skillmap_ids((ROOT / "skill-map.js").read_text(encoding="utf-8"))
    unique = set(all_ids)
    if len(all_ids) != len(unique):
        from collections import Counter
        dups = [k for k, n in Counter(all_ids).items() if n > 1]
        failures.append("duplicate ids: " + ", ".join(dups))
    if unique != set(sm_ids):
        only_lib = sorted(unique - set(sm_ids))
        only_sm = sorted(set(sm_ids) - unique)
        if only_lib:
            failures.append("in libraries but not skill-map: " + ", ".join(only_lib[:20]))
        if only_sm:
            failures.append("in skill-map but not libraries: " + ", ".join(only_sm[:20]))
    if len(unique) != EXPECTED:
        failures.append(f"expected {EXPECTED} unique ids, found {len(unique)}")

    print("Library counts:")
    for tool, n in counts.items():
        print(f"  {tool}: {n}")
    print(f"Unique ids: {len(unique)}")
    print(f"Skill-map ids: {len(sm_ids)}")
    if failures:
        print("FAILURES:")
        for f in failures:
            print("  -", f)
        print(f"{len(unique) - len(failures)} / {EXPECTED} clean (see failures)")
        return 1
    print(f"{EXPECTED}/{EXPECTED} tasks unique, mapped, and gradeable.")
    print("Not claimed: live Desktop execution, or a human clicking every grader.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
