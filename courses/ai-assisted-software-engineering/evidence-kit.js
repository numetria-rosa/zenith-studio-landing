/* Evidence Passport.

   Distinguishes what Zenith Lab actually knows:
     platform  — graded inside the course
     artifact  — GitHub API or URL-shape checks
     external  — student URL; reachability unknown (CORS) or API down
     self      — honor-system session notes

   Never claims Cursor inspection or semantic app quality. */
(function (global) {
  const esc = (s) => (global.CourseProgress ? CourseProgress.escapeHtml(s) : String(s || ""));

  const CLASS_LABEL = {
    platform: "Platform verified",
    artifact: "Artifact checked",
    external: "External, format only",
    self: "Self-reported",
  };

  function parseGithub(url) {
    const href = global.CourseProgress ? CourseProgress.isGithubRepoUrl(url) : "";
    if (!href) return null;
    try {
      const u = new URL(href);
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length < 2) return null;
      return { href: href, owner: parts[0], repo: parts[1].replace(/\.git$/i, "") };
    } catch (e) { return null; }
  }

  /* Public GitHub REST API. 404 = hard fail. Rate-limit / network = soft. */
  function probeGithub(url) {
    const parsed = parseGithub(url);
    if (!parsed) {
      return Promise.resolve({ ok: false, hardFail: true, klass: "external", error: "Need https://github.com/owner/repo." });
    }
    const base = "https://api.github.com/repos/" + encodeURIComponent(parsed.owner) + "/" + encodeURIComponent(parsed.repo);
    return fetch(base).then(function (r) {
      if (r.status === 404) {
        return { ok: false, hardFail: true, klass: "artifact", error: "GitHub says this repo does not exist or is private." };
      }
      if (r.status === 403 || r.status === 429) {
        return { ok: false, hardFail: false, klass: "external", error: "GitHub API limited. URL shape is valid. Contents not confirmed this time." };
      }
      if (!r.ok) {
        return { ok: false, hardFail: false, klass: "external", error: "GitHub API " + r.status + ". URL shape is valid." };
      }
      return r.json().then(function (data) {
        return Promise.all([
          fetch(base + "/readme").then(function (x) { return x.ok; }).catch(function () { return false; }),
          fetch(base + "/commits?per_page=10").then(function (x) { return x.ok ? x.json() : []; }).catch(function () { return []; }),
          fetch(base + "/contents/").then(function (x) { return x.ok ? x.json() : []; }).catch(function () { return []; }),
        ]).then(function (triple) {
          const commits = Array.isArray(triple[1]) ? triple[1] : [];
          const files = Array.isArray(triple[2]) ? triple[2] : [];
          const names = files.map(function (f) { return String(f.name || "").toLowerCase(); });
          function hasName(re) { return names.some(function (n) { return re.test(n); }); }
          const placeholder = /hello-world|^test$|placeholder|my-first-repo/i.test(parsed.repo + " " + (data.description || ""));
          const checks = [
            { id: "exists", pass: true, label: "Repository exists and is publicly readable" },
            { id: "readme", pass: !!triple[0] || hasName(/^readme/), label: "README present" },
            { id: "commits", pass: commits.length >= 2, label: "At least two commits in the API sample (" + commits.length + " returned)" },
            { id: "branch", pass: !!data.default_branch, label: data.default_branch ? "Default branch: " + data.default_branch : "No default branch reported" },
            { id: "source", pass: hasName(/\.(html|css|js|ts|py|tsx|jsx)$/) || hasName(/^(src|app|public|index\.html|package\.json|pyproject\.toml|requirements\.txt)$/), label: "Source or config at repo root" },
            { id: "tests", pass: hasName(/test|spec|__tests__/), label: "Test/spec file or folder at root (optional — absence is not a hard fail)" },
            { id: "notPlaceholder", pass: !placeholder, label: "Name/description is not an obvious placeholder" },
          ];
          return {
            ok: true,
            hardFail: false,
            klass: "artifact",
            public: !data.private,
            hasReadme: !!triple[0] || hasName(/^readme/),
            commitSample: commits.length,
            defaultBranch: data.default_branch || "",
            htmlUrl: data.html_url || parsed.href,
            filesSample: names.slice(0, 24),
            checks: checks,
            semanticQuality: "not-verified",
            at: new Date().toISOString(),
          };
        });
      });
    }).catch(function () {
      return { ok: false, hardFail: false, klass: "external", error: "Could not reach GitHub. URL shape is valid. Contents not confirmed." };
    });
  }

  function probeLive(url) {
    const href = global.CourseProgress ? CourseProgress.isLiveAppUrl(url) : "";
    if (!href) {
      return Promise.resolve({
        ok: false, hardFail: true, klass: "external",
        error: "Need a public https live URL that is not a github.com repo, example.com, localhost, or this course host.",
        checks: [{ id: "url", pass: false, label: "Valid public https live URL" }],
        semanticQuality: "not-verified",
      });
    }
    const u = new URL(href);
    const shapeChecks = [
      { id: "https", pass: u.protocol === "https:", label: "HTTPS" },
      { id: "notGithubRepo", pass: true, label: "Not a github.com repository page" },
      { id: "notPlaceholderHost", pass: true, label: "Not example.com / localhost / course host" },
    ];
    return fetch(href, { method: "GET", mode: "cors", redirect: "follow" }).then(function (r) {
      const htmlish = (r.headers.get("content-type") || "").indexOf("html") !== -1;
      return r.text().then(function (text) {
        const titleM = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = titleM ? titleM[1].replace(/<[^>]+>/g, "").trim().slice(0, 120) : "";
        const visible = (text || "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const blob = (title + " " + visible).toLowerCase();
        const obviousPlaceholder = /coming soon|lorem ipsum|parked domain|this domain is for sale|welcome to nginx|default web page|example domain/i.test(blob) || /^hello world!?\s*$/i.test(title) || /^it works!?\s*$/i.test(title);
        const checks = shapeChecks.concat([
          { id: "http", pass: r.ok, label: r.ok ? "HTTP " + r.status + (r.redirected ? " after redirect" : "") : "HTTP " + r.status },
          { id: "html", pass: htmlish || /<html/i.test(text), label: "HTML document (when CORS allows a body)" },
          { id: "title", pass: !!title && !/^untitled$/i.test(title), label: title ? "Page title present: " + title : "No <title> in the readable body" },
          { id: "notPlaceholderPage", pass: !obviousPlaceholder, label: "Not an obvious placeholder / parked / default page" },
        ]);
        return {
          ok: r.ok && !obviousPlaceholder,
          hardFail: !!(r.ok && obviousPlaceholder),
          error: r.ok && obviousPlaceholder ? "The reachable page looks like a placeholder, parked, or default host page. Semantic quality is still not verified for real apps." : "",
          klass: r.ok && !obviousPlaceholder ? "artifact" : "external",
          status: r.status, title: title, redirected: !!r.redirected, finalUrl: r.url || href,
          reachability: r.ok ? "reachable-cors" : "http-" + r.status,
          checks: checks, semanticQuality: "not-verified", at: new Date().toISOString(),
        };
      });
    }).catch(function () {
      return {
        ok: true, hardFail: false, klass: "external",
        reachability: "cors-or-network-blocked",
        note: "Most live apps block browser CORS. Format is valid. Reachability was not independently confirmed. Semantic quality is not verified.",
        checks: shapeChecks.concat([{ id: "cors", pass: false, label: "CORS blocked — reachability not independently confirmed" }]),
        semanticQuality: "not-verified",
        at: new Date().toISOString(),
      };
    });
  }

  function snapshot() {
    return global.CourseProgress ? CourseProgress.evidenceSnapshot() : {};
  }

  function competencies() {
    const ev = snapshot();
    const eng = ev.eng || {};
    const labs = ev.labs || {};
    function dim(id, label, practiced, demonstrated, evidence, gap, klass, nextHref, nextLabel, practicedWhere) {
      return {
        id: id, label: label, practiced: practiced, demonstrated: demonstrated,
        evidence: evidence, gap: gap, klass: klass,
        nextHref: nextHref || "", nextLabel: nextLabel || "",
        practicedWhere: practicedWhere || evidence,
        notYet: demonstrated ? "" : gap,
      };
    }
    return [
      dim("req", "Requirement analysis", ev.modules && ev.modules.completed >= 2, !!eng.spec, "Spec lab + NL-002", "Ambiguous briefs from real clients", eng.spec ? "platform" : "self", "practice-specs.html", "Open Specification Lab", "Module 2 ticket breakdown + Spec lab"),
      dim("spec", "Specification", !!eng.spec, !!eng.spec, "Specification Lab", "Writing ACs under time pressure", "platform", "practice-specs.html", "Re-run Specification Lab", "Specification Lab"),
      (function () {
        const challenged = !!(ev.promptLabs && ev.promptLabs.challenge);
        const d = dim("prompt", "AI Instruction & Context Engineering",
          !!(ev.promptLabs && (ev.promptLabs.labPass >= 3 || ev.promptLabs.moduleComplete)),
          challenged,
          "Prompt labs + Prompt Engineering Challenge (platform graded)",
          "Needs real project application outside the course",
          "platform",
          challenged ? "ai-review.html" : "module-14.html",
          challenged ? "Apply the framework in AI Review, debugging, and Desktop Labs" : "Open Prompt Engineering",
          "NL-014 prompt labs (platform graded, not Cursor verification)");
        d.notYet = "Needs real project application outside the course. This is not a Certified Prompt Engineer credential.";
        return d;
      })(),
      dim("ai", "AI collaboration", labs.cursor || (ev.det || 0) > 0 || !!eng.aiReview, (ev.det || 0) >= 3 || !!eng.aiReview, "Detective + AI Review Lab + Desktop Lab A", "Long-running agent sessions", labs.cursor ? "self" : "platform", "ai-review.html", "AI Review Lab", "Detective cases, AI Review, Desktop Lab A"),
      dim("review", "Code review", !!eng.review || (ev.det || 0) > 0, !!eng.review, "PR Review Lab", "Reviewing teammates, not just agents", "platform", "practice-review.html", "PR Review Lab", "PR Review Lab"),
      dim("test", "Testing", (ev.js || 0) >= 1, (ev.js || 0) >= 3, "JS / testing practice", "Load and contract tests", "platform", "practice-testing.html", "Testing practice", "JavaScript and testing libraries"),
      dim("debug", "Debugging", !!eng.integrated || !!eng.incident, !!eng.integrated, "Integrated next-step lab", "Production logs you do not own", "platform", "practice-integrated.html", "Integrated lab", "Integrated next-step + incident sim"),
      dim("git", "Git workflow", !!eng.git, labs.github, "Git Lab + Desktop Lab B", "Real merge conflicts on a team", labs.github ? "artifact" : "platform", "desktop-labs.html", "Desktop Lab B", "Git Lab simulation + GitHub URL"),
      dim("sec", "Security awareness", (ev.det || 0) >= 1 || !!eng.incident, !!(ev.capstoneGates) || !!eng.incident, "Detective PII / incident / capstone gates", "Threat modelling", "platform", "incident.html", "Incident simulation", "Detective, incident, release review"),
      dim("a11y", "Accessibility", (ev.html || 0) >= 1, !!(ev.capstoneGates), "HTML practice / capstone a11y gate", "Screen-reader testing", "platform", "release-review.html", "Release review (a11y card)", "HTML practice + capstone a11y gate"),
      dim("deploy", "Deployment", !!ev.capstoneShipped, !!ev.capstoneShipped, "Live URL on capstone", "CI, previews, rollback drills", ev.capstoneShipped ? "external" : "self", "deploy-guide.html", "Deploy guide", "Capstone live URL"),
      dim("ship", "Shipping judgment", (eng.shipCorrect || 0) > 0, (eng.shipCorrect || 0) >= 2 || !!eng.releaseReview, "Would you ship this? / release review", "On-call ownership", "platform", "release-review.html", "Release review", "Ship cards + release review"),
      dim("docs", "Documentation", labs.github, !!ev.capstoneShipped, "README / release notes", "Design docs", "self", "desktop-labs.html", "GitHub README evidence", "Desktop Lab B / capstone write-up"),
      dim("interview", "Explaining decisions", !!eng.interview, !!eng.interview, "Interview simulation", "A real hiring loop", "platform", "interview.html", "Interview simulation", "Interview simulation"),
    ];
  }

  function timeline() {
    const ev = snapshot();
    const items = [];
    if (ev.orientation) items.push({ when: "Start", t: "Completed orientation — the 11-step loop on NL-001" });
    if (ev.modules && ev.modules.completed) items.push({ when: "Tickets", t: ev.modules.completed + " / " + ev.modules.total + " Northline modules complete" });
    if (ev.promptLabs && ev.promptLabs.labPass) items.push({ when: "Prompts", t: ev.promptLabs.labPass + " prompt lab(s) passed (platform graded wording)" });
    if (ev.promptLabs && ev.promptLabs.challenge) items.push({ when: "Prompts", t: "Prompt Engineering Challenge passed (platform graded, not Cursor verification)" });
    if (ev.eng && ev.eng.git) items.push({ when: "Git", t: "Passed Git Lab simulation" });
    if (ev.eng && ev.eng.review) items.push({ when: "Review", t: "Passed PR Review Lab (platform verified)" });
    if (ev.det) items.push({ when: "Detective", t: ev.det + " AI Code Detective cases passed" });
    if (ev.eng && ev.eng.integrated) items.push({ when: "Judgment", t: "Passed integrated next-step lab" });
    if (ev.eng && ev.eng.shipCorrect) items.push({ when: "Ship", t: ev.eng.shipCorrect + " ship/no-ship calls judged correctly" });
    if (ev.eng && ev.eng.aiReview) items.push({ when: "AI review", t: "AI Review Lab passed (platform verified)" });
    if (ev.eng && ev.eng.interview) items.push({ when: "Interview", t: "Interview simulation passed" });
    if (ev.eng && ev.eng.incident) items.push({ when: "Incident", t: "Production incident simulation passed" });
    if (ev.labs && ev.labs.cursor) items.push({ when: "Desktop A", t: "Cursor session self-reported" });
    if (ev.labs && ev.labs.github) items.push({ when: "Desktop B", t: "GitHub repo submitted" });
    if (ev.eng && ev.eng.releaseReview) items.push({ when: "Release", t: "Release review passed (platform verified judgment)" });
    if (ev.eng && ev.eng.preship) items.push({ when: "Pre-ship", t: "Pre-ship quality review passed" });
    if (ev.workSession) items.push({ when: "Work session", t: "AI work session record saved (self-reported)" });
    if (ev.finalPassed) items.push({ when: "Final", t: "Final assessment passed" });
    const extra = global.CourseProgress ? CourseProgress.getExtra("engLabs") || {} : {};
    if (extra.interview && extra.interview.passed && !(ev.eng && ev.eng.interview)) items.push({ when: "Interview", t: "Interview simulation passed" });
    if (extra.incident && extra.incident.passed && !(ev.eng && ev.eng.incident)) items.push({ when: "Incident", t: "Production incident simulation passed" });
    if (extra.aiReview && extra.aiReview.passed && !(ev.eng && ev.eng.aiReview)) items.push({ when: "AI review", t: "AI Review Lab passed" });
    return items;
  }

  function evidenceScore() {
    const ev = snapshot();
    const extra = global.CourseProgress ? CourseProgress.getExtra("engLabs") || {} : {};
    const gates = (global.CourseProgress && CourseProgress.getExtra("capstoneGates")) || {};
    let platform = 0;
    const platformMax = 10;
    if (ev.eng && ev.eng.spec) platform += 1;
    if (ev.eng && ev.eng.git) platform += 1;
    if (ev.eng && ev.eng.review) platform += 1;
    if (ev.eng && ev.eng.integrated) platform += 1;
    if ((ev.det || 0) >= 3) platform += 1;
    if ((ev.eng && ev.eng.shipCorrect || 0) >= 1) platform += 1;
    if (extra.releaseReview && extra.releaseReview.passed) platform += 1;
    if (extra.preship && extra.preship.passed) platform += 1;
    if (extra.interview && extra.interview.passed) platform += 1;
    if (extra.incident && extra.incident.passed) platform += 1;
    let artifact = 0, artifactMax = 2;
    if (ev.labs && ev.labs.github) artifact += 1;
    if (ev.capstoneShipped) artifact += 1;
    let self = 0, selfMax = 2;
    if (ev.labs && ev.labs.cursor) self += 1;
    if (ev.modules && ev.modules.completed >= 8) self += 1;
    const total = platform + artifact + self;
    const max = platformMax + artifactMax + selfMax;
    const pct = max ? Math.round((total / max) * 100) : 0;
    return {
      pct: pct,
      platform: platform, platformMax: platformMax,
      artifact: artifact, artifactMax: artifactMax,
      self: self, selfMax: selfMax,
      gatesPassed: !!(gates && gates.passed),
      note: "Engineering Evidence Score counts platform-graded labs, artifact URL checks, and submitted self-reports. It is not job readiness, not a hiring probability, and not a claim you are job-ready.",
    };
  }

  function copyPack() {
    const ev = snapshot();
    const comps = competencies().filter(function (c) { return c.demonstrated; });
    const names = comps.map(function (c) { return c.label; });
    const live = (ev.projects || []).filter(function (p) { return p.completed && p.liveUrl; })[0];
    const repo = (ev.projects || []).filter(function (p) { return p.completed && p.githubUrl; })[0];
    const bits = [];
    if (engOr(ev, "spec") || names.indexOf("Specification") !== -1) bits.push("requirements analysis");
    if (ev.promptLabs && ev.promptLabs.challenge) bits.push("structured engineering prompts for AI coding assistants (course-graded exercises, not a prompt-engineer certificate)");
    if ((ev.det || 0) >= 1 || engOr(ev, "aiReview")) bits.push("review of AI-generated code");
    if ((ev.js || 0) >= 1) bits.push("tests that can fail");
    if (engOr(ev, "incident")) bits.push("incident judgment (simulation)");
    if (ev.capstoneShipped) bits.push("a public https URL");
    const quizOnly = bits.length === 0 && !(ev.modules && ev.modules.completed);
    const skillBit = bits.length
      ? bits.join(", ")
      : (ev.modules && ev.modules.completed
        ? "Northline module exercises (no spec, detective, test, or live-URL evidence recorded yet)"
        : "orientation and quizzes only \u2014 no spec, testing, or deployment evidence is on file");
    const linkedin = quizOnly
      ? "I started an AI-assisted software engineering course. I have not yet recorded specification, testing, or deployment evidence. Not professional employment. Northline is the course storyline, not an employer."
      : "Built as part of an AI-assisted software engineering project involving " + skillBit + ". Not professional employment. Northline is the course storyline, not an employer.";
    const cv = "Course project (AI-assisted software engineering): " + skillBit +
      (repo ? ". Repo: " + repo.githubUrl : "") +
      (live ? ". Live: " + live.liveUrl : "") +
      ". Not production employment.";
    const interview = engOr(ev, "aiReview") || (ev.det || 0) >= 1
      ? "I treated the agent as a pair, not an authority. I can name a defect I charged (invented feature, missing AC, or a test that could not fail) and how I caught it."
      : "I have not yet recorded AI-review evidence in this course. I would not claim I can explain an AI defect until I complete the AI Review Lab.";
    const portfolio = ev.capstoneShipped
      ? "Northline Clinic capstone \u2014 a small public site specified, reviewed, tested, and deployed during an AI-assisted software engineering course. Clinic name is storyline, not an employer."
      : "No capstone live URL is on file yet. I should not list a deployed Northline app until that evidence exists.";
    return { linkedin: linkedin, cv: cv, interview: interview, portfolio: portfolio, quizOnly: quizOnly };
  }
  function engOr(ev, key) {
    return !!(ev && ev.eng && ev.eng[key]);
  }

  function next30() {
    const comps = competencies();
    const weak = comps.filter(function (c) { return !c.demonstrated; });
    const strong = comps.filter(function (c) { return c.demonstrated; }).map(function (c) { return c.id; });
    const slots = [];
    weak.forEach(function (c) {
      if (slots.length >= 4) return;
      slots.push({ days: "Focus: " + c.label, t: (c.nextLabel ? c.nextLabel + " — " : "") + (c.notYet || c.gap), href: c.nextHref });
    });
    const ev = snapshot();
    const extras = [
      { id: "promptApply", days: "Apply prompting", t: "Use Context \u2192 Task \u2192 Constraints \u2192 Acceptance \u2192 Verify on a real debugging session, code review, or agent task. Do not repeat beginner prompt drills.", skipIf: strong.indexOf("prompt") === -1, href: "ai-review.html" },
      { id: "second", days: "Days 8–14", t: "Build a second tiny public repo (confirmation page with empty/error/success).", skipIf: (ev.projectsCompleted || 0) >= 2 },
      { id: "interview", days: "Days 15–21", t: "Repeat the interview simulation until you can explain what AI got wrong without notes.", skipIf: strong.indexOf("interview") !== -1 },
      { id: "portfolio", days: "Days 22–30", t: "Put the live URL and repo on a one-page portfolio using the career-page wording. Do not claim Northline as an employer.", skipIf: !!ev.capstoneShipped && strong.indexOf("docs") !== -1 },
    ];
    extras.forEach(function (ex) {
      if (ex.skipIf) return;
      if (slots.length >= 4) return;
      slots.push({ days: ex.days, t: ex.t, href: ex.href || "" });
    });
    if (!slots.length) {
      slots.push({ days: "Days 1–7", t: "Improve the capstone README and add one failing test you can demo.", href: "projects.html" });
    }
    return { weak: weak, plan: slots };
  }

  const CAP_GATES = [
    { id: "req", title: "Gate 1 · Requirements", hint: "Select what NL-013 actually requires. Leave inventions off.", key: "keep",
      items: [
        { id: "a", keep: true, t: "A public https URL a stranger can open" },
        { id: "b", keep: true, t: "A GitHub repo that is source, not the live app" },
        { id: "c", keep: true, t: "Tests that fail if booking or hours break" },
        { id: "d", keep: false, t: "A native iOS app" },
        { id: "e", keep: false, t: "RAG over clinic PDFs" },
        { id: "f", keep: true, t: "A known limitation named in the release note" },
        { id: "g", keep: false, t: "OAuth so patients can see their booking history" },
      ] },
    { id: "spec", title: "Gate 2 · Specification", hint: "Which are real acceptance criteria?", key: "real",
      items: [
        { id: "a", real: true, t: "Given a 390px window, when I open the site, then I can read hours without horizontal scroll." },
        { id: "b", real: false, t: "It should feel premium." },
        { id: "c", real: true, t: "Given an empty name, when I submit, then nothing is stored." },
        { id: "d", real: false, t: "Use Kubernetes." },
        { id: "e", real: false, t: "The page should feel fast." },
      ] },
    { id: "ai", title: "Gate 3 · AI plan review", hint: "Charge the real defects in the agent plan.", key: "real",
      items: [
        { id: "a", real: true, t: "Plan adds Stripe although payment is out of scope." },
        { id: "b", real: true, t: "No empty or error state for the request form." },
        { id: "c", real: false, t: "Using fetch is banned." },
        { id: "d", real: true, t: "Patient email would be logged." },
      ] },
    { id: "sec", title: "Gate 4 · Security", hint: "What is actually a stop-ship?", key: "real",
      items: [
        { id: "a", real: true, t: "A secret or card number in the client bundle or logs" },
        { id: "b", real: false, t: "A serif heading" },
        { id: "c", real: true, t: "innerHTML of a patient-typed name" },
        { id: "d", real: false, t: "A README that is only 12 lines" },
        { id: "e", real: false, t: "A console.log of submit time (not the email)" },
      ] },
    { id: "a11y", title: "Gate 5 · Accessibility", hint: "What would you actually check before a real user?", key: "real",
      items: [
        { id: "a", real: true, t: "Every input has a visible label, not only placeholder" },
        { id: "b", real: true, t: "The request button is reachable with the keyboard" },
        { id: "c", real: false, t: "The brand colour must be exactly #0A0" },
        { id: "d", real: true, t: "Focus is visible on links and buttons" },
        { id: "e", real: false, t: "A paid WCAG certificate before Friday" },
      ] },
    { id: "mon", title: "Gate 6 · Post-launch", hint: "What belongs in a monitoring/rollback note?", key: "real",
      items: [
        { id: "a", real: true, t: "The symptom that triggers a revert of the last deploy" },
        { id: "b", real: false, t: "Hope the agent notices" },
        { id: "c", real: true, t: "One number you will look at on day one (failed submits, 404s)" },
        { id: "d", real: false, t: "Rewrite in a framework if anyone complains" },
      ] },
  ];

  function gradeSelect(items, selected, key) {
    const missed = items.filter(function (x) { return x[key] && !selected[x.id]; });
    const extra = items.filter(function (x) { return !x[key] && selected[x.id]; });
    return { ok: missed.length === 0 && extra.length === 0, missed: missed, extra: extra };
  }

  function capstoneGatesPassed() {
    const rec = global.CourseProgress ? CourseProgress.getExtra("capstoneGates") : null;
    return !!(rec && rec.passed);
  }

  function renderCapstoneGates(mountId) {
    const mount = document.getElementById(mountId);
    if (!mount || !global.CourseProgress) return;
    const saved = CourseProgress.getExtra("capstoneGates") || {};
    const selected = saved.selected || {};
    const passedPhases = saved.passedPhases || {};
    mount.innerHTML = '<div class="elab"><div class="elab-banner">Platform verified \u00b7 judgment gates, not an audit of your live site</div>' +
      "<p class='mut'>Six gates. Every real item on, inventions off. This is how the capstone earns an Engineering Evidence Score. URLs are still a separate check.</p>" +
      '<div id="capPhases"></div><div class="feedback" id="capFb"></div></div>';
    const box = mount.querySelector("#capPhases");
    CAP_GATES.forEach(function (ph) {
      if (!selected[ph.id]) selected[ph.id] = {};
      const card = document.createElement("div");
      card.className = "elab-phase" + (passedPhases[ph.id] ? " is-done" : "");
      card.innerHTML = "<h4>" + esc(ph.title) + "</h4><p class='mut'>" + esc(ph.hint) + "</p>";
      const row = document.createElement("div");
      row.className = "elab-chips";
      ph.items.forEach(function (item) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "elab-chip";
        b.setAttribute("data-id", item.id);
        b.textContent = item.t;
        b.setAttribute("aria-pressed", selected[ph.id][item.id] ? "true" : "false");
        if (selected[ph.id][item.id]) b.classList.add("on");
        b.onclick = function () {
          selected[ph.id][item.id] = !selected[ph.id][item.id];
          b.classList.toggle("on", selected[ph.id][item.id]);
          b.setAttribute("aria-pressed", selected[ph.id][item.id] ? "true" : "false");
        };
        row.appendChild(b);
      });
      card.appendChild(row);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "primary";
      btn.style.marginTop = "12px";
      btn.setAttribute("data-check", ph.id);
      btn.textContent = passedPhases[ph.id] ? "Passed \u00b7 check again" : "Check this gate";
      const fb = document.createElement("div");
      fb.className = "feedback";
      btn.onclick = function () {
        const g = gradeSelect(ph.items, selected[ph.id], ph.key);
        passedPhases[ph.id] = g.ok;
        card.classList.toggle("is-done", g.ok);
        fb.className = "feedback " + (g.ok ? "ok" : "bad");
        fb.textContent = g.ok ? "Clean." : "Missed " + g.missed.length + ", charged " + g.extra.length + " inventions.";
        const all = CAP_GATES.every(function (p) { return passedPhases[p.id]; });
        CourseProgress.setExtra("capstoneGates", { selected: selected, passedPhases: passedPhases, passed: all, at: new Date().toISOString() });
        const top = mount.querySelector("#capFb");
        if (all) { top.className = "feedback ok"; top.textContent = "All six gates passed. This is platform-verified judgment, not a quality audit of the live URL."; }
      };
      card.appendChild(btn);
      card.appendChild(fb);
      box.appendChild(card);
    });
    if (saved.passed) {
      const top = mount.querySelector("#capFb");
      top.className = "feedback ok";
      top.textContent = "Capstone gates already passed in this browser.";
    }
  }

  const AI_REVIEW = [
    { id: "ar1", title: "AI wrote the requirement", body: "\u201cAdd booking so it is better and also payments.\u201d",
      prompt: "What do you do?",
      opts: [{ v: "build", t: "Build it. The agent understood the vibe." }, { v: "split", t: "Split: booking in scope, payments a later ticket, ask who confirms." }, { v: "pay", t: "Start with Stripe because it is impressive." }],
      answer: "split", whyOk: "\u2018Better\u2019 is not a requirement. Payments are a second product.", whyBad: "You cannot test \u2018better\u2019, and payments were not asked." },
    { id: "ar2", title: "AI wrote the tests", body: "expect(true).toBe(true) and a screenshot of the happy path.",
      prompt: "What is dangerous?",
      opts: [{ v: "ok", t: "Green is green." }, { v: "fail", t: "The test cannot fail. Add the empty-email case." }, { v: "more", t: "Add ten more true===true for coverage." }],
      answer: "fail", whyOk: "A test that cannot fail is theatre.", whyBad: "Coverage of tautologies is still theatre." },
    { id: "ar3", title: "AI claims it is secure", body: "\u201cNo secrets. I used innerHTML for names because it is faster.\u201d",
      prompt: "Your move?",
      opts: [{ v: "trust", t: "Trust the claim." }, { v: "reject", t: "Reject innerHTML of user text. Ask for textContent." }, { v: "csp", t: "Add a CSP header and merge." }],
      answer: "reject", whyOk: "The claim and the code disagree. The code wins.", whyBad: "Headers do not make innerHTML of names safe." },
    { id: "ar4", title: "AI says ship it", body: "Suite green. You have not opened a phone-sized window.",
      prompt: "Ship?",
      opts: [{ v: "ship", t: "Ship." }, { v: "phone", t: "Do not ship until 390px is checked against the ticket." }, { v: "rewrite", t: "Rewrite in a framework first." }],
      answer: "phone", whyOk: "The ticket named the phone. The suite did not.", whyBad: "Shipping or boiling the ocean both skip the check the ticket named." },
  ];

  function renderAiReview(mountId) {
    renderChoiceLab(mountId, "aiReview", AI_REVIEW, 3, "AI Review Lab \u00b7 platform verified \u00b7 not a real agent");
  }

  const INCIDENT = [
    { id: "inc1", title: "Level 1 — Simple bug", body: "09:12. It worked yesterday. Three patients this morning. You are on a train with a laptop.",
      context: "Request on the public clinic page does nothing.",
      stakeholder: "Priya (office manager) and three patients.",
      constraint: "You cannot physically sit at the clinic desk.",
      aiRec: "Rewrite booking.js.",
      hidden: "Last night's tidy may have deleted a guard \u2014 you do not know that yet.",
      prompt: "First move?",
      opts: [{ v: "rewrite", t: "Ask the agent to rewrite booking.js." }, { v: "repro", t: "Reproduce: empty email, valid email, phone vs laptop, console." }, { v: "ignore", t: "Tell her to hard-refresh." }],
      answer: "repro", whyOk: "You cannot debug a symptom you have not seen.", whyBad: "Rewrites and \u2018try again\u2019 skip evidence." },
    { id: "inc5", title: "Level 2 — Conflicting signals", body: "Console is clean. Priya still sees nothing. One laptop works. Two phones do not. The agent says \u201cit is a cache issue.\u201d",
      context: "Same outage, mixed evidence.",
      stakeholder: "Priya still on the phone.",
      constraint: "Closing the ticket would look efficient.",
      aiRec: "It is a cache issue.",
      hidden: "Cache is a guess until a phone network tab agrees.",
      prompt: "What is the honest next step?",
      opts: [{ v: "cache", t: "Tell everyone to clear cache and close the ticket." }, { v: "narrow", t: "Reproduce on a phone, compare network tab, do not close on an unverified cache theory." }, { v: "rewrite", t: "Rewrite the form in a framework tonight." }],
      answer: "narrow", whyOk: "Two devices failing and one passing is evidence. \u2018Cache\u2019 is a guess until you see it.", whyBad: "Closing on a guess, or boiling the ocean, both skip the phone." },
    { id: "inc2", title: "Level 3 — AI gives a bad diagnosis", body: "The agent, 0.9s later, very sure: \u201cI traced it. HTML5 required is flaky on some phones, so Request never fires. Disable all validation. Patients get service now. I can have a PR in two minutes.\u201d",
      context: "The agent is confident. Patients are waiting.",
      stakeholder: "Anyone who will be stored as a blank row.",
      constraint: "Restoring clicks is the tempting metric.",
      aiRec: "Disable validation.",
      hidden: "The requirement was empty email stores nothing.",
      prompt: "Use this?",
      opts: [{ v: "yes", t: "Yes — restore service." }, { v: "no", t: "No. That ships blank patients. Keep looking." }, { v: "maybe", t: "Ship it behind a flag until Friday." }],
      answer: "no", whyOk: "Restoring clicks by deleting the requirement is how you get a worse incident at 10:00.", whyBad: "Flags still store garbage." },
    { id: "inc6", title: "Level 4 — Business pressure", body: "Dan: \u201cCan we just ship the workaround \u2014 disable validation \u2014 until Friday? The client is waiting.\u201d",
      context: "User impact is real. The workaround deletes the requirement.",
      stakeholder: "Dan (account) and Priya (operations).",
      constraint: "Friday is not an acceptance criterion.",
      aiRec: "The workaround already exists in chat.",
      hidden: "A flag named temporary still stores garbage.",
      prompt: "Balance user impact, risk, and communication.",
      opts: [{ v: "yes", t: "Ship the workaround. Restore clicks." }, { v: "no", t: "No. Revert the tidy, keep the guard, tell Dan the workaround stores blank patients." }, { v: "flag", t: "Ship it behind a flag named \u2018temporary\u2019." }],
      answer: "no", whyOk: "A workaround that deletes the requirement is a second incident with your name on the status.", whyBad: "Flags and Fridays still store garbage." },
    { id: "inc3", title: "Mitigation — known-good commit", body: "You found last night's \u2018tidy\u2019 removed the empty-email guard. Booking is down for anyone who tabs past email.",
      prompt: "Now?",
      opts: [{ v: "forward", t: "Fix forward on main while patients keep hitting it." }, { v: "revert", t: "Revert the tidy commit, then fix forward on a branch." }, { v: "tweet", t: "Post an apology and leave it." }],
      answer: "revert", whyOk: "A known last-good commit is faster than heroics on a live form.", whyBad: "Leaving it, or slow-fixing on main, extends the outage." },
    { id: "inc4", title: "Communicate — status to Dan", body: "He wants a sentence for the client.",
      prompt: "Which is honest?",
      opts: [{ v: "ai", t: "\u201cThe AI glitched.\u201d" }, { v: "status", t: "\u201cWe reverted last night's validation tidy. Request works. We will add a test so empty email cannot ship again.\u201d" }, { v: "deny", t: "\u201cNothing happened.\u201d" }],
      answer: "status", whyOk: "Cause, current state, prevention. No theatre.", whyBad: "Blame and denial are not a status." },
  ];

  function renderIncident(mountId) {
    renderChoiceLab(mountId, "incident", INCIDENT, 3, "Production incident \u00b7 labeled simulation \u00b7 not your production \u00b7 pass 3 of 6 (legacy 3-of-4 still counts)");
  }

  function interviewScenes() {
    const ev = snapshot();
    const cap = (ev.projects || []).filter(function (p) { return p.isCapstone && p.completed; })[0];
    const rec = cap && global.CourseProgress ? CourseProgress.getProject(cap.id) : null;
    const evidence = rec && rec.evidence ? rec.evidence : {};
    const cursor = global.CourseProgress ? CourseProgress.desktopLabRecord("cursor") : { fields: {} };
    const aiWrong = String((evidence.aiHelped && evidence.limitation) || (cursor.fields && cursor.fields.aiWrong) || "").trim();
    const limitation = String(evidence.limitation || "").trim();
    const tested = String(evidence.tested || (cursor.fields && cursor.fields.tested) || "").trim();
    const ws = global.CourseProgress ? CourseProgress.getExtra("workSession") : null;
    const wsWrong = ws && ws.fields ? String(ws.fields.wrong || "").trim() : "";
    const personalized = !!(limitation || aiWrong || tested || wsWrong);
    const iv1body = personalized
      ? "You marked extra product (payments, apps, OAuth) as out of scope on a brochure + request. Why not a framework?"
      : "A static site plus a request form. Why not a framework?";
    const iv2body = (aiWrong || wsWrong)
      ? "Your notes say AI went wrong here: \u201c" + (aiWrong || wsWrong).slice(0, 180) + "\u201d How do you tell that story?"
      : "They will ask what AI got wrong. A vague \u2018sometimes it hallucinates\u2019 fails.";
    const iv3body = tested
      ? "Your test notes: \u201c" + tested.slice(0, 180) + "\u201d What would break if this had 10,000 users?"
      : "What would break if this had 10,000 users?";
    const iv4body = limitation
      ? "You named this limitation: \u201c" + limitation.slice(0, 180) + "\u201d Why did you still ship (or not)?"
      : "They point at your live URL. Why did you ship (or not)?";
    const iv5body = ev.eng && ev.eng.releaseReview
      ? "You completed the release review and chose hold on XSS / 390px. What is the biggest remaining risk in the project?"
      : "What is the biggest remaining risk in a small public request form?";
    return [
      { id: "iv1", title: "Why this architecture?", body: iv1body,
        prompt: "Best answer?",
        lookFor: "Scope as an architecture decision, not difficulty or the agent.",
        opts: [{ v: "lazy", t: "Frameworks are hard." }, { v: "scope", t: "The ticket was a brochure + request. A framework would be a second product." }, { v: "ai", t: "The agent chose it." }],
        answer: "scope", whyOk: "Strong: scope is the architecture decision.", whyBad: "Weak: difficulty and the agent are not reasons you can defend." },
      { id: "iv2", title: "What did AI get wrong?", body: iv2body,
        prompt: "Strongest shape of answer?",
        lookFor: "A named invented feature, a missing AC, and how you caught it.",
        opts: [{ v: "vague", t: "It hallucinates a lot." }, { v: "specific", t: "Name one invented feature, one missing AC, and how you caught it." }, { v: "never", t: "Mine never gets it wrong." }],
        answer: "specific", whyOk: "Strong: a story with a mechanism.", whyBad: "Weak: vague and boastful answers are not evidence." },
      { id: "iv3", title: "10,000 users", body: iv3body,
        prompt: "Honest answer at this level?",
        lookFor: "The limit of this design, not a pretend Kubernetes afternoon.",
        opts: [{ v: "fine", t: "Nothing. Static sites scale forever." }, { v: "honest", t: "The form and any client-only store will not. I would not claim this design for that load." }, { v: "kube", t: "I would Kubernetes it this afternoon." }],
        answer: "honest", whyOk: "Strong: knowing the limit is senior-adjacent.", whyBad: "Weak: forever and Kubernetes are both theatre here." },
      { id: "iv4", title: "Why did you ship (or not)?", body: iv4body,
        prompt: "What belongs in the answer?",
        lookFor: "Acceptance criteria, what you tested (including a phone-sized window), and one known limitation.",
        opts: [{ v: "green", t: "Tests were green." }, { v: "full", t: "The AC I wrote, what I tested including a phone-sized window, and one known limitation." }, { v: "dan", t: "Dan wanted it Friday." }],
        answer: "full", whyOk: "Strong: ship is a claim about checks, not a calendar.", whyBad: "Weak: green and Friday are how bad ships happen." },
      { id: "iv5", title: "Remaining risk", body: iv5body,
        prompt: "What belongs in the answer?",
        lookFor: "A remaining risk you can name, and what evidence would change your mind \u2014 not a job-ready claim.",
        opts: [{ v: "none", t: "Nothing. The course certified it." }, { v: "named", t: "Name a remaining risk (XSS, unchecked phone width, no rate limit, no monitoring) and what evidence would change your mind." }, { v: "job", t: "I am job-ready now." }],
        answer: "named", whyOk: "Strong: a remaining risk you can name is more honest than a certificate.", whyBad: "Weak: the course did not certify the live app or your employment." },
    ];
  }

  function renderInterview(mountId) {
    renderChoiceLab(mountId, "interview", interviewScenes(), 3, "Interview simulation \u00b7 uses your recorded evidence when present \u00b7 not a real interview");
  }

  const RELEASE = [
    { id: "rr1", title: "1 \u00b7 Requirements", body: "Priya still needs hours she can trust and a request that stores a name and email. The agent also built a gift-card store.",
      context: "NL-013 brochure + request.", stakeholder: "Priya.", constraint: "No payments.",
      aiRec: "Ship the store \u2014 extra value.", hidden: "Unrequested product has no tests.",
      prompt: "Ship the extra store?",
      opts: [{ v: "ship", t: "Ship. Extra value." }, { v: "cut", t: "Cut the store. Hours + request were the ticket." }, { v: "ask", t: "Ask Dan after it is live." }],
      answer: "cut", whyOk: "Unrequested product is a second release with no tests.", whyBad: "Live or later both sneak a second product under the first ticket." },
    { id: "rr2", title: "2 \u00b7 Specification", body: "An acceptance criterion (AC) is a check a stranger can fail. One line says \u201cit should feel premium.\u201d Another says empty email stores nothing.",
      context: "Two lines in the spec. Only one is testable.",
      stakeholder: "Sam (reviewer).",
      constraint: "Friday is close.",
      aiRec: "Both matter equally for brand.",
      hidden: "You cannot fail \u2018premium\u2019 in a test.",
      prompt: "Which is ship-blocking if missing?",
      opts: [{ v: "premium", t: "The premium one \u2014 taste is the brand." }, { v: "empty", t: "Empty email stores nothing. You can check it." }, { v: "both", t: "Both equally." }],
      answer: "empty", whyOk: "You can fail the empty-email case. You cannot fail \u2018premium\u2019.", whyBad: "Taste is not an acceptance criterion." },
    { id: "rr3", title: "3 \u00b7 AI review", body: "The plan logs patient email \u2018for debugging\u2019 and adds Stripe.",
      prompt: "Your review?",
      opts: [{ v: "ok", t: "Approve. Debugging needs logs." }, { v: "reject", t: "Reject the log and Stripe. Both are out of scope or unsafe." }, { v: "stripe", t: "Keep Stripe, drop the log." }],
      answer: "reject", whyOk: "PII in logs is a stop-ship. Payments were not asked.", whyBad: "Either leftover is a second product or a leak." },
    { id: "rr4", title: "4 \u00b7 Testing", body: "Suite is green. The only booking test is expect(true).toBe(true).",
      prompt: "Ship?",
      opts: [{ v: "ship", t: "Green is green." }, { v: "fix", t: "Do not ship. Add empty/valid/error cases that can fail." }, { v: "more", t: "Add twenty more tautologies for coverage." }],
      answer: "fix", whyOk: "A test that cannot fail is theatre.", whyBad: "Coverage of tautologies is still theatre." },
    { id: "rr5", title: "5 \u00b7 Security", body: "Authentication is not in this capstone. The form uses innerHTML for the typed name. Password reset is N/A.",
      prompt: "Decision?",
      opts: [{ v: "ship", t: "Ship. There is no auth to rate-limit." }, { v: "fix", t: "Fix before shipping: textContent, not innerHTML of user text." }, { v: "accept", t: "Accept XSS risk. It is a small clinic." }],
      answer: "fix", whyOk: "No auth does not make innerHTML of names safe.", whyBad: "Clinic size is not a control." },
    { id: "rr6", title: "6 \u00b7 Accessibility", body: "Inputs use placeholder only. The Request button is a styled div with onclick.",
      prompt: "Decision?",
      opts: [{ v: "ship", t: "Ship. It looks fine on your laptop." }, { v: "fix", t: "Fix before shipping: real labels and a real button." }, { v: "accept", t: "Accept. Screen-reader users are rare." }],
      answer: "fix", whyOk: "Placeholder is not a name. A div is not a button.", whyBad: "Rarity is not a reason to ship a wall." },
    { id: "rr7", title: "7 \u00b7 Deployment", body: "The live URL is https://github.com/you/repo. Images use C:/Users/you/logo.png.",
      prompt: "Decision?",
      opts: [{ v: "ship", t: "The repo is public, so it is deployed." }, { v: "fix", t: "Do not ship. Need a public https app URL and relative image paths." }, { v: "accept", t: "Accept. It works on your machine." }],
      answer: "fix", whyOk: "A github.com repo is source, not a live app. Drive paths die on the server.", whyBad: "Local success is not shipping." },
    { id: "rr8", title: "8 \u00b7 Monitoring", body: "Dan asks what you will look at on day one. Analytics sessions are up. You have no alert on failed Request submits.",
      prompt: "Best answer?",
      opts: [{ v: "hope", t: "Hope the agent notices." }, { v: "metric", t: "Failed submits and 404s on the hours page \u2014 not just session count." }, { v: "rewrite", t: "Rewrite in a framework if anyone complains." }],
      answer: "metric", whyOk: "A number tied to the ticket. Sessions can be up while Request is dead.", whyBad: "Hope and a rewrite are not monitoring. Sessions are vanity if submit is broken." },
    { id: "rr9", title: "9 \u00b7 Rollback", body: "You need a trigger and a mechanism before the URL goes public.",
      prompt: "Which is a rollback plan?",
      opts: [{ v: "hope", t: "We will fix forward if Priya yells." }, { v: "revert", t: "If Request stores blanks, revert the last Pages deploy / last GitHub Pages commit." }, { v: "tweet", t: "Post an apology." }],
      answer: "revert", whyOk: "Symptom + known-good version. That is a rollback.", whyBad: "Yelling and apologies are not a mechanism." },
    { id: "rr10", title: "10 \u00b7 Final ship decision", body: "Gates are clean. innerHTML of names is still in the diff. Phone width is unchecked.",
      context: "Judgment gates passed. Visible defects remain.", stakeholder: "The first real patient.",
      constraint: "Dan wanted Friday.", aiRec: "Ship \u2014 the gates passed.", hidden: "Gates do not override XSS.",
      prompt: "Ship?",
      opts: [{ v: "ship", t: "Ship. The gates passed." }, { v: "hold", t: "No-ship until innerHTML is gone and 390px is checked." }, { v: "dan", t: "Ship because Dan wanted Friday." }],
      answer: "hold", whyOk: "Gates do not override a visible XSS and an unchecked AC.", whyBad: "Gates and Fridays are not a substitute for the last look." },
  ];

  function releaseReviewPassed() {
    const labs = global.CourseProgress ? CourseProgress.getExtra("engLabs") || {} : {};
    return !!(labs.releaseReview && labs.releaseReview.passed);
  }

  function renderReleaseReview(mountId) {
    renderChoiceLab(mountId, "releaseReview", RELEASE, 8, "Release review \u00b7 platform verified \u00b7 not an audit of your live URL \u00b7 pass 8 of 10");
  }

  const PRESHIP = [
    { id: "ps1", title: "Functionality", body: "Happy path works. You have not tried empty email or a double-click on Request.",
      prompt: "Ready to ship on functionality?",
      opts: [{ v: "ship", t: "Ship. Happy path is the product." }, { v: "test", t: "Do not ship until empty, error, and double-submit are tried." }, { v: "later", t: "Users will report edge cases." }],
      answer: "test", whyOk: "Empty and double-submit are the ticket, not extras.", whyBad: "Users filing bugs is not a test plan." },
    { id: "ps2", title: "UX", body: "Errors are a red border with no text. Empty list is a blank white area.",
      prompt: "Decision?",
      opts: [{ v: "ship", t: "Colour is enough." }, { v: "fix", t: "Fix: a sentence for the error and for the empty state." }, { v: "accept", t: "Accept. Power users will know." }],
      answer: "fix", whyOk: "A border is not a message. A blank is not an empty state.", whyBad: "Power users are not Priya." },
    { id: "ps3", title: "Accessibility", body: "You have not tabbed the form. Labels are placeholders.",
      prompt: "Decision?",
      opts: [{ v: "ship", t: "Mouse users are the majority." }, { v: "fix", t: "Keyboard the form and add visible labels before shipping." }, { v: "audit", t: "Claim WCAG AA without testing." }],
      answer: "fix", whyOk: "You cannot certify what you have not tabbed.", whyBad: "Majority and fake badges both skip the check." },
    { id: "ps4", title: "Security", body: "No API keys in the repo. innerHTML still interpolates the name.",
      prompt: "Decision?",
      opts: [{ v: "ship", t: "No keys, so it is secure." }, { v: "fix", t: "Fix innerHTML. Keys are not the only class of bug." }, { v: "accept", t: "Accept. It is static hosting." }],
      answer: "fix", whyOk: "Static hosting still executes HTML.", whyBad: "\u2018No keys\u2019 is not a security review." },
    { id: "ps5", title: "Reliability", body: "Offline, the form looks like it submitted. There is no failure message.",
      prompt: "Decision?",
      opts: [{ v: "ship", t: "Clinic Wi-Fi is fine." }, { v: "fix", t: "Show a failure when save does not happen." }, { v: "retry", t: "Silent retry forever." }],
      answer: "fix", whyOk: "A fake success is worse than a visible failure.", whyBad: "Assuming the network, or retrying forever, hides the miss." },
    { id: "ps6", title: "Ship / no-ship", body: "HTTPS is on. You have not opened 390px. innerHTML is still there.",
      prompt: "Final call on this Northline-shaped review (not your live URL)?",
      opts: [{ v: "ship", t: "Ship. HTTPS is the hard part." }, { v: "hold", t: "No-ship until 390px and innerHTML are handled." }, { v: "accept", t: "Accept remaining risk and ship." }],
      answer: "hold", whyOk: "HTTPS does not clear an unchecked AC or XSS.", whyBad: "Accepting a known XSS is not a junior habit to practice." },
  ];

  function renderPreship(mountId) {
    renderChoiceLab(mountId, "preship", PRESHIP, 5, "Pre-ship quality review \u00b7 platform verified on a Northline-shaped site \u00b7 not an audit of your URL");
  }

  function renderWorkSession(mountId) {
    const mount = document.getElementById(mountId);
    if (!mount || !global.CourseProgress) return;
    const saved = CourseProgress.getExtra("workSession") || {};
    const f = saved.fields || {};
    mount.innerHTML =
      '<div class="elab"><div class="elab-banner">Self-reported external evidence \u00b7 this page cannot see Cursor</div>' +
      "<p class='mut'>Record one AI-assisted work session so a reviewer can inspect your reasoning. Screenshots and diffs are optional URLs. Nothing here proves the editor was open.</p>" +
      '<div class="formrow"><label for="wsTask">Task / ticket</label><textarea id="wsTask">' + esc(f.task || "") + "</textarea></div>" +
      '<div class="formrow"><label for="wsGoal">Goal</label><textarea id="wsGoal">' + esc(f.goal || "") + "</textarea></div>" +
      '<div class="formrow"><label for="wsTool">AI tool used (Cursor, Copilot, other)</label><input id="wsTool" type="text" value="' + esc(f.tool || "") + '"></div>' +
      '<div class="formrow"><label for="wsStart">Starting state</label><textarea id="wsStart">' + esc(f.start || "") + "</textarea></div>" +
      '<div class="formrow"><label for="wsStrat">Prompt / context strategy</label><textarea id="wsStrat">' + esc(f.strategy || "") + "</textarea></div>" +
      '<div class="formrow"><label for="wsOut">What the AI produced (paste excerpt or describe the diff)</label><textarea id="wsOut">' + esc(f.output || "") + "</textarea></div>" +
      '<div class="formrow"><label for="wsWrong">What AI got wrong</label><textarea id="wsWrong">' + esc(f.wrong || "") + "</textarea></div>" +
      '<div class="formrow"><label for="wsFix">Your correction</label><textarea id="wsFix">' + esc(f.fix || "") + "</textarea></div>" +
      '<div class="formrow"><label for="wsTest">Test performed and result</label><textarea id="wsTest">' + esc(f.test || "") + "</textarea></div>" +
      '<div class="formrow"><label for="wsDec">Final decision (ship / no-ship / iterate)</label><textarea id="wsDec">' + esc(f.decision || "") + "</textarea></div>" +
      '<div class="formrow"><label for="wsDiff">Diff or gist URL (optional)</label><input id="wsDiff" type="url" value="' + esc(f.diffUrl || "") + '"></div>' +
      '<div class="formrow"><label for="wsShot">Screenshot URL (optional)</label><input id="wsShot" type="url" value="' + esc(f.shotUrl || "") + '"></div>' +
      '<button type="button" class="primary" id="wsSave">Save work session</button><div class="feedback" id="wsFb" role="status" aria-live="polite"></div></div>';
    mount.querySelector("#wsSave").onclick = function () {
      function v(id) { return (mount.querySelector("#" + id).value || "").trim(); }
      const fields = {
        task: v("wsTask"), goal: v("wsGoal"), tool: v("wsTool"), start: v("wsStart"),
        strategy: v("wsStrat"), output: v("wsOut"), wrong: v("wsWrong"), fix: v("wsFix"),
        test: v("wsTest"), decision: v("wsDec"), diffUrl: v("wsDiff"), shotUrl: v("wsShot"),
      };
      const need = ["task", "goal", "tool", "start", "strategy", "output", "wrong", "fix", "test", "decision"];
      const short = need.filter(function (k) { return fields[k].length < 24; });
      const fb = mount.querySelector("#wsFb");
      if (short.length) {
        fb.className = "feedback bad";
        fb.textContent = "Every required field needs at least 24 characters (" + short.join(", ") + "). Optional URLs can stay blank.";
        return;
      }
      CourseProgress.setExtra("workSession", { saved: true, fields: fields, at: new Date().toISOString(), klass: "self" });
      fb.className = "feedback ok";
      fb.textContent = "Saved as self-reported external evidence. This is not proof Cursor was open.";
    };
  }

  function caseStudy() {
    const ev = snapshot();
    const cap = (ev.projects || []).filter(function (p) { return p.isCapstone && p.completed; })[0];
    if (!cap) {
      return { empty: true, text: "No completed capstone is on file. A case study would be invented. Complete a capstone card first." };
    }
    const rec = CourseProgress.getProject(cap.id);
    const e = rec.evidence || {};
    const sections = [
      ["Problem", "Patients could not trust clinic hours or send a request on a phone (Northline storyline, not an employer)."],
      ["User", "Priya (office manager) and patients using a phone-sized window."],
      ["Constraints", "No payments, no native app, HTTPS, keyboard-reachable request, tests that can fail."],
      ["Approach", e.built || rec.description || "Not recorded."],
      ["AI collaboration", e.aiHelped || "Not recorded."],
      ["Engineering decisions", e.reviewed || "Not recorded."],
      ["Testing", e.tested || "Not recorded."],
      ["Bugs discovered", (e.problem || "") + (e.fixed ? " Fix: " + e.fixed : "") || "Not recorded."],
      ["Security considerations", e.beforeUser || "Not recorded as a named security review."],
      ["Accessibility", "Judgment practiced in capstone a11y gate / release review \u2014 not a certified audit of the live page."],
      ["Deployment", rec.liveUrl ? rec.liveUrl + " (format-checked; quality not audited)" : "No live URL."],
      ["Final outcome", e.limitation ? "Shipped with known limitation: " + e.limitation : "See project card."],
      ["What I would improve", e.next || "Not recorded."],
    ];
    return { empty: false, title: cap.title, liveUrl: rec.liveUrl || "", githubUrl: rec.githubUrl || "", sections: sections };
  }

  function passportItems() {
    const ev = snapshot();
    const extra = global.CourseProgress ? CourseProgress.getExtra("engLabs") || {} : {};
    const gh = global.CourseProgress ? CourseProgress.desktopLabRecord("github") : {};
    const items = [];
    function add(skill, activity, result, klass, at, artifact, unverified) {
      items.push({ skill: skill, activity: activity, result: result, klass: klass, at: at || "", artifact: artifact || "", unverified: unverified || "" });
    }
    if (ev.eng && ev.eng.spec) add("Specification", "Specification Lab", "Passed", "platform", "", "practice-specs.html", "Not a real client brief");
    if (ev.promptLabs && ev.promptLabs.challenge) add("AI Instruction & Context Engineering", "Prompt Engineering Challenge", "Passed", "platform", "", "module-14.html", "Cursor was not inspected; this grades prompt text, not a live agent session");
    else if (ev.promptLabs && ev.promptLabs.labPass) add("AI Instruction & Context Engineering", "Prompt labs", ev.promptLabs.labPass + " passed", "platform", "", "module-14.html", "Cursor was not inspected");
    if (ev.eng && ev.eng.git) add("Git", "Git Lab", "Passed", "platform", "", "practice-git.html", "No git binary");
    if (ev.eng && ev.eng.review) add("Code review", "PR Review Lab", "Passed", "platform", "", "practice-review.html", "Not a teammate PR");
    if (ev.eng && ev.eng.aiReview) add("AI collaboration", "AI Review Lab", "Passed", "platform", extra.aiReview && extra.aiReview.at, "ai-review.html", "Not a live agent");
    if (ev.eng && ev.eng.interview) add("Explaining decisions", "Interview simulation", "Passed", "platform", extra.interview && extra.interview.at, "interview.html", "Not a real interview");
    if (ev.eng && ev.eng.incident) add("Debugging", "Incident simulation", "Passed", "platform", extra.incident && extra.incident.at, "incident.html", "Not production");
    if (ev.eng && ev.eng.releaseReview) add("Shipping judgment", "Release review", "Passed", "platform", extra.releaseReview && extra.releaseReview.at, "release-review.html", "Not an audit of your live site");
    if (ev.eng && ev.eng.preship) add("Shipping judgment", "Pre-ship quality review", "Passed", "platform", extra.preship && extra.preship.at, "projects.html", "Northline-shaped scenario, not your URL");
    if (ev.labs && ev.labs.cursor) add("AI collaboration", "Desktop Lab A", "Submitted", "self", "", "desktop-labs.html", "Cursor was not inspected");
    if (ev.workSession) add("AI collaboration", "AI work session record", "Saved", "self", (CourseProgress.getExtra("workSession") || {}).at, "work-session.html", "Editor was not inspected");
    if (ev.labs && ev.labs.github) add("Git", "Desktop Lab B", "Repo URL recorded", gh.evidenceClass || "external", "", gh.url || "", "Code quality not semantically verified");
    if (ev.capstoneShipped) add("Deployment", "Capstone live URL", "Submitted", "external", "", (ev.projects.filter(function (p) { return p.isCapstone && p.completed; })[0] || {}).liveUrl || "", "Semantic quality of the live app is not verified");
    if (ev.capstoneGates) add("Product judgment", "Capstone gates", "Passed", "platform", "", "projects.html", "Not a quality audit of the live site");
    const lim = global.CourseProgress ? CourseProgress.getExtra("limitationsCheck") : null;
    if (lim && lim.passed) add("Shipping judgment", "Limitations check", "Passed", "platform", lim.at, "graduation.html", "Still not a live-app quality audit");
    const debrief = global.CourseProgress ? CourseProgress.getExtra("incidentDebrief") : null;
    if (debrief && debrief.saved) add("Debugging", "Incident write-up", "Saved", "self", debrief.at, "incident.html", "Still a simulation, not production");
    return items;
  }

  function checksHtml(probe, heading) {
    if (!probe || !probe.checks) return "";
    const passed = probe.checks.filter(function (c) { return c.pass; });
    const failed = probe.checks.filter(function (c) { return !c.pass; });
    function row(c, ok) {
      return '<div class="evrow' + (ok ? " is-on" : "") + '"><span class="evdot" aria-hidden="true"></span><div><div class="evlabel">' + esc(c.label) + "</div><div class='evmeta'>" + (ok ? "Artifact check passed" : "Artifact check failed or unverified") + "</div></div></div>";
    }
    return "<h3 class='serif' style='font-size:1.1rem'>" + esc(heading) + "</h3>" +
      "<p class='mut'>Semantic quality not verified.</p>" +
      (probe.note ? "<p class='mut'>" + esc(probe.note) + "</p>" : "") +
      (passed.length ? "<p><b>Artifact checks passed</b></p>" + passed.map(function (c) { return row(c, true); }).join("") : "") +
      (failed.length ? "<p><b>Artifact checks failed</b></p>" + failed.map(function (c) { return row(c, false); }).join("") : "") +
      "<p class='mut'><b>Semantic quality not verified.</b> A reachable URL is not a quality grade.</p>";
  }

  function renderArtifactPanel(hostId) {
    const host = document.getElementById(hostId);
    if (!host || !global.CourseProgress) return;
    const gh = CourseProgress.desktopLabRecord("github");
    const ev = snapshot();
    const cap = (ev.projects || []).filter(function (p) { return p.isCapstone && p.completed; })[0];
    const rec = cap ? CourseProgress.getProject(cap.id) : null;
    const parts = [];
    if (gh && gh.probe) parts.push(checksHtml(gh.probe, "GitHub (Desktop Lab B)"));
    if (rec && rec.evidence && rec.evidence.githubProbe) parts.push(checksHtml(rec.evidence.githubProbe, "GitHub (capstone)"));
    if (rec && rec.evidence && rec.evidence.liveProbe) parts.push(checksHtml(rec.evidence.liveProbe, "Live URL (capstone)"));
    host.innerHTML = parts.join("") || "<p class='mut'>No GitHub or live-URL probe on file. Submit Desktop Lab B and a capstone live URL to run structural checks. <b>Semantic quality not verified</b> either way.</p>";
  }

  function renderIncidentDebrief(mountId) {
    const mount = document.getElementById(mountId);
    if (!mount || !global.CourseProgress) return;
    const saved = CourseProgress.getExtra("incidentDebrief") || {};
    const f = saved.fields || {};
    mount.innerHTML =
      '<div class="elab"><div class="elab-banner">Write-up \u00b7 still a simulation \u00b7 does not change the 3-of-6 pass</div>' +
      "<p class='mut'>After the cards: name the engineering close-out. This is assessed structure, not production ownership.</p>" +
      '<div class="formrow"><label for="idRoot">Root cause</label><textarea id="idRoot">' + esc(f.root || "") + "</textarea></div>" +
      '<div class="formrow"><label for="idMit">Immediate mitigation</label><textarea id="idMit">' + esc(f.mitigate || "") + "</textarea></div>" +
      '<div class="formrow"><label for="idFix">Permanent fix</label><textarea id="idFix">' + esc(f.permanent || "") + "</textarea></div>" +
      '<div class="formrow"><label for="idPrev">Prevention</label><textarea id="idPrev">' + esc(f.prevent || "") + "</textarea></div>" +
      '<div class="formrow"><label for="idMon">Monitoring</label><textarea id="idMon">' + esc(f.monitor || "") + "</textarea></div>" +
      '<button type="button" class="primary" id="idSave">Save write-up</button><div class="feedback" id="idFb" role="status" aria-live="polite"></div></div>';
    mount.querySelector("#idSave").onclick = function () {
      function v(id) { return (mount.querySelector("#" + id).value || "").trim(); }
      const fields = { root: v("idRoot"), mitigate: v("idMit"), permanent: v("idFix"), prevent: v("idPrev"), monitor: v("idMon") };
      const short = Object.keys(fields).filter(function (k) { return fields[k].length < 24; });
      const fb = mount.querySelector("#idFb");
      if (short.length) {
        fb.className = "feedback bad";
        fb.textContent = "Each close-out field needs a real sentence (24+ characters): " + short.join(", ") + ".";
        return;
      }
      CourseProgress.setExtra("incidentDebrief", { saved: true, fields: fields, at: new Date().toISOString() });
      fb.className = "feedback ok";
      fb.textContent = "Saved. This is still a simulation write-up, not on-call experience.";
    };
  }

  function evidenceBuckets() {
    const comps = competencies();
    const items = passportItems();
    function of(k) { return items.filter(function (it) { return it.klass === k; }); }
    const unverified = [];
    items.forEach(function (it) { if (it.unverified && unverified.indexOf(it.unverified) === -1) unverified.push(it.unverified); });
    ["Cursor / the editor was not inspected", "Semantic quality of a live app is not verified", "Employment and professional experience are not verified", "WCAG and screen-reader behaviour are not certified"].forEach(function (u) {
      if (unverified.indexOf(u) === -1) unverified.push(u);
    });
    return {
      practiced: comps.filter(function (c) { return c.practiced; }).map(function (c) { return c.label; }),
      demonstrated: comps.filter(function (c) { return c.demonstrated; }).map(function (c) { return c.label; }),
      platform: of("platform"),
      artifact: of("artifact"),
      self: of("self"),
      external: of("external"),
      unverified: unverified,
    };
  }

  const LIMIT_ITEMS = [
    { id: "a", keep: true, t: "Platform verified: in-browser labs, quizzes, and judgment gates" },
    { id: "b", keep: false, t: "Platform verified: that Cursor was open and used correctly" },
    { id: "c", keep: true, t: "Artifact checked: GitHub existence / README / commits when the API answers; live URL shape" },
    { id: "d", keep: false, t: "Artifact checked: that the deployed application is high quality" },
    { id: "e", keep: true, t: "Self-reported: Desktop Lab A / AI work session notes" },
    { id: "f", keep: false, t: "Verified: professional software-engineering experience or job-readiness" },
  ];

  function limitationsCheckPassed() {
    const rec = global.CourseProgress ? CourseProgress.getExtra("limitationsCheck") : null;
    return !!(rec && rec.passed);
  }

  function renderLimitationsCheck(mountId) {
    const mount = document.getElementById(mountId);
    if (!mount || !global.CourseProgress) return;
    const saved = CourseProgress.getExtra("limitationsCheck") || {};
    const selected = Object.assign({}, saved.selected || {});
    const tested = saved.tested || "";
    mount.innerHTML = '<div class="elab"><div class="elab-banner">Limitations check \u00b7 knowing what you do not know \u00b7 not a live-app audit</div>' +
      "<p class='mut'>Select what this platform actually verified. Leave inventions off. Then name one thing <b>you</b> tested by hand. Existing module and capstone completions stay complete even if you skip this.</p>" +
      '<div class="elab-chips" id="limChips"></div>' +
      '<div class="formrow"><label for="limTested">What I personally tested (not the platform)</label><textarea id="limTested">' + esc(tested) + "</textarea></div>" +
      '<button type="button" class="primary" id="limSave">Save limitations check</button>' +
      '<div class="feedback" id="limFb" role="status" aria-live="polite"></div></div>';
    const row = mount.querySelector("#limChips");
    LIMIT_ITEMS.forEach(function (item) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "elab-chip" + (selected[item.id] ? " on" : "");
      b.setAttribute("aria-pressed", selected[item.id] ? "true" : "false");
      b.textContent = item.t;
      b.onclick = function () {
        selected[item.id] = !selected[item.id];
        b.classList.toggle("on", selected[item.id]);
        b.setAttribute("aria-pressed", selected[item.id] ? "true" : "false");
      };
      row.appendChild(b);
    });
    mount.querySelector("#limSave").onclick = function () {
      const g = gradeSelect(LIMIT_ITEMS, selected, "keep");
      const personal = (mount.querySelector("#limTested").value || "").trim();
      const fb = mount.querySelector("#limFb");
      if (!g.ok) {
        fb.className = "feedback bad";
        fb.textContent = "Missed " + g.missed.length + " real item(s), charged " + g.extra.length + " invention(s). The platform did not inspect Cursor, certify live-app quality, or grant professional experience.";
        CourseProgress.setExtra("limitationsCheck", { selected: selected, tested: personal, passed: false, at: new Date().toISOString() });
        return;
      }
      if (personal.length < 24) {
        fb.className = "feedback bad";
        fb.textContent = "Name something you personally tested (24+ characters). The platform cannot see your phone, keyboard, or empty-form try.";
        return;
      }
      CourseProgress.setExtra("limitationsCheck", { selected: selected, tested: personal, passed: true, at: new Date().toISOString() });
      fb.className = "feedback ok";
      fb.textContent = "Saved. This is an honesty check, not a quality audit of your URL.";
    };
    if (saved.passed) {
      const fb = mount.querySelector("#limFb");
      fb.className = "feedback ok";
      fb.textContent = "Limitations check already saved in this browser.";
    }
  }

  function renderCompetencyDetail(hostId) {
    const host = document.getElementById(hostId);
    if (!host) return;
    host.innerHTML = competencies().map(function (c) {
      const klass = CLASS_LABEL[c.klass] || c.klass;
      return '<details class="more comp-detail"><summary>' + esc(c.label) + " \u00b7 " + (c.demonstrated ? "demonstrated" : "gap") + "</summary>" +
        "<p><b>What you practiced:</b> " + (c.practiced ? esc(c.practicedWhere) : "Not yet") + "</p>" +
        "<p><b>Where:</b> " + esc(c.practicedWhere) + "</p>" +
        "<p><b>What you demonstrated:</b> " + (c.demonstrated ? "Yes \u2014 " + esc(c.evidence) : "Not yet") + "</p>" +
        "<p><b>Evidence class:</b> " + esc(klass) + "</p>" +
        "<p><b>What you have not demonstrated:</b> " + esc(c.notYet || "Keep practicing in the wild.") + "</p>" +
        (c.nextHref ? "<p><b>Suggested next:</b> <a href='" + esc(c.nextHref) + "'>" + esc(c.nextLabel || c.nextHref) + "</a></p>" : "") +
        "</details>";
    }).join("");
  }

  function renderChoiceLab(mountId, extraKey, scenes, need, banner) {
    const mount = document.getElementById(mountId);
    if (!mount || !global.CourseProgress) return;
    const labs = CourseProgress.getExtra("engLabs") || {};
    const saved = labs[extraKey] || { done: {} };
    const done = Object.assign({}, saved.done);
    mount.innerHTML = '<div class="elab"><div class="elab-banner">' + esc(banner) + "</div><div class='scenes'></div><div class='feedback' id='" + extraKey + "Fb'></div></div>";
    const host = mount.querySelector(".scenes");
    function paint() {
      const n = scenes.filter(function (s) { return done[s.id]; }).length;
      const passed = n >= need;
      const patch = {};
      patch[extraKey] = { done: done, passed: passed, at: new Date().toISOString() };
      CourseProgress.setExtra("engLabs", Object.assign({}, CourseProgress.getExtra("engLabs") || {}, patch));
      const top = mount.querySelector("#" + extraKey + "Fb");
      top.setAttribute("aria-live", "polite");
      top.setAttribute("role", "status");
      top.className = passed ? "feedback ok" : "feedback";
      top.textContent = passed ? "Passed (" + n + "/" + scenes.length + "). Platform verified judgment, not a job offer." : n + " / " + scenes.length + " · need " + need + ".";
    }
    scenes.forEach(function (sc) {
      const card = document.createElement("div");
      card.className = "elab-phase" + (done[sc.id] ? " is-done" : "");
      card.setAttribute("data-scene", sc.id);
      card.innerHTML = "<h4>" + esc(sc.title) + "</h4>" +
        (sc.context ? "<p class='mut'><b>Context.</b> " + esc(sc.context) + "</p>" : "") +
        (sc.stakeholder ? "<p class='mut'><b>Stakeholder.</b> " + esc(sc.stakeholder) + "</p>" : "") +
        (sc.constraint ? "<p class='mut'><b>Constraint.</b> " + esc(sc.constraint) + "</p>" : "") +
        (sc.aiRec ? "<p class='mut'><b>AI recommendation.</b> " + esc(sc.aiRec) + "</p>" : "") +
        (sc.hidden ? "<p class='mut'><b>Hidden risk.</b> " + esc(sc.hidden) + "</p>" : "") +
        "<p>" + esc(sc.body) + "</p><p class='mut'>" + esc(sc.prompt) + "</p>";
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
          done[sc.id] = ok;
          card.classList.toggle("is-done", ok);
          fb.className = "feedback " + (ok ? "ok" : "bad");
          fb.setAttribute("aria-live", "polite");
          fb.textContent = (ok ? sc.whyOk : sc.whyBad) + (sc.lookFor ? " Interviewer was looking for: " + sc.lookFor : "");
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

  global.EvidenceKit = {
    CLASS_LABEL: CLASS_LABEL, probeGithub: probeGithub, probeLive: probeLive,
    competencies: competencies, timeline: timeline, evidenceScore: evidenceScore,
    copyPack: copyPack, next30: next30, renderCapstoneGates: renderCapstoneGates,
    capstoneGatesPassed: capstoneGatesPassed, renderAiReview: renderAiReview,
    renderIncident: renderIncident, renderInterview: renderInterview,
    renderReleaseReview: renderReleaseReview, releaseReviewPassed: releaseReviewPassed,
    renderPreship: renderPreship, renderWorkSession: renderWorkSession,
    caseStudy: caseStudy, passportItems: passportItems, renderCompetencyDetail: renderCompetencyDetail,
    renderArtifactPanel: renderArtifactPanel, renderIncidentDebrief: renderIncidentDebrief,
    evidenceBuckets: evidenceBuckets, renderLimitationsCheck: renderLimitationsCheck,
    limitationsCheckPassed: limitationsCheckPassed,
    CAP_GATES: CAP_GATES, gradeSelect: gradeSelect,
  };
})(window);
