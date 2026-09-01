/* Zenith Lab — AI Engineering course progress system.
   Single source of truth for module completion, quiz state, and navigation gating.
   Persisted via localStorage. Per-browser/per-device only — see dashboard disclosure note.
   Architecture mirrors the Automation Engineering course's course-progress.js exactly,
   security hardening (escapeHtml/safeHttpUrl, corruption-proof load()) included from
   day one rather than retrofitted. */
(function (global) {
  const STORAGE_KEY = "zenith_aie_progress_v1";

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
    { id: 1, file: "module-01.html", title: "Prompting & Structured Outputs", minutes: 45 },
    { id: 2, file: "module-02.html", title: "Context Windows & Token Economics", minutes: 40 },
    { id: 3, file: "module-03.html", title: "Retrieval-Augmented Generation", minutes: 45 },
    { id: 4, file: "module-04.html", title: "Tool Use & Function Calling", minutes: 45 },
    { id: 5, file: "module-05.html", title: "Agent Architectures & Control Flow", minutes: 45 },
    { id: 6, file: "module-06.html", title: "Reliability for LLM Systems", minutes: 40 },
    { id: 7, file: "module-07.html", title: "Evaluation, Testing & Observability", minutes: 40 },
    { id: 8, file: "module-08.html", title: "Capstone: A Production AI Agent", minutes: 90 },
  ];

  const STAGES = [
    { id: 0, label: "Stage 0", title: "Prompting foundations", modules: [1, 2] },
    { id: 1, label: "Stage 1", title: "Retrieval and tools", modules: [3, 4] },
    { id: 2, label: "Stage 2", title: "Agents in production", modules: [5, 6, 7] },
    { id: 3, label: "Stage 3", title: "Capstone", modules: [8] },
  ];

  const PASS_THRESHOLD = 0.8;

  const RUBRIC_WEIGHTS = { architecture: 20, implementation: 25, reliability: 15, security: 15, testing: 10, observability: 10, documentation: 5 };

  const PROJECTS = [
    { id: 1, title: "Structured Output Validator", modules: [1], difficulty: "Beginner",
      summary: "Build a tool that validates and repairs raw model output against a JSON schema: strips markdown fences, fixes trailing commas, reports what it couldn't fix.",
      rubric: ["architecture", "implementation", "testing", "documentation"] },
    { id: 2, title: "Token-Budget-Aware Chunker", modules: [2], difficulty: "Beginner",
      summary: "Build a text chunker that respects a token budget, adds configurable overlap, and never silently truncates mid-sentence.",
      rubric: ["implementation", "testing", "documentation"] },
    { id: 3, title: "Vector Similarity Search Engine", modules: [3], difficulty: "Intermediate",
      summary: "Build a small in-memory vector search engine: cosine similarity, top-k retrieval, and a relevance-threshold cutoff.",
      rubric: ["architecture", "implementation", "testing", "documentation"] },
    { id: 4, title: "Idempotent Tool-Calling Executor", modules: [4], difficulty: "Intermediate",
      summary: "Build a tool executor that safely handles a model retrying the same tool call, validates arguments against a schema, and surfaces errors the model can act on.",
      rubric: ["architecture", "implementation", "reliability", "testing", "documentation"] },
    { id: 5, title: "Bounded ReAct Agent Loop", modules: [5], difficulty: "Intermediate",
      summary: "Build a reason-act-observe agent loop with a hard step limit, explicit termination conditions, and protection against repeating the same failing action forever.",
      rubric: ["architecture", "implementation", "reliability", "testing", "documentation"] },
    { id: 6, title: "Resilient LLM API Client", modules: [6], difficulty: "Intermediate",
      summary: "Build a client that retries transient failures with backoff and jitter, falls back to a secondary model on persistent failure, and fails fast on non-retryable errors.",
      rubric: ["implementation", "reliability", "testing", "documentation"] },
    { id: 7, title: "Prompt Evaluation Harness", modules: [7], difficulty: "Intermediate",
      summary: "Build a deterministic eval harness that scores model outputs against a labeled test set using multiple criteria, and flags regressions between two prompt versions.",
      rubric: ["implementation", "observability", "testing", "documentation"] },
    { id: 8, title: "Production AI Agent Platform", modules: [1, 2, 3, 4, 5, 6, 7, 8], difficulty: "Capstone-level",
      summary: "The major portfolio project. Combine structured outputs, token-aware context management, retrieval, idempotent tool calling, a bounded agent loop, retry/fallback reliability, and evaluation into one system with an architecture diagram, implementation, tests, and README.",
      rubric: ["architecture", "implementation", "reliability", "security", "testing", "observability", "documentation"] },
  ];

  function rubricForProject(projectId) {
    const p = PROJECTS.find((x) => x.id === projectId);
    if (!p) return [];
    const total = p.rubric.reduce((sum, key) => sum + RUBRIC_WEIGHTS[key], 0);
    return p.rubric.map((key) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), weight: Math.round((RUBRIC_WEIGHTS[key] / total) * 100) }));
  }

  const REQUIRED_SECTIONS = {
    1: ["structuredOutputExercise"],
    2: ["chunkerExercise"],
    3: ["retrievalExercise"],
    4: ["toolExecutorExercise"],
    5: ["agentLoopExercise"],
    6: ["retryFallbackExercise"],
    7: ["evalHarnessExercise"],
    8: [], // capstone's own composite score gates it, same pattern as Automation Engineering
  };

  const SECTION_LABELS = {
    structuredOutputExercise: "Structured output validator/repair implementation (5/5 tests)",
    chunkerExercise: "Token-budget-aware chunker implementation (5/5 tests)",
    retrievalExercise: "Cosine similarity + top-k retrieval implementation (5/5 tests)",
    toolExecutorExercise: "Idempotent tool executor implementation (5/5 tests)",
    agentLoopExercise: "Bounded agent loop implementation (5/5 tests)",
    retryFallbackExercise: "Retry-with-fallback implementation (5/5 tests)",
    evalHarnessExercise: "Evaluation harness implementation (5/5 tests)",
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

  /* ---- Server sync (Phase 10/19) ----------------------------------------
     Additive only — every function above (and everything callers already
     rely on) stays fully synchronous, backed by localStorage exactly as
     before. This block just also mirrors state to/from the server so
     progress follows an account across devices.

     It only does anything real when this file is loaded through the
     authenticated course guard (Next.js /courses/[courseId]/... route),
     where relative fetches carry the session cookie. Loaded any other way
     (e.g. local `python -m http.server` testing, or the guard 401ing a
     logged-out visitor) the fetch fails/401s and this silently no-ops,
     leaving pure localStorage behavior identical to before this system
     existed. */
  var SERVER_COURSE_ID = "ai-engineering";
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
        if (!body) return; // not authenticated, not entitled, or not on the guarded route
        var serverData = body.data;
        var local = load();
        if (hasContent(serverData) && !hasContent(local)) {
          // Fresh browser on an account with real progress elsewhere — pull it down.
          save(serverData);
          location.reload();
        } else if (hasContent(local) && !hasContent(serverData)) {
          // First time this account has been seen with progress — migrate local up once.
          fetch("/api/progress/migrate", {
            method: "POST",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ courseId: SERVER_COURSE_ID, data: local }),
          }).catch(function () {});
        }
        // If both already have content, local (already rendered this session)
        // stays authoritative here; the next save() call pushes it up as usual.
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

  function crossChallengesComplete() {
    const a = getExtra("crossRagBot");
    const b = getExtra("crossFailureInvestigation");
    return !!(a && a.passed && b && b.passed);
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
    STORAGE_KEY, MODULES, STAGES, PASS_THRESHOLD, REQUIRED_SECTIONS, SECTION_LABELS, PROJECTS, RUBRIC_WEIGHTS,
    escapeHtml, safeHttpUrl,
    load, save, getModule, setModuleField, setAnswer, setSection, getExtra, setExtra,
    touchVisited, markComplete, isModuleComplete, isModuleDataComplete, completionRequirements,
    overall, isUnlocked, statusOf, resetAll, resetModule, crossChallengesComplete,
    rubricForProject, getProject, setProject,
  };

  serverSyncOnLoad();
})(window);
