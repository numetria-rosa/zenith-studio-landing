/* Shared module chrome: the Northline ticket card, the loop strip, the
   checkpoint quiz, and the requirements grader.

   Every module page calls ModuleKit.mount(id) once. That keeps the ticket
   framing and the loop diagram identical across 13 pages instead of
   drifting per page, and it means the gate wiring lives in one file. */
(function (global) {
  const esc = (s) => (global.CourseProgress ? CourseProgress.escapeHtml(s) : String(s || ""));

  /* Question and explanation text in quiz-data.js wraps code fragments in
     <code> and writes the fragment itself as entities, e.g.
     "<code>&lt;nav&gt;</code>". Escaping the whole string shows that source
     to the student verbatim; not escaping it lets arbitrary markup into the
     page. So escape everything, then restore known entities and a fixed
     whitelist of inline tags. Anything else stays inert text. */
  function rich(s) {
    /* Tags are restored before entities, so a fragment that means to display
       a whitelisted tag name -- "<code>&lt;b&gt;</code>" -- stays text rather
       than becoming a real <b>. */
    return esc(s)
      .replace(/&lt;(\/?)(code|b|i|em|strong)&gt;/g, "<$1$2>")
      .replace(/&amp;(lt|gt|amp|quot|nbsp|mdash|ndash|hellip|#39);/g, "&$1;");
  }

  function renderTicket(moduleId) {
    const host = document.getElementById("ticketCard");
    if (!host) return;
    const t = CourseProgress.ticketFor(moduleId);
    if (!t) { host.remove(); return; }
    const m = CourseProgress.MODULES.find(function (x) { return x.id === moduleId; });
    const pri = (t.priority || "Medium").toLowerCase();
    const done = CourseProgress.isModuleComplete(moduleId);
    host.className = "ticket pri-" + pri;
    host.innerHTML =
      '<div class="tkhead">' +
        '<span class="tkorg"><span class="tkdot" aria-hidden="true"></span>' + esc(t.org || "Northline Digital") + "</span>" +
        '<span class="tkstatus ' + (done ? "done" : "open") + '">' + (done ? "Done" : "Open") + "</span>" +
      "</div>" +
      '<div class="tkid">' + esc(t.id) + "</div>" +
      '<div class="tktitle">' + esc(t.title) + "</div>" +
      '<div class="tkmeta">' +
        '<div><span>Priority</span><b class="pri-' + esc(pri) + '">' + esc(t.priority || "Medium") + "</b></div>" +
        "<div><span>Type</span><b>" + esc(t.kind || "Engineering") + "</b></div>" +
        "<div><span>Estimate</span><b>~" + ((m && m.minutes) || 45) + " min</b></div>" +
      "</div>" +
      '<div class="tkquote">\u201c' + esc(t.quote) + '\u201d</div>' +
      '<div class="tkfrom">\u2014 ' + esc(t.from) + "</div>" +
      '<div class="tkactions">' +
        (done
          ? '<a class="primary" href="#quizRoot">Review checkpoint</a>'
          : '<button type="button" class="primary" data-ticket-start>Start ticket</button>') +
      "</div>";
    const start = host.querySelector("[data-ticket-start]");
    if (start) {
      start.addEventListener("click", function () {
        const target = document.getElementById("beforeAi") ||
          document.querySelector(".wrap > section") ||
          document.getElementById("whyGrid");
        if (!target) return;
        const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
    }
  }

  /* `active` is the list of loop step ids this module drills; pass "all" to
     light the whole loop up, which Module 13 does to close the course. */
  function renderLoopInto(hostId, moduleId, label) {
    const host = document.getElementById(hostId);
    if (!host) return;
    const active = moduleId === "all"
      ? CourseProgress.LOOP.map(function (s) { return s.id; })
      : CourseProgress.loopFor(moduleId);
    host.className = "loopstrip";
    host.innerHTML =
      '<div class="looplbl">' + esc(label || "The loop \u00b7 this module drills the highlighted steps") + "</div>" +
      '<ol class="loopsteps">' +
        CourseProgress.LOOP.map(function (s) {
          const on = active.indexOf(s.id) !== -1;
          return '<li class="loopstep' + (on ? " on" : "") + '" title="' + esc(s.blurb) + '">' + esc(s.label) + "</li>";
        }).join("") +
      "</ol>";
  }

  function renderLoop(moduleId) { renderLoopInto("loopStrip", moduleId); }

  /* onPass fires only at or above the pass threshold, which is what a module
     checkpoint needs. onDone fires on every completed set with the score, which
     is what the diagnostic and the final assessment need: they report a result
     rather than unlocking anything. */
  function renderQuiz(moduleId, questions, onPass, onDone) {
    const root = document.getElementById("quizRoot");
    if (!root) return;
    let score = 0, answered = 0;
    root.innerHTML = "";
    questions.forEach(function (q) {
      const card = document.createElement("div");
      card.className = "qcard";
      card.innerHTML = '<div class="qtext">' + rich(q.text) + "</div>";
      /* Options are shuffled per render so the correct answer is not always
         in the same slot for students who retake a checkpoint. */
      const opts = (q.opts || []).slice();
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp;
      }
      opts.forEach(function (opt) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "qopt";
        b.textContent = opt.t;
        b.onclick = function () {
          if (card.dataset.done) return;
          card.dataset.done = "1";
          answered += 1;
          const ok = !!opt.correct;
          if (ok) score += 1;
          b.classList.add(ok ? "correct" : "incorrect");
          CourseProgress.setAnswer(moduleId, q.id, opt.t);
          const fb = document.createElement("div");
          fb.className = "feedback " + (ok ? "ok" : "bad");
          fb.innerHTML = rich(ok ? (opt.whyOk || opt.why || "Yes.") : (opt.why || "Not that one."));
          card.appendChild(fb);
          const sd = document.getElementById("scoreDisplay");
          if (sd) sd.textContent = "Checkpoint: " + score + " / " + questions.length;
          if (answered === questions.length) {
            CourseProgress.markComplete(moduleId, score, questions.length);
            if (score / questions.length >= CourseProgress.PASS_THRESHOLD && onPass) onPass();
            if (onDone) onDone({ score: score, total: questions.length });
          }
        };
        card.appendChild(b);
      });
      root.appendChild(card);
    });
  }

  function mount(moduleId, questions) {
    CourseProgress.touchVisited(moduleId);
    renderTicket(moduleId);
    renderLoop(moduleId);

    const mods = CourseProgress.MODULES;
    const idx = mods.findIndex((m) => m.id === moduleId);
    const next = idx >= 0 ? mods[idx + 1] : null;

    function sync() {
      const ok = CourseProgress.isModuleComplete(moduleId);
      const btn = document.getElementById("btnNext");
      if (btn) {
        if (!next) {
          btn.textContent = ok ? "Module complete" : "Finish the exercise and checkpoint";
        } else if (ok) {
          btn.textContent = "Continue to Module " + next.id;
          btn.href = next.file;
          btn.removeAttribute("aria-disabled");
          btn.classList.remove("isdisabled");
        } else {
          btn.textContent = "Finish the exercise and checkpoint (80%) to continue";
          btn.removeAttribute("href");
          btn.setAttribute("aria-disabled", "true");
          btn.classList.add("isdisabled");
        }
      }
      const box = document.getElementById("reqList");
      if (box) {
        box.innerHTML = CourseProgress.completionRequirements(moduleId).map(function (r) {
          return '<div class="req ' + (r.satisfied ? "ok" : "bad") + '">' +
            '<span class="i ' + (r.satisfied ? "i-check" : "i-circle") + '" aria-hidden="true"></span>' +
            esc(r.label) + "</div>";
        }).join("");
      }
    }

    if (questions) renderQuiz(moduleId, questions, sync);
    sync();
    return { sync };
  }

  /* Requirements grader (Module 2).

     The input is five free-text blocks. We are not pretending to judge
     whether the requirements are *good* — no regex can. We check the
     shapes a reviewer would check first: are these actually user stories,
     are the criteria testable, did you think about failure, did you break
     the work down, and did you write down what you are NOT doing.

     That last one matters most. "Make it better" has no end without it. */
  function gradeRequirements(fields) {
    const stories = String(fields.stories || "");
    const criteria = String(fields.criteria || "");
    const edges = String(fields.edges || "");
    const tasks = String(fields.tasks || "");
    const scope = String(fields.outOfScope || "");

    function bulletCount(text) {
      return text.split("\n").map((l) => l.trim()).filter((l) => l.length >= 12).length;
    }
    const gwt = (criteria.match(/\bgiven\b/gi) || []).length;
    const storyShapes = (stories.match(/\bas an?\b[\s\S]{0,120}?\bi want\b/gi) || []).length;

    const results = [
      { name: "three or more user stories in \u201cAs a \u2026 I want \u2026 so that \u2026\u201d form",
        pass: storyShapes >= 3 && /\bso that\b/i.test(stories),
        hint: "Each line needs a role, a want, and a reason. The reason is what stops you building the wrong thing." },
      { name: "three or more acceptance criteria using Given / When / Then",
        pass: gwt >= 3 && /\bwhen\b/i.test(criteria) && /\bthen\b/i.test(criteria),
        hint: "A criterion a stranger cannot run is a wish." },
      { name: "criteria are concrete \u2014 a number, a value, a message, or a named field",
        pass: /(\d|empty|blank|error|message|email|date|required|invalid|disabled)/i.test(criteria),
        hint: "\u201cWorks correctly\u201d is not checkable. Name the field or the value." },
      { name: "three or more edge cases",
        pass: bulletCount(edges) >= 3,
        hint: "One per line. What happens when it is empty, huge, duplicated, or offline?" },
      { name: "edge cases include a failure or empty state",
        pass: /(empty|none|zero|no |fail|error|offline|down|slow|invalid|duplicate|already)/i.test(edges),
        hint: "The happy path is the easy half." },
      { name: "four or more decomposed tasks",
        pass: bulletCount(tasks) >= 4,
        hint: "Break it into pieces you could finish in one sitting each." },
      { name: "something explicitly out of scope",
        pass: scope.trim().length >= 30,
        hint: "Write down what you are deliberately not doing. This is how \u201cmake it better\u201d becomes a finite job." },
    ];
    return { passed: results.every((r) => r.pass), results };
  }

  function showResults(el, out) {
    if (!el) return;
    el.className = "feedback " + (out.passed ? "ok" : "bad");
    el.innerHTML = out.results.map(function (r) {
      return '<span class="i ' + (r.pass ? "i-check" : "i-x") + '" aria-hidden="true"></span>' +
        esc(r.name) + (r.pass || !r.hint ? "" : '<span class="fbhint"> \u2014 ' + esc(r.hint) + "</span>");
    }).join("<br>");
  }

  global.ModuleKit = { mount, renderQuiz, renderTicket, renderLoop, renderLoopInto, gradeRequirements, showResults };
})(window);
