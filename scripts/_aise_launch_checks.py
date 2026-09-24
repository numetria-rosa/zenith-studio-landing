"""Headless checks for AISE launch fixes. Does not claim to be a student walkthrough."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "courses" / "ai-assisted-software-engineering"


def fail(msg: str) -> None:
    print("FAIL:", msg)
    sys.exit(1)


def main() -> int:
    tasks = (COURSE / "practice-tasks.js").read_text(encoding="utf-8")
    progress = (COURSE / "course-progress.js").read_text(encoding="utf-8")
    m13 = (COURSE / "module-13.html").read_text(encoding="utf-8")
    projects = (COURSE / "projects.html").read_text(encoding="utf-8")
    syllabus = (COURSE / "syllabus.html").read_text(encoding="utf-8")
    kit = (COURSE / "practice-kit.js").read_text(encoding="utf-8")

    if '"value": "correct"' in tasks:
        fail("MCQ options still use value=correct")
    if "if (m.id === CAPSTONE_ID) return;" in progress:
        fail("gateCurrentPage still skips the capstone")
    if "function isLiveAppUrl" not in progress:
        fail("isLiveAppUrl missing")
    if "isLiveAppUrl" not in m13:
        fail("module-13 does not reject github.com as live URL")
    if "indexOf(9)" in projects:
        fail("projects.html still gates on module 9")
    if "13 sequential" not in syllabus and "Thirteen Northline" not in syllabus:
        fail("syllabus still not 13-module")
    if 'task.kind === "detective"' not in kit:
        fail("PracticeKit has no detective branch")

    # js-f37 / js-f39 names line up
    if "functionName: \"partition\"" not in tasks or "function partition(xs)" not in tasks:
        fail("js-f37 starter/functionName mismatch")
    if "functionName: \"add\"" not in tasks or "function add(a, b)" not in tasks:
        fail("js-f39 starter/functionName mismatch")

    # Grade js-f37 / js-f39 with node
    js = r"""
function grade(fnName, student, cases) {
  let fn;
  try {
    fn = new Function(student + "\n; return typeof " + fnName + " === 'function' ? " + fnName + " : null;")();
  } catch (e) { return { ok: false, err: String(e) }; }
  if (!fn) return { ok: false, err: "missing " + fnName };
  for (const tc of cases) {
    const got = fn.apply(null, tc.args);
    if (JSON.stringify(got) !== JSON.stringify(tc.expected)) {
      return { ok: false, err: tc.name + " got " + JSON.stringify(got) };
    }
  }
  return { ok: true };
}
const good37 = grade("partition", "function partition(xs){ const e=[], o=[]; for (const x of xs) (x%2===0?e:o).push(x); return [e,o]; }",
  [{name:"mix", args:[[1,2,3,4]], expected:[[2,4],[1,3]]}]);
const bad37 = grade("partition", "function partition_even(xs){ return xs; }",
  [{name:"mix", args:[[1,2,3,4]], expected:[[2,4],[1,3]]}]);
const good39 = grade("add", "function add(a,b){ return a+b; }", [{name:"2+3", args:[2,3], expected:5}]);
const cheat = grade("add", "function add(a,b){ return 0; }", [{name:"2+3", args:[2,3], expected:5}]);
console.log(JSON.stringify({ good37, bad37, good39, cheat }));
"""
    out = subprocess.check_output(["node", "-e", js], text=True)
    result = json.loads(out)
    if not result["good37"]["ok"]:
        fail("genuine partition solution failed: " + str(result["good37"]))
    if result["bad37"]["ok"]:
        fail("mismatched starter name still 'passes' js-f37")
    if not result["good39"]["ok"]:
        fail("genuine add solution failed")
    if result["cheat"]["ok"]:
        fail("return 0 passed add")

    print("Static launch checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
