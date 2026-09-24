# -*- coding: utf-8 -*-
"""Remap the 13-module draft onto the live 9-module contract.

Reads current module HTML into memory, writes remapped destinations, then
rewrites quiz-data.js keys. Safe to re-run: sources are snapshotted first.
"""
from __future__ import annotations

import re
from pathlib import Path

COURSE = Path(__file__).resolve().parents[1] / "courses" / "ai-assisted-software-engineering"

# source file, dest file, new module id, old section key, new section key
MAP = [
    ("module-03.html", "module-01.html", 1, "htmlStructureExercise", "htmlPageExercise"),
    ("module-04.html", "module-02.html", 2, "cssResponsiveExercise", "cssLayoutExercise"),
    ("module-05.html", "module-03.html", 3, "jsLogicExercise", "jsFunctionExercise"),
    ("module-02.html", "module-04.html", 4, "requirementsExercise", "specWritingExercise"),
    ("module-10.html", "module-05.html", 5, "reviewExercise", "diffReadingExercise"),
    ("module-09.html", "module-06.html", 6, "debugExercise", "failingTestExercise"),
    ("module-07.html", "module-07.html", 7, "aiWorkflowExercise", "featureSpecExercise"),
    ("module-12.html", "module-08.html", 8, "pythonToolExercise", "pythonScriptExercise"),
    ("module-13.html", "module-09.html", 9, "releasePlan", "releasePlan"),
]

# source module id inferred from filename
SRC_ID = {
    "module-02.html": 2,
    "module-03.html": 3,
    "module-04.html": 4,
    "module-05.html": 5,
    "module-07.html": 7,
    "module-09.html": 9,
    "module-10.html": 10,
    "module-12.html": 12,
    "module-13.html": 13,
}

QUIZ_REMAP = {3: 1, 4: 2, 5: 3, 2: 4, 10: 5, 9: 6, 7: 7, 12: 8, 13: 9}
CENTER_REMAP = {3: 1, 5: 3, 1: 9, 9: 6, 8: 7, 11: 5}


def remap_html(src: str, old_id: int, new_id: int, old_key: str, new_key: str) -> str:
    text = src
    # setSection / mount / quiz lookups first (numeric, word-bounded-ish)
    text = text.replace(f"setSection({old_id}, \"{old_key}\"", f"setSection({new_id}, \"{new_key}\"")
    text = text.replace(f"setSection({old_id}, '{old_key}'", f"setSection({new_id}, '{new_key}'")
    text = text.replace(f"ModuleKit.mount({old_id}", f"ModuleKit.mount({new_id}")
    text = text.replace(f"AISEQuizData.MODULE_QUIZZES[{old_id}]", f"AISEQuizData.MODULE_QUIZZES[{new_id}]")
    text = text.replace(f"CourseProgress.touchVisited({old_id})", f"CourseProgress.touchVisited({new_id})")
    text = re.sub(rf"ModuleKit\.mount\(\s*{old_id}\s*,", f"ModuleKit.mount({new_id},", text)

    # Visible chrome
    text = re.sub(rf"<span class=\"tag\">Module {old_id}</span>", f'<span class="tag">Module {new_id}</span>', text)
    text = re.sub(rf"Module {old_id} —", f"Module {new_id} —", text)
    text = re.sub(rf"Module {old_id} &mdash;", f"Module {new_id} &mdash;", text)
    text = re.sub(rf"Module {old_id} </title>", f"Module {new_id} </title>", text)
    text = re.sub(rf"(Stage \d+ &middot; )Module {old_id}( &middot;)", rf"\1Module {new_id}\2", text)
    text = re.sub(rf"Required exercise &middot; {old_key}", f"Required exercise &middot; {new_key}", text)

    # Cross-refs that are now wrong after the 13→9 fold
    replacements = [
        ("In Module 9 they become the tests", "In Module 6 they become the tests"),
        ("Module 10 is about branches", "Module 5 is about branches"),
        ("Module 10 starts from zero", "Module 5 starts from zero"),
        ("Skim Module 10", "Skim Module 5"),
        ("Needed from Module 10", "Needed from Module 5"),
        ("Module 13 wants a live URL", "Module 9 wants a live URL"),
        ("Module 13 grades", "Module 9 grades"),
        ("from Module 10", "from Module 5"),
        ("Modules 1 through 6", "Modules 1 through 3"),
        ("From Module 7 you need a real editor", "From Module 4 you can start Desktop Lab A; Module 7 needs the real editor"),
    ]
    for a, b in replacements:
        text = text.replace(a, b)
    return text


