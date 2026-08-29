/* Zenith Lab — AI Automation course progress.
   Same shape as AI Engineering / Data Science: localStorage first,
   mirrored to /api/progress when loaded through the guarded course route. */
(function (global) {
  const STORAGE_KEY = "zenith_aia_progress_v1";

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
    } catch (e) { /* ignore */ }
    return "";
  }

  const MODULES = [
    { id: 1, file: "module-01.html", title: "Your First Client Workflow", minutes: 50 },
    { id: 2, file: "module-02.html", title: "Data That Moves", minutes: 45 },
    { id: 3, file: "module-03.html", title: "APIs, Webhooks & Auth", minutes: 50 },
    { id: 4, file: "module-04.html", title: "When Things Fail", minutes: 50 },
    { id: 5, file: "module-05.html", title: "Do It Once", minutes: 45 },
    { id: 6, file: "module-06.html", title: "AI as a Step, Not a Brain", minutes: 50 },
    { id: 7, file: "module-07.html", title: "Agents That Can't Run Away", minutes: 50 },
    { id: 8, file: "module-08.html", title: "Capstone: A Client-Ready Lead Pipeline", minutes: 90 },
  ];

  const PASS_THRESHOLD = 0.8;
  const RUBRIC_WEIGHTS = { architecture: 20, reliability: 25, safety: 20, implementation: 20, documentation: 15 };

  const PROJECTS = [
    { id: 1, title: "Welcome Sequence for a New Lead", modules: [1], difficulty: "Beginner",
      summary: "Form submit → tag the lead → send a welcome email. No AI. Prove you can map a real process.",
      rubric: ["architecture", "implementation", "documentation"] },
    { id: 2, title: "Lead Form to CRM", modules: [2, 3], difficulty: "Beginner",
      summary: "Take a messy form payload, map it onto a CRM contact, and refuse to create a record with a missing email.",
      rubric: ["architecture", "implementation", "documentation"] },
    { id: 3, title: "Invoice Follow-Up That Survives Timeouts", modules: [4], difficulty: "Intermediate",
      summary: "A payment API fails twice, then succeeds. Your workflow retries without sending three invoices.",
      rubric: ["reliability", "implementation", "documentation"] },
    { id: 4, title: "Webhook That Must Not Double-Charge", modules: [5], difficulty: "Intermediate",
      summary: "The same Stripe-style event arrives twice. Charge once. Return the original result on the replay.",
      rubric: ["reliability", "implementation", "documentation"] },
    { id: 5, title: "Support Ticket Classifier", modules: [6], difficulty: "Intermediate",
      summary: "An AI step labels a ticket. Reject prose. Accept only {priority, topic, needs_human}.",
      rubric: ["safety", "implementation", "documentation"] },
    { id: 6, title: "Refund Agent With a Human Gate", modules: [7], difficulty: "Intermediate",
      summary: "An agent may draft a refund. It may not execute one without an approval node.",
      rubric: ["safety", "architecture", "documentation"] },
    { id: 7, title: "Broken Production Run", modules: [4, 5, 8], difficulty: "Intermediate",
      summary: "You inherit logs from a workflow that emailed the wrong list. Find the actual bug and write the fix.",
      rubric: ["reliability", "documentation"] },
    { id: 8, title: "Client-Ready Lead Pipeline", modules: [1, 2, 3, 4, 5, 6, 7, 8], difficulty: "Capstone-level",
      summary: "Lead in → enrich → score → CRM → notify. Survive a retry, a replayed webhook, and a bad AI extract.",
      rubric: ["architecture", "reliability", "safety", "implementation", "documentation"] },
  ];

  function rubricForProject(projectId) {
    const p = PROJECTS.find((x) => x.id === projectId);
    if (!p) return [];
    const total = p.rubric.reduce((sum, key) => sum + RUBRIC_WEIGHTS[key], 0);
    return p.rubric.map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      weight: Math.round((RUBRIC_WEIGHTS[key] / total) * 100),
    }));
  }

  const REQUIRED_SECTIONS = {
    1: ["firstWorkflow"],
    2: ["mappingLab"],
    3: ["webhookLab"],
    4: ["retryLab"],
    5: ["idemLab"],
    6: ["aiStepLab"],
    7: ["guardrailLab"],
    8: ["capstoneLab"],
  };

  const SECTION_LABELS = {
    firstWorkflow: "Build a valid trigger → action → notify workflow",
    mappingLab: "Map a messy form payload onto a CRM contact",
    webhookLab: "Accept a matching teaching-signature and drop a mismatch (not Stripe HMAC)",
    retryLab: "Retry a flaky API without duplicating the side effect",
    idemLab: "Same event twice, one charge",
    aiStepLab: "Reject unstructured AI output; accept only the schema",
    guardrailLab: "Block an unbounded tool and require human approval",
    capstoneLab: "Lead pipeline survives retry, replay, and prose AI",
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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* quota */ }
    pushToServer(data);
  }

  var SERVER_COURSE_ID = "ai-automation";
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
    return cleanModuleRecord(load().modules[id]);
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
  function crossChallengesComplete() {
    const a = getExtra("crossDoubleCharge");
    const b = getExtra("crossRunawayAgent");
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
    STORAGE_KEY, MODULES, PASS_THRESHOLD, REQUIRED_SECTIONS, SECTION_LABELS, PROJECTS, RUBRIC_WEIGHTS,
    escapeHtml, safeHttpUrl,
    load, save, getModule, setModuleField, setAnswer, setSection, getExtra, setExtra,
    touchVisited, markComplete, isModuleComplete, isModuleDataComplete, completionRequirements,
    overall, isUnlocked, statusOf, resetAll, resetModule, crossChallengesComplete,
    rubricForProject, getProject, setProject,
  };

  serverSyncOnLoad();
})(window);
