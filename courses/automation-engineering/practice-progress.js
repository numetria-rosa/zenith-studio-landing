/* Practice-task progress for AI Automation. Separate key from module progress.
   Browser-only for now — same honest limitation as Data Science practice. */
(function (global) {
  const STORAGE_KEY = "zenith_aia_practice_v1";

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function isPlainObject(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
  }
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    const parsed = raw ? safeParse(raw) : null;
    const data = isPlainObject(parsed) ? parsed : {};
    if (!isPlainObject(data.tasks)) data.tasks = {};
    return data;
  }
  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* quota */ }
  }
  function getTask(id) {
    const t = load().tasks[id];
    return isPlainObject(t) ? t : { passed: false, attempts: 0 };
  }
  function mark(id, passed) {
    const data = load();
    const cur = isPlainObject(data.tasks[id]) ? data.tasks[id] : { passed: false, attempts: 0 };
    cur.attempts = (Number(cur.attempts) || 0) + 1;
    if (passed) {
      cur.passed = true;
      cur.passedAt = new Date().toISOString();
    }
    data.tasks[id] = cur;
    save(data);
    return cur;
  }
  function passedCount(ids) {
    const data = load();
    return ids.filter(function (id) { return data.tasks[id] && data.tasks[id].passed; }).length;
  }
  function skillTier(passed, total) {
    if (!passed) return "not-started";
    const p = passed / total;
    if (p >= 0.9) return "mastered";
    if (p >= 0.7) return "competent";
    if (p >= 0.4) return "practicing";
    return "introduced";
  }

  global.PracticeProgress = { STORAGE_KEY, load, save, getTask, mark, passedCount, skillTier };
})(window);
