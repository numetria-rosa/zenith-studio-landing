/* Zenith Lab, Data Science & Analysis persistent course sidebar.
   Loaded as the last script on every course page. Wraps the page's
   existing content (unchanged) in a flex shell and prepends a sticky
   left rail: course nav plus a live module list with lock/progress
   status, read from CourseProgress when that script has already loaded
   on the page. Doing the wrap in JS, once, here, means every page only
   needs one extra <script> tag instead of hand-edited markup. */
(function () {
  const CSS = `
    .courseshell{display:flex;align-items:stretch;min-height:100vh}
    .courserail{width:228px;flex-shrink:0;box-sizing:border-box;padding:20px 14px 24px;
      border-right:1px solid var(--bd,#232838);position:sticky;top:0;align-self:flex-start;
      height:100vh;overflow-y:auto;background:var(--bg,#0d0f14)}
    .coursemain{flex:1;min-width:0}
    .courseshell .coursenav{display:none}
    .rail-brand{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.14em;
      text-transform:uppercase;color:var(--mut2,#676e7d)}
    .rail-title{font-family:'Fraunces',serif;font-size:15.5px;font-weight:600;margin-top:5px;
      color:var(--tx,#eeeee7);line-height:1.25}
    .rail-nav{margin-top:20px;display:flex;flex-direction:column;gap:1px}
    .rail-nav a{font-family:'IBM Plex Sans',sans-serif;font-size:12.5px;color:var(--mut,#9aa0ae);
      text-decoration:none;padding:7px 9px;border-radius:7px;transition:.15s;display:block}
    .rail-nav a:hover{background:var(--card2,#191d26);color:var(--tx,#eeeee7)}
    .rail-nav a.active{background:rgba(240,180,41,.12);color:var(--amber,#f0b429);font-weight:600}
    .rail-modlbl{margin-top:20px;font-family:'IBM Plex Mono',monospace;font-size:10px;
      letter-spacing:.12em;text-transform:uppercase;color:var(--mut2,#676e7d);padding:0 9px}
    .rail-mods{margin-top:8px;display:flex;flex-direction:column;gap:1px}
    .rail-mod{display:flex;align-items:center;gap:7px;font-size:11.5px;padding:6px 9px;border-radius:7px;
      text-decoration:none;color:var(--mut,#9aa0ae);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    a.rail-mod:hover{background:var(--card2,#191d26);color:var(--tx,#eeeee7)}
    .rail-mod.active{background:rgba(240,180,41,.12);color:var(--amber,#f0b429)}
    .rail-mod .rmnum{font-family:'IBM Plex Mono',monospace;font-size:10px;width:14px;flex-shrink:0;
      text-align:center;color:var(--mut2,#676e7d)}
    .rail-mod .rmdot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:var(--bd2,#333a4c)}
    .rail-mod.done .rmdot{background:var(--good,#4ade95)}
    .rail-mod.progress .rmdot{background:var(--amber,#f0b429)}
    .rail-mod.locked{opacity:.55}
    .rail-note{margin-top:14px;padding:0 9px;font-size:10.5px;color:var(--mut2,#676e7d);line-height:1.5}
    @media (max-width:860px){
      .courseshell{flex-direction:column}
      .courserail{width:100%;height:auto;max-height:none;position:static;border-right:none;
        border-top:1px solid var(--bd,#232838);order:2}
      .coursemain{order:1}
    }
  `;

  const NAV = [
    ["syllabus.html", "Syllabus"],
    ["dashboard.html", "Dashboard"],
    ["quiz-center.html", "Quiz Center"],
    ["cheatsheets.html", "Cheat Sheets"],
    ["python-survival-guide.html", "Python Survival Guide"],
    ["practice-sql.html", "SQL Practice Library"],
    ["practice-excel.html", "Excel Practice Library"],
    ["projects.html", "Projects"],
    ["portfolio.html", "My Portfolio"],
    ["career.html", "Career Path"],
  ];

  function currentFile() {
    return location.pathname.split("/").pop() || "syllabus.html";
  }

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

      cp.MODULES.forEach((m) => {
        const status = cp.statusOf(m.id);
        const unlocked = cp.isUnlocked(m.id);
        const cls = ["rail-mod"];
        if (cur === m.file) cls.push("active");
        if (!unlocked) cls.push("locked");
        else if (status === "completed") cls.push("done");
        else if (status === "in-progress") cls.push("progress");
        const inner = `<span class="rmnum">${m.id}</span><span class="rmdot"></span>${m.title}`;
        const title = unlocked ? m.title : `Recommended after Module ${m.id - 1}, click to jump ahead anyway`;
        modsHtml += `<a href="${m.file}" class="${cls.join(" ")}" title="${title}">${inner}</a>`;
      });
    } else {
      modsHtml = `<span class="rail-note">Module status loads once CourseProgress is available on this page.</span>`;
    }

    return `
      <div class="rail-brand">Zenith Lab</div>
      <div class="rail-title">Data Science &amp; Analysis</div>
      <nav class="rail-nav">${navHtml}</nav>
      <div class="rail-modlbl">Modules</div>
      <div class="rail-mods">${modsHtml}</div>
    `;
  }

  function init() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const shell = document.createElement("div");
    shell.className = "courseshell";
    const rail = document.createElement("aside");
    rail.className = "courserail";
    rail.innerHTML = buildRailHtml();
    const main = document.createElement("div");
    main.className = "coursemain";

    while (document.body.firstChild) {
      main.appendChild(document.body.firstChild);
    }
    shell.appendChild(rail);
    shell.appendChild(main);
    document.body.appendChild(shell);
  }

  init();
})();
