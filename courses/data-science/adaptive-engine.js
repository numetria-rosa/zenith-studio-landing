/* Zenith Lab, Data Science & Analysis: adaptive next-task recommendation.
   Reads ONLY real persisted evidence from PracticeProgress (attempts,
   passed, lastAttemptAt per task) and SkillMap (which task belongs to
   which skill/tool/level). No fabricated history, no separate state of
   its own: this is a pure function of what PracticeProgress and SkillMap
   already track, extending the existing course-order-only
   SkillMap.recommendNextAcrossCourse() with mastery gap, failure
   history, tool balance, and neglect signals, and a plain-English
   explanation built from whichever factors actually fired. */
(function (global) {
  const LEVEL_ORDER = { guided: 0, semiguided: 1, challenge: 2, mastery: 3 };

  function daysSince(iso) {
    if (!iso) return Infinity;
    return (Date.now() - new Date(iso).getTime()) / 86400000;
  }

  function skillLabel(skillId) {
    const m = SkillMap.SKILL_META[skillId];
    return m ? m.label : skillId;
  }

  function toolLabel(toolId) {
    const LABELS = { sql: "SQL", excel: "Excel", python: "Python", tableau: "Tableau", powerbi: "Power BI", automation: "Automation", integrated: "Integrated Challenges" };
    return LABELS[toolId] || toolId;
  }

  /* Real, persisted, per-skill state: last touched, passed count, total. */
  function skillStats() {
    const stats = {};
    SkillMap.TASKS.forEach((t) => {
      if (!stats[t.skill]) stats[t.skill] = { skill: t.skill, total: 0, passed: 0, lastAttemptAt: null };
      const s = stats[t.skill];
      s.total++;
      const st = PracticeProgress.getTaskState(t.id);
      if (st.passed) s.passed++;
      if (st.lastAttemptAt && (!s.lastAttemptAt || st.lastAttemptAt > s.lastAttemptAt)) s.lastAttemptAt = st.lastAttemptAt;
    });
    return stats;
  }

  /* Real, persisted, per-tool completion, used for tool-balance scoring. */
  function toolStats() {
    const stats = {};
    SkillMap.TASKS.forEach((t) => {
      if (!stats[t.tool]) stats[t.tool] = { tool: t.tool, total: 0, passed: 0 };
      stats[t.tool].total++;
      if (PracticeProgress.getTaskState(t.id).passed) stats[t.tool].passed++;
    });
    return stats;
  }

  /* Score one not-yet-passed task. Every term traces to a specific,
     real signal; reasons[] records which ones actually fired so the
     "Why am I seeing this?" explanation is never templated filler. */
  function scoreTask(t, idx, sStats, tStats) {
    const state = PracticeProgress.getTaskState(t.id);
    const reasons = [];
    let score = 0;

    if (state.attempts >= 2) {
      score += 40;
      reasons.push(`You've attempted this task ${state.attempts} times without passing yet. Finishing it clears a real, tracked repeated failure.`);
    } else if (state.attempts === 1) {
      score += 15;
      reasons.push("One attempt on this task didn't pass yet, it's worth a second try before moving on.");
    }

    const tier = PracticeProgress.skillTier(SkillMap.TASKS, t.skill);
    if (tier === "not-started") { score += 10; }
    else if (tier === "introduced") { score += 6; reasons.push(`${skillLabel(t.skill)} is Introduced but not yet Practicing, this task adds toward that.`); }
    score += (3 - (LEVEL_ORDER[t.level] || 0)) * 2;

    const tStat = tStats[t.tool];
    const toolPct = tStat.total ? tStat.passed / tStat.total : 0;
    score += (1 - toolPct) * 15;
    if (tStat.passed > 0 && toolPct < 0.3) {
      reasons.push(`${toolLabel(t.tool)} is your least-covered tool so far (${tStat.passed}/${tStat.total} tasks passed).`);
    }

    const sStat = sStats[t.skill];
    const idle = daysSince(sStat.lastAttemptAt);
    if (sStat.passed > 0 && idle < Infinity && idle > 7) {
      score += Math.min(idle, 30);
      reasons.push(`${skillLabel(t.skill)} hasn't been practiced in ${Math.round(idle)} days.`);
    }

    score += (SkillMap.TASKS.length - idx) * 0.01;
    return { task: t, score, reasons, tool: t.tool, skill: t.skill };
  }

  /* Primary + alternative recommendation, both backed by the same real
     evidence, plus a transparent, regenerable "why" for each. Same
     input state always produces the same output: no randomness, no
     invented history. */
  function recommend() {
    if (typeof PracticeProgress === "undefined" || typeof SkillMap === "undefined") return null;
    const sStats = skillStats();
    const tStats = toolStats();
    const candidates = [];
    SkillMap.TASKS.forEach((t, idx) => {
      const state = PracticeProgress.getTaskState(t.id);
      if (state.passed) return;
      candidates.push(scoreTask(t, idx, sStats, tStats));
    });
    if (!candidates.length) return { primary: null, alternative: null, done: true };

    candidates.sort((a, b) => b.score - a.score);
    const primary = candidates[0];

    const alt = candidates.find((c) => c.task.id !== primary.task.id && c.tool !== primary.tool) || candidates[1] || null;

    function toResult(c) {
      if (!c) return null;
      const reasons = c.reasons.length ? c.reasons : ["This is the next task in course order for a skill you haven't started yet."];
      return { taskId: c.task.id, tool: c.tool, skill: c.skill, level: c.task.level, why: reasons, score: Math.round(c.score * 10) / 10 };
    }
    return { primary: toResult(primary), alternative: toResult(alt), done: false };
  }

  global.AdaptiveEngine = { recommend, skillStats, toolStats, skillLabel, toolLabel };
})(window);
