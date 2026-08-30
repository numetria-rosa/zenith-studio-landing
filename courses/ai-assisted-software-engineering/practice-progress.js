(function (global) {
  const STORAGE_KEY = "zenith_aise_practice_v1";
  function safeParse(raw) { try { return JSON.parse(raw); } catch (e) { return null; } }
  function isPlainObject(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
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
  function persistToCourse(data) {
    if (!window.CourseProgress || typeof CourseProgress.setExtra !== "function") return;
    try { CourseProgress.setExtra("practiceTasks", data.tasks); } catch (e) { /* ignore */ }
  }
  function save(data) {
    if (typeof localStorage === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* quota */ }
    persistToCourse(data);
  }
  function hydrateFromCourse() {
    if (!window.CourseProgress || typeof CourseProgress.getExtra !== "function") return;
    const extra = CourseProgress.getExtra("practiceTasks");
    if (!isPlainObject(extra)) return;
    const data = load();
    let changed = false;
    Object.keys(extra).forEach(function (id) {
      const rem = extra[id];
      if (!isPlainObject(rem)) return;
      const cur = data.tasks[id] || { passed: false, attempts: 0, lastAttemptAt: null };
      const passed = !!(cur.passed || rem.passed);
      const attempts = Math.max(Number(cur.attempts) || 0, Number(rem.attempts) || 0);
      const last = (cur.lastAttemptAt && rem.lastAttemptAt)
        ? (cur.lastAttemptAt > rem.lastAttemptAt ? cur.lastAttemptAt : rem.lastAttemptAt)
        : (cur.lastAttemptAt || rem.lastAttemptAt || null);
      if (passed !== !!cur.passed || attempts !== (Number(cur.attempts) || 0) || last !== cur.lastAttemptAt) {
        data.tasks[id] = { passed, attempts, lastAttemptAt: last };
        changed = true;
      }
    });
    if (changed) save(data);
  }
  function getTaskState(taskId) {
    return load().tasks[taskId] || { passed: false, attempts: 0, lastAttemptAt: null };
  }
  function recordAttempt(taskId, passed) {
    const data = load();
    const cur = data.tasks[taskId] || { passed: false, attempts: 0, lastAttemptAt: null };
    data.tasks[taskId] = { passed: cur.passed || passed, attempts: cur.attempts + 1, lastAttemptAt: new Date().toISOString() };
    save(data);
    return data.tasks[taskId];
  }
  function resetTask(taskId) {
    const data = load();
    delete data.tasks[taskId];
    save(data);
  }
  const LEVELS = ["guided", "semiguided", "challenge", "mastery"];
  function skillTaskIds(tasks, skillId) { return tasks.filter((t) => t.skill === skillId); }
  function passedTasksFor(tasks, skillId) { return skillTaskIds(tasks, skillId).filter((t) => getTaskState(t.id).passed); }
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
    return { tier: skillTier(tasks, skillId), passedCount: passed.length, totalCount: all.length, pct: all.length ? Math.round((passed.length / all.length) * 100) : 0 };
  }
  function toolProgress(tasks, toolId) {
    const toolTasks = tasks.filter((t) => t.tool === toolId);
    const passed = toolTasks.filter((t) => getTaskState(t.id).passed);
    return { passedCount: passed.length, totalCount: toolTasks.length, pct: toolTasks.length ? Math.round((passed.length / toolTasks.length) * 100) : 0 };
  }
  function recommendNext(tasks) {
    for (const t of tasks) {
      if (getTaskState(t.id).passed) continue;
      if ((t.prerequisite || []).every((pid) => getTaskState(pid).passed)) return t;
    }
    return null;
  }
  global.PracticeProgress = {
    STORAGE_KEY, LEVELS, load, save, getTaskState, recordAttempt, resetTask,
    skillTier, skillProgress, toolProgress, recommendNext,
  };
  hydrateFromCourse();
})(window);
