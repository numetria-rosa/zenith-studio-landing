(function () {
  const CSS = `
    .courseshell{display:flex;align-items:stretch;min-height:100vh}
    .courserail{width:228px;flex-shrink:0;box-sizing:border-box;padding:20px 14px 24px;
      border-right:1px solid var(--bd);position:sticky;top:0;align-self:flex-start;
      height:100vh;overflow-y:auto;background:var(--bg);
      scrollbar-width:thin}
    .coursemain{flex:1;min-width:0}
    .rail-brand{font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut2)}
    .rail-title{font-family:'Source Serif 4',serif;font-size:15.5px;font-weight:600;margin-top:5px;color:var(--tx);line-height:1.25}
    .rail-nav{margin-top:20px;display:flex;flex-direction:column;gap:1px}
    .rail-nav a{font-size:12.5px;color:var(--mut);text-decoration:none;padding:7px 9px;border-radius:7px;display:block}
    .rail-nav a:hover{background:var(--card2);color:var(--tx)}
    .rail-nav a.active{background:rgba(34,211,238,.12);color:var(--accent);font-weight:600}
    .rail-modlbl{margin-top:20px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut2);padding:0 9px}
    .rail-mods{margin-top:8px;display:flex;flex-direction:column;gap:1px}
    .rail-mod{display:flex;align-items:center;gap:7px;font-size:11.5px;padding:6px 9px;border-radius:7px;text-decoration:none;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    a.rail-mod:hover{background:var(--card2);color:var(--tx)}
    .rail-mod.active{background:rgba(34,211,238,.12);color:var(--accent)}
    .rail-mod .rmnum{font-family:'JetBrains Mono',monospace;font-size:10px;width:14px;flex-shrink:0;text-align:center;color:var(--mut2)}
    .rail-mod .rmdot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:var(--bd2)}
    .rail-mod.done .rmdot{background:var(--emerald)}
    .rail-mod.progress .rmdot{background:var(--accent)}
    .rail-mod.locked{opacity:.55}
    @media (max-width:860px){
      .courseshell{flex-direction:column}
      .courserail{width:100%;height:auto;position:static;border-right:none;border-top:1px solid var(--bd);order:2}
      .coursemain{order:1}
    }
  `;

  const NAV = [
    ["dashboard.html", "Dashboard"],
    ["syllabus.html", "Syllabus"],
    ["quiz-center.html", "Quiz Center"],
    ["cheatsheets.html", "Cheat Sheets"],
    ["practice-workflows.html", "Workflow Practice"],
    ["practice-apis.html", "API Practice"],
    ["practice-reliability.html", "Reliability Practice"],
    ["practice-ai.html", "AI-Step Practice"],
    ["projects.html", "Projects"],
    ["portfolio.html", "Portfolio"],
    ["career.html", "Career Path"],
  ];

  function currentFile() {
    return location.pathname.split("/").pop() || "dashboard.html";
  }

  function boot() {
    if (document.querySelector(".courseshell")) return;
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const shell = document.createElement("div");
    shell.className = "courseshell";
    const rail = document.createElement("aside");
    rail.className = "courserail";
    const main = document.createElement("div");
    main.className = "coursemain";
    while (document.body.firstChild) main.appendChild(document.body.firstChild);
    document.body.appendChild(shell);
    shell.appendChild(rail);
    shell.appendChild(main);

    const file = currentFile();
    const CP = window.CourseProgress;
    let mods = "";
    if (CP) {
      mods += '<a class="rail-mod' + (file === "module-00.html" ? " active" : "") + '" href="module-00.html"><span class="rmnum">0</span><span class="rmdot"></span>Orientation</a>';
      CP.MODULES.forEach(function (m) {
        const st = CP.statusOf(m.id);
        const unlocked = CP.isUnlocked(m.id);
        const cls = "rail-mod" + (file === m.file ? " active" : "") + (st === "completed" ? " done" : st === "in-progress" ? " progress" : "") + (unlocked ? "" : " locked");
        const href = unlocked ? m.file : "#";
        mods += '<a class="' + cls + '" href="' + href + '"><span class="rmnum">' + m.id + '</span><span class="rmdot"></span>' + CP.escapeHtml(m.title) + "</a>";
      });
    }

    rail.innerHTML =
      '<div class="rail-brand">Zenith Lab</div>' +
      '<div class="rail-title">AI Automation</div>' +
      '<nav class="rail-nav">' +
      NAV.map(function (n) {
        return '<a class="' + (file === n[0] ? "active" : "") + '" href="' + n[0] + '">' + n[1] + "</a>";
      }).join("") +
      "</nav>" +
      '<div class="rail-modlbl">Modules</div>' +
      '<div class="rail-mods">' + mods + "</div>";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
