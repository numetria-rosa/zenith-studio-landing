# -*- coding: utf-8 -*-
"""Generate skill-map.js from the task catalog.

Reads practice-tasks.js so the skill map can never drift from the real task
inventory, then emits the master-skill rollups the mastery profile and roadmap
render.
"""
import io
import os
import re
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
COURSE = os.path.join(os.path.dirname(HERE), "courses", "ai-assisted-software-engineering")
SRC = os.path.join(COURSE, "practice-tasks.js")
OUT = os.path.join(COURSE, "skill-map.js")

text = io.open(SRC, encoding="utf-8").read()
objs = re.findall(r'\{ id: "([^"]+)", skill: "([^"]+)", tool: "([^"]+)", level: "([^"]+)"', text)
if not objs:
    raise SystemExit("could not parse any tasks out of practice-tasks.js")

total_ids = len(re.findall(r'\{ id: "', text))
if len(objs) != total_ids:
    raise SystemExit("parsed %d tasks but the file declares %d; field order changed"
                     % (len(objs), total_ids))

TOOL_LIBRARIES = [
    ("html", "practice-html.html"),
    ("css", "practice-css.html"),
    ("js", "practice-js.html"),
    ("specs", "practice-specs.html"),
    ("git", "practice-git.html"),
    ("testing", "practice-testing.html"),
    ("review", "practice-review.html"),
    ("detective", "practice-detective.html"),
    ("python", "practice-python.html"),
    ("integrated", "practice-integrated.html"),
]

SKILL_LABELS = {
    "html-structure": "HTML structure",
    "html-links": "HTML links",
    "html-forms": "HTML forms",
    "html-images": "HTML images",
    "html-tables": "HTML tables",
    "css-selectors": "CSS selectors",
    "css-box": "CSS box model",
    "css-layout": "CSS layout",
    "css-typography": "CSS typography",
    "css-visibility": "CSS visibility",
    "js-functions": "JavaScript functions",
    "js-arrays": "JavaScript arrays",
    "js-strings": "JavaScript strings",
    "js-objects": "JavaScript objects",
    "specs-criteria": "Requirements and acceptance criteria",
    "git-workflow": "Git workflow",
    "review-judgment": "Reviewing an AI diff",
    "ai-failure-detection": "Detecting AI failures",
    "testing-assertions": "Writing assertions",
    "testing-mutations": "Tests that can fail",
    "python-basics": "Python basics",
    "python-strings": "Python strings",
    "python-json": "Python and JSON",
    "python-files": "Python text and files",
    "integrated-flow": "End-to-end tickets",
}

# Every skill present in the catalog must have a label, or the mastery profile
# renders a blank row.
missing = sorted({s for _, s, _, _ in objs} - set(SKILL_LABELS))
if missing:
    raise SystemExit("no label for skills: %s" % ", ".join(missing))

MASTER_SKILLS = """  const MASTER_SKILLS = [
    { id: "m-specs", label: "Requirements you can hand over", category: "Engineering", members: ["specs-criteria"] },
    { id: "m-html", label: "HTML you can write", category: "The web", members: ["html-structure","html-links","html-forms","html-images","html-tables"] },
    { id: "m-css", label: "CSS that matches a spec", category: "The web", members: ["css-selectors","css-box","css-layout","css-typography","css-visibility"] },
    { id: "m-js", label: "JavaScript you can defend", category: "The web", members: ["js-functions","js-arrays","js-strings","js-objects"] },
    { id: "m-detective", label: "Catching what the AI got wrong", category: "Working with AI", members: ["ai-failure-detection"] },
    { id: "m-review", label: "Reviewing an AI pull request", category: "Working with AI", members: ["review-judgment"] },
    { id: "m-test", label: "Tests that can fail", category: "Discipline", members: ["testing-assertions","testing-mutations"] },
    { id: "m-git", label: "Git under your own hands", category: "Discipline", members: ["git-workflow"] },
    { id: "m-py", label: "Python for tools", category: "Ship", members: ["python-basics","python-strings","python-json","python-files"] },
    { id: "m-int", label: "Whole tickets, end to end", category: "Ship", members: ["integrated-flow"] },
    { id: "m-port", label: "Portfolio delivery", category: "Ship", special: "portfolio" },
  ];
"""