def remap_quiz(text: str) -> str:
    # Rewrite MODULE_QUIZZES keys. Process high ids first so 13 doesn't become 1 then 9.
    def swap_block(src: str, mapping: dict[int, int], header: str) -> str:
        # Extract each "    N: [" ... until the matching close before the next key or end
        # Safer: replace the key lines only, then the question id prefixes later.
        out = src
        for old in sorted(mapping, reverse=True):
            new = mapping[old]
            out = re.sub(rf"(?m)^    {old}: \[", f"    {new}: [", out)
        return out

    # Split MODULE_QUIZZES and CENTER_EXTRA so remaps don't collide
    mq_start = text.find("const MODULE_QUIZZES = {")
    ce_start = text.find("const CENTER_EXTRA = {")
    if mq_start < 0 or ce_start < 0:
        raise SystemExit("quiz-data markers missing")
    mq = text[mq_start:ce_start]
    rest = text[ce_start:]
    head = text[:mq_start]

    # Rebuild MODULE_QUIZZES by extracting original numbered blocks
    def extract_blocks(blob: str) -> dict[int, str]:
        blocks = {}
        for m in re.finditer(r"(?m)^    (\d+): \[", blob):
            key = int(m.group(1))
            start = m.start()
            # find next key or closing of object
            nxt = re.search(r"(?m)^    (\d+): \[", blob[m.end() :])
            end = m.end() + nxt.start() if nxt else blob.rfind("  };")
            blocks[key] = blob[start:end]
        return blocks

    mq_blocks = extract_blocks(mq)
    new_mq = ["const MODULE_QUIZZES = {\n"]
    for new_id in range(1, 10):
        old_id = {v: k for k, v in QUIZ_REMAP.items()}[new_id]
        block = mq_blocks[old_id]
        # rewrite the opening key
        block = re.sub(rf"^    {old_id}: \[", f"    {new_id}: [", block, count=1)
        new_mq.append(block if block.endswith("\n") else block + "\n")
    new_mq.append("  };\n\n  /* Extra pool for the Quiz Center, so retaking is not just the same\n")

    ce_blob = rest
    # trim the comment that was left on mq
    ce_only = ce_blob[ce_blob.find("const CENTER_EXTRA") :]
    ce_blocks = extract_blocks(ce_only)
    new_ce = ["     five questions again. */\n  const CENTER_EXTRA = {\n"]
    # keep remapped extras; drop ones we don't need
    seen = set()
    for old_id, new_id in CENTER_REMAP.items():
        if new_id in seen or old_id not in ce_blocks:
            continue
        seen.add(new_id)
        block = ce_blocks[old_id]
        block = re.sub(rf"^    {old_id}: \[", f"    {new_id}: [", block, count=1)
        new_ce.append(block if block.endswith("\n") else block + "\n")
    new_ce.append("  };\n\n  global.AISEQuizData = { MODULE_QUIZZES, CENTER_EXTRA };\n})(window);\n")

    return head + "".join(new_mq) + "".join(new_ce)


def main() -> None:
    snapshots = {}
    for src, _dest, _nid, _ok, _nk in MAP:
        snapshots[src] = (COURSE / src).read_text(encoding="utf-8")
    # also snapshot current M1 for optional extra
    m1_orig = (COURSE / "module-01.html").read_text(encoding="utf-8")
    m11 = (COURSE / "module-11.html").read_text(encoding="utf-8") if (COURSE / "module-11.html").exists() else ""

    for src, dest, new_id, old_key, new_key in MAP:
        old_id = SRC_ID[src]
        out = remap_html(snapshots[src], old_id, new_id, old_key, new_key)
        (COURSE / dest).write_text(out, encoding="utf-8")
        print(f"  {src} (M{old_id}) -> {dest} (M{new_id})  {old_key} -> {new_key}")

    # Optional extras: first-change drill and refactor studio. Not in MODULES.
    extra_banner = (
        '<div class="honestnote"><b>Optional studio extra.</b> This page is not a gated module '
        "and does not unlock the capstone. The required path is Modules 1–9.</div>\n"
    )
    m1_extra = m1_orig.replace("<title>", "<title>Optional studio — ").replace(
        '<div class="wrap">', '<div class="wrap">\n  ' + extra_banner, 1
    )
    # neutralize required-section writes so extras cannot satisfy a live gate
    m1_extra = m1_extra.replace('setSection(1, "shipFirstChange"', 'setExtra("studioFirstChange"')
    (COURSE / "module-10.html").write_text(m1_extra, encoding="utf-8")
    print("  module-01.html (original first-change) -> module-10.html (optional extra)")

    if m11:
        m11_extra = m11.replace("<title>", "<title>Optional studio — ").replace(
            '<div class="wrap">', '<div class="wrap">\n  ' + extra_banner, 1
        )
        m11_extra = m11_extra.replace('setSection(11, "refactorExercise"', 'setExtra("studioRefactor"')
        (COURSE / "module-11.html").write_text(m11_extra, encoding="utf-8")
        print("  module-11.html kept as optional refactor studio")

    for gone in ("module-12.html", "module-13.html"):
        p = COURSE / gone
        if p.exists():
            p.unlink()
            print(f"  deleted {gone} (folded into M8/M9)")

    quiz = (COURSE / "quiz-data.js").read_text(encoding="utf-8")
    (COURSE / "quiz-data.js").write_text(remap_quiz(quiz), encoding="utf-8")
    print("  quiz-data.js remapped to modules 1-9")


if __name__ == "__main__":
    main()
