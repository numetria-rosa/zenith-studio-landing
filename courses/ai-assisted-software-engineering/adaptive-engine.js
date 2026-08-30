(function (global) {
  const LEVEL_ORDER = { guided: 0, semiguided: 1, challenge: 2, mastery: 3 };
  function toolLabel(id) {
    return ({ html: "HTML", css: "CSS", js: "JavaScript", specs: "Specs", git: "Git", testing: "Testing", review: "Review", python: "Python", integrated: "Integrated" })[id] || id;
  }
  function recommend() {
    if (typeof SkillMap === "undefined" || typeof PracticeProgress === "undefined") return { done: true, primary: null };
    const pool = (typeof AISE_TASKS !== "undefined") ? AISE_TASKS : SkillMap.TASKS;
    const tStats = {};
    pool.forEach((t) => {
      if (!tStats[t.tool]) tStats[t.tool] = { total: 0, passed: 0 };
      tStats[t.tool].total++;
      if (PracticeProgress.getTaskState(t.id).passed) tStats[t.tool].passed++;
    });
    let best = null, bestScore = -1;
    pool.forEach((t, idx) => {
      const st = PracticeProgress.getTaskState(t.id);
      if (st.passed) return;
      if ((t.prerequisite || []).some((pid) => !PracticeProgress.getTaskState(pid).passed)) return;
      let score = (3 - (LEVEL_ORDER[t.level] || 0)) * 2;
      const reasons = [];
      if (st.attempts >= 1) { score += 20; reasons.push("You already attempted this and have not passed it yet."); }
      const ts = tStats[t.tool];
      const pct = ts.total ? ts.passed / ts.total : 0;
      score += (1 - pct) * 15;
      if (ts.passed > 0 && pct < 0.3) reasons.push(toolLabel(t.tool) + " is your least-covered tool so far (" + ts.passed + "/" + ts.total + " tasks passed).");
      if (!reasons.length) reasons.push("This is the next unfinished task in course order for a skill you have not finished.");
      if (score > bestScore) { bestScore = score; best = { task: t, why: reasons, tool: t.tool }; }
    });
    if (!best) return { done: true, primary: null };
    return { done: false, primary: { id: best.task.id, tool: best.tool, level: best.task.level, title: best.task.title, why: best.why, file: SkillMap.TOOL_LIBRARIES[best.tool] } };
  }
  global.AdaptiveEngine = { recommend };
})(window);