BODY = '''  function tasksForMasterSkill(id) {
    const m = MASTER_SKILLS.find((x) => x.id === id);
    if (!m || !m.members) return [];
    return TASKS.filter((t) => m.members.indexOf(t.skill) !== -1);
  }
  /* Tiers are proportional, not absolute counts. The tracks are deliberately
     different sizes -- 40 JavaScript tasks against 6 review pull requests --
     so a fixed "12 passed = mastered" made the smaller tracks unmasterable. */
  function tierFor(passed, total) {
    const pct = total ? Math.round((passed / total) * 100) : 0;
    let tier = "not-started";
    if (pct >= 90) tier = "mastered";
    else if (pct >= 60) tier = "competent";
    else if (pct >= 30) tier = "practicing";
    else if (passed >= 1) tier = "introduced";
    return { tier, passedCount: passed, totalCount: total, pct };
  }
  function tierFromTaskSubset(subset) {
    if (typeof PracticeProgress === "undefined") return tierFor(0, subset.length);
    return tierFor(subset.filter((t) => PracticeProgress.getTaskState(t.id).passed).length, subset.length);
  }
  function portfolioTier() {
    if (typeof CourseProgress === "undefined") return tierFor(0, 0);
    const projects = CourseProgress.PROJECTS || [];
    return tierFor(projects.filter((p) => CourseProgress.getProject(p.id).completed).length, projects.length);
  }
  function masterSkillProgress(id) {
    const m = MASTER_SKILLS.find((x) => x.id === id);
    if (!m) return tierFor(0, 0);
    if (m.special === "portfolio") return portfolioTier();
    return tierFromTaskSubset(tasksForMasterSkill(id));
  }
  function allMasterSkillProgress() {
    return MASTER_SKILLS.map((m) => Object.assign(
      { id: m.id, label: m.label, category: m.category, simulation: !!m.simulation },
      masterSkillProgress(m.id)));
  }
  function recommendNextAcrossCourse() {
    if (typeof PracticeProgress === "undefined") return null;
    for (const t of TASKS) {
      if (!PracticeProgress.getTaskState(t.id).passed) return t;
    }
    return null;
  }
  function totalTasksPassed() {
    if (typeof PracticeProgress === "undefined") return 0;
    return TASKS.filter((t) => PracticeProgress.getTaskState(t.id).passed).length;
  }
  global.SkillMap = {
    TOOL_LIBRARIES, TASKS, SKILL_META, MASTER_SKILLS, TOOL_COUNTS,
    tasksForMasterSkill, masterSkillProgress, allMasterSkillProgress,
    portfolioTier, recommendNextAcrossCourse, totalTasksPassed, tierFor,
  };
})(window);
'''

counts = Counter(tool for _, _, tool, _ in objs)

out = ["/* Generated from practice-tasks.js by scripts/_gen_aise_skillmap.py. */",
       "(function (global) {",
       "  const TOOL_LIBRARIES = {"]
out += ["    %s: \"%s\"," % (tool, page) for tool, page in TOOL_LIBRARIES]
out += ["  };",
        "  /* Real per-library counts, so pages never advertise a number the",
        "     catalog cannot back up. */",
        "  const TOOL_COUNTS = {"]
out += ["    %s: %d," % (tool, counts.get(tool, 0)) for tool, _ in TOOL_LIBRARIES]
out += ["  };", "  const TASKS = ["]
out += ['    { id: "%s", skill: "%s", tool: "%s", level: "%s" },' % o for o in objs]
out += ["  ];", "  const SKILL_META = {"]
out += ['    "%s": { id: "%s", label: "%s" },' % (k, k, v) for k, v in SKILL_LABELS.items()]
out += ["  };", MASTER_SKILLS.rstrip("\n"), BODY]

with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(out))

unknown = sorted(set(counts) - {t for t, _ in TOOL_LIBRARIES})
if unknown:
    raise SystemExit("catalog has tools with no library page: %s" % ", ".join(unknown))
print("skill-map: %d tasks" % len(objs), dict(counts))
