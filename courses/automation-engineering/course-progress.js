/* Zenith Lab — Automation Engineering course progress system.
   Single source of truth for module completion, quiz state, and navigation gating.
   Persisted via localStorage. Per-browser/per-device only — see dashboard disclosure note. */
(function (global) {
  const STORAGE_KEY = "zenith_ae_progress_v1";

  const HTML_ESCAPE_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  // Escapes any user- or localStorage-controlled string before it's interpolated
  // into an innerHTML template. Use for every value that didn't come from this
  // file's own authored content (quiz text, cheat sheet copy, etc are trusted).
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c]);
  }

  // Only accepts http(s) URLs; rejects javascript:, data:, vbscript:, and any
  // other scheme that could execute when used as an href. Returns "" if unsafe
  // or unparseable, callers should skip rendering a link at all in that case.
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
    { id: 1, file: "module-01.html", title: "Formal Models of Workflow Execution", minutes: 45 },
    { id: 2, file: "module-02.html", title: "Idempotency & Exactly-Once Semantics", minutes: 40 },
    { id: 3, file: "module-03.html", title: "Failure Handling & Retry Theory", minutes: 45 },
    { id: 4, file: "module-04.html", title: "Queueing Theory for Job Systems", minutes: 40 },
    { id: 5, file: "module-05.html", title: "Authentication & Secure Integration", minutes: 50 },
    { id: 6, file: "module-06.html", title: "API Contract Design", minutes: 40 },
    { id: 7, file: "module-07.html", title: "Observability & SLOs", minutes: 40 },
    { id: 8, file: "module-08.html", title: "Capstone: A Fault-Tolerant Lead Pipeline", minutes: 90 },
  ];

  const PASS_THRESHOLD = 0.8; // 80% checkpoint score required to mark a module complete

  // Standard rubric weighting used across all 8 projects (some projects omit
  // categories that don't apply, e.g. a single-module project has no "Security"
  // category, and its weights are renormalized to sum to 100 on that project).
  const RUBRIC_WEIGHTS = { architecture: 20, implementation: 25, reliability: 15, security: 15, testing: 10, observability: 10, documentation: 5 };

  const PROJECTS = [
    { id: 1, title: "Dependency Workflow Engine", modules: [1], difficulty: "Beginner",
      summary: "Build a workflow dependency system: define tasks, validate dependencies, detect cycles, and compute a topological execution order.",
      rubric: ["architecture", "implementation", "testing", "documentation"] },
    { id: 2, title: "Idempotent Payment API", modules: [2, 6], difficulty: "Intermediate",
      summary: "Build a small API that handles idempotency keys, duplicate requests, request validation, error handling, and a documented contract.",
      rubric: ["architecture", "implementation", "reliability", "testing", "documentation"] },
    { id: 3, title: "Resilient API Client", modules: [3], difficulty: "Intermediate",
      summary: "Build a client with retry, exponential backoff, jitter, and a circuit breaker, verified with automated tests.",
      rubric: ["implementation", "reliability", "testing", "documentation"] },
    { id: 4, title: "Capacity Planning Simulator", modules: [4], difficulty: "Intermediate",
      summary: "Build a simulator that takes arrival rate, service rate, and worker count, and predicts whether the system can handle traffic.",
      rubric: ["implementation", "testing", "documentation"] },
    { id: 5, title: "Secure Webhook Service", modules: [5], difficulty: "Intermediate",
      summary: "Implement HMAC signature verification, replay protection, and safe request processing, defended against named attack scenarios.",
      rubric: ["implementation", "security", "testing", "documentation"] },
    { id: 6, title: "Versioned API", modules: [6], difficulty: "Intermediate",
      summary: "Design and evolve an API without unnecessary breaking changes: contract, versioning strategy, error model, documentation.",
      rubric: ["architecture", "implementation", "documentation"] },
    { id: 7, title: "Incident Observability System", modules: [7], difficulty: "Intermediate",
      summary: "Build a small observability setup: structured logs, request IDs, metrics, error tracking, an SLO definition, and incident diagnosis.",
      rubric: ["implementation", "observability", "documentation"] },
    { id: 8, title: "Production Automation Platform", modules: [1, 2, 3, 4, 5, 6, 7, 8], difficulty: "Capstone-level",
      summary: "The major portfolio project. Combine DAGs, idempotency, retry, capacity, security, API contracts, and observability into one system with an architecture diagram, implementation, tests, and README.",
      rubric: ["architecture", "implementation", "reliability", "security", "testing", "observability", "documentation"] },
  ];

  function rubricForProject(projectId) {
    const p = PROJECTS.find((x) => x.id === projectId);
    if (!p) return [];
    const total = p.rubric.reduce((sum, key) => sum + RUBRIC_WEIGHTS[key], 0);
    return p.rubric.map((key) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), weight: Math.round((RUBRIC_WEIGHTS[key] / total) * 100) }));
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

  // Required hands-on evidence per module, beyond the checkpoint quiz, for the module
  // to count as COMPLETE (mastery gating). Keys match the CourseProgress.setSection()
  // keys each module's own script already writes when a student passes that exercise.
  const REQUIRED_SECTIONS = {
    1: ["dagBuilderValid"],
    2: ["idemCodeExercise"],
    3: ["retryCodeExercise", "cbCodeExercise"],
    4: ["capacityConfigurator"],
    5: ["webhookCodeExercise", "vulnCodeExercise"],
    6: ["apiContractBuilder"],
    7: ["observabilityDashboard"],
    8: [], // capstone's own 3-part composite score (design+impl+debug) already gates it
  };

  const SECTION_LABELS = {
    dagBuilderValid: "Build a valid execution graph (no cycles, no missing dependencies)",
    idemCodeExercise: "Idempotent request handler implementation (5/5 tests)",
    retryCodeExercise: "Retry-with-backoff implementation (5/5 tests)",
    cbCodeExercise: "Circuit breaker implementation (5/5 tests)",
    capacityConfigurator: "Capacity configurator exercise",
    webhookCodeExercise: "Webhook signature verification implementation (5/5 tests)",
    vulnCodeExercise: "Webhook security-fix challenge (5/5 tests)",
    apiContractBuilder: "API contract builder exercise",
    observabilityDashboard: "Observability incident investigation",
  };

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function isPlainObject(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
  }

  // Always returns a well-formed { modules: {...}, extra: {...} } shape, no
  // matter what's actually sitting in localStorage: missing, empty, malformed
  // JSON, the wrong type entirely (array/string/number), or a valid object
  // that's simply missing modules/extra. Every other function in this file
  // reads through load(), so this one guard is what keeps a corrupted or
  // hand-edited localStorage value from crashing the app anywhere downstream.
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
  }

  function getModule(id) {
    const data = load();
    const m = data.modules[id];
    const fallback = { answers: {}, score: 0, total: 0, completed: false, sections: {}, lastVisited: null };
    if (!isPlainObject(m)) return fallback;
    return Object.assign({}, fallback, m, {
      answers: isPlainObject(m.answers) ? m.answers : {},
      sections: isPlainObject(m.sections) ? m.sections : {},
    });
  }

  // Generic top-level storage for things that aren't a single module: the
  // cross-module challenges and the final competency assessment. Stored as
  // data.extra[key] alongside data.modules so the whole shape stays inside
  // one localStorage entry.
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

  function cleanModuleRecord(rec) {
    const base = { answers: {}, score: 0, total: 0, completed: false, sections: {} };
    if (!isPlainObject(rec)) return base;
    return Object.assign({}, base, rec, {
      answers: isPlainObject(rec.answers) ? rec.answers : {},
      sections: isPlainObject(rec.sections) ? rec.sections : {},
    });
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

  // Mastery gate: a module is complete only when the checkpoint quiz is passed
  // AND every required hands-on exercise for that module has been passed.
  // Operates on a raw stored module record (m[id] shape from load().modules) so
  // pages that already hold the loaded data (e.g. the dashboard) don't need a
  // second localStorage read per module.
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
    const cur = data.modules[id] || { answers: {}, score: 0, total: 0, sections: {} };
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

  function crossChallengesComplete() {
    const pay = getExtra("crossPayment");
    const inc = getExtra("crossIncident");
    return !!(pay && pay.passed && inc && inc.passed);
  }

  function isUnlocked(id) {
    if (id <= 1) return true;
    if (id === 8) return isModuleComplete(7) && crossChallengesComplete();
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
    overall, isUnlocked, statusOf, resetAll, resetModule, crossChallengesComplete,
    rubricForProject, getProject, setProject,
  };
})(window);
