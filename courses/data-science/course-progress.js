/* Zenith Lab — Data Science & Analysis course progress system.
   Single source of truth for module completion, quiz state, and navigation gating.
   Persisted via localStorage, mirrored to the server when authenticated.
   Architecture is a direct port of the AI Engineering / Automation Engineering
   course-progress.js — same public API, same storage shape — with the module
   list, projects, and rubric swapped for this course's content. */
(function (global) {
  const STORAGE_KEY = "zenith_ds_progress_v1";

  const HTML_ESCAPE_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c]);
  }

  function safeHttpUrl(url) {
    const raw = String(url || "").replace(/[\x00-\x1f\x7f]/g, "").trim();
    if (!raw) return "";
    try {
      const u = new URL(raw);
      if (u.protocol === "http:" || u.protocol === "https:") return u.href;
    } catch (e) { /* not a valid absolute URL */ }
    return "";
  }

  const MODULES = [
    { id: 1, file: "module-01.html", title: "Spreadsheet & Data Literacy Foundations", minutes: 40 },
    { id: 2, file: "module-02.html", title: "Python Foundations for Data", minutes: 45 },
    { id: 3, file: "module-03.html", title: "Pandas & NumPy Fundamentals", minutes: 50 },
    { id: 4, file: "module-04.html", title: "Data Cleaning & Validation", minutes: 55 },
    { id: 5, file: "module-05.html", title: "Exploratory Data Analysis & Statistics", minutes: 50 },
    { id: 6, file: "module-06.html", title: "SQL for Analysts", minutes: 45 },
    { id: 7, file: "module-07.html", title: "Data Visualization & Storytelling", minutes: 45 },
    { id: 8, file: "module-08.html", title: "Dashboards & Business Communication", minutes: 50 },
    { id: 9, file: "module-09.html", title: "Capstone Analysis Project", minutes: 120 },
  ];

  const PASS_THRESHOLD = 0.8;

  const RUBRIC_WEIGHTS = { dataCleaning: 20, analysis: 30, visualization: 20, communication: 20, documentation: 10 };

  const PROJECTS = [
    { id: 1, title: '"The Leaky Funnel"', modules: [9], difficulty: "Capstone · E-commerce & Retail",
      summary: "Abandoned-cart and conversion analysis on real (messy) order data: find where in the funnel people actually drop off, and what it's costing per week.",
      rubric: ["dataCleaning", "analysis", "visualization", "communication", "documentation"] },
    { id: 2, title: '"The Understaffed Quarter"', modules: [9], difficulty: "Capstone · People & HR",
      summary: "Headcount, attrition, and overtime-cost analysis: figure out whether the team is genuinely understaffed or just poorly scheduled, and what to do about it.",
      rubric: ["dataCleaning", "analysis", "visualization", "communication", "documentation"] },
    { id: 3, title: '"The Campaign That Didn’t Work"', modules: [9], difficulty: "Capstone · Marketing & Agency",
      summary: "Spend-versus-outcome attribution across channels: work out which channel actually earned the result everyone is crediting to the wrong one.",
      rubric: ["dataCleaning", "analysis", "visualization", "communication", "documentation"] },
    { id: 4, title: '"The Slow Season"', modules: [9], difficulty: "Capstone · Finance & Small Business",
      summary: "P&L variance and a simple cash-flow forecast: determine whether a slow quarter is ordinary seasonality or something the business needs to act on now.",
      rubric: ["dataCleaning", "analysis", "visualization", "communication", "documentation"] },
  ];

  function rubricForProject(projectId) {
    const p = PROJECTS.find((x) => x.id === projectId);
    if (!p) return [];
    const total = p.rubric.reduce((sum, key) => sum + RUBRIC_WEIGHTS[key], 0);
    return p.rubric.map((key) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"), weight: Math.round((RUBRIC_WEIGHTS[key] / total) * 100) }));
  }

  const REQUIRED_SECTIONS = {
    1: ["summaryTableExercise"],
    2: ["csvParseExercise"],
    3: ["mergeJoinExercise"],
    4: ["cleaningPipelineExercise"],
    5: ["hypothesisTestExercise"],
    6: ["sqlQueryExercise"],
    7: ["chartBuildExercise"],
    8: ["dashboardBuildExercise"],
    9: [], // capstone's own rubric score gates it, same pattern as the other two courses
  };

  const SECTION_LABELS = {
    summaryTableExercise: "Build-a-summary-table exercise (Retail Sales Ledger)",
    csvParseExercise: "Hand-parse-a-CSV exercise (no pandas)",
    mergeJoinExercise: "Multi-sheet merge/join exercise (Employee Headcount)",
    cleaningPipelineExercise: "Cleaning-pipeline build (Expense Reports + E-commerce Orders)",
    hypothesisTestExercise: "Mini hypothesis-test exercise (Survey Responses)",
    chartBuildExercise: "Build-a-chart-from-raw-data exercise (App Analytics)",
    sqlQueryExercise: "Translate-a-business-question-into-SQL exercise",
    dashboardBuildExercise: "Dashboard build (P&L or Inventory file)",
  };

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
    if (!isPlainObject(data.modules)) data.modules = {};
    if (!isPlainObject(data.extra)) data.extra = {};
    return data;
  }

  function save(data) {
    if (typeof localStorage === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable or quota exceeded, degrade silently */ }
    pushToServer(data);
  }

  /* ---- Server sync -------------------------------------------------------
     Additive only, identical mechanism to the other two courses: mirrors
     state to/from the server so progress follows an account across devices.
     Only does anything when loaded through the authenticated course guard;
     otherwise fetches fail/401 and this silently no-ops. */
  var SERVER_COURSE_ID = "data-science";
  var pushDebounceTimer = null;

  function hasContent(d) {
    return !!d && (Object.keys(d.modules || {}).length > 0 || Object.keys(d.extra || {}).length > 0);
  }

  function pushToServer(data) {
    if (typeof fetch === "undefined") return;
    clearTimeout(pushDebounceTimer);
    pushDebounceTimer = setTimeout(function () {
      fetch("/api/progress", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId: SERVER_COURSE_ID, data: data }),
      }).catch(function () {});
    }, 600);
  }

  function serverSyncOnLoad() {
    if (typeof fetch === "undefined") return;
    fetch("/api/progress?courseId=" + SERVER_COURSE_ID, { credentials: "same-origin" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (body) {
        if (!body) return;
        var serverData = body.data;
        var local = load();
        if (hasContent(serverData) && !hasContent(local)) {
          save(serverData);
          location.reload();
        } else if (hasContent(local) && !hasContent(serverData)) {
          fetch("/api/progress/migrate", {
            method: "POST",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ courseId: SERVER_COURSE_ID, data: local }),
          }).catch(function () {});
        }
      })
      .catch(function () {});
  }

  function cleanModuleRecord(rec) {
    const base = { answers: {}, score: 0, total: 0, completed: false, sections: {} };
    if (!isPlainObject(rec)) return base;
    return Object.assign({}, base, rec, {
      answers: isPlainObject(rec.answers) ? rec.answers : {},
      sections: isPlainObject(rec.sections) ? rec.sections : {},
    });
  }

  function getModule(id) {
    const data = load();
    return cleanModuleRecord(data.modules[id]);
  }

  function getExtra(key) {
    const data = load();
    return (data.extra && data.extra[key]) || null;
  }

  function setExtra(key, value) {
    const data = load();
    data.extra = Object.assign({}, data.extra, { [key]: value });
    save(data);
    return data.extra[key];
  }

  function getProject(id) {
    const extra = getExtra("project_" + id);
    const base = { checklist: {}, rubricScores: {}, githubUrl: "", description: "", completed: false };
    if (!isPlainObject(extra)) return base;
    return Object.assign({}, base, extra, {
      checklist: isPlainObject(extra.checklist) ? extra.checklist : {},
      rubricScores: isPlainObject(extra.rubricScores) ? extra.rubricScores : {},
    });
  }

  function setProject(id, patch) {
    const cur = getProject(id);
    const merged = Object.assign({}, cur, patch);
    setExtra("project_" + id, merged);
    return merged;
  }

  function setModuleField(id, patch) {
    const data = load();
    const cur = cleanModuleRecord(data.modules[id]);
    data.modules[id] = Object.assign({}, cur, patch);
    save(data);
    return data.modules[id];
  }

  function setAnswer(id, qKey, value) {
    const data = load();
    const cur = cleanModuleRecord(data.modules[id]);
    cur.answers = Object.assign({}, cur.answers, { [qKey]: value });
    data.modules[id] = cur;
    save(data);
  }

  function setSection(id, sectionKey, value) {
    const data = load();
    const cur = cleanModuleRecord(data.modules[id]);
    const wasComplete = isModuleDataComplete(id, cur);
    cur.sections = Object.assign({}, cur.sections, { [sectionKey]: value });
    if (!wasComplete && isModuleDataComplete(id, cur)) cur.completedAt = new Date().toISOString();
    data.modules[id] = cur;
    save(data);
  }

  function touchVisited(id) {
    setModuleField(id, { lastVisited: new Date().toISOString() });
  }

  function quizPassed(m) {
    return !!m && m.total > 0 && (m.score / m.total) >= PASS_THRESHOLD;
  }

  function sectionSatisfied(sections, key) {
    const v = sections && sections[key];
    if (v === true) return true;
    if (v && typeof v === "object" && typeof v.total === "number" && v.total > 0 && v.passCount === v.total) return true;
    return false;
  }

  function isModuleDataComplete(id, m) {
    if (!quizPassed(m)) return false;
    const req = REQUIRED_SECTIONS[id] || [];
    return req.every((key) => sectionSatisfied(m && m.sections, key));
  }

  function completionRequirements(id) {
    const m = getModule(id);
    const reqs = [{ key: "quiz", label: "Checkpoint quiz ≥ 80%", satisfied: quizPassed(m) }];
    (REQUIRED_SECTIONS[id] || []).forEach((key) => {
      reqs.push({ key, label: SECTION_LABELS[key] || key, satisfied: sectionSatisfied(m.sections, key) });
    });
    return reqs;
  }

  function markComplete(id, score, total) {
    const patch = { score, total };
    const wasComplete = isModuleComplete(id);
    const data = load();
    const cur = cleanModuleRecord(data.modules[id]);
    const merged = Object.assign({}, cur, patch);
    const nowComplete = isModuleDataComplete(id, merged);
    if (nowComplete && !wasComplete) merged.completedAt = new Date().toISOString();
    data.modules[id] = merged;
    save(data);
    return merged;
  }

  function isModuleComplete(id) {
    return isModuleDataComplete(id, getModule(id));
  }

  function overall() {
    let completed = 0;
    MODULES.forEach((m) => { if (isModuleComplete(m.id)) completed++; });
    return { completed, total: MODULES.length, pct: Math.round((completed / MODULES.length) * 100) };
  }

  function isUnlocked(id) {
    if (id <= 1) return true;
    return isModuleComplete(id - 1);
  }

  function statusOf(id) {
    const m = getModule(id);
    if (isModuleDataComplete(id, m)) return "completed";
    if (m.lastVisited || (m.answers && Object.keys(m.answers).length > 0)) return "in-progress";
    return "not-started";
  }

  function resetAll() {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  }

  function resetModule(id) {
    const data = load();
    delete data.modules[id];
    save(data);
  }

  global.CourseProgress = {
    STORAGE_KEY, MODULES, PASS_THRESHOLD, REQUIRED_SECTIONS, SECTION_LABELS, PROJECTS, RUBRIC_WEIGHTS,
    escapeHtml, safeHttpUrl,
    load, save, getModule, setModuleField, setAnswer, setSection, getExtra, setExtra,
    touchVisited, markComplete, isModuleComplete, isModuleDataComplete, completionRequirements,
    overall, isUnlocked, statusOf, resetAll, resetModule,
    rubricForProject, getProject, setProject,
  };

  serverSyncOnLoad();
})(window);
