/* Zenith Lab, AI-Assisted Software Engineering progress.
   Same public API as the Data Science course-progress.js. */
(function (global) {
  const STORAGE_KEY = "zenith_aise_progress_v1";
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
    } catch (e) { /* invalid */ }
    return "";
  }

  const MODULES = [
    { id: 1, file: "module-01.html", title: "How software works + HTML", minutes: 50 },
    { id: 2, file: "module-02.html", title: "CSS: layout, not decoration", minutes: 50 },
    { id: 3, file: "module-03.html", title: "JavaScript you can read", minutes: 60 },
    { id: 4, file: "module-04.html", title: "Specs and coding agents", minutes: 50 },
    { id: 5, file: "module-05.html", title: "Git and GitHub", minutes: 50 },
    { id: 6, file: "module-06.html", title: "Testing and debugging", minutes: 50 },
    { id: 7, file: "module-07.html", title: "Multi-file features with AI", minutes: 55 },
    { id: 8, file: "module-08.html", title: "Python for scripts", minutes: 55 },
    { id: 9, file: "module-09.html", title: "Capstone: ship a real app", minutes: 120 },
  ];

  const PASS_THRESHOLD = 0.8;
  const RUBRIC_WEIGHTS = { spec: 20, review: 20, tests: 25, deploy: 20, writeup: 15 };

  const PROJECTS = [
    { id: 1, title: '"Northline Landing"', modules: [9], difficulty: "Capstone · Web",
      stage: 1, stageLabel: "Ship",
      summary: "A one-page marketing site for a fictional clinic: semantic HTML, a working form, tests, GitHub, and a live URL.",
      rubric: ["spec", "review", "tests", "deploy", "writeup"] },
    { id: 2, title: '"Shift Board"', modules: [9], difficulty: "Capstone · Web app",
      stage: 1, stageLabel: "Ship",
      summary: "A small shift-list app: add/remove rows in the browser, persist in localStorage, tests that fail if add is broken.",
      rubric: ["spec", "review", "tests", "deploy", "writeup"] },
    { id: 3, title: '"Receipt Splitter"', modules: [], difficulty: "Portfolio · JS",
      stage: 2, stageLabel: "JavaScript",
      summary: "Split a bill across people with tip and rounding you can defend.",
      rubric: ["spec", "tests", "writeup"] },
    { id: 4, title: '"Accessible FAQ"', modules: [], difficulty: "Portfolio · HTML/CSS",
      stage: 2, stageLabel: "Markup",
      summary: "An FAQ page that works with a keyboard and a screen-reader mental model, not just a pretty accordion.",
      rubric: ["spec", "review", "writeup"] },
    { id: 5, title: '"PR Review Log"', modules: [], difficulty: "Portfolio · Git + review",
      stage: 3, stageLabel: "Review",
      summary: "A public repo where you review an AI-authored PR and write why you accepted or rejected each change.",
      rubric: ["review", "writeup"] },
    { id: 6, title: '"CSV Cleaner"', modules: [], difficulty: "Portfolio · Python",
      stage: 4, stageLabel: "Python",
      summary: "A script that reads a messy CSV, writes a cleaned one, and fails a test if a duplicate slips through.",
      rubric: ["spec", "tests", "writeup"] },
    { id: 7, title: '"Status Page"', modules: [], difficulty: "Portfolio · Multi-file",
      stage: 3, stageLabel: "Features",
      summary: "Three HTML pages sharing one CSS file plus a tiny JS filter. Spec first, then Cursor, then your review notes.",
      rubric: ["spec", "review", "deploy", "writeup"] },
    { id: 8, title: '"Form Validator"', modules: [], difficulty: "Portfolio · Testing",
      stage: 3, stageLabel: "Tests",
      summary: "Email/password rules with tests that catch the empty-string and the missing-@ cases.",
      rubric: ["tests", "spec", "writeup"] },
  ];

  function rubricForProject(projectId) {
    const p = PROJECTS.find((x) => x.id === projectId);
    if (!p) return [];
    const total = p.rubric.reduce((sum, key) => sum + (RUBRIC_WEIGHTS[key] || 10), 0);
    return p.rubric.map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      weight: Math.round(((RUBRIC_WEIGHTS[key] || 10) / total) * 100),
    }));
  }

  const REQUIRED_SECTIONS = {
    1: ["htmlPageExercise"],
    2: ["cssLayoutExercise"],
    3: ["jsFunctionExercise"],
    4: ["specWritingExercise"],
    5: ["diffReadingExercise"],
    6: ["failingTestExercise"],
    7: ["featureSpecExercise"],
    8: ["pythonScriptExercise"],
    9: [],
  };
  const SECTION_LABELS = {
    htmlPageExercise: "Build a semantic HTML page from a brief",
    cssLayoutExercise: "Match a layout spec in CSS",
    jsFunctionExercise: "Write the required JavaScript functions by hand",
    specWritingExercise: "Write acceptance criteria a stranger could implement",
    diffReadingExercise: "Read a diff and reject the unsafe change",
    failingTestExercise: "Write a test that fails on the planted bug",
    featureSpecExercise: "Spec + test for a multi-file feature",
    pythonScriptExercise: "Python script that transforms a JSON list",
  };

  function safeParse(raw) { try { return JSON.parse(raw); } catch (e) { return null; } }
  function isPlainObject(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* quota */ }
    pushToServer(data);
  }

  var SERVER_COURSE_ID = "ai-assisted-software-engineering";
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
  function loadPracticeTasksLocal() {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem("zenith_aise_practice_v1") : null;
      const parsed = raw ? safeParse(raw) : null;
      return (isPlainObject(parsed) && isPlainObject(parsed.tasks)) ? parsed.tasks : {};
    } catch (e) { return {}; }
  }
  function applyPracticeToLocalStorage(tasks) {
    if (typeof localStorage === "undefined") return;
    try { localStorage.setItem("zenith_aise_practice_v1", JSON.stringify({ tasks: tasks || {} })); } catch (e) { /* quota */ }
  }
  function extraObj(d) { return (d && isPlainObject(d.extra)) ? d.extra : {}; }
  function serverSyncOnLoad() {
    if (typeof fetch === "undefined") return;
    fetch("/api/progress?courseId=" + SERVER_COURSE_ID, { credentials: "same-origin" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (body) {
        if (!body) return;
        var serverData = body.data;
        var local = load();
        var mergedPractice = mergePracticeTasks(
          mergePracticeTasks(extraObj(local).practiceTasks, extraObj(serverData).practiceTasks),
          loadPracticeTasksLocal()
        );
        if (hasContent(serverData) && !hasContent(local)) {
          serverData.extra = Object.assign({}, extraObj(serverData), { practiceTasks: mergedPractice });
          save(serverData);
          applyPracticeToLocalStorage(mergedPractice);
          location.reload();
          return;
        }
        if (JSON.stringify(loadPracticeTasksLocal()) !== JSON.stringify(mergedPractice)) {
          local.extra = Object.assign({}, local.extra, { practiceTasks: mergedPractice });
          save(local);
          applyPracticeToLocalStorage(mergedPractice);
          location.reload();
          return;
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
  function getModule(id) { return cleanModuleRecord(load().modules[id]); }
  function getExtra(key) { return (load().extra && load().extra[key]) || null; }
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
    const merged = Object.assign({}, getProject(id), patch);
    setExtra("project_" + id, merged);
    return merged;
  }
  function setModuleField(id, patch) {
    const data = load();
    data.modules[id] = Object.assign({}, cleanModuleRecord(data.modules[id]), patch);
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
  function touchVisited(id) { setModuleField(id, { lastVisited: new Date().toISOString() }); }
  function quizPassed(m) { return !!m && m.total > 0 && (m.score / m.total) >= PASS_THRESHOLD; }
  function sectionSatisfied(sections, key) {
    const v = sections && sections[key];
    if (v === true) return true;
    if (v && typeof v === "object" && typeof v.total === "number" && v.total > 0 && v.passCount === v.total) return true;
    return false;
  }
  function isModuleDataComplete(id, m) {
    if (!quizPassed(m)) return false;
    return (REQUIRED_SECTIONS[id] || []).every((key) => sectionSatisfied(m && m.sections, key));
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
    const wasComplete = isModuleComplete(id);
    const data = load();
    const cur = cleanModuleRecord(data.modules[id]);
    const merged = Object.assign({}, cur, { score, total });
    if (isModuleDataComplete(id, merged) && !wasComplete) merged.completedAt = new Date().toISOString();
    data.modules[id] = merged;
    save(data);
    return merged;
  }
  function isModuleComplete(id) { return isModuleDataComplete(id, getModule(id)); }
  function overall() {
    let completed = 0;
    MODULES.forEach((m) => { if (isModuleComplete(m.id)) completed++; });
    return { completed, total: MODULES.length, pct: Math.round((completed / MODULES.length) * 100) };
  }

  function practiceTasksStore() {
    return mergePracticeTasks(loadPracticeTasksLocal(), getExtra("practiceTasks"));
  }
  function countPassedPractice(prefix) {
    const tasks = practiceTasksStore();
    let n = 0;
    Object.keys(tasks).forEach(function (id) {
      if (id.indexOf(prefix) === 0 && tasks[id] && tasks[id].passed) n += 1;
    });
    return n;
  }
  function capstonePracticeStatus() {
    const html = countPassedPractice("html-");
    const css = countPassedPractice("css-");
    const js = countPassedPractice("js-");
    const readyTools = (html >= 3 ? 1 : 0) + (css >= 3 ? 1 : 0) + (js >= 3 ? 1 : 0);
    return { html, css, js, readyTools, ready: readyTools >= 2, needPerTool: 3, toolsNeeded: 2 };
  }
  function isGithubRepoUrl(url) {
    const href = safeHttpUrl(url);
    if (!href) return "";
    try {
      const u = new URL(href);
      if (u.protocol !== "https:") return "";
      const host = u.hostname.toLowerCase();
      if (host !== "github.com" && host !== "www.github.com") return "";
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length < 2) return "";
      return href;
    } catch (e) { return ""; }
  }
  function isGithubCommitUrl(url) {
    const href = isGithubRepoUrl(url);
    if (!href) return "";
    try {
      const u = new URL(href);
      if (u.pathname.indexOf("/commit/") === -1 && u.pathname.indexOf("/commits/") === -1) return "";
      return href;
    } catch (e) { return ""; }
  }
  function desktopLabRecord(tool) {
    const labs = getExtra("desktopLabs");
    const rec = isPlainObject(labs) && isPlainObject(labs[tool]) ? labs[tool] : {};
    return { url: rec.url || "", notes: rec.notes || "", confirmed: !!rec.confirmed, completed: !!rec.completed, completedAt: rec.completedAt || null };
  }
  function desktopLabReady() {
    return !!(desktopLabRecord("cursor").completed && desktopLabRecord("github").completed);
  }
  function completeDesktopLab(tool, payload) {
    const notes = String((payload && payload.notes) || "").trim();
    const confirmed = !!(payload && payload.confirmed);
    let url = "";
    if (tool === "cursor") url = isGithubCommitUrl(payload && payload.url);
    else if (tool === "github") url = isGithubRepoUrl(payload && payload.url);
    else return { ok: false, error: "Unknown lab." };
    if (!url) {
      return {
        ok: false,
        error: tool === "cursor"
          ? "Need an https://github.com/.../commit/... URL from a real push."
          : "Need an https://github.com/owner/repo URL.",
      };
    }
    if (notes.length < 80) return { ok: false, error: "Write at least 80 characters about what you changed and how you checked it." };
    if (!confirmed) {
      return {
        ok: false,
        error: tool === "cursor"
          ? "Confirm you made this change in Cursor or VS Code, not the in-browser simulation."
          : "Confirm this is a repo you own and that it has a README plus at least three commits.",
      };
    }
    const labs = Object.assign({}, isPlainObject(getExtra("desktopLabs")) ? getExtra("desktopLabs") : {});
    labs[tool] = { url, notes, confirmed: true, completed: true, completedAt: new Date().toISOString() };
    setExtra("desktopLabs", labs);
    return { ok: true, labs };
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
      var wrap = document.querySelector(".wrap");
      if (!wrap) return;
      var box = document.createElement("div");
      box.className = "objectives";
      box.setAttribute("role", "alert");
      box.style.borderLeftColor = "var(--amber)";
      box.style.marginTop = "18px";
      box.innerHTML = "<div class=\"lbl\" style=\"color:var(--amber)\">Locked</div><p style=\"font-size:14px\">This module unlocks after you complete Module " + (m.id - 1) + " (checkpoint quiz at 80% plus the graded exercise).</p><p style=\"margin-top:10px\"><a href=\"dashboard.html\">Back to dashboard</a></p>";
      var header = wrap.querySelector("header");
      if (header && header.nextSibling) wrap.insertBefore(box, header.nextSibling);
      else wrap.insertBefore(box, wrap.firstChild);
    } catch (e) { /* ignore */ }
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

  global.CourseProgress = {
    STORAGE_KEY, MODULES, PASS_THRESHOLD, REQUIRED_SECTIONS, SECTION_LABELS, PROJECTS, RUBRIC_WEIGHTS,
    escapeHtml, safeHttpUrl,
    load, save, getModule, setModuleField, setAnswer, setSection, getExtra, setExtra,
    touchVisited, markComplete, isModuleComplete, isModuleDataComplete, completionRequirements,
    overall, isUnlocked, statusOf, resetAll, resetModule,
    rubricForProject, getProject, setProject,
    countPassedPractice, capstonePracticeStatus, capstonePracticeReady,
    desktopLabReady, desktopLabRecord, completeDesktopLab, isGithubRepoUrl, isGithubCommitUrl,
  };

  hydratePracticeIntoExtra();
  serverSyncOnLoad();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", gateCurrentPage);
  else gateCurrentPage();
})(window);
