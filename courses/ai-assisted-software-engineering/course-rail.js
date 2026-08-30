/* Shared chrome: course rail, mobile drawer, skip link.
   Visual language lives in course.css. This file builds the DOM and
   wires the drawer. CourseUI (course-ui.js) hydrates icons, copy buttons,
   and hero metadata after the shell exists. */
(function () {
  const NAV = [
    ["syllabus.html", "Syllabus"],
    ["dashboard.html", "Dashboard"],
    ["tickets.html", "Ticket board"],
    ["learning-roadmap.html", "Learning Roadmap"],
    ["mastery-profile.html", "Mastery Profile"],
    ["diagnostic.html", "Skill Diagnostic"],
    ["quiz-center.html", "Quiz Center"],
    ["cheatsheets.html", "Cheat Sheets"],
    ["practice-detective.html", "AI Code Detective"],
    ["practice-html.html", "HTML Practice"],
    ["practice-css.html", "CSS Practice"],
    ["practice-js.html", "JavaScript Practice"],
    ["practice-specs.html", "Specs Practice (sim)"],
    ["practice-git.html", "Git Practice (sim)"],
    ["practice-testing.html", "Testing Practice"],
    ["practice-review.html", "Review Practice (sim)"],
    ["practice-python.html", "Python Practice"],
    ["practice-integrated.html", "Integrated Challenges"],
    ["desktop-labs.html", "Desktop Labs (required)"],
    ["projects.html", "Projects"],
    ["portfolio.html", "My Portfolio"],
    ["deploy-guide.html", "Deploy Guide"],
    ["career.html", "Career Path"],
  ];

  function currentFile() { return location.pathname.split("/").pop() || "syllabus.html"; }

  function statusMark(unlocked, status, isCurrent) {
    if (!unlocked) return { cls: "locked", title: "Locked" };
    if (status === "completed") return { cls: "done", title: "Completed" };
    if (isCurrent || status === "in-progress") return { cls: "progress", title: "Current" };
    return { cls: "upcoming", title: "Upcoming" };
  }

  function buildRailHtml() {
    const cur = currentFile();
    const navHtml = NAV.map(([file, label]) => {
      const cls = cur === file ? ' class="active"' : "";
      return `<a href="${file}"${cls}>${label}</a>`;
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
          if (!unlocked && m.id === cp.CAPSTONE_ID) title = "Needs Module " + (cp.CAPSTONE_ID - 1) + ", the practice bar, and both Desktop Labs";
          else if (!unlocked) title = "Unlocks after Module " + (m.id - 1);
          if (!unlocked) modsHtml += `<span class="${cls.join(" ")}" aria-disabled="true" title="${title}">${inner}</span>`;
          else modsHtml += `<a href="${m.file}" class="${cls.join(" ")}" title="${title}">${inner}</a>`;
        });
      });
    }
    return `<div class="rail-brand">Zenith Lab</div>` +
      `<div class="rail-title">AI-Assisted Software Engineering</div>` +
      ovHtml +
      `<nav class="rail-nav">${navHtml}</nav>` +
      `<div class="rail-modlbl">Modules</div>` +
      `<div class="rail-mods">${modsHtml}</div>`;
  }

  function closeRail() {
    document.body.classList.remove("rail-open");
    const btn = document.querySelector(".rail-toggle");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }
  function openRail() {
    document.body.classList.add("rail-open");
    const btn = document.querySelector(".rail-toggle");
    if (btn) btn.setAttribute("aria-expanded", "true");
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
