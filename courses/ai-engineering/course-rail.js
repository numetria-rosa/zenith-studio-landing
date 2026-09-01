/* Zenith Lab course rail — AI Engineering */
(function () {
  const TITLE = "AI Engineering";
  const NAV = [
    ["dashboard.html", "Dashboard"],
    ["syllabus.html", "Syllabus"],
    ["learning-roadmap.html", "Learning Roadmap"],
    ["quiz-center.html", "Quiz Center"],
    ["cheatsheets.html", "Cheat Sheets"],
    ["python-foundations.html", "Python Foundations"],
    ["challenges.html", "Challenges"],
    ["projects.html", "Projects"],
    ["portfolio.html", "My Portfolio"],
    ["career.html", "Career Path"],
    ["final-assessment.html", "Final Assessment"],
  ];

  function currentFile() { return location.pathname.split("/").pop() || "dashboard.html"; }

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
    const cp = window.CourseProgress;
    if (cp) {
      const ov = cp.overall ? cp.overall() : { pct: 0, completed: 0, total: 0 };
      ovHtml = `<div class="rail-ov"><div class="lbl">Course progress</div>` +
        `<div class="barline"><i style="width:${ov.pct || 0}%"></i></div>` +
        `<div class="lbl" style="margin-top:6px">${ov.completed || 0} / ${ov.total || 0} modules</div></div>`;
      const m0 = (cp.getExtra && cp.getExtra("module0")) || {};
      const m0Cls = ["rail-mod"];
      if (cur === "module-00.html") m0Cls.push("active", "progress");
      if (m0.completed) m0Cls.push("done");
      else if (m0.visited) m0Cls.push("progress");
      modsHtml += `<a href="module-00.html" class="${m0Cls.join(" ")}" title="Orientation">` +
        `<span class="rmnum">0</span><span class="rmdot" aria-hidden="true"></span>` +
        `<span>Orientation</span></a>`;
      (cp.MODULES || []).forEach(function (m) {
        const status = cp.statusOf ? cp.statusOf(m.id) : "not-started";
        const unlocked = cp.isUnlocked ? cp.isUnlocked(m.id) : true;
        const isCurrent = cur === m.file;
        const mark = statusMark(unlocked, status, isCurrent);
        const cls = ["rail-mod", mark.cls];
        if (isCurrent) cls.push("active");
        const lock = !unlocked ? `<span class="rmlock" aria-hidden="true"><span class="i i-lock"></span></span>` : "";
        const inner = `<span class="rmnum">${m.id}</span><span class="rmdot" aria-hidden="true"></span>` +
          `<span>${m.title}</span>${lock}`;
        const title = unlocked ? m.title : "Unlocks after the previous module";
        if (!unlocked) modsHtml += `<span class="${cls.join(" ")}" aria-disabled="true" title="${title}">${inner}</span>`;
        else modsHtml += `<a href="${m.file}" class="${cls.join(" ")}" title="${title}">${inner}</a>`;
      });
    }
    const accountHtml = `<div class="rail-account">` +
      `<a href="/lab/dashboard">&larr; Zenith Lab Dashboard</a>` +
      `<a href="/profile">My Profile</a></div>`;
    return `<div class="rail-brand">Zenith Lab</div><div class="rail-title">${TITLE}</div>` +
      accountHtml + ovHtml + `<nav class="rail-nav">${navHtml}</nav>` +
      `<div class="rail-modlbl">Modules</div><div class="rail-mods">${modsHtml}</div>`;
  }

  function closeRail() {
    document.body.classList.remove("rail-open");
    const btn = document.querySelector(".rail-toggle");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }
  function toggleRail() {
    if (document.body.classList.contains("rail-open")) closeRail();
    else {
      document.body.classList.add("rail-open");
      const btn = document.querySelector(".rail-toggle");
      if (btn) btn.setAttribute("aria-expanded", "true");
    }
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
  function ensureCss(href) {
    const links = document.querySelectorAll("link[rel=stylesheet]");
    for (let i = 0; i < links.length; i++) {
      if ((links[i].getAttribute("href") || "").indexOf(href) !== -1) return;
    }
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }

  function init() {
    if (document.querySelector(".courseshell")) return;
    ensureCss("zenith-lab.css");
    ensureCss("theme.css");
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
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeRail(); });
    rail.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeRail); });
    const ui = document.createElement("script");
    ui.src = "course-ui.js";
    document.body.appendChild(ui);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
