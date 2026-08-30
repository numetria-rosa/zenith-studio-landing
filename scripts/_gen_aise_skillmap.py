from pathlib import Path
import re
p = Path(r"d:\zenith-studio\courses\ai-assisted-software-engineering\practice-tasks.js")
text = p.read_text(encoding="utf-8")
ids = re.findall(r'id: "([^"]+)"', text)
# pull skill tool level from each object start
objs = re.findall(r'\{ id: "([^"]+)", skill: "([^"]+)", tool: "([^"]+)", level: "([^"]+)"', text)
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
    "specs-criteria": "Specs and acceptance criteria",
    "git-workflow": "Git workflow",
    "review-judgment": "Code review judgment",
    "testing-assertions": "Writing assertions",
    "testing-mutations": "Mutation-style tests",
    "python-basics": "Python basics",
    "python-strings": "Python strings",
    "python-json": "Python and JSON",
    "python-files": "Python text/files",
    "integrated-flow": "Integrated judgment",
}
lines = ['(function (global) {', '  const TOOL_LIBRARIES = {',
         '    html: "practice-html.html", css: "practice-css.html", js: "practice-js.html",',
         '    specs: "practice-specs.html", git: "practice-git.html", testing: "practice-testing.html",',
         '    review: "practice-review.html", python: "practice-python.html", integrated: "practice-integrated.html"',
         '  };', '  const TASKS = [']
for tid, skill, tool, level in objs:
    lines.append(f'    {{ id: "{tid}", skill: "{skill}", tool: "{tool}", level: "{level}" }},')
lines.append('  ];')
lines.append('  const SKILL_META = {')
for k, lab in SKILL_LABELS.items():
    lines.append(f'    "{k}": {{ label: {k!r} and "{lab}", id: "{k}" }},'.replace(" and ", ": "))
# fix that hack
lines = [ln for ln in lines if not ln.startswith('    "') or "SKILL" in "".join(lines[:20])]
# rewrite SKILL_META cleanly
head = ['(function (global) {', '  const TOOL_LIBRARIES = {',
         '    html: "practice-html.html", css: "practice-css.html", js: "practice-js.html",',
         '    specs: "practice-specs.html", git: "practice-git.html", testing: "practice-testing.html",',
         '    review: "practice-review.html", python: "practice-python.html", integrated: "practice-integrated.html"',
         '  };', '  const TASKS = [']
for tid, skill, tool, level in objs:
    head.append(f'    {{ id: "{tid}", skill: "{skill}", tool: "{tool}", level: "{level}" }},')
head.append('  ];')
head.append('  const SKILL_META = {')
for k, lab in SKILL_LABELS.items():
    head.append(f'    "{k}": {{ id: "{k}", label: "{lab}" }},')
head.append('  };')
head.append('''  const MASTER_SKILLS = [
    { id: "m-html", label: "HTML you can write", category: "Literacy", members: ["html-structure","html-links","html-forms","html-images","html-tables"] },
    { id: "m-css", label: "CSS that matches a spec", category: "Literacy", members: ["css-selectors","css-box","css-layout","css-typography","css-visibility"] },
    { id: "m-js", label: "JavaScript you can read", category: "Literacy", members: ["js-functions","js-arrays","js-strings","js-objects"] },
    { id: "m-specs", label: "Specs for an agent", category: "Agent", members: ["specs-criteria"], simulation: true },
    { id: "m-git", label: "Git judgment", category: "Agent", members: ["git-workflow"], simulation: true },
    { id: "m-review", label: "Reviewing AI diffs", category: "Agent", members: ["review-judgment"], simulation: true },
    { id: "m-test", label: "Tests that can fail", category: "Quality", members: ["testing-assertions","testing-mutations"] },
    { id: "m-py", label: "Python scripts", category: "Scripts", members: ["python-basics","python-strings","python-json","python-files"] },
    { id: "m-int", label: "End-to-end judgment", category: "Integration", members: ["integrated-flow"] },
    { id: "m-port", label: "Portfolio delivery", category: "Portfolio", special: "portfolio" },
  ];
  function tasksForMasterSkill(id) {
    const m = MASTER_SKILLS.find((x) => x.id === id);
    if (!m || !m.members) return [];
    return TASKS.filter((t) => m.members.indexOf(t.skill) !== -1);
  }
  function tierFromTaskSubset(subset) {
    if (typeof PracticeProgress === "undefined") return { tier: "not-started", passedCount: 0, totalCount: subset.length, pct: 0 };
    const passed = subset.filter((t) => PracticeProgress.getTaskState(t.id).passed).length;
    let tier = "not-started";
    if (passed >= 12) tier = "mastered";
    else if (passed >= 7) tier = "competent";
    else if (passed >= 3) tier = "practicing";
    else if (passed >= 1) tier = "introduced";
    return { tier, passedCount: passed, totalCount: subset.length, pct: subset.length ? Math.round((passed / subset.length) * 100) : 0 };
  }
  function portfolioTier() {
    if (typeof CourseProgress === "undefined") return { tier: "not-started", passedCount: 0, totalCount: 8, pct: 0 };
    const projects = CourseProgress.PROJECTS || [];
    const completed = projects.filter((p) => CourseProgress.getProject(p.id).completed).length;
    let tier = "not-started";
    if (completed >= 6) tier = "mastered";
    else if (completed >= 4) tier = "competent";
    else if (completed >= 2) tier = "practicing";
    else if (completed >= 1) tier = "introduced";
    return { tier, passedCount: completed, totalCount: projects.length, pct: projects.length ? Math.round((completed / projects.length) * 100) : 0 };
  }
  function masterSkillProgress(id) {
    const m = MASTER_SKILLS.find((x) => x.id === id);
    if (!m) return { tier: "not-started", passedCount: 0, totalCount: 0, pct: 0 };
    if (m.special === "portfolio") return portfolioTier();
    return tierFromTaskSubset(tasksForMasterSkill(id));
  }
  function allMasterSkillProgress() {
    return MASTER_SKILLS.map((m) => Object.assign({ id: m.id, label: m.label, category: m.category, simulation: !!m.simulation }, masterSkillProgress(m.id)));
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
    TOOL_LIBRARIES, TASKS, SKILL_META, MASTER_SKILLS,
    tasksForMasterSkill, masterSkillProgress, allMasterSkillProgress,
    portfolioTier, recommendNextAcrossCourse, totalTasksPassed,
  };
})(window);
''')
out = Path(r"d:\zenith-studio\courses\ai-assisted-software-engineering\skill-map.js")
out.write_text("\n".join(head), encoding="utf-8")
print("skill-map", len(objs), "tasks")
