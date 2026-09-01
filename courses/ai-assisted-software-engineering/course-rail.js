/* Shared chrome: course rail, mobile drawer, skip link.
   Visual language lives in course.css. This file builds the DOM and
   wires the drawer. CourseUI (course-ui.js) hydrates icons, copy buttons,
   and hero metadata after the shell exists. */
(function () {
  const NAV_GROUPS = [
    { id: "learn", label: "Learn", items: [
      ["dashboard.html", "Dashboard"],
      ["syllabus.html", "Syllabus"],
      ["tickets.html", "Ticket board"],
      ["learning-roadmap.html", "Learning Roadmap"],
      ["cheatsheets.html", "Cheat Sheets"],
    ] },
    { id: "practice", label: "Practice", items: [
      ["quiz-center.html", "Quiz Center"],
      ["practice-html.html", "HTML"],
      ["practice-css.html", "CSS"],
      ["practice-js.html", "JavaScript"],
      ["practice-testing.html", "Testing"],
      ["practice-python.html", "Python"],
      ["practice-detective.html", "AI Code Detective"],
      ["diagnostic.html", "Skill Diagnostic"],
      ["mastery-profile.html", "Mastery Profile"],
    ] },
    { id: "decide", label: "Decide · simulations", items: [
      ["practice-specs.html", "Specs Lab"],
      ["practice-git.html", "Git Lab"],
      ["practice-review.html", "PR Review Lab"],
      ["practice-integrated.html", "Integrated"],
      ["ai-review.html", "AI Review Lab"],
      ["interview.html", "Interview"],
      ["incident.html", "Incident"],
      ["release-review.html", "Release review"],
    ] },
    { id: "build", label: "Build", items: [
      ["desktop-labs.html", "Desktop Labs"],
      ["work-session.html", "AI work session"],
      ["projects.html", "Projects"],
      ["deploy-guide.html", "Deploy Guide"],
    ] },
    { id: "evidence", label: "Evidence", items: [
      ["passport.html", "Evidence Passport"],
      ["portfolio.html", "Portfolio"],
      ["career.html", "Career Path"],
      ["graduation.html", "Graduation"],
    ] },
  ];

  function currentFile() {
    // Production serves every course page through a guarded route that
    // permanently redirects "/foo.html" to the clean "/foo" (see
    // src/app/courses/[courseId]/[...path]/route.ts), so location.pathname
    // never carries ".html" there, only in local/static testing. Every nav
    // and module entry in this file is keyed WITH ".html", so without this
    // normalization cur !== file on every single page in production and
    // nothing in the sidebar ever highlights or auto-expands.
    const last = location.pathname.split("/").pop() || "syllabus";
    return last.toLowerCase().endsWith(".html") ? last : last + ".html";
  }

  function statusMark(unlocked, status, isCurrent) {
    if (!unlocked) return { cls: "locked", title: "Locked" };
    if (status === "completed") return { cls: "done", title: "Completed" };
    if (isCurrent || status === "in-progress") return { cls: "progress", title: "Current" };
    return { cls: "upcoming", title: "Upcoming" };
  }

  function buildRailHtml() {
    const cur = currentFile();
    const navHtml = NAV_GROUPS.map(function (g) {
      const open = g.items.some(function (it) { return it[0] === cur; });
      const links = g.items.map(function (pair) {
        const file = pair[0], label = pair[1];
        const cls = cur === file ? ' class="active"' : "";
        const curAttr = cur === file ? ' aria-current="page"' : "";
        return `<a href="${file}"${cls}${curAttr}>${label}</a>`;
      }).join("");
      return `<details class="rail-g"${open ? " open" : ""}><summary>${g.label}</summary>${links}</details>`;
    }).join("");
    let modsHtml = "";
    let ovHtml = "";
    if (window.CourseProgress) {
      const cp = window.CourseProgress;
      const ov = cp.overall();
      ovHtml = `<div class="rail-ov"><div class="lbl">Course progress</div>` +
        `<div class="barline"><i style="width:${ov.pct}%"></i></div>` +
        `<div class="lbl" style="margin-top:6px">${ov.completed} / ${ov.total} modules</div></div>`;

      const m0 = cp.getExtra("module0") || {};
      const m0Cls = ["rail-mod"];
      if (cur === "module-00.html") m0Cls.push("active", "progress");
      if (m0.completed) m0Cls.push("done");
      else if (m0.visited) m0Cls.push("progress");
      modsHtml += `<a href="module-00.html" class="${m0Cls.join(" ")}" title="Orientation">` +
        `<span class="rmnum">0</span><span class="rmdot rmdot-${m0.completed ? "done" : (m0.visited || cur === "module-00.html" ? "progress" : "upcoming")}" aria-hidden="true"></span>` +
        `<span class="rmtitle">Orientation</span></a>`;
      cp.STAGES.forEach((stage) => {
        modsHtml += `<div class="rail-stage">${stage.label} · ${stage.title}</div>`;
        stage.modules.forEach((id) => {
          const m = cp.MODULES.find((x) => x.id === id);
          if (!m) return;
          const status = cp.statusOf(m.id);
          const unlocked = cp.isUnlocked(m.id);
          const isCurrent = cur === m.file;
          const mark = statusMark(unlocked, status, isCurrent);
          const cls = ["rail-mod", mark.cls];
          if (isCurrent) cls.push("active");
          const t = cp.ticketFor(m.id);
          const tick = t ? `<span class="rmtick">${t.id.replace("NL-", "#")}</span>` : "";
          const lock = !unlocked
            ? `<span class="rmlock" title="Locked"><span class="ico" data-ico="lock"></span></span>`
            : tick;
          const inner = `<span class="rmnum">${m.id}</span><span class="rmdot rmdot-${mark.cls}" aria-hidden="true"></span>` +
            `<span class="rmtitle">${m.title}</span>${lock}`;
          let title = m.title + (t ? " · " + t.id : "");
          if (!unlocked && m.id === cp.CAPSTONE_ID) title = "Needs Module 12, the practice bar, and both Desktop Labs";
          else if (!unlocked) {
            const prev = cp.prevInSequence ? cp.prevInSequence(m.id) : null;
            title = prev ? ("Unlocks after Module " + prev.id + " (" + prev.title + ")") : "Locked";
          }
          if (!unlocked) modsHtml += `<span class="${cls.join(" ")}" aria-disabled="true" title="${title}">${inner}</span>`;
          else modsHtml += `<a href="${m.file}" class="${cls.join(" ")}" title="${title}">${inner}</a>`;
        });
      });
    }
    const accountHtml = `<div class="rail-account">` +
      `<a href="/lab/dashboard">&larr; Zenith Lab Dashboard</a>` +
      `<a href="/profile">My Profile</a></div>`;
    return `<div class="rail-brand">Zenith Lab</div>` +
      `<div class="rail-title">AI-Assisted Software Engineering</div>` +
      accountHtml +
      ovHtml +
      `<nav class="rail-nav">${navHtml}</nav>` +
      `<div class="rail-modlbl">Modules</div>` +
      `<div class="rail-mods">${modsHtml}</div>`;
  }

  function closeRail() {
    document.body.classList.remove("rail-open");
    const btn = document.querySelector(".rail-toggle");
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open course navigation");
    }
  }
  function openRail() {
    document.body.classList.add("rail-open");
    const btn = document.querySelector(".rail-toggle");
    if (btn) {
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Close course navigation");
    }
    const first = document.querySelector("#course-rail a, #course-rail summary");
    if (first) first.focus();
  }
  function toggleRail() {
    if (document.body.classList.contains("rail-open")) closeRail();
    else openRail();
  }

  function injectToggle() {
    const barIn = document.querySelector(".bar .in");
    if (!barIn || barIn.querySelector(".rail-toggle")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rail-toggle";
    btn.setAttribute("aria-controls", "course-rail");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open course navigation");
    btn.innerHTML = '<span class="i i-menu" aria-hidden="true"></span>';
    barIn.insertBefore(btn, barIn.firstChild);
    btn.addEventListener("click", toggleRail);
  }

  function init() {
    const skip = document.createElement("a");
    skip.className = "skip-to-content";
    skip.href = "#main-content";
    skip.textContent = "Skip to content";
    const shell = document.createElement("div");
    shell.className = "courseshell";
    const rail = document.createElement("aside");
    rail.className = "courserail";
    rail.id = "course-rail";
    rail.setAttribute("aria-label", "Course navigation");
    rail.innerHTML = buildRailHtml();
    const scrim = document.createElement("button");
    scrim.type = "button";
    scrim.className = "railscrim";
    scrim.setAttribute("aria-label", "Close course navigation");
    scrim.addEventListener("click", closeRail);
    const main = document.createElement("div");
    main.className = "coursemain";
    main.id = "main-content";
    main.setAttribute("role", "main");
    main.tabIndex = -1;
    while (document.body.firstChild) main.appendChild(document.body.firstChild);
    shell.appendChild(rail);
    shell.appendChild(main);
    document.body.appendChild(skip);
    document.body.appendChild(scrim);
    document.body.appendChild(shell);
    injectToggle();
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeRail();
      if (e.key !== "Tab" || !document.body.classList.contains("rail-open")) return;
      const toggle = document.querySelector(".rail-toggle");
      const nodes = [];
      if (toggle) nodes.push(toggle);
      rail.querySelectorAll("a, button, summary").forEach(function (el) { nodes.push(el); });
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    rail.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeRail);
    });
    document.querySelectorAll('[id$="Results"], [id^="results_"], .feedback').forEach((el) => {
      if (!el.getAttribute("aria-live")) el.setAttribute("aria-live", "polite");
    });
    const ui = document.createElement("script");
    ui.src = "course-ui.js";
    document.body.appendChild(ui);
  }
  init();
})();
