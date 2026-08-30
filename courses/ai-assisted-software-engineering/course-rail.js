(function () {
  const CSS = `
    .courseshell{display:flex;align-items:stretch;min-height:100vh}
    .courserail{width:228px;flex-shrink:0;box-sizing:border-box;padding:20px 14px 24px;
      border-right:1px solid var(--bd,#243049);position:sticky;top:0;align-self:flex-start;
      height:100vh;overflow-y:auto;background:var(--bg,#0b1020);
      scrollbar-width:thin}
    .coursemain{flex:1;min-width:0}
    .courseshell .coursenav{display:none}
    .rail-brand{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut2,#6b7690)}
    .rail-title{font-family:'Fraunces',serif;font-size:15px;font-weight:600;margin-top:5px;color:var(--tx,#eef2ff);line-height:1.25}
    .rail-nav{margin-top:18px;display:flex;flex-direction:column;gap:1px}
    .rail-nav a{font-size:12.5px;color:var(--mut,#9aa6c2);text-decoration:none;padding:7px 9px;border-radius:7px;display:block}
    .rail-nav a:hover{background:var(--card2,#1a2134);color:var(--tx,#eef2ff)}
    .rail-nav a.active{background:rgba(96,165,250,.14);color:var(--accent,#60a5fa);font-weight:600}
    .rail-modlbl{margin-top:20px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut2,#6b7690);padding:0 9px}
    .rail-mods{margin-top:8px;display:flex;flex-direction:column;gap:1px}
    .rail-stage{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut2,#6b7690);padding:12px 9px 4px;line-height:1.35}
    .rail-mod{display:flex;align-items:center;gap:7px;font-size:11.5px;padding:6px 9px;border-radius:7px;text-decoration:none;color:var(--mut,#9aa6c2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    a.rail-mod:hover{background:var(--card2,#1a2134);color:var(--tx,#eef2ff)}
    .rail-mod.active{background:rgba(96,165,250,.14);color:var(--accent,#60a5fa)}
    .rail-mod .rmnum{font-family:'IBM Plex Mono',monospace;font-size:10px;width:14px;flex-shrink:0;text-align:center}
    .rail-mod .rmdot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:var(--bd2,#33415f)}
    .rail-mod.done .rmdot{background:var(--good,#4ade95)}
    .rail-mod.progress .rmdot{background:var(--accent,#60a5fa)}
    .rail-mod.locked{opacity:.55;cursor:not-allowed}
    span.rail-mod{display:flex}
    .skip-to-content{position:absolute;left:-999px;top:8px;z-index:400;background:var(--accent,#60a5fa);color:var(--accentd,#0b1220);font-weight:700;font-size:13px;padding:8px 14px;border-radius:8px;text-decoration:none}
    .skip-to-content:focus{left:8px}
    @media (max-width:860px){
      .courseshell{flex-direction:column}
      .courserail{width:100%;height:auto;position:static;border-right:none;border-top:1px solid var(--bd,#243049);order:2}
      .coursemain{order:1}
    }
  `;
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
  function buildRailHtml() {
    const cur = currentFile();
    const navHtml = NAV.map(([file, label]) => {
      const cls = cur === file ? ' class="active"' : "";
      return `<a href="${file}"${cls}>${label}</a>`;
    }).join("");
    let modsHtml = "";
    if (window.CourseProgress) {
      const cp = window.CourseProgress;
      const m0 = cp.getExtra("module0") || {};
      const m0Cls = ["rail-mod"];
      if (cur === "module-00.html") m0Cls.push("active");
      if (m0.completed) m0Cls.push("done");
      else if (m0.visited) m0Cls.push("progress");
      modsHtml += `<a href="module-00.html" class="${m0Cls.join(" ")}" title="Orientation"><span class="rmnum">0</span><span class="rmdot"></span>Orientation</a>`;
      cp.STAGES.forEach((stage) => {
        modsHtml += `<div class="rail-stage">${stage.label} · ${stage.title}</div>`;
        stage.modules.forEach((id) => {
          const m = cp.MODULES.find((x) => x.id === id);
          if (!m) return;
          const status = cp.statusOf(m.id);
          const unlocked = cp.isUnlocked(m.id);
          const cls = ["rail-mod"];
          if (cur === m.file) cls.push("active");
          if (!unlocked) cls.push("locked");
          else if (status === "completed") cls.push("done");
          else if (status === "in-progress") cls.push("progress");
          const inner = `<span class="rmnum">${m.id}</span><span class="rmdot"></span>${m.title}`;
          let title = m.title;
          if (!unlocked && m.id === cp.CAPSTONE_ID) title = "Needs Module " + (cp.CAPSTONE_ID - 1) + ", the practice bar, and both Desktop Labs";
          else if (!unlocked) title = "Unlocks after Module " + (m.id - 1);
          if (!unlocked) modsHtml += `<span class="${cls.join(" ")}" aria-disabled="true" title="${title}">${inner}</span>`;
          else modsHtml += `<a href="${m.file}" class="${cls.join(" ")}" title="${title}">${inner}</a>`;
        });
      });
    }
    return `<div class="rail-brand">Zenith Lab</div><div class="rail-title">AI-Assisted Software Engineering</div><nav class="rail-nav">${navHtml}</nav><div class="rail-modlbl">Modules</div><div class="rail-mods">${modsHtml}</div>`;
  }
  function init() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    const skip = document.createElement("a");
    skip.className = "skip-to-content";
    skip.href = "#main-content";
    skip.textContent = "Skip to content";
    const shell = document.createElement("div");
    shell.className = "courseshell";
    const rail = document.createElement("aside");
    rail.className = "courserail";
    rail.setAttribute("aria-label", "Course navigation");
    rail.innerHTML = buildRailHtml();
    const main = document.createElement("div");
    main.className = "coursemain";
    main.id = "main-content";
    main.setAttribute("role", "main");
    main.tabIndex = -1;
    while (document.body.firstChild) main.appendChild(document.body.firstChild);
    shell.appendChild(rail);
    shell.appendChild(main);
    document.body.appendChild(skip);
    document.body.appendChild(shell);
    document.querySelectorAll('[id$="Results"], [id^="results_"], .feedback').forEach((el) => {
      if (!el.getAttribute("aria-live")) el.setAttribute("aria-live", "polite");
    });
  }
  init();
})();
