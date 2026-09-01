/* Interactive engineering labs.

   Labeled simulations. They do not run Git, Cursor, or GitHub.
   They teach decisions: what belongs in a spec, where a branch
   should start, whether a PR is safe to merge, whether to ship.

   Progress is stored in CourseProgress extra.engLabs and never
   unlocks the capstone on its own. */
(function (global) {
  const esc = (s) => (global.CourseProgress ? CourseProgress.escapeHtml(s) : String(s || ""));

  function loadLabs() {
    if (!global.CourseProgress) return {};
    const extra = CourseProgress.getExtra("engLabs");
    return extra && typeof extra === "object" ? extra : {};
  }
  function saveLabs(patch) {
    if (!global.CourseProgress) return;
    CourseProgress.setExtra("engLabs", Object.assign({}, loadLabs(), patch));
  }

  function setChip(btn, on) {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("on", on);
  }

  /* ---------- Spec Lab ---------- */

  const SPEC = {
    ticket: {
      id: "NL-SPEC",
      from: "Dan (Northline Digital)",
      title: "Add a booking system",
      quote: "Can you add a booking system so users can choose a time and get confirmation?",
    },
    reqs: [
      { id: "r1", keep: true, t: "A patient can pick a date and a time from slots the clinic actually offers." },
      { id: "r2", keep: true, t: "After a successful request, the patient sees a confirmation they can screenshot." },
      { id: "r3", keep: true, t: "Name and email are required before the request is sent." },
      { id: "r4", keep: false, t: "Patients can pay the appointment fee by card in this ticket." },
      { id: "r5", keep: false, t: "Sync the clinic calendar with Google Calendar." },
      { id: "r6", keep: false, t: "Rebuild the whole site in a JavaScript framework while we are here." },
      { id: "r7", keep: true, t: "A slot that is already taken cannot be booked again." },
      { id: "r8", keep: false, t: "Send SMS reminders 24 hours before the appointment." },
      { id: "r9", keep: true, t: "If the request fails, the patient sees an honest error, not a blank page." },
      { id: "r10", keep: false, t: "Add a staff login and an admin dashboard." },
    ],
    criteria: [
      { id: "c1", real: true, t: "Given available Saturday 09:00 slots, when I select one and submit a name and email, then I see a confirmation that names that time." },
      { id: "c2", real: true, t: "Given no remaining slots on a day, when I open that day, then I cannot submit a booking for it." },
      { id: "c3", real: false, t: "The confirmation should feel premium and use a delightful animation." },
      { id: "c4", real: true, t: "Given a missing email, when I press Request, then nothing is sent and the email field is marked." },
      { id: "c5", real: false, t: "Use Tailwind and a booking microservice." },
      { id: "c6", real: false, t: "The form should match Apple's Human Interface Guidelines." },
    ],
    questions: [
      { id: "q1", ask: true, t: "Which days and hours are actually bookable?" },
      { id: "q2", ask: true, t: "Is this a request the clinic confirms later, or an instant booking?" },
      { id: "q3", ask: false, t: "Which shade of blue should the button be?" },
      { id: "q4", ask: true, t: "What happens if two people submit the same slot at the same time?" },
      { id: "q5", ask: false, t: "Should we migrate the CMS this sprint?" },
      { id: "q6", ask: true, t: "Who receives the confirmation \u2014 patient, clinic, or both?" },
    ],
    proposal: {
      title: "Agent proposal \u00b7 not a real agent",
      body: "I will add Stripe checkout, a Google Calendar sync, an SMS reminder, and a React booking widget. Slots are hardcoded 9\u20135 weekdays. On success I console.log the patient email. Duplicate submissions are fine; the clinic can sort it out.",
      flags: [
        { id: "f1", real: true, t: "Invented: payment, calendar sync, SMS, a framework rewrite." },
        { id: "f2", real: true, t: "Missing: confirmation the patient can see, honest failure, duplicate-slot rule." },
        { id: "f3", real: true, t: "Unclarified: instant book vs request; weekend hours; who gets notified." },
        { id: "f4", real: false, t: "Hardcoded weekday hours are a reasonable first draft if Priya confirmed them." },
        { id: "f5", real: true, t: "Logging the email is a privacy defect, not a debug detail." },
        { id: "f6", real: false, t: "console.log is always forbidden in student work, even of non-personal data." },
      ],
    },
  };

  function gradeSelect(items, selected, key) {
    const missed = items.filter((x) => x[key] && !selected[x.id]);
    const extra = items.filter((x) => !x[key] && selected[x.id]);
    return { ok: missed.length === 0 && extra.length === 0, missed, extra };
  }

  function renderSpec(mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const saved = (loadLabs().spec || {});
    mount.innerHTML =
      '<div class="elab">' +
        '<div class="elab-banner">Labeled simulation \u00b7 you are writing a spec, not talking to Cursor</div>' +
        '<div class="ticket">' +
          '<div class="tkhead"><span class="ticketid">' + esc(SPEC.ticket.id) + '</span><span class="tkwho">' + esc(SPEC.ticket.from) + "</span></div>" +
          "<h3>" + esc(SPEC.ticket.title) + "</h3>" +
          '<p class="tkquote">\u201c' + esc(SPEC.ticket.quote) + "\u201d</p>" +
        "</div>" +
        '<p class="mut">Dan forwarded one sentence. Select what belongs. Leave the inventions off. Then judge the agent\u2019s plan against the spec you just made.</p>' +
        '<div id="specPhases"></div>' +
        '<div class="feedback" id="specFb"></div>' +
      "</div>";

    const phases = [
      { id: "reqs", title: "1 \u00b7 What is actually in scope?", hint: "Select every real requirement. Leave the extras off \u2014 they are how a one-week ticket becomes a rewrite.", items: SPEC.reqs, key: "keep" },
      { id: "criteria", title: "2 \u00b7 Which of these are acceptance criteria?", hint: "A criterion is Given / When / Then. A vibe or a framework is not.", items: SPEC.criteria, key: "real" },
      { id: "questions", title: "3 \u00b7 What do you still need to ask Priya?", hint: "Select the questions that have factual answers. Skip the ones that are taste or a different project.", items: SPEC.questions, key: "ask" },
      { id: "flags", title: "4 \u00b7 The agent drafted a plan. What is wrong with it?", hint: "Charge the real defects. Leave the innocent observations.", items: SPEC.proposal.flags, key: "real", proposal: true },
    ];

    const selected = saved.selected || {};
    const passedPhases = saved.passedPhases || {};
    const box = mount.querySelector("#specPhases");

    phases.forEach(function (ph) {
      if (!selected[ph.id]) selected[ph.id] = {};
      const card = document.createElement("div");
      card.className = "elab-phase" + (passedPhases[ph.id] ? " is-done" : "");
      card.innerHTML = "<h4>" + esc(ph.title) + "</h4><p class='mut'>" + esc(ph.hint) + "</p>";
      if (ph.proposal) {
        const prop = document.createElement("div");
        prop.className = "elab-ai";
        prop.innerHTML = "<div class='elab-ai-lbl'>" + esc(SPEC.proposal.title) + "</div><p>" + esc(SPEC.proposal.body) + "</p>";
        card.appendChild(prop);
      }
      const row = document.createElement("div");
      row.className = "elab-chips";
      ph.items.forEach(function (item) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "elab-chip";
        b.setAttribute("data-id", item.id);
        b.setAttribute("aria-pressed", "false");
        b.textContent = item.t;
        setChip(b, !!selected[ph.id][item.id]);
        b.onclick = function () {
          selected[ph.id][item.id] = !selected[ph.id][item.id];
          setChip(b, selected[ph.id][item.id]);
        };
        row.appendChild(b);
      });
      card.appendChild(row);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-check", ph.id);
      btn.className = "primary";
      btn.style.marginTop = "12px";
      btn.textContent = passedPhases[ph.id] ? "Passed \u00b7 check again" : "Check this step";
      const fb = document.createElement("div");
      fb.className = "feedback";
      btn.onclick = function () {
        const g = gradeSelect(ph.items, selected[ph.id], ph.key);
        if (g.ok) {
          passedPhases[ph.id] = true;
          card.classList.add("is-done");
          fb.className = "feedback ok";
          fb.textContent = "Clean. Every real item is in, and the inventions stayed out.";
        } else {
          passedPhases[ph.id] = false;
          card.classList.remove("is-done");
          fb.className = "feedback bad";
          const bits = [];
          if (g.missed.length) bits.push("Missed " + g.missed.length + " that belong.");
          if (g.extra.length) bits.push("Charged " + g.extra.length + " that do not.");
          fb.textContent = bits.join(" ") + " Read the ticket again. Inventions feel helpful and they are how scope dies.";
        }
        const all = phases.every(function (p) { return passedPhases[p.id]; });
        const ownEl = mount.querySelector("#specOwn");
        saveLabs({ spec: { selected: selected, passedPhases: passedPhases, passed: all, ownCriterion: ownEl ? ownEl.value.trim() : (saved.ownCriterion || ""), at: new Date().toISOString() } });
        const top = mount.querySelector("#specFb");
        if (all) {
          top.className = "feedback ok";
          top.innerHTML = "<b>That is a spec.</b> You named the work, named the non-work, wrote checks a stranger could run, listed the unknowns, and rejected a plan that implemented a different product. The MCQs below are extra reps. They do not replace this.";
        }
      };
      card.appendChild(btn);
      card.appendChild(fb);
      box.appendChild(card);
    });
    const ownWrap = document.createElement("div");
    ownWrap.className = "elab-phase";
    ownWrap.innerHTML = "<h4>Optional \u00b7 Write one Given / When / Then of your own</h4>" +
      "<p class='mut'>Not auto-graded for wording. A sentence a stranger could run. Stored as learning evidence, not a spec oracle.</p>";
    const ownTa = document.createElement("textarea");
    ownTa.id = "specOwn";
    ownTa.setAttribute("aria-label", "Your own acceptance criterion");
    ownTa.value = saved.ownCriterion || "";
    ownTa.addEventListener("blur", function () {
      const prev = loadLabs().spec || {};
      saveLabs({ spec: Object.assign({}, prev, { selected: selected, passedPhases: passedPhases, ownCriterion: ownTa.value.trim() }) });
    });
    ownWrap.appendChild(ownTa);
    box.appendChild(ownWrap);
    if (saved.passed) {
      const top = mount.querySelector("#specFb");
      top.className = "feedback ok";
      top.textContent = "Spec lab already passed in this browser. You can still re-check any step.";
    }
  }

  /* ---------- Git Lab ---------- */

  const GIT = [
    {
      id: "g1",
      title: "Where does the production hotfix go?",
      body: "feature/booking is half-finished. Priya just called: Saturday hours are still Closed on the live site. You need a one-line fix in production today, without shipping half-built booking.",
      tree: [
        { id: "c0", label: "Initial landing page", branch: "main" },
        { id: "c1", label: "Add hours list (this is live)", branch: "main" },
        { id: "c2", label: "WIP: booking form (not reviewed)", branch: "feature/booking" },
      ],
      prompt: "Click the commit you would base the hotfix on.",
      answer: "c1",
      whyOk: "The hotfix has to reach production without the unfinished booking work. Branch from live main (hours list), not from feature/booking.",
      whyBad: "Initial is missing the hours list you already shipped. The booking WIP must not ride along with a production fix.",
    },
    {
      id: "g2",
      title: "Which commit broke booking?",
      body: "Priya says Request does nothing for some people. History on feature/booking:",
      tree: [
        { id: "c1", label: "Add booking form", branch: "feature/booking" },
        { id: "c2", label: "Wire the submit handler", branch: "feature/booking" },
        { id: "c3", label: "Agent: tidy validation", branch: "feature/booking", bad: true },
        { id: "c4", label: "Adjust button copy", branch: "feature/booking" },
      ],
      prompt: "Click the commit that most likely introduced the regression.",
      answer: "c3",
      whyOk: "Copy changes do not stop a submit. Wiring the handler made it work. \u201cTidy validation\u201d is where agents delete the empty-field guard and leave a comment saying it moved.",
      whyBad: "The symptom appeared after validation was \u201ctidied\u201d. Copy and the original form are the wrong suspects.",
    },
    {
      id: "g3",
      title: "Revert, or fix forward?",
      body: "Two incidents, same afternoon.",
      choices: [
        { id: "a", q: "Booking is sending empty emails. It shipped an hour ago. Traffic is live.", answer: "revert", opts: [
          { v: "revert", t: "Revert the commit and push." },
          { v: "forward", t: "Fix forward on main while patients keep hitting it." },
        ]},
        { id: "b", q: "The heading is 4px off on tablet. Nobody has complained.", answer: "forward", opts: [
          { v: "revert", t: "Revert the last three commits to be safe." },
          { v: "forward", t: "Fix forward on a tiny commit." },
        ]},
      ],
      whyOk: "Booking broken is a rollback: you named the trigger in Module 13. A misaligned heading is not.",
    },
    {
      id: "g4",
      title: "Merge conflict: whose line stays?",
      body: "You and the hotfix both touched hours. Resolve each hunk. \u201cOurs\u201d is your booking branch (Saturday 09:00\u201313:00, already confirmed with Priya). \u201cTheirs\u201d is a drive-by rewrite to \u201cClosed\u201d that an agent produced on main.",
      hunks: [
        { id: "h1", ours: "<dd>09:00 \u2013 13:00</dd>", theirs: "<dd>Closed</dd>", answer: "ours" },
        { id: "h2", ours: "<button>Request appointment</button>", theirs: "<button>Request appointment</button>", answer: "either" },
      ],
      whyOk: "Keep Priya\u2019s hours. Identical lines are not a conflict you need to overthink.",
    },
  ];

  function renderGit(mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const saved = loadLabs().git || { done: {} };
    const done = Object.assign({}, saved.done);
    mount.innerHTML =
      '<div class="elab">' +
        '<div class="elab-banner">Labeled simulation \u00b7 no git binary, no GitHub. Desktop Lab B is the real repo.</div>' +
        '<p class="mut">Four situations. You click commits, pick revert vs fix-forward, and resolve a tiny conflict. Pass 3 of 4 to complete the lab.</p>' +
        '<div id="gitScenes"></div>' +
        '<div class="feedback" id="gitFb"></div>' +
      "</div>";
    const host = mount.querySelector("#gitScenes");

    function paintScore() {
      const n = GIT.filter(function (s) { return done[s.id]; }).length;
      const top = mount.querySelector("#gitFb");
      const passed = n >= 3;
      saveLabs({ git: { done: done, passed: passed, at: new Date().toISOString() } });
      if (passed) {
        top.className = "feedback ok";
        top.innerHTML = "<b>Git lab complete (" + n + "/4).</b> You still need Desktop Lab B \u2014 a repo you own \u2014 before the capstone. This page does not count as using Git.";
      } else {
        top.className = "feedback";
        top.textContent = n + " / 4 scenarios passed. Need 3.";
      }
    }

    GIT.forEach(function (sc) {
      const card = document.createElement("div");
      card.className = "elab-phase" + (done[sc.id] ? " is-done" : "");
      card.setAttribute("data-scene", sc.id);
      card.innerHTML = "<h4>" + esc(sc.title) + "</h4><p>" + esc(sc.body) + "</p>";
      const fb = document.createElement("div");
      fb.className = "feedback";

      if (sc.tree) {
        const tree = document.createElement("div");
        tree.className = "gitgraph";
        tree.setAttribute("role", "group");
        tree.setAttribute("aria-label", sc.prompt);
        sc.tree.forEach(function (node, i) {
          const row = document.createElement("button");
          row.type = "button";
          row.className = "gitnode" + (node.bad ? " is-suspect" : "");
          row.setAttribute("data-id", node.id);
          row.innerHTML = '<span class="gitline" aria-hidden="true">' + (i === sc.tree.length - 1 ? "\u2514" : "\u251c") + "\u2500 </span>" +
            '<span class="gitbr">' + esc(node.branch) + "</span>" +
            "<span>" + esc(node.label) + "</span>";
          row.onclick = function () {
            tree.querySelectorAll(".gitnode").forEach(function (x) { x.classList.remove("picked", "correct", "incorrect"); });
            if (node.id === sc.answer) {
              row.classList.add("picked", "correct");
              done[sc.id] = true;
              card.classList.add("is-done");
              fb.className = "feedback ok";
              fb.textContent = sc.whyOk;
            } else {
              row.classList.add("picked", "incorrect");
              done[sc.id] = false;
              card.classList.remove("is-done");
              fb.className = "feedback bad";
              fb.textContent = sc.whyBad + " Try another commit.";
            }
            paintScore();
          };
          tree.appendChild(row);
        });
        card.appendChild(elHint(sc.prompt));
        card.appendChild(tree);
      } else if (sc.choices) {
        sc.choices.forEach(function (ch) {
          const q = document.createElement("div");
          q.className = "elab-subq";
          q.innerHTML = "<p><b>" + esc(ch.q) + "</b></p>";
          const row = document.createElement("div");
          row.className = "elab-chips";
          ch.opts.forEach(function (opt) {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "elab-chip";
            b.setAttribute("data-v", opt.v);
            b.textContent = opt.t;
            b.onclick = function () {
              row.querySelectorAll(".elab-chip").forEach(function (x) { x.classList.remove("correct", "incorrect", "on"); });
              if (opt.v === ch.answer) {
                b.classList.add("correct", "on");
                ch._ok = true;
              } else {
                b.classList.add("incorrect");
                ch._ok = false;
              }
              if (sc.choices.every(function (c) { return c._ok; })) {
                done[sc.id] = true;
                card.classList.add("is-done");
                fb.className = "feedback ok";
                fb.textContent = sc.whyOk;
              } else if (ch._ok === false) {
                done[sc.id] = false;
                fb.className = "feedback bad";
                fb.textContent = "One of these is still the wrong severity. Booking down is a rollback. A heading is not.";
              }
              paintScore();
            };
            row.appendChild(b);
          });
          q.appendChild(row);
          card.appendChild(q);
        });
      } else if (sc.hunks) {
        sc.hunks.forEach(function (h) {
          const wrap = document.createElement("div");
          wrap.className = "conflict";
          wrap.innerHTML = "<p class='mut'>Hunk</p>";
          const grid = document.createElement("div");
          grid.className = "conflict-grid";
          [["ours", "Ours (booking branch)", h.ours], ["theirs", "Theirs (agent on main)", h.theirs]].forEach(function (pair) {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "conflict-side";
            b.setAttribute("data-side", pair[0]);
            b.innerHTML = "<span class='mut'>" + pair[1] + "</span><code class='conflict-code'>" + esc(pair[2]) + "</code>";
            b.onclick = function () {
              grid.querySelectorAll(".conflict-side").forEach(function (x) { x.classList.remove("on", "correct", "incorrect"); });
              const ok = h.answer === "either" || pair[0] === h.answer;
              b.classList.add("on", ok ? "correct" : "incorrect");
              h._ok = ok;
              if (sc.hunks.every(function (x) { return x._ok; })) {
                done[sc.id] = true;
                card.classList.add("is-done");
                fb.className = "feedback ok";
                fb.textContent = sc.whyOk;
              } else if (!ok) {
                done[sc.id] = false;
                fb.className = "feedback bad";
                fb.textContent = "Priya already confirmed Saturday morning. Do not take the agent\u2019s Closed.";
              }
              paintScore();
            };
            grid.appendChild(b);
          });
          wrap.appendChild(grid);
          card.appendChild(wrap);
        });
      }
      card.appendChild(fb);
      host.appendChild(card);
    });
    paintScore();
  }

  function elHint(text) {
    const p = document.createElement("p");
    p.className = "mut";
    p.textContent = text;
    return p;
  }

  /* ---------- PR Review Lab ---------- */

  const PRS = [
    {
      id: "pr1",
      title: "Feature landed, ticket incomplete",
      ticket: "NL-005 \u00b7 Let the front desk filter appointments by status and by clinician.",
      prompt: "Add a status filter to the list.",
      files: ["appointments.js"],
      diff: "- return rows;\n+ return rows.filter(r => r.status === query.status);",
      tests: "3 passed \u00b7 no test for clinician.",
      issues: [
        { id: "i1", real: true, t: "Clinician filter from the ticket is missing." },
        { id: "i2", real: false, t: "filter should be a for-loop." },
        { id: "i3", real: true, t: "No test that a clinician-only query returns the right rows." },
      ],
      decision: "request",
      why: "It does part of the ticket fluently. Missing half of a two-part ticket is a request-changes, not a merge.",
    },
    {
      id: "pr2",
      title: "Desktop yes, phone no",
      ticket: "NL-004 \u00b7 It looks broken on my phone.",
      prompt: "Make the layout work on a phone.",
      files: ["styles.css"],
      diff: "+ .layout { display: flex; width: 980px; }\n+ @media (max-width: 320px) { .layout { flex-direction: column; } }",
      tests: "No visual tests. Screenshot on a 1440px window is attached.",
      issues: [
        { id: "i1", real: true, t: "Fixed 980px width cannot survive a 390px screen." },
        { id: "i2", real: true, t: "Breakpoint at 320px is below every phone you will actually see." },
        { id: "i3", real: false, t: "flex is banned on mobile." },
      ],
      decision: "request",
      why: "The screenshot is the laptop. The ticket was the phone. max-width plus a breakpoint you found by shrinking the window, not 320px from a blog.",
    },
    {
      id: "pr3",
      title: "Unrelated files",
      ticket: "NL-001 \u00b7 Saturday hours are wrong.",
      prompt: "Change Saturday to 09:00\u201313:00. Do not restyle.",
      files: ["index.html", "styles.css", "package.json"],
      diff: "index.html: Saturday hours fixed.\nstyles.css: new colour palette.\npackage.json: added three dependencies.",
      tests: "None.",
      issues: [
        { id: "i1", real: true, t: "styles.css and package.json were not in the ticket." },
        { id: "i2", real: false, t: "Saturday hours are still Closed." },
        { id: "i3", real: true, t: "This should be split: keep the hours commit, revert the rest." },
      ],
      decision: "request",
      why: "The hours line is the whole ticket. Extra files make the review about five things. Ask for a one-reason commit.",
    },
    {
      id: "pr4",
      title: "A secret in the diff",
      ticket: "NL-009 \u00b7 Booking is broken for some people.",
      prompt: "Find out why submit fails when email is empty.",
      files: ["booking.js"],
      diff: "+ console.log('debug email', form.email, process.env.STRIPE_SECRET);\n+ if (!form.email) return false;",
      tests: "Empty email now fails the unit test.",
      issues: [
        { id: "i1", real: true, t: "A secret and a personal email in logs." },
        { id: "i2", real: false, t: "Returning false on empty email is the bug." },
        { id: "i3", real: true, t: "The validation fix is fine; the log line is not mergeable." },
      ],
      decision: "request",
      why: "The behaviour fix is real. Secrets and PII in logs are a stop-ship even when tests are green.",
    },
    {
      id: "pr5",
      title: "Happy path only",
      ticket: "NL-006 \u00b7 Load appointments from the data file. Handle slow, empty, and missing.",
      prompt: "Read appointments.json and render the list.",
      files: ["load.js"],
      diff: "+ const rows = await fetch('appointments.json').then(r => r.json());\n+ render(rows);",
      tests: "1 passed: fixture file present, 3 rows render.",
      issues: [
        { id: "i1", real: true, t: "No loading, empty, or error state. fetch does not throw on 404." },
        { id: "i2", real: false, t: "await is illegal in browsers." },
        { id: "i3", real: true, t: "The test cannot fail if the file is missing." },
      ],
      decision: "request",
      why: "The ticket named four states. The PR implemented one and proved the one.",
    },
    {
      id: "pr6",
      title: "The test is the bug",
      ticket: "NL-009 \u00b7 Prove empty email cannot submit.",
      prompt: "Add a test that fails if empty email submits.",
      files: ["booking.test.js"],
      diff: "+ test('email', () => { expect(true).toBe(true); });",
      tests: "1 passed.",
      issues: [
        { id: "i1", real: true, t: "The test cannot fail, so it detects nothing." },
        { id: "i2", real: false, t: "Jest is the wrong runner." },
        { id: "i3", real: true, t: "Green coverage here is theater." },
      ],
      decision: "request",
      why: "A test that asserts true === true is how agents fake a suite. Reject it. Ask for the empty-string case.",
    },
    {
      id: "pr7",
      title: "Fixed the bug, broke yesterday",
      ticket: "NL-009 \u00b7 Empty email must not submit.",
      prompt: "Reject empty email. Do not change other validation.",
      files: ["booking.js"],
      diff: "- if (!form.email || !form.date) return false;\n+ if (!String(form.email).trim()) return false;\n+ return true;",
      tests: "empty email: pass. missing date: no test. date-in-the-past: now submits.",
      issues: [
        { id: "i1", real: true, t: "Date validation was deleted. That is a regression." },
        { id: "i2", real: false, t: "trim() on email is the regression." },
        { id: "i3", real: true, t: "The new test does not cover the behaviour that used to exist." },
      ],
      decision: "request",
      why: "Agents \u201cfix\u201d by replacing a compound guard with the one clause you mentioned. The other clause was load-bearing.",
    },
  ];

  function renderReview(mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const saved = loadLabs().review || { done: {} };
    const done = Object.assign({}, saved.done);
    mount.innerHTML =
      '<div class="elab">' +
        '<div class="elab-banner">Labeled simulation \u00b7 not a GitHub pull request. You are practising the review, not merging into production.</div>' +
        '<p class="mut">Seven AI-shaped PRs. Flag the real issues, then decide. Approve is almost never the answer here \u2014 that is the point. Pass 5 of 7.</p>' +
        '<div id="prScenes"></div>' +
        '<div class="feedback" id="prFb"></div>' +
      "</div>";
    const host = mount.querySelector("#prScenes");

    function paint() {
      const n = PRS.filter(function (p) { return done[p.id]; }).length;
      const top = mount.querySelector("#prFb");
      const passed = n >= 5;
      saveLabs({ review: { done: done, passed: passed, at: new Date().toISOString() } });
      top.className = passed ? "feedback ok" : "feedback";
      top.innerHTML = passed
        ? "<b>PR lab complete (" + n + "/7).</b> You still open real PRs on GitHub for Desktop Lab B. This page never merged anything."
        : n + " / 7 cases passed. Need 5.";
    }

    PRS.forEach(function (pr) {
      const card = document.createElement("div");
      card.className = "elab-phase prcard-lab" + (done[pr.id] ? " is-done" : "");
      card.setAttribute("data-pr", pr.id);
      card.innerHTML =
        "<h4>" + esc(pr.title) + "</h4>" +
        '<p class="mut">Ticket: ' + esc(pr.ticket) + "</p>" +
        '<div class="elab-ai"><div class="elab-ai-lbl">Ask to the agent</div><p>' + esc(pr.prompt) + "</p></div>" +
        '<div class="prmeta"><span>Files: ' + esc(pr.files.join(", ")) + "</span><span>Tests: " + esc(pr.tests) + "</span></div>" +
        '<pre class="prdiff">' + esc(pr.diff) + "</pre>";
      const selected = {};
      const row = document.createElement("div");
      row.className = "elab-chips";
      pr.issues.forEach(function (iss) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "elab-chip";
        b.setAttribute("data-id", iss.id);
        b.textContent = iss.t;
        setChip(b, false);
        b.onclick = function () {
          selected[iss.id] = !selected[iss.id];
          setChip(b, selected[iss.id]);
        };
        row.appendChild(b);
      });
      card.appendChild(elHint("Flag every real issue. Leave style preferences."));
      card.appendChild(row);
      const decisions = document.createElement("div");
      decisions.className = "ship-row";
      const fb = document.createElement("div");
      fb.className = "feedback";
      [["approve", "Approve"], ["request", "Request changes"], ["investigate", "Investigate further"]].forEach(function (pair) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ship-btn";
        b.setAttribute("data-v", pair[0]);
        b.textContent = pair[1];
        b.onclick = function () {
          const g = gradeSelect(pr.issues, selected, "real");
          if (!g.ok) {
            done[pr.id] = false;
            card.classList.remove("is-done");
            fb.className = "feedback bad";
            fb.textContent = (g.missed.length ? "Missed a real issue. " : "") + (g.extra.length ? "A preference is not a blocking finding. " : "") + "Fix the charge sheet before you vote.";
            paint();
            return;
          }
          if (pair[0] === pr.decision) {
            done[pr.id] = true;
            card.classList.add("is-done");
            fb.className = "feedback ok";
            fb.textContent = pr.why;
          } else {
            done[pr.id] = false;
            card.classList.remove("is-done");
            fb.className = "feedback bad";
            fb.textContent = pair[0] === "approve"
              ? "Approve is how half-tickets and secrets reach production. Request changes."
              : "You can investigate, but the evidence on this card is already enough to request changes.";
          }
          paint();
        };
        decisions.appendChild(b);
      });
      card.appendChild(elHint("Decision"));
      card.appendChild(decisions);
      card.appendChild(fb);
      host.appendChild(card);
    });
    paint();
  }

  /* ---------- Would you ship this? ---------- */

  const SHIPS = {
    "ship-m7": {
      title: "Would you ship this huddle dashboard?",
      ticket: "NL-007 \u00b7 Three numbers at 8am: today, still open, no-shows this week.",
      prompt: "Write dashboardCounts(appointments, today). Last seven days inclusive.",
      diff: "noShows: rows.filter(r => r.status === 'no-show').length\n// no date window",
      tests: "today and open: pass. no-shows: pass on a fixture that only contains this week.",
      output: "On a quiet Tuesday the no-show number includes last month.",
      answer: "request",
      good: "today and open look right, and the function shape matches the spec.",
      danger: "noShows has no window. The test fixture cannot catch that.",
      missing: "A case from eight days ago that must not count.",
      verify: "Break the window on purpose. If the test stays green, the test is the bug.",
      ifShip: "Tuesday 08:12 \u00b7 Priya: the huddle board says 40 no-shows. That is last month. Patients are asking if the clinic is collapsing. Rollback the dashboard or leave it and write a Slack apology?",
      followShip: {
        q: "Priya is in Slack. What do you do first?",
        opts: [
          { v: "rewrite", t: "Ask the agent to rewrite the dashboard." },
          { v: "repro", t: "Reproduce the number with last month's fixture, then revert or fix the window." },
          { v: "sorry", t: "Apologise and leave the number up." },
        ],
        answer: "repro",
        whyOk: "See the number, then restore a known-good window. Do not start a rewrite during an incident.",
        whyBad: "Rewrites and apologies skip the fixture that would prove the window is missing.",
      },
      ifInvestigate: "Dan: fair. Add an eight-day-ago fixture that must not count, then come back. Do not ship the number as-is.",
      ifRequest: "Sam on the PR: request changes is the right call. The suite is green because the fixture only contains this week.",
    },
    "ship-m9": {
      title: "Would you ship this booking fix?",
      ticket: "NL-009 \u00b7 Two patients hit Request and nothing happened.",
      prompt: "Make submit work.",
      diff: "- btn.disabled = !canSubmit(form);\n+ btn.disabled = false;\n+ btn.onclick = () => save(form);",
      tests: "Clicking Request now always calls save. Suite green.",
      output: "Empty email is now stored. Priya will see blank patients.",
      answer: "request",
      good: "The button responds. That was the symptom.",
      danger: "The agent removed the guard that was the actual requirement.",
      missing: "A test that save is not called when email is empty.",
      verify: "Submit empty, submit valid, read the stored records. Not just \u2018the button works\u2019.",
      ifShip: "Tuesday 09:40 \u00b7 Priya: three blank patients in the list. Email empty. The button works. The requirement does not. Revert the guard deletion.",
      followShip: {
        q: "Priya reports blank patients. What do you do first?",
        opts: [
          { v: "rewrite", t: "Ask the agent to rewrite the form." },
          { v: "repro", t: "Reproduce empty submit, revert the guard deletion, then add a failing test." },
          { v: "sorry", t: "Apologise and leave the blanks." },
        ],
        answer: "repro",
        whyOk: "See the blank row, restore the guard, prove it with a test. Do not start a rewrite during an incident.",
        whyBad: "Rewrites and apologies skip the fixture that would prove the guard is gone.",
      },
      ifInvestigate: "Dan: the button working is not the ticket. Put the empty-email guard back, then add a test that fails if it is gone.",
      ifRequest: "Sam: request changes. A click that stores garbage is not a fix.",
    },
    "ship-m11": {
      title: "Would you ship this tidy-up?",
      ticket: "NL-011 \u00b7 Three copies of the date helper, and a console.log with a patient email.",
      prompt: "Refactor. Do not change behaviour. Remove the log.",
      diff: "One isWithinDays, behaviour preserved in the cases we ran.\nconsole.log removed.\nAlso reformatted every file and renamed patient to user.",
      tests: "Existing tests pass. No test asserts the log is gone.",
      output: "Diff is 400 lines. The leak is gone. So is a lot of unrelated noise.",
      answer: "investigate",
      good: "The log is gone and the helper is unified \u2014 that was the ticket.",
      danger: "A 400-line \u201ctidy\u201d hides whether behaviour moved. Renames across files are a second ticket.",
      missing: "A split: one commit for the helper, one for the log, none for the drive-by rename.",
      verify: "Read the diff hunk by hunk. If you cannot defend a hunk, it does not ship in this PR.",
      ifShip: "Tuesday 11:02 \u00b7 QA: booking confirmation copy changed on a page this ticket never named. The tidy shipped a second product. Split the PR or revert.",
      followShip: {
        q: "QA caught a copy change this ticket never named. First move?",
        opts: [
          { v: "keep", t: "Leave it. The log is gone." },
          { v: "split", t: "Revert or split: keep the helper and log removal, put the rename on a later ticket." },
          { v: "rewrite", t: "Ask the agent to rewrite the whole repo." },
        ],
        answer: "split",
        whyOk: "A 400-line tidy is two tickets. Split or revert. Do not add a third rewrite.",
        whyBad: "Leaving the surprise, or boiling the ocean, both skip the hunk review.",
      },
      ifInvestigate: "Right call. Walk the hunks. Keep the helper and the log removal. Put the rename on a later ticket.",
      ifRequest: "Requesting changes is not wrong \u2014 but this card is teaching you to read the noisy diff before you bounce it. Investigate the hunks first.",
    },
  };

  function renderShip(mountId, shipId) {
    const mount = document.getElementById(mountId);
    const spec = SHIPS[shipId];
    if (!mount || !spec) return;
    const saved = ((loadLabs().ship || {})[shipId]) || {};
    mount.innerHTML =
      '<div class="elab shipcard">' +
        '<div class="elab-banner">Would you ship this? \u00b7 judgment call, not a deploy</div>' +
        "<h3>" + esc(spec.title) + "</h3>" +
        '<p class="mut">Ticket: ' + esc(spec.ticket) + "</p>" +
        '<div class="elab-ai"><div class="elab-ai-lbl">Ask</div><p>' + esc(spec.prompt) + "</p></div>" +
        '<pre class="prdiff">' + esc(spec.diff) + "</pre>" +
        '<div class="prmeta"><span>Tests: ' + esc(spec.tests) + "</span><span>Observed: " + esc(spec.output) + "</span></div>" +
        '<div class="ship-row" role="group" aria-label="Ship decision">' +
          '<button type="button" class="ship-btn" data-v="ship">Ship it</button>' +
          '<button type="button" class="ship-btn" data-v="investigate">Investigate first</button>' +
          '<button type="button" class="ship-btn" data-v="request">Request changes</button>' +
        "</div>" +
        '<div class="feedback" id="shipFb-' + esc(shipId) + '"></div>' +
        '<div class="conseq" id="shipConseq-' + esc(shipId) + '" hidden></div>' +
        '<div class="followup" hidden></div>' +
      "</div>";
    const fb = mount.querySelector(".feedback");
    const conseq = mount.querySelector(".conseq");
    function showConsequence(v, ok) {
      const key = v === "ship" ? "ifShip" : (v === "investigate" ? "ifInvestigate" : "ifRequest");
      const text = spec[key] || "";
      if (!text) { conseq.hidden = true; conseq.innerHTML = ""; return; }
      conseq.hidden = false;
      conseq.innerHTML = '<div class="elab-ai-lbl">' + (ok ? "What happens next" : "Consequence of that call") + "</div><p>" + esc(text) + "</p>";
      const fu = mount.querySelector(".followup");
      if (fu) {
        if (v === "ship" && !ok && spec.followShip) {
          fu.hidden = false;
          fu.innerHTML = '<div class="elab-ai-lbl">Follow-up \u00b7 still a simulation</div><p>' + esc(spec.followShip.q) + "</p>" +
            '<div class="elab-chips">' + spec.followShip.opts.map(function (o) {
              return '<button type="button" class="elab-chip" data-fu="' + esc(o.v) + '">' + esc(o.t) + "</button>";
            }).join("") + '</div><div class="feedback" data-fufb></div>';
          fu.querySelectorAll("[data-fu]").forEach(function (btn) {
            btn.onclick = function () {
              const fv = btn.getAttribute("data-fu");
              const good = fv === spec.followShip.answer;
              const ffb = fu.querySelector("[data-fufb]");
              ffb.className = "feedback " + (good ? "ok" : "bad");
              ffb.textContent = good ? spec.followShip.whyOk : spec.followShip.whyBad;
            };
          });
        } else {
          fu.hidden = true;
          fu.innerHTML = "";
        }
      }
    }
    mount.querySelectorAll(".ship-btn").forEach(function (b) {
      b.onclick = function () {
        const v = b.getAttribute("data-v");
        mount.querySelectorAll(".ship-btn").forEach(function (x) { x.classList.remove("correct", "incorrect", "on"); });
        const ok = v === spec.answer;
        b.classList.add(ok ? "correct" : "incorrect", "on");
        fb.className = "feedback " + (ok ? "ok" : "bad");
        if (ok) {
          fb.innerHTML = "<b>Right call.</b> Looks good: " + esc(spec.good) +
            " Dangerous: " + esc(spec.danger) +
            " Missing: " + esc(spec.missing) +
            " Verify: " + esc(spec.verify);
        } else if (v === "ship") {
          fb.innerHTML = "Shipping this is how a green suite hides a real hole. Try again.";
        } else if (spec.answer === "request") {
          fb.innerHTML = "Investigate is fair when you lack evidence. On this card the defect is already visible. Request changes.";
        } else {
          fb.innerHTML = "Requesting changes is not wrong forever \u2014 but this card is teaching you to read a noisy diff before you bounce it. Investigate the hunks first.";
        }
        showConsequence(v, ok);
        const ship = Object.assign({}, loadLabs().ship || {});
        ship[shipId] = { choice: v, correct: ok, at: new Date().toISOString() };
        saveLabs({ ship: ship });
      };
    });
    if (saved.correct) {
      fb.className = "feedback ok";
      fb.textContent = "You already judged this one. You can still pick again.";
      if (saved.choice) showConsequence(saved.choice, true);
    }
  }

  /* ---------- Integrated: what would you do next? ---------- */

  const NEXT = [
    {
      id: "n1",
      title: "Dan wants it Friday",
      body: "Tests are green. You have not opened the page at 390px. The ticket said Priya must be able to book on her phone.",
      prompt: "What do you do next?",
      opts: [
        { v: "ship", t: "Ship. Tests passed and Dan is waiting." },
        { v: "phone", t: "Open it at 390px (or on a phone) before anyone else sees it." },
        { v: "rewrite", t: "Spend the afternoon rewriting it in a framework." },
      ],
      answer: "phone",
      whyOk: "Green tests that never ran at phone width are not evidence the ticket is done. Dan's calendar is not an acceptance criterion.",
      whyBad: "Shipping untested mobile, or boiling the ocean in a framework, both miss the actual next step: look at the page the way Priya will.",
    },
    {
      id: "n2",
      title: "The agent added extras",
      body: "The ticket was Saturday hours. Cursor also added Stripe checkout \u201cwhile it was in there.\u201d Tests still pass.",
      prompt: "What is dangerous here?",
      opts: [
        { v: "keep", t: "Keep Stripe. Free payment feature." },
        { v: "revert", t: "Revert the extra files. Hours only. Ask Dan if payment is a later ticket." },
        { v: "hide", t: "Comment Stripe out and merge anyway so the PR looks busy." },
      ],
      answer: "revert",
      whyOk: "Unrequested payment code is a new product, a new failure mode, and a new review. Hours was the ticket.",
      whyBad: "Keeping or hiding the extra work still ships a second feature under the first ticket's name.",
    },
    {
      id: "n3",
      title: "Ready to mark shipped?",
      body: "You are about to close NL-013. Which evidence is actually enough?",
      prompt: "What evidence would you need before shipping?",
      opts: [
        { v: "chat", t: "A screenshot of the agent saying it works." },
        { v: "local", t: "It runs on localhost on your laptop." },
        { v: "live", t: "A public https URL a stranger can open, the repo, and one thing you tested by hand." },
      ],
      answer: "live",
      whyOk: "Shipped means someone else can open it. Chat logs and localhost are private rehearsals.",
      whyBad: "The agent's summary and your laptop are not a release. Module 13 already defined this.",
    },
  ];

  function renderIntegrated(mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const saved = loadLabs().integrated || { done: {} };
    const done = Object.assign({}, saved.done);
    mount.innerHTML =
      '<div class="elab">' +
        '<div class="elab-banner">Labeled simulation \u00b7 what would you do next? Not a real incident.</div>' +
        '<p class="mut">Three pressure moments. Pass 2 of 3. The MCQs below are extra reps.</p>' +
        '<div id="nextScenes"></div>' +
        '<div class="feedback" id="nextFb"></div>' +
      "</div>";
    const host = mount.querySelector("#nextScenes");

    function paint() {
      const n = NEXT.filter(function (s) { return done[s.id]; }).length;
      const passed = n >= 2;
      saveLabs({ integrated: { done: done, passed: passed, at: new Date().toISOString() } });
      const top = mount.querySelector("#nextFb");
      top.className = passed ? "feedback ok" : "feedback";
      top.innerHTML = passed
        ? "<b>Integrated lab complete (" + n + "/3).</b> You still need Desktop Labs for the capstone. This page did not ship anything."
        : n + " / 3 passed. Need 2.";
    }

    NEXT.forEach(function (sc) {
      const card = document.createElement("div");
      card.className = "elab-phase" + (done[sc.id] ? " is-done" : "");
      card.setAttribute("data-next", sc.id);
      card.innerHTML = "<h4>" + esc(sc.title) + "</h4><p>" + esc(sc.body) + "</p><p class='mut'>" + esc(sc.prompt) + "</p>";
      const row = document.createElement("div");
      row.className = "elab-chips";
      const fb = document.createElement("div");
      fb.className = "feedback";
      sc.opts.forEach(function (opt) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "elab-chip";
        b.setAttribute("data-v", opt.v);
        b.textContent = opt.t;
        b.onclick = function () {
          row.querySelectorAll(".elab-chip").forEach(function (x) { x.classList.remove("correct", "incorrect", "on"); });
          const ok = opt.v === sc.answer;
          b.classList.add(ok ? "correct" : "incorrect", "on");
          if (ok) {
            done[sc.id] = true;
            card.classList.add("is-done");
            fb.className = "feedback ok";
            fb.textContent = sc.whyOk;
          } else {
            done[sc.id] = false;
            card.classList.remove("is-done");
            fb.className = "feedback bad";
            fb.textContent = sc.whyBad;
          }
          paint();
        };
        row.appendChild(b);
      });
      card.appendChild(row);
      card.appendChild(fb);
      host.appendChild(card);
    });
    paint();
  }

  global.EngLab = { renderSpec, renderGit, renderReview, renderShip, renderIntegrated, SPEC, GIT, PRS, SHIPS, NEXT, gradeSelect };
})(window);
