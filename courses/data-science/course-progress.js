/* Zenith Lab, Data Science & Analysis course progress system.
   Single source of truth for module completion, quiz state, and navigation gating.
   Persisted via localStorage, mirrored to the server when authenticated.
   Architecture is a direct port of the AI Engineering / Automation Engineering
   course-progress.js, same public API, same storage shape, with the module
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
      stage: 1, stageLabel: "Foundation",
      summary: "Abandoned-cart and conversion analysis on real (messy) order data: find where in the funnel people actually drop off, and what it's costing per week.",
      rubric: ["dataCleaning", "analysis", "visualization", "communication", "documentation"] },
    { id: 2, title: '"The Understaffed Quarter"', modules: [9], difficulty: "Capstone · People & HR",
      stage: 1, stageLabel: "Foundation",
      summary: "Headcount, attrition, and overtime-cost analysis: figure out whether the team is genuinely understaffed or just poorly scheduled, and what to do about it.",
      rubric: ["dataCleaning", "analysis", "visualization", "communication", "documentation"] },
    { id: 3, title: '"The Campaign That Didn’t Work"', modules: [9], difficulty: "Capstone · Marketing & Agency",
      stage: 2, stageLabel: "SQL & Data-Driven Analysis",
      summary: "Spend-versus-outcome attribution across channels: work out which channel actually earned the result everyone is crediting to the wrong one.",
      rubric: ["dataCleaning", "analysis", "visualization", "communication", "documentation"] },
    { id: 4, title: '"The Slow Season"', modules: [9], difficulty: "Capstone · Finance & Small Business",
      stage: 4, stageLabel: "Python-Heavy & Forecasting",
      summary: "P&L variance and a simple cash-flow forecast: determine whether a slow quarter is ordinary seasonality or something the business needs to act on now.",
      rubric: ["dataCleaning", "analysis", "visualization", "communication", "documentation"] },
    { id: 5, title: '"The Phantom Stock"', modules: [], difficulty: "Portfolio · Retail",
      stage: 3, stageLabel: "Visualization & BI",
      summary: "Multi-location inventory and pricing analysis on a messy store-by-store export: find which SKUs are quietly losing money and which locations are chronically understocked.",
      rubric: ["dataCleaning", "analysis", "visualization", "communication", "documentation"] },
    { id: 6, title: '"The Churn Cliff"', modules: [], difficulty: "Portfolio · SaaS",
      stage: 2, stageLabel: "SQL & Data-Driven Analysis",
      summary: "Subscription and churn analysis on real (messy) billing data: compute MRR, find which plan and industry segment is actually driving cancellations, SQL-heavy.",
      rubric: ["dataCleaning", "analysis", "communication", "documentation"] },
    { id: 7, title: '"The Overpriced Listing"', modules: [], difficulty: "Portfolio · Real Estate",
      stage: 2, stageLabel: "SQL & Data-Driven Analysis",
      summary: "Days-on-market and pricing analysis on a messy listings export: work out which listings are overpriced relative to comparable sold properties, and by how much.",
      rubric: ["dataCleaning", "analysis", "visualization", "communication", "documentation"] },
    { id: 8, title: '"The Wait Time Problem"', modules: [], difficulty: "Portfolio · Healthcare Operations",
      stage: 4, stageLabel: "Python-Heavy & Forecasting",
      summary: "Appointment and wait-time analysis on messy clinic scheduling data: find which department and provider combination is actually driving long waits and no-shows, Python-heavy.",
      rubric: ["dataCleaning", "analysis", "communication", "documentation"] },
    { id: 9, title: '"The Empty Rooms"', modules: [], difficulty: "Portfolio · Travel & Hospitality",
      stage: 3, stageLabel: "Visualization & BI",
      summary: "Booking and revenue analysis on a messy hotel reservations export: work out which room type and channel combination is genuinely most profitable once cancellations and no-shows are accounted for.",
      rubric: ["dataCleaning", "analysis", "visualization", "communication", "documentation"] },
    { id: 10, title: '"The Monthly Scorecard"', modules: [], difficulty: "Portfolio · Executive & BI, multi-tool",
      stage: 5, stageLabel: "Integrated Capstone",
      summary: "Build a single executive scorecard pulling KPIs across sales, marketing, and operations from data you've already cleaned in earlier modules, SQL for the pull, Python or Excel for the calculations, Tableau or Power BI for the dashboard.",
      rubric: ["analysis", "visualization", "communication", "documentation"] },
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
    dashboardBuildExercise: "Dashboard build (E-commerce Orders funnel data)",
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

  function mergePracticeTasks(a, b) {
    const out = {};
    const A = isPlainObject(a) ? a : {};
    const B = isPlainObject(b) ? b : {};
    Object.keys(A).concat(Object.keys(B)).forEach(function (id) {
      if (out[id]) return;
      const cur = isPlainObject(A[id]) ? A[id] : {};
      const rem = isPlainObject(B[id]) ? B[id] : {};
      out[id] = {
        passed: !!(cur.passed || rem.passed),
        attempts: Math.max(Number(cur.attempts) || 0, Number(rem.attempts) || 0),
        lastAttemptAt: (cur.lastAttemptAt && rem.lastAttemptAt)
          ? (cur.lastAttemptAt > rem.lastAttemptAt ? cur.lastAttemptAt : rem.lastAttemptAt)
          : (cur.lastAttemptAt || rem.lastAttemptAt || null),
      };
    });
    return out;
  }

  function mergeDesktopLabs(a, b) {
    function rec(src) {
      const r = isPlainObject(src) ? src : {};
      return {
        url: r.url || "",
        notes: r.notes || "",
        confirmed: !!r.confirmed,
        completed: !!r.completed,
        completedAt: r.completedAt || null,
      };
    }
    function pick(key) {
      const la = rec(isPlainObject(a) ? a[key] : null);
      const lb = rec(isPlainObject(b) ? b[key] : null);
      if (la.completed && !lb.completed) return la;
      if (lb.completed && !la.completed) return lb;
      if (la.completed && lb.completed) {
        return (String(la.notes || "").length >= String(lb.notes || "").length) ? la : lb;
      }
      return (la.url || la.notes) ? la : lb;
    }
    return { tableau: pick("tableau"), powerbi: pick("powerbi") };
  }

  function applyPracticeToLocalStorage(tasks) {
    if (typeof localStorage === "undefined") return;
    try { localStorage.setItem("zenith_ds_practice_v1", JSON.stringify({ tasks: tasks || {} })); } catch (e) { /* quota */ }
  }

  function loadPracticeTasksLocal() {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem("zenith_ds_practice_v1") : null;
      const parsed = raw ? safeParse(raw) : null;
      return (isPlainObject(parsed) && isPlainObject(parsed.tasks)) ? parsed.tasks : {};
    } catch (e) { return {}; }
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

  function extraObj(d) {
    return (d && isPlainObject(d.extra)) ? d.extra : {};
  }

  function mergeSyncedExtras(local, serverData) {
    var serverExtra = extraObj(serverData);
    var localExtra = extraObj(local);
    var mergedPractice = mergePracticeTasks(
      mergePracticeTasks(localExtra.practiceTasks, serverExtra.practiceTasks),
      loadPracticeTasksLocal()
    );
    var mergedDesk = mergeDesktopLabs(localExtra.desktopLabs, serverExtra.desktopLabs);
    return { mergedPractice: mergedPractice, mergedDesk: mergedDesk };
  }

  function serverSyncOnLoad() {
    if (typeof fetch === "undefined") return;
    fetch("/api/progress?courseId=" + SERVER_COURSE_ID, { credentials: "same-origin" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (body) {
        if (!body) return;
        var serverData = body.data;
        var local = load();
        var merged = mergeSyncedExtras(local, serverData);
        var beforePractice = JSON.stringify(loadPracticeTasksLocal());
        if (hasContent(serverData) && !hasContent(local)) {
          serverData.extra = Object.assign({}, extraObj(serverData), {
            practiceTasks: merged.mergedPractice,
            desktopLabs: merged.mergedDesk,
          });
          save(serverData);
          applyPracticeToLocalStorage(merged.mergedPractice);
          location.reload();
          return;
        }
        var practiceChanged = beforePractice !== JSON.stringify(merged.mergedPractice);
        var deskChanged = JSON.stringify(extraObj(local).desktopLabs || {}) !== JSON.stringify(merged.mergedDesk);
        if (practiceChanged || deskChanged) {
          local.extra = Object.assign({}, local.extra, {
            practiceTasks: merged.mergedPractice,
            desktopLabs: merged.mergedDesk,
          });
          save(local);
          applyPracticeToLocalStorage(merged.mergedPractice);
          if (practiceChanged) { location.reload(); return; }
        }
        if (hasContent(local) && !hasContent(serverData)) {
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

  /* Capstone gate: Module 8 is not enough. Students must also pass real
     practice-library tasks in two core tools, and submit evidence of one
     real Desktop Lab (Tableau Public or Power BI Desktop). The in-browser
     Tableau/Power BI libraries are simulations and do not count. */
  function practiceTasksStore() {
    return mergePracticeTasks(loadPracticeTasksLocal(), getExtra("practiceTasks"));
  }
  function countPassedPractice(prefix) {
    try {
      const tasks = practiceTasksStore();
      let n = 0;
      Object.keys(tasks).forEach(function (id) {
        if (id.indexOf(prefix) === 0 && tasks[id] && tasks[id].passed) n += 1;
      });
      return n;
    } catch (e) { return 0; }
  }
  function capstonePracticeStatus() {
    const sql = countPassedPractice("sql-");
    const excel = countPassedPractice("xl-");
    const python = countPassedPractice("py-");
    const readyTools = (sql >= 3 ? 1 : 0) + (excel >= 3 ? 1 : 0) + (python >= 3 ? 1 : 0);
    return { sql: sql, excel: excel, python: python, readyTools: readyTools, ready: readyTools >= 2, needPerTool: 3, toolsNeeded: 2 };
  }
  function isTableauPublicUrl(url) {
    const href = safeHttpUrl(url);
    if (!href) return "";
    try {
      const u = new URL(href);
      if (u.protocol !== "https:") return "";
      const host = u.hostname.toLowerCase();
      if (host === "public.tableau.com" || host === "tableaupublic.com" || host.endsWith(".tableaupublic.com")) return href;
    } catch (e) { /* invalid */ }
    return "";
  }
  function isPowerBiEvidenceUrl(url) {
    const href = safeHttpUrl(url);
    if (!href) return "";
    try {
      const u = new URL(href);
      if (u.protocol !== "http:" && u.protocol !== "https:") return "";
      const host = u.hostname.toLowerCase();
      const path = u.pathname.toLowerCase();
      if (path.endsWith(".pbix")) return href;
      if (host === "app.powerbi.com" || host.endsWith(".powerbi.com") || host === "powerbi.com") return href;
      if (host.endsWith(".sharepoint.com") || host === "onedrive.live.com" || host === "1drv.ms" || host.endsWith(".1drv.ms")) return href;
    } catch (e) { /* invalid */ }
    return "";
  }
  function desktopLabRecord(tool) {
    const labs = getExtra("desktopLabs");
    const rec = isPlainObject(labs) && isPlainObject(labs[tool]) ? labs[tool] : {};
    return {
      url: rec.url || "",
      notes: rec.notes || "",
      confirmed: !!rec.confirmed,
      completed: !!rec.completed,
      completedAt: rec.completedAt || null,
    };
  }
  function desktopLabReady() {
    return !!(desktopLabRecord("tableau").completed || desktopLabRecord("powerbi").completed);
  }
  function completeDesktopLab(tool, payload) {
    const notes = String((payload && payload.notes) || "").trim();
    const confirmed = !!(payload && payload.confirmed);
    let url = "";
    if (tool === "tableau") url = isTableauPublicUrl(payload && payload.url);
    else if (tool === "powerbi") url = isPowerBiEvidenceUrl(payload && payload.url);
    else return { ok: false, error: "Unknown desktop tool." };
    if (!url) {
      return {
        ok: false,
        error: tool === "tableau"
          ? "Need a public https://public.tableau.com/... link."
          : "Need an http(s) link to a .pbix file, a Power BI service share, or a OneDrive/SharePoint file.",
      };
    }
    if (notes.length < 80) return { ok: false, error: "Write at least 80 characters about what you built and what the view shows." };
    if (!confirmed) {
      return {
        ok: false,
        error: tool === "tableau"
          ? "Confirm you built this in Tableau Desktop or Tableau Public."
          : "Confirm you built this in Power BI Desktop.",
      };
    }
    const labs = Object.assign({}, isPlainObject(getExtra("desktopLabs")) ? getExtra("desktopLabs") : {});
    labs[tool] = { url: url, notes: notes, confirmed: true, completed: true, completedAt: new Date().toISOString() };
    setExtra("desktopLabs", labs);
    return { ok: true, labs: labs };
  }
  function capstonePracticeReady() {
    return capstonePracticeStatus().ready && desktopLabReady();
  }

  function isUnlocked(id) {
    if (id <= 1) return true;
    if (!isModuleComplete(id - 1)) return false;
    if (id === 9) return capstonePracticeReady();
    return true;
  }

  function currentCourseFile() {
    var file = (location.pathname.split("/").pop() || "").split("?")[0];
    if (file && file.indexOf(".") === -1) file += ".html";
    return file;
  }

  function gateCurrentPage() {
    try {
      var file = currentCourseFile();
      var m = MODULES.find(function (x) { return x.file === file; });
      if (!m || m.id <= 1) return;
      if (isUnlocked(m.id)) return;
      if (file === "module-09.html") return;
      document.body.classList.add("module-locked");
      var style = document.createElement("style");
      style.textContent = "body.module-locked .wrap > section, body.module-locked .scoreboard{display:none !important}";
      document.head.appendChild(style);
      var wrap = document.querySelector(".wrap");
      if (!wrap) return;
      var box = document.createElement("div");
      box.className = "objectives";
      box.setAttribute("role", "alert");
      box.style.borderLeftColor = "var(--amber)";
      box.style.marginTop = "18px";
      var why = "This module unlocks after you complete Module " + (m.id - 1) + " (checkpoint quiz at 80% plus the graded exercise).";
      box.innerHTML = "<div class=\"lbl\" style=\"color:var(--amber)\">Locked</div><p style=\"font-size:14px\">" + escapeHtml(why) + "</p><p style=\"margin-top:10px\"><a href=\"dashboard.html\" style=\"color:var(--amber)\">Back to dashboard</a></p>";
      var header = wrap.querySelector("header");
      if (header && header.nextSibling) wrap.insertBefore(box, header.nextSibling);
      else wrap.insertBefore(box, wrap.firstChild);
    } catch (e) { /* page without .wrap, ignore */ }
  }

  function hydratePracticeIntoExtra() {
    try {
      var merged = mergePracticeTasks(loadPracticeTasksLocal(), getExtra("practiceTasks"));
      if (!Object.keys(merged).length) return;
      applyPracticeToLocalStorage(merged);
      var cur = getExtra("practiceTasks") || {};
      if (JSON.stringify(cur) !== JSON.stringify(merged)) setExtra("practiceTasks", merged);
    } catch (e) { /* ignore */ }
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
    countPassedPractice, capstonePracticeStatus, capstonePracticeReady,
    desktopLabReady, desktopLabRecord, completeDesktopLab, isTableauPublicUrl, isPowerBiEvidenceUrl,
  };

  hydratePracticeIntoExtra();
  serverSyncOnLoad();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", gateCurrentPage);
  else gateCurrentPage();
})(window);
