/* Zenith Lab, Data Science & Analysis: Practice/Mastery layer.
   A separate, additive system that sits ALONGSIDE course-progress.js
   (different localStorage key, never touches module/quiz state) and
   tracks per-task and per-skill evidence for the practice-task
   libraries (SQL, Python, Excel, etc). Mirrors course-progress.js's
   shape and API conventions on purpose, so it feels like the same
   system to a developer reading both files. */
(function (global) {
  const STORAGE_KEY = "zenith_ds_practice_v1";

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function isPlainObject(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
  }
  function load() {
    let raw = null;
    if (typeof localStorage !== "undefined") {
      try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    }
    const parsed = raw ? safeParse(raw) : null;
    const data = isPlainObject(parsed) ? parsed : {};
    if (!isPlainObject(data.tasks)) data.tasks = {};
    return data;
  }
  function save(data) {
    if (typeof localStorage === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* quota/unavailable, degrade silently */ }
  }

  /* ---- Task result recording -------------------------------------- */
  // A task's stored record: { passed: bool, attempts: int, bestLevel: str, lastAttemptAt: iso }
  function getTaskState(taskId) {
    const data = load();
    return data.tasks[taskId] || { passed: false, attempts: 0, lastAttemptAt: null };
  }
  function recordAttempt(taskId, passed) {
    const data = load();
    const cur = data.tasks[taskId] || { passed: false, attempts: 0, lastAttemptAt: null };
    data.tasks[taskId] = {
      passed: cur.passed || passed,
      attempts: cur.attempts + 1,
      lastAttemptAt: new Date().toISOString(),
    };
    save(data);
    return data.tasks[taskId];
  }
  function resetTask(taskId) {
    const data = load();
    delete data.tasks[taskId];
    save(data);
  }

  /* ---- Mastery computation ------------------------------------------
     A skill (e.g. "sql-select-where") reaches each tier only once enough
     DIFFERENT tasks tagged with that skill, at the required levels, have
     passed. This is a deliberate design choice per spec: one successful
     exercise never equals mastery. The exact rule, matching the brief's
     example (1 guided + 2 varied + 1 independent):
       INTRODUCED  = at least 1 guided task passed
       PRACTICING  = INTRODUCED, plus at least 2 semi-guided/guided tasks passed (3+ total)
       COMPETENT   = PRACTICING, plus at least 1 challenge-level task passed
       MASTERED    = COMPETENT, plus at least 1 independent/mastery-level task passed
     TASK_MAP (passed as `tasks`) supplies which tasks belong to which
     skill/level so this stays purely a function of real evidence. */
  const LEVELS = ["guided", "semiguided", "challenge", "mastery"];

  function skillTaskIds(tasks, skillId) {
    return tasks.filter((t) => t.skill === skillId);
  }
  function passedTasksFor(tasks, skillId) {
    return skillTaskIds(tasks, skillId).filter((t) => getTaskState(t.id).passed);
  }
  function skillTier(tasks, skillId) {
    const passed = passedTasksFor(tasks, skillId);
    if (passed.length === 0) return "not-started";
    const byLevel = { guided: 0, semiguided: 0, challenge: 0, mastery: 0 };
    passed.forEach((t) => { byLevel[t.level] = (byLevel[t.level] || 0) + 1; });
    const guidedOk = byLevel.guided >= 1;
    const practicingOk = guidedOk && passed.length >= 3;
    const competentOk = practicingOk && byLevel.challenge >= 1;
    const masteredOk = competentOk && byLevel.mastery >= 1;
    if (masteredOk) return "mastered";
    if (competentOk) return "competent";
    if (practicingOk) return "practicing";
    if (guidedOk) return "introduced";
    return "not-started";
  }
  function skillProgress(tasks, skillId) {
    const all = skillTaskIds(tasks, skillId);
    const passed = passedTasksFor(tasks, skillId);
    return {
      tier: skillTier(tasks, skillId),
      passedCount: passed.length,
      totalCount: all.length,
      pct: all.length ? Math.round((passed.length / all.length) * 100) : 0,
    };
  }
  function toolProgress(tasks, toolId) {
    const toolTasks = tasks.filter((t) => t.tool === toolId);
    const passed = toolTasks.filter((t) => getTaskState(t.id).passed);
    return {
      passedCount: passed.length,
      totalCount: toolTasks.length,
      pct: toolTasks.length ? Math.round((passed.length / toolTasks.length) * 100) : 0,
    };
  }

  /* ---- "What should I do next?" recommendation ----------------------
     Purely rule-based on real evidence: first incomplete prerequisite
     chain, in TASK_MAP order. No fabricated intelligence. */
  function recommendNext(tasks) {
    for (const t of tasks) {
      const state = getTaskState(t.id);
      if (state.passed) continue;
      const prereqsMet = (t.prerequisite || []).every((pid) => getTaskState(pid).passed);
      if (prereqsMet) return t;
    }
    return null;
  }

  global.PracticeProgress = {
    STORAGE_KEY, LEVELS,
    load, save,
    getTaskState, recordAttempt, resetTask,
    skillTier, skillProgress, toolProgress, recommendNext,
  };
})(window);
