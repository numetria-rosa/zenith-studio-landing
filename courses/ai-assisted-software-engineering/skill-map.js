(function (global) {
  const TOOL_LIBRARIES = {
    html: "practice-html.html", css: "practice-css.html", js: "practice-js.html",
    specs: "practice-specs.html", git: "practice-git.html", testing: "practice-testing.html",
    review: "practice-review.html", python: "practice-python.html", integrated: "practice-integrated.html"
  };
  const TASKS = [
    { id: "html-f01", skill: "html-structure", tool: "html", level: "guided" },
    { id: "html-f02", skill: "html-structure", tool: "html", level: "guided" },
    { id: "html-f03", skill: "html-structure", tool: "html", level: "guided" },
    { id: "html-f04", skill: "html-links", tool: "html", level: "guided" },
    { id: "html-f05", skill: "html-forms", tool: "html", level: "guided" },
    { id: "html-f06", skill: "html-structure", tool: "html", level: "semiguided" },
    { id: "html-f07", skill: "html-images", tool: "html", level: "semiguided" },
    { id: "html-f08", skill: "html-forms", tool: "html", level: "semiguided" },
    { id: "html-f09", skill: "html-tables", tool: "html", level: "semiguided" },
    { id: "html-f10", skill: "html-structure", tool: "html", level: "challenge" },
    { id: "html-f11", skill: "html-forms", tool: "html", level: "challenge" },
    { id: "html-f12", skill: "html-links", tool: "html", level: "challenge" },
    { id: "html-f13", skill: "html-structure", tool: "html", level: "guided" },
    { id: "html-f14", skill: "html-structure", tool: "html", level: "semiguided" },
    { id: "html-f15", skill: "html-forms", tool: "html", level: "guided" },
    { id: "html-f16", skill: "html-images", tool: "html", level: "guided" },
    { id: "html-f17", skill: "html-structure", tool: "html", level: "challenge" },
    { id: "html-f18", skill: "html-tables", tool: "html", level: "challenge" },
    { id: "html-f19", skill: "html-forms", tool: "html", level: "mastery" },
    { id: "html-f20", skill: "html-structure", tool: "html", level: "mastery" },
    { id: "css-f01", skill: "css-selectors", tool: "css", level: "guided" },
    { id: "css-f02", skill: "css-box", tool: "css", level: "guided" },
    { id: "css-f03", skill: "css-box", tool: "css", level: "guided" },
    { id: "css-f04", skill: "css-layout", tool: "css", level: "guided" },
    { id: "css-f05", skill: "css-layout", tool: "css", level: "semiguided" },
    { id: "css-f06", skill: "css-typography", tool: "css", level: "guided" },
    { id: "css-f07", skill: "css-selectors", tool: "css", level: "semiguided" },
    { id: "css-f08", skill: "css-box", tool: "css", level: "semiguided" },
    { id: "css-f09", skill: "css-layout", tool: "css", level: "challenge" },
    { id: "css-f10", skill: "css-visibility", tool: "css", level: "guided" },
    { id: "css-f11", skill: "css-box", tool: "css", level: "challenge" },
    { id: "css-f12", skill: "css-typography", tool: "css", level: "semiguided" },
    { id: "css-f13", skill: "css-selectors", tool: "css", level: "challenge" },
    { id: "css-f14", skill: "css-layout", tool: "css", level: "guided" },
    { id: "css-f15", skill: "css-box", tool: "css", level: "guided" },
    { id: "css-f16", skill: "css-layout", tool: "css", level: "semiguided" },
    { id: "css-f17", skill: "css-visibility", tool: "css", level: "semiguided" },
    { id: "css-f18", skill: "css-typography", tool: "css", level: "challenge" },
    { id: "css-f19", skill: "css-layout", tool: "css", level: "mastery" },
    { id: "css-f20", skill: "css-box", tool: "css", level: "mastery" },
    { id: "js-f01", skill: "js-functions", tool: "js", level: "guided" },
    { id: "js-f02", skill: "js-functions", tool: "js", level: "guided" },
    { id: "js-f03", skill: "js-functions", tool: "js", level: "guided" },
    { id: "js-f04", skill: "js-arrays", tool: "js", level: "guided" },
    { id: "js-f05", skill: "js-arrays", tool: "js", level: "guided" },
    { id: "js-f06", skill: "js-functions", tool: "js", level: "semiguided" },
    { id: "js-f07", skill: "js-strings", tool: "js", level: "guided" },
    { id: "js-f08", skill: "js-strings", tool: "js", level: "semiguided" },
    { id: "js-f09", skill: "js-arrays", tool: "js", level: "semiguided" },
    { id: "js-f10", skill: "js-objects", tool: "js", level: "guided" },
    { id: "js-f11", skill: "js-functions", tool: "js", level: "semiguided" },
    { id: "js-f12", skill: "js-arrays", tool: "js", level: "challenge" },
    { id: "js-f13", skill: "js-strings", tool: "js", level: "challenge" },
    { id: "js-f14", skill: "js-strings", tool: "js", level: "guided" },
    { id: "js-f15", skill: "js-arrays", tool: "js", level: "guided" },
    { id: "js-f16", skill: "js-objects", tool: "js", level: "semiguided" },
    { id: "js-f17", skill: "js-arrays", tool: "js", level: "challenge" },
    { id: "js-f18", skill: "js-arrays", tool: "js", level: "semiguided" },
    { id: "js-f19", skill: "js-strings", tool: "js", level: "challenge" },
    { id: "js-f20", skill: "js-functions", tool: "js", level: "mastery" },
    { id: "js-f21", skill: "js-functions", tool: "js", level: "guided" },
    { id: "js-f22", skill: "js-arrays", tool: "js", level: "guided" },
    { id: "js-f23", skill: "js-strings", tool: "js", level: "guided" },
    { id: "js-f24", skill: "js-objects", tool: "js", level: "guided" },
    { id: "js-f25", skill: "js-arrays", tool: "js", level: "semiguided" },
    { id: "js-f26", skill: "js-functions", tool: "js", level: "semiguided" },
    { id: "js-f27", skill: "js-arrays", tool: "js", level: "challenge" },
    { id: "js-f28", skill: "js-strings", tool: "js", level: "semiguided" },
    { id: "js-f29", skill: "js-objects", tool: "js", level: "challenge" },
    { id: "js-f30", skill: "js-arrays", tool: "js", level: "mastery" },
    { id: "js-f31", skill: "js-arrays", tool: "js", level: "guided" },
    { id: "js-f32", skill: "js-functions", tool: "js", level: "guided" },
    { id: "js-f33", skill: "js-strings", tool: "js", level: "guided" },
    { id: "js-f34", skill: "js-arrays", tool: "js", level: "semiguided" },
    { id: "js-f35", skill: "js-objects", tool: "js", level: "semiguided" },
    { id: "js-f36", skill: "js-functions", tool: "js", level: "challenge" },
    { id: "js-f37", skill: "js-arrays", tool: "js", level: "challenge" },
    { id: "js-f38", skill: "js-strings", tool: "js", level: "mastery" },
    { id: "js-f39", skill: "js-functions", tool: "js", level: "mastery" },
    { id: "js-f40", skill: "js-arrays", tool: "js", level: "mastery" },
    { id: "spec-f01", skill: "specs-criteria", tool: "specs", level: "guided" },
    { id: "spec-f02", skill: "specs-criteria", tool: "specs", level: "guided" },
    { id: "spec-f03", skill: "specs-criteria", tool: "specs", level: "guided" },
    { id: "spec-f04", skill: "specs-criteria", tool: "specs", level: "guided" },
    { id: "spec-f05", skill: "specs-criteria", tool: "specs", level: "guided" },
    { id: "spec-f06", skill: "specs-criteria", tool: "specs", level: "guided" },
    { id: "spec-f07", skill: "specs-criteria", tool: "specs", level: "guided" },
    { id: "spec-f08", skill: "specs-criteria", tool: "specs", level: "guided" },
    { id: "spec-f09", skill: "specs-criteria", tool: "specs", level: "semiguided" },
    { id: "spec-f10", skill: "specs-criteria", tool: "specs", level: "semiguided" },
    { id: "spec-f11", skill: "specs-criteria", tool: "specs", level: "semiguided" },
    { id: "spec-f12", skill: "specs-criteria", tool: "specs", level: "semiguided" },
    { id: "spec-f13", skill: "specs-criteria", tool: "specs", level: "semiguided" },
    { id: "spec-f14", skill: "specs-criteria", tool: "specs", level: "semiguided" },
    { id: "spec-f15", skill: "specs-criteria", tool: "specs", level: "challenge" },
    { id: "spec-f16", skill: "specs-criteria", tool: "specs", level: "challenge" },
    { id: "spec-f17", skill: "specs-criteria", tool: "specs", level: "challenge" },
    { id: "spec-f18", skill: "specs-criteria", tool: "specs", level: "challenge" },
    { id: "spec-f19", skill: "specs-criteria", tool: "specs", level: "mastery" },
    { id: "spec-f20", skill: "specs-criteria", tool: "specs", level: "mastery" },
    { id: "git-f01", skill: "git-workflow", tool: "git", level: "guided" },
    { id: "git-f02", skill: "git-workflow", tool: "git", level: "guided" },
    { id: "git-f03", skill: "git-workflow", tool: "git", level: "guided" },
    { id: "git-f04", skill: "git-workflow", tool: "git", level: "guided" },
    { id: "git-f05", skill: "git-workflow", tool: "git", level: "guided" },
    { id: "git-f06", skill: "git-workflow", tool: "git", level: "guided" },
    { id: "git-f07", skill: "git-workflow", tool: "git", level: "guided" },
    { id: "git-f08", skill: "git-workflow", tool: "git", level: "guided" },
    { id: "git-f09", skill: "git-workflow", tool: "git", level: "semiguided" },
    { id: "git-f10", skill: "git-workflow", tool: "git", level: "semiguided" },
    { id: "git-f11", skill: "git-workflow", tool: "git", level: "semiguided" },
    { id: "git-f12", skill: "git-workflow", tool: "git", level: "semiguided" },
    { id: "git-f13", skill: "git-workflow", tool: "git", level: "semiguided" },
    { id: "git-f14", skill: "git-workflow", tool: "git", level: "semiguided" },
    { id: "git-f15", skill: "git-workflow", tool: "git", level: "challenge" },
    { id: "git-f16", skill: "git-workflow", tool: "git", level: "challenge" },
    { id: "git-f17", skill: "git-workflow", tool: "git", level: "challenge" },
    { id: "git-f18", skill: "git-workflow", tool: "git", level: "challenge" },
    { id: "git-f19", skill: "git-workflow", tool: "git", level: "mastery" },
    { id: "git-f20", skill: "git-workflow", tool: "git", level: "mastery" },
    { id: "rv-f01", skill: "review-judgment", tool: "review", level: "guided" },
    { id: "rv-f02", skill: "review-judgment", tool: "review", level: "guided" },
    { id: "rv-f03", skill: "review-judgment", tool: "review", level: "guided" },
    { id: "rv-f04", skill: "review-judgment", tool: "review", level: "guided" },
    { id: "rv-f05", skill: "review-judgment", tool: "review", level: "guided" },
    { id: "rv-f06", skill: "review-judgment", tool: "review", level: "guided" },
    { id: "rv-f07", skill: "review-judgment", tool: "review", level: "guided" },
    { id: "rv-f08", skill: "review-judgment", tool: "review", level: "guided" },
    { id: "rv-f09", skill: "review-judgment", tool: "review", level: "semiguided" },
    { id: "rv-f10", skill: "review-judgment", tool: "review", level: "semiguided" },
    { id: "rv-f11", skill: "review-judgment", tool: "review", level: "semiguided" },
    { id: "rv-f12", skill: "review-judgment", tool: "review", level: "semiguided" },
    { id: "rv-f13", skill: "review-judgment", tool: "review", level: "semiguided" },
    { id: "rv-f14", skill: "review-judgment", tool: "review", level: "semiguided" },
    { id: "rv-f15", skill: "review-judgment", tool: "review", level: "challenge" },
    { id: "rv-f16", skill: "review-judgment", tool: "review", level: "challenge" },
    { id: "rv-f17", skill: "review-judgment", tool: "review", level: "challenge" },
    { id: "rv-f18", skill: "review-judgment", tool: "review", level: "challenge" },
    { id: "rv-f19", skill: "review-judgment", tool: "review", level: "mastery" },
    { id: "rv-f20", skill: "review-judgment", tool: "review", level: "mastery" },
    { id: "ts-f01", skill: "testing-assertions", tool: "testing", level: "guided" },
    { id: "ts-f02", skill: "testing-assertions", tool: "testing", level: "guided" },
    { id: "ts-f03", skill: "testing-assertions", tool: "testing", level: "guided" },
    { id: "ts-f04", skill: "testing-assertions", tool: "testing", level: "semiguided" },
    { id: "ts-f05", skill: "testing-assertions", tool: "testing", level: "semiguided" },
    { id: "ts-f06", skill: "testing-assertions", tool: "testing", level: "semiguided" },
    { id: "ts-f07", skill: "testing-mutations", tool: "testing", level: "challenge" },
    { id: "ts-f08", skill: "testing-mutations", tool: "testing", level: "challenge" },
    { id: "ts-f09", skill: "testing-assertions", tool: "testing", level: "guided" },
    { id: "ts-f10", skill: "testing-assertions", tool: "testing", level: "guided" },
    { id: "ts-f11", skill: "testing-mutations", tool: "testing", level: "semiguided" },
    { id: "ts-f12", skill: "testing-mutations", tool: "testing", level: "semiguided" },
    { id: "ts-f13", skill: "testing-mutations", tool: "testing", level: "challenge" },
    { id: "ts-f14", skill: "testing-assertions", tool: "testing", level: "guided" },
    { id: "ts-f15", skill: "testing-assertions", tool: "testing", level: "semiguided" },
    { id: "ts-f16", skill: "testing-mutations", tool: "testing", level: "challenge" },
    { id: "ts-f17", skill: "testing-mutations", tool: "testing", level: "mastery" },
    { id: "ts-f18", skill: "testing-assertions", tool: "testing", level: "guided" },
    { id: "ts-f19", skill: "testing-assertions", tool: "testing", level: "semiguided" },
    { id: "ts-f20", skill: "testing-mutations", tool: "testing", level: "mastery" },
    { id: "py-f01", skill: "python-basics", tool: "python", level: "guided" },
    { id: "py-f02", skill: "python-basics", tool: "python", level: "guided" },
    { id: "py-f03", skill: "python-basics", tool: "python", level: "guided" },
    { id: "py-f04", skill: "python-json", tool: "python", level: "guided" },
    { id: "py-f05", skill: "python-json", tool: "python", level: "semiguided" },
    { id: "py-f06", skill: "python-basics", tool: "python", level: "semiguided" },
    { id: "py-f07", skill: "python-strings", tool: "python", level: "guided" },
    { id: "py-f08", skill: "python-strings", tool: "python", level: "semiguided" },
    { id: "py-f09", skill: "python-json", tool: "python", level: "semiguided" },
    { id: "py-f10", skill: "python-files", tool: "python", level: "guided" },
    { id: "py-f11", skill: "python-basics", tool: "python", level: "guided" },
    { id: "py-f12", skill: "python-json", tool: "python", level: "challenge" },
    { id: "py-f13", skill: "python-files", tool: "python", level: "challenge" },
    { id: "py-f14", skill: "python-strings", tool: "python", level: "guided" },
    { id: "py-f15", skill: "python-basics", tool: "python", level: "semiguided" },
    { id: "py-f16", skill: "python-json", tool: "python", level: "semiguided" },
    { id: "py-f17", skill: "python-json", tool: "python", level: "challenge" },
    { id: "py-f18", skill: "python-strings", tool: "python", level: "challenge" },
    { id: "py-f19", skill: "python-files", tool: "python", level: "mastery" },
    { id: "py-f20", skill: "python-json", tool: "python", level: "mastery" },
    { id: "py-f21", skill: "python-basics", tool: "python", level: "guided" },
    { id: "py-f22", skill: "python-basics", tool: "python", level: "guided" },
    { id: "py-f23", skill: "python-strings", tool: "python", level: "semiguided" },
    { id: "py-f24", skill: "python-json", tool: "python", level: "challenge" },
    { id: "py-f25", skill: "python-files", tool: "python", level: "mastery" },
    { id: "ct-01", skill: "integrated-flow", tool: "integrated", level: "guided" },
    { id: "ct-02", skill: "integrated-flow", tool: "integrated", level: "guided" },
    { id: "ct-03", skill: "integrated-flow", tool: "integrated", level: "semiguided" },
    { id: "ct-04", skill: "integrated-flow", tool: "integrated", level: "semiguided" },
    { id: "ct-05", skill: "integrated-flow", tool: "integrated", level: "semiguided" },
    { id: "ct-06", skill: "integrated-flow", tool: "integrated", level: "challenge" },
    { id: "ct-07", skill: "integrated-flow", tool: "integrated", level: "challenge" },
    { id: "ct-08", skill: "integrated-flow", tool: "integrated", level: "challenge" },
    { id: "ct-09", skill: "integrated-flow", tool: "integrated", level: "guided" },
    { id: "ct-10", skill: "integrated-flow", tool: "integrated", level: "semiguided" },
    { id: "ct-11", skill: "integrated-flow", tool: "integrated", level: "mastery" },
    { id: "ct-12", skill: "integrated-flow", tool: "integrated", level: "guided" },
    { id: "ct-13", skill: "integrated-flow", tool: "integrated", level: "challenge" },
    { id: "ct-14", skill: "integrated-flow", tool: "integrated", level: "semiguided" },
    { id: "ct-15", skill: "integrated-flow", tool: "integrated", level: "mastery" },
  ];
  const SKILL_META = {
    "html-structure": { id: "html-structure", label: "HTML structure" },
    "html-links": { id: "html-links", label: "HTML links" },
    "html-forms": { id: "html-forms", label: "HTML forms" },
    "html-images": { id: "html-images", label: "HTML images" },
    "html-tables": { id: "html-tables", label: "HTML tables" },
    "css-selectors": { id: "css-selectors", label: "CSS selectors" },
    "css-box": { id: "css-box", label: "CSS box model" },
    "css-layout": { id: "css-layout", label: "CSS layout" },
    "css-typography": { id: "css-typography", label: "CSS typography" },
    "css-visibility": { id: "css-visibility", label: "CSS visibility" },
    "js-functions": { id: "js-functions", label: "JavaScript functions" },
    "js-arrays": { id: "js-arrays", label: "JavaScript arrays" },
    "js-strings": { id: "js-strings", label: "JavaScript strings" },
    "js-objects": { id: "js-objects", label: "JavaScript objects" },
    "specs-criteria": { id: "specs-criteria", label: "Specs and acceptance criteria" },
    "git-workflow": { id: "git-workflow", label: "Git workflow" },
    "review-judgment": { id: "review-judgment", label: "Code review judgment" },
    "testing-assertions": { id: "testing-assertions", label: "Writing assertions" },
    "testing-mutations": { id: "testing-mutations", label: "Mutation-style tests" },
    "python-basics": { id: "python-basics", label: "Python basics" },
    "python-strings": { id: "python-strings", label: "Python strings" },
    "python-json": { id: "python-json", label: "Python and JSON" },
    "python-files": { id: "python-files", label: "Python text/files" },
    "integrated-flow": { id: "integrated-flow", label: "Integrated judgment" },
  };
  const MASTER_SKILLS = [
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
