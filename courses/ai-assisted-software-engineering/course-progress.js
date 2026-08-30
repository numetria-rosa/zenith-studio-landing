/* Zenith Lab, AI-Assisted Software Engineering progress.

   Schema 2 (2026-08-30 rebuild). The course was restructured from 9 flat
   modules into 5 stages / 13 modules driven by Northline Digital tickets,
   so module 4 no longer means what it meant in schema 1. Old records are
   deliberately NOT migrated — a schema-1 "module 4 complete" would silently
   mark a completely different module done and hand out a gate the student
   never earned. loadRaw() ignores any blob without schema >= 2. */
(function (global) {
  const STORAGE_KEY = "zenith_aise_progress_v2";
  const LEGACY_KEYS = ["zenith_aise_progress_v1"];
  const SCHEMA = 2;

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

  /* The loop the whole course is built around. Every module page renders it
     and highlights the steps that module is actually about, so the student
     sees where today's work sits inside the real job. */
  const LOOP = [
    { id: "understand", label: "Understand", blurb: "What is the person actually asking for?" },
    { id: "specify", label: "Specify", blurb: "Write the checks before the code." },
    { id: "ask", label: "Ask AI", blurb: "Small scope, real context, stated constraints." },
    { id: "inspect", label: "Inspect", blurb: "Read every line it changed." },
    { id: "run", label: "Run", blurb: "Open it. Click it. Watch the console." },
    { id: "test", label: "Test", blurb: "A test that cannot fail proves nothing." },
    { id: "debug", label: "Debug", blurb: "Find the cause, not the symptom." },
    { id: "review", label: "Review", blurb: "Would you defend this hunk out loud?" },
    { id: "improve", label: "Improve", blurb: "Name things. Delete duplication." },
    { id: "commit", label: "Commit", blurb: "One reason per commit." },
    { id: "ship", label: "Ship", blurb: "A URL someone else can open." },
  ];

  const STAGES = [
    { id: 0, label: "Stage 0", title: "Welcome to AI-assisted development", modules: [1] },
    { id: 1, label: "Stage 1", title: "Think like a software engineer", modules: [2] },
    { id: 2, label: "Stage 2", title: "Understand the web", modules: [3, 4, 5, 6] },
    { id: 3, label: "Stage 3", title: "AI as your pair programmer", modules: [7, 8] },
    { id: 4, label: "Stage 4", title: "Engineering discipline", modules: [9, 10, 11] },
    { id: 5, label: "Stage 5", title: "Release and ship", modules: [12, 13] },
  ];

  /* Northline Digital: a fictional five-person shop that builds internal
     tools and small customer-facing apps. The student is the junior dev.
     Every module is one ticket from their tracker. */
  const TICKETS = {
    1: { id: "NL-001", from: "Priya (office manager, Northline Clinic)", title: "The hours on the site are wrong",
         quote: "We changed our Saturday hours three weeks ago and the website still says we're closed. People are showing up to a locked door." },
    2: { id: "NL-002", from: "Dan (Northline Digital, account lead)", title: "Make the booking system better",
         quote: "Client says booking is confusing. Can you just make it better? I told them we'd scope it this week." },
    3: { id: "NL-003", from: "Priya (Northline Clinic)", title: "We need a real page for the clinic",
         quote: "Right now there's one paragraph. We need hours, services, how to reach us, and a way to ask for an appointment." },
    4: { id: "NL-004", from: "Support inbox", title: "It looks broken on my phone",
         quote: "Everything is squashed into a column on the left and I have to pinch to read the hours. Fine on my laptop." },
    5: { id: "NL-005", from: "Priya (Northline Clinic)", title: "Let the front desk filter appointments",
         quote: "We get 40 a day. I need to see just the ones that are still open, and just the ones for a given clinician." },
    6: { id: "NL-006", from: "Dan (Northline Digital)", title: "Load the appointments from the data file",
         quote: "Stop hard-coding the list. It should read appointments.json and still work if the file is slow or empty." },
    7: { id: "NL-007", from: "Priya (Northline Clinic)", title: "A dashboard for the morning huddle",
         quote: "Three numbers on one screen: appointments today, still open, and no-shows this week. We read it out at 8am." },
    8: { id: "NL-008", from: "Dan (Northline Digital)", title: "Review this AI-generated pull request",
         quote: "Contractor pushed a big AI-written PR before going on leave. It runs. I still do not want to merge it blind. You are the reviewer." },
    9: { id: "NL-009", from: "Priya (Northline Clinic)", title: "The booking form is broken for some people",
         quote: "Two patients said they hit Request and nothing happened. It works when I try it. I do not know what is different." },
    10: { id: "NL-010", from: "Dan (Northline Digital)", title: "Add clinician notes without breaking booking",
         quote: "New feature, same release. If booking regresses I have to call the client myself, so prove it still works." },
    11: { id: "NL-011", from: "Dan (Northline Digital)", title: "Clean this up before the release",
         quote: "There are three copies of the same date function and a console.log with a patient email in it. Tidy it without changing behaviour." },
    12: { id: "NL-012", from: "Priya (Northline Clinic)", title: "The exported patient list is a mess",
         quote: "Our old system exports a file full of duplicates and blank rows. Somebody cleans it by hand every Monday. Please stop that." },
    13: { id: "NL-013", from: "Dan (Northline Digital)", title: "Prepare the release and ship it",
         quote: "Client demo is Friday. I need a live URL, tests that actually catch a break, and a note explaining what you decided and why." },
  };

  const MODULES = [
    { id: 1, file: "module-01.html", stage: 0, title: "Your first shipped change", minutes: 45,
      loop: ["understand", "run", "commit", "ship"],
      teaser: "Read a real ticket, change one line, prove it, and ship it. Today." },
    { id: 2, file: "module-02.html", stage: 1, title: "Requirements: turning \u201cmake it better\u201d into work", minutes: 70,
      loop: ["understand", "specify", "ask", "review"],
      teaser: "Turn Dan's one sentence into a spec an agent can be supervised against." },
    { id: 3, file: "module-03.html", stage: 2, title: "HTML: the structure under every page", minutes: 60,
      loop: ["specify", "inspect", "run", "review"],
      teaser: "Landmarks, forms, and labels. The skeleton AI keeps getting subtly wrong." },
    { id: 4, file: "module-04.html", stage: 2, title: "CSS: layout that survives a phone", minutes: 70,
      loop: ["specify", "inspect", "run", "review"],
      teaser: "Box model, flexbox, grid, one breakpoint you can defend." },
    { id: 5, file: "module-05.html", stage: 2, title: "JavaScript: logic you can defend", minutes: 70,
      loop: ["specify", "test", "debug"],
      teaser: "Functions, arrays, objects, conditions. Written by you, because you will be reviewing this shape forever." },
    { id: 6, file: "module-06.html", stage: 2, title: "The DOM, events, and data that arrives late", minutes: 65,
      loop: ["run", "debug", "test"],
      teaser: "Wire logic to a real interface, then handle the file being slow, empty, or broken." },
    { id: 7, file: "module-07.html", stage: 3, title: "AI as your pair programmer", minutes: 65,
      loop: ["specify", "ask", "inspect", "run", "test", "review"],
      teaser: "The full loop, for real, in Cursor. You bring the actual output back and we run tests against it." },
    { id: 8, file: "module-08.html", stage: 3, title: "AI Code Detective", minutes: 65,
      loop: ["inspect", "test", "debug", "review"],
      teaser: "Plausible AI code with real defects. Find them, prove them, fix them \u2014 without rejecting the innocent lines." },
    { id: 9, file: "module-09.html", stage: 4, title: "Testing and debugging under pressure", minutes: 65,
      loop: ["debug", "test", "improve"],
      teaser: "\u201cWorks on my machine\u201d is a starting point, not a defence." },
    { id: 10, file: "module-10.html", stage: 4, title: "Git, GitHub, and code review", minutes: 60,
      loop: ["review", "commit"],
      teaser: "Branch, diff, PR, and a review that names what you actually checked." },
    { id: 11, file: "module-11.html", stage: 4, title: "Refactoring, security, and maintenance", minutes: 60,
      loop: ["improve", "review", "test"],
      teaser: "Change the shape without changing the behaviour. Then find the leak." },
    { id: 12, file: "module-12.html", stage: 5, title: "Python for scripts and small tools", minutes: 60,
      loop: ["specify", "test", "ship"],
      teaser: "Enough Python to kill a recurring manual chore. Not RAG. Not agents." },
    { id: 13, file: "module-13.html", stage: 5, title: "Release: ship the application", minutes: 150,
      loop: ["review", "test", "commit", "ship"],
      teaser: "One live product with tests, a repo, a release note, and decisions you can defend." },
  ];

  const CAPSTONE_ID = 13;
  const PASS_THRESHOLD = 0.8;
  const RUBRIC_WEIGHTS = { spec: 20, review: 20, tests: 25, deploy: 20, writeup: 15 };

  const PROJECTS = [
    { id: 1, title: '"Northline Clinic" \u2014 the live site', modules: [13], difficulty: "Capstone \u00b7 Web",
      stage: 1, stageLabel: "Ship", ticket: "NL-013",
      summary: "The site you have been building since Module 3, released: semantic structure, responsive layout, a working request form, filtering, tests, a repo, and a live URL.",
      rubric: ["spec", "review", "tests", "deploy", "writeup"] },
    { id: 2, title: '"Shift Board" \u2014 an internal tool', modules: [13], difficulty: "Capstone \u00b7 Web app",
      stage: 1, stageLabel: "Ship", ticket: "NL-013",
      summary: "Alternative capstone: a shift list staff can add to, remove from, and reload, persisted in the browser, with tests that fail if add breaks.",
      rubric: ["spec", "review", "tests", "deploy", "writeup"] },
    { id: 3, title: '"Receipt Splitter"', modules: [], difficulty: "Portfolio \u00b7 JS logic",
      stage: 2, stageLabel: "Logic",
      summary: "Split a bill with tip and rounding rules you can defend when someone is short 1p.",
      rubric: ["spec", "tests", "writeup"] },
    { id: 4, title: '"Accessible FAQ"', modules: [], difficulty: "Portfolio \u00b7 HTML/CSS",
      stage: 2, stageLabel: "Markup",
      summary: "An FAQ that works with a keyboard and reads correctly to a screen reader, not just a pretty accordion.",
      rubric: ["spec", "review", "writeup"] },
    { id: 5, title: '"AI PR Review Log"', modules: [], difficulty: "Portfolio \u00b7 Review",
      stage: 3, stageLabel: "Review",
      summary: "A public repo where you review a real AI-authored PR hunk by hunk and record what you accepted, rejected, and verified.",
      rubric: ["review", "writeup"] },
    { id: 6, title: '"CSV Cleaner"', modules: [], difficulty: "Portfolio \u00b7 Python",
      stage: 5, stageLabel: "Python",
      summary: "The NL-012 tool, finished: reads a messy export, writes a clean file, and fails a test if a duplicate slips through.",
      rubric: ["spec", "tests", "writeup"] },
    { id: 7, title: '"Status Page"', modules: [], difficulty: "Portfolio \u00b7 Multi-file",
      stage: 3, stageLabel: "Features",
      summary: "Three pages sharing one stylesheet plus a filter. Spec first, then AI, then your review notes on its diff.",
      rubric: ["spec", "review", "deploy", "writeup"] },
    { id: 8, title: '"Form Validator"', modules: [], difficulty: "Portfolio \u00b7 Testing",
      stage: 4, stageLabel: "Tests",
      summary: "Email and password rules with tests that catch the empty string, the missing @, and the trailing space.",
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
    1: ["shipFirstChange"],
    2: ["requirementsExercise"],
    3: ["htmlStructureExercise"],
    4: ["cssResponsiveExercise"],
    5: ["jsLogicExercise"],
    6: ["domDataExercise"],
    7: ["aiWorkflowExercise"],
    8: ["detectiveExercise"],
    9: ["debugExercise"],
    10: ["reviewExercise"],
    11: ["refactorExercise"],
    12: ["pythonToolExercise"],
    13: ["releasePlan"],
  };
  const SECTION_LABELS = {
    shipFirstChange: "Fix ticket NL-001 in the real markup",
    requirementsExercise: "Turn a vague request into acceptance criteria and edge cases",
    htmlStructureExercise: "Build the clinic page structure from the ticket",
    cssResponsiveExercise: "Match the layout spec, including the phone breakpoint",
    jsLogicExercise: "Write the filtering logic by hand",
    domDataExercise: "Wire the UI and survive slow, empty, and malformed data",
    aiWorkflowExercise: "Run the full loop in Cursor and pass tests with the code AI produced",
    detectiveExercise: "Find the real defects, spare the innocent lines, and prove the fix",
    debugExercise: "Reproduce the reported bug, write the failing test, then fix it",
    reviewExercise: "Review the AI pull request hunk by hunk with reasons",
    refactorExercise: "Refactor without changing behaviour and remove the leak",
    pythonToolExercise: "Ship the data-cleanup tool with a test that catches duplicates",
    releasePlan: "Write the release notes, the verification steps, and the rollback plan",
  };

  function safeParse(raw) { try { return JSON.parse(raw); } catch (e) { return null; } }
  function isPlainObject(v) { return !!v && typeof v === "object" && !Array.isArray(v); }

  function blankData() { return { schema: SCHEMA, modules: {}, extra: {} }; }
  function normalize(parsed) {
    const data = isPlainObject(parsed) ? parsed : {};
    if (Number(data.schema) < SCHEMA) return blankData();
    data.schema = SCHEMA;
    if (!isPlainObject(data.modules)) data.modules = {};
    if (!isPlainObject(data.extra)) data.extra = {};
    return data;
  }
  function load() {
    let raw = null;
    if (typeof localStorage !== "undefined") {
      try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    }
    return normalize(raw ? safeParse(raw) : null);
  }
  function save(data) {
    const clean = normalize(data);
    if (typeof localStorage === "undefined") return clean;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clean)); } catch (e) { /* quota */ }
    pushToServer(clean);
    return clean;
  }
  /* Schema-1 progress is unusable (module numbers changed meaning) but the
     student's own words are worth keeping, so their desktop-lab evidence and
     project write-ups survive the restructure. Nothing that grants a gate
     is carried over. */
  function rescueLegacy() {
    if (typeof localStorage === "undefined") return;
    let rescued = false;
    const cur = load();
    LEGACY_KEYS.forEach(function (key) {
      let old = null;
      try { old = safeParse(localStorage.getItem(key)); } catch (e) { old = null; }
      if (!isPlainObject(old) || !isPlainObject(old.extra)) return;
      Object.keys(old.extra).forEach(function (k) {
        const keepable = k === "desktopLabs" || k.indexOf("project_") === 0;
        if (!keepable || cur.extra[k] !== undefined) return;
        cur.extra[k] = old.extra[k];
        rescued = true;
      });
      try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    });
    if (rescued) {
      cur.extra.restructuredAt = new Date().toISOString();
      save(cur);
    }
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
        /* A stored blob from schema 1 is dropped here, same as locally. */
        var serverData = (isPlainObject(body.data) && Number(body.data.schema) >= SCHEMA) ? body.data : null;
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
    const base = { checklist: {}, rubricScores: {}, githubUrl: "", liveUrl: "", description: "", completed: false };
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
    if (v && typeof v === "object" && v.passed === true) return true;
    return false;
  }
  function isModuleDataComplete(id, m) {
    if (!quizPassed(m)) return false;
    return (REQUIRED_SECTIONS[id] || []).every((key) => sectionSatisfied(m && m.sections, key));
  }
  function completionRequirements(id) {
    const m = getModule(id);
    const reqs = [{ key: "quiz", label: "Checkpoint quiz \u2265 80%", satisfied: quizPassed(m) }];
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
  function stageOf(moduleId) {
    return STAGES.find(function (s) { return s.modules.indexOf(moduleId) !== -1; }) || null;
  }
  function stageProgress(stageId) {
    const s = STAGES.find(function (x) { return x.id === stageId; });
    if (!s) return { completed: 0, total: 0, pct: 0 };
    const done = s.modules.filter(function (id) { return isModuleComplete(id); }).length;
    return { completed: done, total: s.modules.length, pct: s.modules.length ? Math.round((done / s.modules.length) * 100) : 0 };
  }
  function ticketFor(moduleId) { return TICKETS[moduleId] || null; }
  function loopFor(moduleId) {
    const m = MODULES.find(function (x) { return x.id === moduleId; });
    return (m && m.loop) || [];
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
  /* Capstone practice bar. Build skills (html/css/js) still gate the ship,
     and the detective library now counts as a fourth pillar because reading
     AI output is the actual job this course claims to teach. */
  function capstonePracticeStatus() {
    const html = countPassedPractice("html-");
    const css = countPassedPractice("css-");
    const js = countPassedPractice("js-");
    const det = countPassedPractice("det-");
    const readyTools = (html >= 3 ? 1 : 0) + (css >= 3 ? 1 : 0) + (js >= 3 ? 1 : 0) + (det >= 3 ? 1 : 0);
    return { html, css, js, det, readyTools, ready: readyTools >= 3, needPerTool: 3, toolsNeeded: 3 };
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
    const raw = String((payload && payload.url) || "").trim();
    let url = "";
    if (tool === "cursor") {
      /* Lab A is the agent session, which happens before anything is pushed, so
         demanding a commit URL here would make it impossible to finish in the
         order the page teaches. The link is optional; the notes carry the
         evidence. Lab B is where a real GitHub URL is required. */
      url = raw ? safeHttpUrl(raw) : "";
      if (raw && !url) return { ok: false, error: "That link is not a URL we can open. Leave it blank if you have nothing to point at." };
    } else if (tool === "github") {
      url = isGithubRepoUrl(raw);
      if (!url) return { ok: false, error: "Need an https://github.com/owner/repo URL." };
    } else {
      return { ok: false, error: "Unknown lab." };
    }
    if (notes.length < 80) return { ok: false, error: "Write at least 80 characters about what you changed and how you checked it." };
    if (!confirmed) {
      return {
        ok: false,
        error: tool === "cursor"
          ? "Tick the box to confirm this was a real session in Cursor or VS Code, not the in-browser exercise."
          : "Tick the box to confirm the repo is yours and pushed.",
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
    if (id === CAPSTONE_ID) return capstonePracticeReady();
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
      if (m.id === CAPSTONE_ID) return;
      document.body.classList.add("module-locked");
      var wrap = document.querySelector(".wrap");
      if (!wrap) return;
      var prev = MODULES.find(function (x) { return x.id === m.id - 1; });
      var box = document.createElement("div");
      box.className = "objectives";
      box.setAttribute("role", "alert");
      box.style.borderLeftColor = "var(--amber)";
      box.style.marginTop = "18px";
      box.innerHTML = "<div class=\"lbl\" style=\"color:var(--amber)\">Locked</div><p style=\"font-size:14px\">This module opens once Module " + (m.id - 1) + (prev ? " (" + escapeHtml(prev.title) + ")" : "") + " is complete \u2014 checkpoint quiz at 80% plus its graded exercise.</p><p style=\"margin-top:10px\"><a href=\"" + (prev ? prev.file : "dashboard.html") + "\">Go to Module " + (m.id - 1) + "</a> \u00b7 <a href=\"dashboard.html\">Dashboard</a></p>";
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
    STORAGE_KEY, SCHEMA, MODULES, STAGES, TICKETS, LOOP, CAPSTONE_ID,
    PASS_THRESHOLD, REQUIRED_SECTIONS, SECTION_LABELS, PROJECTS, RUBRIC_WEIGHTS,
    escapeHtml, safeHttpUrl,
    load, save, getModule, setModuleField, setAnswer, setSection, getExtra, setExtra,
    touchVisited, markComplete, isModuleComplete, isModuleDataComplete, completionRequirements,
    overall, stageOf, stageProgress, ticketFor, loopFor,
    isUnlocked, statusOf, resetAll, resetModule,
    rubricForProject, getProject, setProject,
    countPassedPractice, capstonePracticeStatus, capstonePracticeReady,
    desktopLabReady, desktopLabRecord, completeDesktopLab, isGithubRepoUrl,
  };

  rescueLegacy();
  hydratePracticeIntoExtra();
  serverSyncOnLoad();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", gateCurrentPage);
  else gateCurrentPage();
})(window);
