/* Prompt Engineering labs for AI-Assisted Software Engineering.

   Rubric grading, not keyword bingo. A prompt that repeats "tests tests tests"
   without a case still fails verification. Copying the login example fails.
   Different valid wording can pass. Partial credit is shown; a lab passes when
   enough independent criteria land.

   Nothing here runs a coding agent. Student text is stored in extra.promptLabs
   and the module-14 required section. Cursor use remains self-reported. */
(function (global) {
  const esc = function (s) {
    return global.CourseProgress ? CourseProgress.escapeHtml(s) : String(s || "");
  };

  const LOGIN_EXAMPLE = "investigate the login failure in the authentication flow. first inspect the request payload, authentication response, and session creation path";

  const LABS = {
    repair: {
      id: "repair",
      title: "Prompt Lab 1 — Repair the vague request",
      label: "Turn Dan's sentence into an engineering prompt",
      brief: "Dan wrote: \u201cmake the huddle dashboard better.\u201d Last time the contractor sent that, the agent rewrote booking.js. Write the prompt you would actually send.",
      minWords: 40,
      need: 4,
      topic: {
        re: /\b(dashboard|huddle|no-?show|appointment|open|today|seven|7[- ]?day)\b/i,
        hint: "Name the huddle dashboard work (today / open / no-shows), not a generic \u201cmake it better.\u201d",
      },
      criteria: ["context", "task", "constraints", "acceptance", "verify"],
    },
    constraints: {
      id: "constraints",
      title: "Prompt Lab 2 — Add missing constraints",
      label: "What must the AI preserve?",
      brief: "The agent is about to rewrite authentication to fix a small huddle-dashboard label. Write the constraints you would add before it touches any file.",
      minWords: 30,
      need: 3,
      topic: {
        re: /\b(auth|authentication|booking|schema|dependenc|api|unrelated|only|dashboard)\b/i,
        hint: "Name what must not change (auth, booking, schema, dependencies) and what may.",
      },
      criteria: ["constraints", "scope", "task"],
    },
    acceptance: {
      id: "acceptance",
      title: "Prompt Lab 3 — Build acceptance criteria",
      label: "Turn \u201cadd a dashboard filter\u201d into testable criteria",
      brief: "Priya: \u201cAdd a dashboard filter.\u201d Write 3\u20135 acceptance criteria. Name what is filtered, where, empty state, and how you would know it worked.",
      minWords: 35,
      need: 4,
      topic: {
        re: /\b(filter|open|clinician|status|appointment|dashboard|empty)\b/i,
        hint: "Say what is being filtered (open / clinician / status) on the dashboard, not \u201ca filter.\u201d",
      },
      criteria: ["acceptance", "task", "context", "verify"],
    },
    debug: {
      id: "debug",
      title: "Prompt Lab 4 — Debugging prompt",
      label: "Build a debugging prompt from the bug report",
      brief: "Two patients hit Request and nothing happened. It works when Priya tries it. Console shows TypeError: Cannot read properties of undefined (reading 'trim') in booking.js:41. Write the debugging prompt \u2014 do not ask it to rewrite booking.",
      minWords: 40,
      need: 5,
      topic: {
        re: /\b(request|booking|trim|undefined|patient|submit|form|typeerror)\b/i,
        hint: "Include the symptom and the TypeError / booking.js clue, not a generic \u201cfix the bug.\u201d",
      },
      criteria: ["context", "task", "constraints", "verify", "risk"],
    },
    agent: {
      id: "agent",
      title: "Prompt Lab 5 — Bounded agent task",
      label: "Give an agent authority with a fence around it",
      brief: "You will let an agent edit the huddle dashboard. Write the instruction: scope, prohibited changes, plan first, tests, and when to stop.",
      minWords: 45,
      need: 5,
      topic: {
        re: /\b(dashboard|src\/|booking|schema|dependenc|plan|stop|only)\b/i,
        hint: "Bound the agent: which files, what is forbidden, plan before edits, when to stop.",
      },
      criteria: ["scope", "constraints", "task", "verify", "stop"],
    },
  };

  const CHALLENGE_FIELDS = [
    { id: "context", label: "Context", hint: "Relevant files, data shape, the existing test, the business rule \u2014 not the whole repo." },
    { id: "objective", label: "Objective", hint: "What should the AI do first? Investigate before rewriting totals." },
    { id: "constraints", label: "Constraints", hint: "What must not change (API, schema, unrelated files, payment)." },
    { id: "acceptance", label: "Acceptance criteria", hint: "Observable: after an edit, the invoice total matches the rule." },
    { id: "tests", label: "Tests", hint: "Name cases: edit quantity, empty line, the regression Priya reported." },
    { id: "verify", label: "Verification", hint: "How you will know it is fixed \u2014 run the test, do not trust a summary." },
    { id: "stop", label: "Stop conditions", hint: "When the agent must halt (API conflict, missing rule, totals disagree with evidence)." },
  ];

  function words(s) {
    return String(s || "").trim().split(/\s+/).filter(Boolean);
  }
  function lower(s) { return String(s || "").toLowerCase(); }
  function uniqueRatio(s) {
    const w = words(lower(s).replace(/[^a-z0-9\s]/g, " ")).filter(function (x) { return x.length > 2; });
    if (w.length < 10) return 1;
    const u = {};
    w.forEach(function (x) { u[x] = 1; });
    return Object.keys(u).length / w.length;
  }
  function has(re, s) { return re.test(String(s || "")); }
  function near(s, a, b) {
    const t = lower(s);
    const ia = t.search(a);
    const ib = t.search(b);
    if (ia < 0 || ib < 0) return false;
    return Math.abs(ia - ib) < 280;
  }

  function criterion(id, label, pass, hint) {
    return { id: id, label: label, pass: !!pass, hint: hint };
  }

  function detectContext(t) {
    const pass = has(/\b(file|existing|current|codebase|appointments?\.json|booking\.js|dashboard|src\/|hours|model|log|error|stack|test|repo|directory)\b/i, t)
      && words(t).length >= 12;
    return criterion("context", "Context", pass,
      pass ? "Relevant context is named." : "Name the relevant files, data, error, or current behaviour \u2014 not \u201cthe project.\u201d");
  }
  function detectTask(t) {
    const action = has(/\b(investigate|identify|implement|add|fix|propose|inspect|review|write|build|debug|reproduce|plan)\b/i, t);
    const object = has(/\b(dashboard|filter|booking|login|invoice|total|auth|appointment|no-?show|form|label|huddle|agent)\b/i, t);
    const vagueOnly = /^(please )?(make it better|fix (it|this|the bug)|build this)\.?$/i.test(String(t).trim());
    const pass = action && object && !vagueOnly;
    return criterion("task", "Task", pass,
      pass ? "The objective is specific." : "Say what to do and to which thing. \u201cFix it\u201d is not a task.");
  }
  function detectConstraints(t) {
    const fence = has(/\b(do not|don't|must not|without (changing|modifying)|preserve|only (change|edit|touch|modify)|do not (change|modify|rewrite|add|remove|touch))\b/i, t);
    const what = has(/\b(api|schema|booking|auth|dependenc|unrelated|package|database|existing|test|behaviour|behavior|html|css)\b/i, t);
    const pass = fence && (what || near(t, /do not|don't|preserve|only/, /file|booking|auth|api|schema|dashboard/));
    return criterion("constraints", "Constraints", pass,
      pass ? "A real boundary is stated." : "Say what must not change (API, schema, booking, dependencies) \u2014 not the word \u201cconstraints.\u201d");
  }
  function detectAcceptance(t) {
    const gwt = has(/\bgiven\b[\s\S]{4,80}\bwhen\b[\s\S]{4,80}\bthen\b/i, t);
    const observable = has(/\b(must (show|reject|display|preserve|submit|remain|match|equal)|empty|invalid|error message|no-?show|total|visible|keyboard|label)\b/i, t);
    const notVibe = !has(/\b(user[- ]friendly|make it better|feel premium|nice ux)\b/i, t) || observable;
    const pass = (gwt || observable) && notVibe && words(t).length >= 12;
    return criterion("acceptance", "Acceptance", pass,
      pass ? "Success is observable." : "Write a checkable outcome (empty, invalid, visible total), not \u201cworks properly.\u201d");
  }
  function detectVerify(t) {
    const mentionsTest = has(/\b(test|verify|reproduc|regression|assert|failing case)\b/i, t);
    const aCase = has(/\b(empty|invalid|boundary|regression|seven|7[- ]?day|edit(ed)? order|quantity|undefined|trim|failed login|successful login|no-?show)\b/i, t);
    const theatre = /\btests?\b/.test(lower(t)) && !aCase && !has(/\b(run the|must fail|cannot pass without)\b/i, t);
    const pass = mentionsTest && aCase && !theatre;
    return criterion("verify", "Verification", pass,
      pass ? "A real check is named." : "\u201cAdd tests\u201d is not verification. Name the case (empty, invalid, the reported regression).");
  }
  function detectScope(t) {
    const pass = has(/\b(only|stay inside|work only|do not (modify|change|touch) unrelated|allowed files?|\/src\/|dashboard\.js|booking\.js)\b/i, t);
    return criterion("scope", "Scope", pass,
      pass ? "Scope is bounded." : "Name allowed files or \u201cdo not change unrelated files.\u201d");
  }
  function detectRisk(t) {
    const pass = has(/\b(edge|empty|undefined|null|concurrent|security|authori[sz]|injection|xss|csrf|secret|pii|email in (the )?log)\b/i, t);
    return criterion("risk", "Risk / edge", pass,
      pass ? "A real risk or edge is named." : "Name an edge or risk (empty input, undefined, PII in logs), not \u201cbe careful.\u201d");
  }
  function detectStop(t) {
    const pass = has(/\b(stop if|stop when|halt if|do not (continue|proceed)|stopping condition)\b/i, t)
      || has(/\bif\b[\s\S]{0,90}\b(conflict|disagree|unclear|missing|fail)\b/i, t);
    return criterion("stop", "Stop condition", pass,
      pass ? "A stop condition is present." : "Say when the agent must stop (API conflict, missing rule, tests fail).");
  }

  const DETECT = {
    context: detectContext,
    task: detectTask,
    constraints: detectConstraints,
    acceptance: detectAcceptance,
    verify: detectVerify,
    scope: detectScope,
    risk: detectRisk,
    stop: detectStop,
  };

  function antiGame(text) {
    const t = String(text || "");
    const w = words(t);
    const reasons = [];
    if (lower(t).indexOf(LOGIN_EXAMPLE) !== -1) {
      reasons.push("This copies the login example. Write a prompt for this ticket.");
    }
    if (uniqueRatio(t) < 0.28 && w.length > 25) {
      reasons.push("Keyword stuffing: repeating the same words is not an engineering prompt.");
    }
    if (w.length > 420 && uniqueRatio(t) < 0.45) {
      reasons.push("The prompt is huge and unstructured. Minimum sufficient context, not a dump.");
    }
    const testsCount = (lower(t).match(/\btests?\b/g) || []).length;
    if (testsCount >= 8 && !has(/\b(empty|invalid|regression|no-?show|trim)\b/i, t)) {
      reasons.push("Repeating \u201ctests\u201d without a case is test theatre.");
    }
    return reasons;
  }

  function gradeText(text, spec) {
    const t = String(text || "").trim();
    const w = words(t);
    const veto = antiGame(t);
    const criteria = (spec.criteria || []).map(function (id) {
      return DETECT[id] ? DETECT[id](t) : criterion(id, id, false, "");
    });
    if (spec.topic) {
      const topicPass = spec.topic.re.test(t);
      criteria.unshift(criterion("topic", "On this ticket", topicPass, topicPass ? "On-ticket." : spec.topic.hint));
    }
    if (w.length < (spec.minWords || 30)) {
      veto.push("Too short to be an engineering request (need about " + (spec.minWords || 30) + " words).");
    }
    const hits = criteria.filter(function (c) { return c.pass; }).length;
    const need = spec.need || Math.max(3, criteria.length - 1);
    const passed = veto.length === 0 && hits >= need;
    return {
      passed: passed,
      hits: hits,
      need: need,
      total: criteria.length,
      criteria: criteria,
      veto: veto,
      words: w.length,
    };
  }

  function gradeChallenge(fields) {
    const f = fields || {};
    const blob = CHALLENGE_FIELDS.map(function (x) { return f[x.id] || ""; }).join("\n");
    const veto = antiGame(blob);
    const parts = [
      detectContext(f.context || ""),
      detectTask((f.objective || "") + " " + (f.context || "")),
      detectConstraints(f.constraints || ""),
      detectAcceptance(f.acceptance || ""),
      detectVerify((f.tests || "") + "\n" + (f.verify || "")),
      detectScope((f.constraints || "") + "\n" + (f.stop || "")),
      detectStop(f.stop || ""),
      criterion("invoice", "Invoice ticket", has(/\b(invoice|total|order|quantity|line item)\b/i, blob),
        has(/\b(invoice|total|order)\b/i, blob) ? "On the invoice ticket." : "This challenge is about invoice totals after editing an order."),
    ];
    CHALLENGE_FIELDS.forEach(function (x) {
      if (words(f[x.id] || "").length < 8) {
        veto.push(x.label + " needs a real sentence, not a heading.");
      }
    });
    if (!has(/\b(do not|don't|must not|preserve)\b/i, f.constraints || "")) {
      /* already in detectConstraints */
    }
    const hits = parts.filter(function (c) { return c.pass; }).length;
    const need = 6;
    return {
      passed: veto.length === 0 && hits >= need,
      hits: hits,
      need: need,
      total: parts.length,
      criteria: parts,
      veto: veto,
    };
  }

  function rubricHtml(result) {
    const rows = (result.criteria || []).map(function (c) {
      return '<div class="req ' + (c.pass ? "ok" : "bad") + '">' +
        '<span class="i ' + (c.pass ? "i-check" : "i-circle") + '" aria-hidden="true"></span>' +
        esc(c.label) + " \u2014 " + esc(c.hint) + "</div>";
    }).join("");
    const veto = (result.veto || []).map(function (v) {
      return '<div class="req bad"><span class="i i-circle" aria-hidden="true"></span>' + esc(v) + "</div>";
    }).join("");
    return veto + rows;
  }

  function loadStore() {
    if (!global.CourseProgress) return { labs: {}, challenge: {} };
    const rec = CourseProgress.getExtra("promptLabs") || {};
    return {
      labs: rec.labs && typeof rec.labs === "object" ? rec.labs : {},
      challenge: rec.challenge && typeof rec.challenge === "object" ? rec.challenge : {},
    };
  }
  function saveStore(store) {
    if (!global.CourseProgress) return;
    const labs = store.labs || {};
    let labPass = 0;
    Object.keys(LABS).forEach(function (k) { if (labs[k] && labs[k].passed) labPass += 1; });
    const challengeOk = !!(store.challenge && store.challenge.passed);
    const allLabs = Object.keys(LABS).every(function (k) { return labs[k] && labs[k].passed; });
    CourseProgress.setExtra("promptLabs", {
      labs: labs,
      challenge: store.challenge || {},
      at: new Date().toISOString(),
    });
    CourseProgress.setSection(14, "promptLabsExercise", {
      passed: allLabs && challengeOk,
      passCount: labPass + (challengeOk ? 1 : 0),
      total: Object.keys(LABS).length + 1,
      at: new Date().toISOString(),
    });
  }

  function paintFb(el, result, okMsg) {
    if (!el) return;
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    if (!result) { el.className = "feedback"; el.innerHTML = ""; return; }
    el.className = "feedback " + (result.passed ? "ok" : "bad");
    const head = result.passed
      ? (okMsg || ("Passed (" + result.hits + "/" + result.total + ")."))
      : (result.veto && result.veto[0]
        ? result.veto[0]
        : "Partial credit: " + result.hits + "/" + result.total + " \u2014 need " + result.need + ".");
    el.innerHTML = esc(head) + '<div style="margin-top:10px">' + rubricHtml(result) + "</div>";
  }

  function mountLab(hostId, labId, onChange) {
    const host = document.getElementById(hostId);
    const spec = LABS[labId];
    if (!host || !spec) return;
    const store = loadStore();
    const saved = store.labs[labId] || {};
    host.innerHTML =
      '<div class="ilbl">' + esc(spec.title) + " \u00b7 rubric, not keywords</div>" +
      "<p>" + esc(spec.brief) + "</p>" +
      '<div class="formrow"><label for="pk_' + labId + '">' + esc(spec.label) + "</label>" +
      '<textarea id="pk_' + labId + '" spellcheck="true">' + esc(saved.text || "") + "</textarea></div>" +
      '<button type="button" class="primary" id="pkbtn_' + labId + '">Grade this prompt</button>' +
      '<div class="feedback" id="pkfb_' + labId + '"></div>';
    const ta = host.querySelector("#pk_" + labId);
    const fb = host.querySelector("#pkfb_" + labId);
    if (saved.passed) paintFb(fb, saved.result, "Already passed in this browser. You can still edit and re-grade.");
    host.querySelector("#pkbtn_" + labId).onclick = function () {
      const result = gradeText(ta.value, spec);
      const cur = loadStore();
      cur.labs[labId] = { text: ta.value, passed: result.passed, result: result, at: new Date().toISOString() };
      saveStore(cur);
      paintFb(fb, result, "Passed. Engineering information is present \u2014 wording does not have to match an example.");
      if (onChange) onChange();
    };
  }

  function mountChallenge(hostId, onChange) {
    const host = document.getElementById(hostId);
    if (!host) return;
    const saved = loadStore().challenge || {};
    const fields = saved.fields || {};
    let html = '<div class="ilbl">Prompt Engineering Challenge \u00b7 NL-014 final</div>';
    html += "<p>Priya: invoice totals sometimes look wrong after someone edits an order. Repo: <code>orders.js</code>, <code>invoice.js</code>, <code>totals.test.js</code>. Rule: line total is quantity \u00d7 unit price; invoice total is the sum of line totals after the edit. Existing test only checks a new order, not an edit. Constraint: do not change the payments API. A contractor already asked the AI \u201cjust fix the totals\u201d and it suggested rewriting <code>orders.js</code> from scratch. Write the prompt you would send instead.</p>";
    CHALLENGE_FIELDS.forEach(function (x) {
      html += '<div class="formrow"><label for="pkc_' + x.id + '">' + esc(x.label) + " \u2014 " + esc(x.hint) + "</label>" +
        '<textarea id="pkc_' + x.id + '">' + esc(fields[x.id] || "") + "</textarea></div>";
    });
    html += '<button type="button" class="primary" id="pkc_go">Grade the challenge</button><div class="feedback" id="pkc_fb"></div>';
    host.innerHTML = html;
    const fb = host.querySelector("#pkc_fb");
    if (saved.passed) paintFb(fb, saved.result, "Challenge already passed in this browser.");
    host.querySelector("#pkc_go").onclick = function () {
      const f = {};
      CHALLENGE_FIELDS.forEach(function (x) {
        f[x.id] = (host.querySelector("#pkc_" + x.id).value || "");
      });
      const result = gradeChallenge(f);
      const cur = loadStore();
      cur.challenge = { fields: f, passed: result.passed, result: result, at: new Date().toISOString() };
      saveStore(cur);
      paintFb(fb, result, "Challenge passed. This is platform-graded prompt text, not proof you used Cursor.");
      if (onChange) onChange();
    };
  }

  function mountAll(onChange) {
    Object.keys(LABS).forEach(function (id) {
      mountLab("pkLab_" + id, id, onChange);
    });
    mountChallenge("pkChallenge", onChange);
  }

  global.PromptKit = {
    LABS: LABS,
    gradeText: gradeText,
    gradeChallenge: gradeChallenge,
    mountLab: mountLab,
    mountChallenge: mountChallenge,
    mountAll: mountAll,
    loadStore: loadStore,
  };
})(window);
