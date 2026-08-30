"""Emit student-facing HTML for AI-Assisted Software Engineering."""
from pathlib import Path

ROOT = Path(r"d:\zenith-studio\courses\ai-assisted-software-engineering")

SHELL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<link rel="stylesheet" href="course.css">
</head>
<body>
<div class="bar"><div class="in"><span class="logo">ZENITH<b>LAB</b></span><span class="tag">{tag}</span></div></div>
<div class="coursenav"><div class="in">{nav}</div></div>
<div class="wrap">
{body}
<footer>Zenith Lab · AI-Assisted Software Engineering</footer>
</div>
{extra}
<script src="course-progress.js"></script>
{scripts}
<script src="course-rail.js"></script>
</body>
</html>
"""

def write(name, title, tag, nav, body, scripts, extra=""):
    (ROOT / name).write_text(
        SHELL.format(title=title, tag=tag, nav=nav, body=body, scripts=scripts, extra=extra),
        encoding="utf-8",
    )
    print("wrote", name)

NAV_DASH = '<a href="dashboard.html">&larr; Dashboard</a><a href="syllabus.html">Syllabus</a><a href="desktop-labs.html">Desktop Labs</a>'

# ---------------------------------------------------------------------------
# Practice libraries
# ---------------------------------------------------------------------------
LIBS = [
    ("practice-html.html", "HTML Practice", "html", "Real DOM checks. You write markup. Nothing here opens Cursor."),
    ("practice-css.html", "CSS Practice", "css", "Computed-style checks on a fixture. Not a design tool."),
    ("practice-js.html", "JavaScript Practice", "js", "You write functions. Tests call them. This is the literacy that makes AI output readable."),
    ("practice-specs.html", "Specs Practice", "specs", "Labeled simulation: judgment about tickets and prompts. Does not run Cursor."),
    ("practice-git.html", "Git Practice", "git", "Labeled simulation: reading workflow and diffs. The required GitHub lab is on Desktop Labs."),
    ("practice-testing.html", "Testing Practice", "testing", "You write a test function. We run it on a good impl and a planted bug."),
    ("practice-review.html", "Review Practice", "review", "Labeled simulation: accept or reject an AI-shaped change. Not a real PR."),
    ("practice-python.html", "Python Practice", "python", "Functions in Python, graded in-browser via Pyodide. Not RAG. Not agents."),
    ("practice-integrated.html", "Integrated Challenges", "integrated", "Cross-tool judgment. Simulations are labeled. Desktop Labs still required for the capstone."),
]
SIM = {"specs", "git", "review"}
for fname, title, tool, blurb in LIBS:
    note = (
        f'<div class="honestnote"><b>Simulation.</b> {blurb} These tasks do not unlock the capstone by themselves.</div>'
        if tool in SIM
        else f'<div class="disclosure">{blurb}</div>'
    )
    extra_src = '<script src="pyodide-sandbox-runner.js"></script>\n' if tool == "python" else ""
    body = f"""  <header class="hero">
    <span class="eyebrow">Practice library</span>
    <h1 class="serif">{title}</h1>
    <p class="sub">{blurb}</p>
    {note}
    <p class="mono" id="skillMeta" style="margin-top:14px;color:var(--mut2)">0 passed</p>
  </header>
  <div id="taskList"></div>"""
    scripts = f"""{extra_src}<script src="practice-progress.js"></script>
<script src="practice-tasks.js"></script>
<script src="practice-kit.js"></script>
<script>
const TASKS = AISE_TASKS.filter(t => t.tool === "{tool}");
PracticeKit.renderLibrary(TASKS);
</script>"""
    write(fname, title + " — AI-Assisted Software Engineering", "Practice", NAV_DASH, body, scripts)

# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
write(
    "dashboard.html",
    "Dashboard — AI-Assisted Software Engineering",
    "Dashboard",
    '<a href="module-00.html">Orientation</a><a href="syllabus.html">Syllabus</a><a href="desktop-labs.html">Desktop Labs</a>',
    """  <header class="hero">
    <span class="eyebrow">Course dashboard</span>
    <h1 class="serif">AI-Assisted Software Engineering</h1>
    <p class="sub">Zero coding to a live URL. Module progress syncs when you are signed in through Zenith Lab. This course is not AI Engineering.</p>
  </header>
  <div class="sysgrid">
    <a class="syscard" href="module-00.html"><span class="systitle">Orientation</span><span class="sysdesc">What this job is</span></a>
    <a class="syscard" href="quiz-center.html"><span class="systitle">Quiz Center</span><span class="sysdesc">Shuffled extra reps</span></a>
    <a class="syscard" href="practice-html.html"><span class="systitle">HTML Practice</span><span class="sysdesc">Real DOM checks</span></a>
    <a class="syscard" href="practice-js.html"><span class="systitle">JS Practice</span><span class="sysdesc">Functions you write</span></a>
    <a class="syscard" href="desktop-labs.html"><span class="systitle">Desktop Labs</span><span class="sysdesc">Cursor + GitHub</span></a>
    <a class="syscard" href="projects.html"><span class="systitle">Projects</span><span class="sysdesc">Portfolio briefs</span></a>
    <a class="syscard" href="portfolio.html"><span class="systitle">Portfolio</span><span class="sysdesc">What you can show</span></a>
    <a class="syscard" href="career.html"><span class="systitle">Career Path</span><span class="sysdesc">Honest non-claims</span></a>
    <a class="syscard" href="learning-roadmap.html"><span class="systitle">Roadmap</span><span class="sysdesc">What to do next</span></a>
    <a class="syscard" href="mastery-profile.html"><span class="systitle">Mastery</span><span class="sysdesc">Skill tiers</span></a>
    <a class="syscard" href="diagnostic.html"><span class="systitle">Diagnostic</span><span class="sysdesc">Placement check</span></a>
    <a class="syscard" href="cheatsheets.html"><span class="systitle">Cheat sheets</span><span class="sysdesc">One page per skill</span></a>
  </div>
  <div class="overallwrap">
    <div class="overallrow"><span class="ov-lbl">Overall course progress</span><span class="ov-val" id="ovVal">0 / 9</span></div>
    <div class="overallbar" id="ovBar"><div class="fill" id="ovFill"></div></div>
    <div class="nextaction" id="nextAction"></div>
    <p class="assume" id="syncNote"></p>
    <button id="btnReset" style="margin-top:10px">Reset module progress in this browser</button>
  </div>
  <div class="modgrid-lbl">Modules</div>
  <div id="modGrid"></div>""",
    """<script>
const DESC = {
  1: "Files, the browser, errors. Semantic HTML from a brief.",
  2: "Layout, spacing, hierarchy. Match a spec, including one responsive rule.",
  3: "Functions, events, DOM. You write them. No Cursor yet.",
  4: "Acceptance criteria. Simulations are labeled. Desktop Lab A required to go further honestly.",
  5: "Commits, branches, PRs. Simulation here. Desktop Lab B is the real repo.",
  6: "A failing test is information. Agent 'it works' is not.",
  7: "Spec → implement in Cursor → review → PR. We grade the spec and the test.",
  8: "Python for scripts: files, functions, JSON, a small CLI. Not RAG.",
  9: "One live product: tests, GitHub, https URL. Both Desktop Labs plus practice bar.",
};
function card(href, unlocked, status, num, title, desc, meta, label) {
  const el = document.createElement(unlocked ? "a" : "div");
  if (unlocked) el.href = href;
  el.className = "modcard " + status + (unlocked ? "" : " locked");
  el.innerHTML = '<div class="modnum">' + (status === "completed" ? "✓" : num) + '</div><div class="modbody"><div class="modtitle">' +
    title + '</div><div class="moddesc">' + desc + '</div><div class="modmeta">' + meta +
    '</div></div><div class="modstatus ' + (unlocked ? status : "locked") + '">' + label + "</div>";
  return el;
}
function render() {
  const grid = document.getElementById("modGrid");
  grid.innerHTML = "";
  grid.appendChild(card("module-00.html", true, "not-started", "0", "Orientation — What this job is", "Placement self-check. Everyone starts at Module 1.", "<span>~20 min</span>", "Open"));
  CourseProgress.MODULES.forEach(function (m) {
    const status = CourseProgress.statusOf(m.id);
    const unlocked = CourseProgress.isUnlocked(m.id);
    const label = !unlocked ? "Locked" : status === "completed" ? "Completed" : status === "in-progress" ? "In progress" : "Not started";
    let meta = "~" + m.minutes + " min";
    if (!unlocked && m.id === 9) meta = "Needs Module 8, 3+ tasks in two of HTML/CSS/JS, both Desktop Labs";
    else if (!unlocked) meta = "Unlocks after Module " + (m.id - 1) + " (quiz 80% + exercise)";
    grid.appendChild(card(m.file, unlocked, status, String(m.id), "Module " + m.id + " — " + m.title, DESC[m.id], "<span>" + meta + "</span>", label));
  });
  const ov = CourseProgress.overall();
  document.getElementById("ovVal").textContent = ov.completed + " / " + ov.total + " modules — " + ov.pct + "%";
  document.getElementById("ovFill").style.width = ov.pct + "%";
  const next = CourseProgress.MODULES.find(function (m) { return CourseProgress.isUnlocked(m.id) && !CourseProgress.isModuleComplete(m.id); });
  const na = document.getElementById("nextAction");
  if (next) na.innerHTML = '<div class="nalbl" style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--accent);font-weight:700">Up next</div><div style="margin-top:6px">Module ' + next.id + " — " + next.title + ' · <a href="' + next.file + '">Open</a></div>';
  else if (ov.completed === ov.total) na.textContent = "All modules complete. Ship remaining portfolio projects if you want more evidence.";
  else na.textContent = "Finish Orientation, then Module 1.";
  document.getElementById("syncNote").textContent = "Module and quiz progress syncs when you are signed in on zenith-studio.site. Practice ticks sync into extra.practiceTasks.";
}
document.getElementById("btnReset").onclick = function () {
  if (confirm("Reset module progress in this browser?")) { CourseProgress.resetAll(); location.reload(); }
};
render();
</script>""",
)

# ---------------------------------------------------------------------------
# Syllabus
# ---------------------------------------------------------------------------
write(
    "syllabus.html",
    "Syllabus — AI-Assisted Software Engineering",
    "Syllabus",
    NAV_DASH,
    """  <header class="hero">
    <span class="eyebrow">12 weeks · ~8–10 hrs/week</span>
    <h1 class="serif">Syllabus</h1>
    <p class="sub">Hand-writing comes before agent work. That is the equivalent of a data course making you write SQL instead of only clicking a dashboard tool.</p>
    <div class="honestnote"><b>This is not AI Engineering.</b> That course builds LLM products (RAG, tools, eval) and assumes programming logic. This course starts at zero and ends at a live web app you specified, reviewed, tested, and shipped with Cursor and GitHub.</div>
  </header>
  <section>
    <div class="kh"><span class="num">00</span><h2>What you will be able to do</h2></div>
    <p>Specify a small web feature, drive Cursor, read the diff, write and run tests, open a GitHub PR, and deploy a live https URL. You will not be a senior engineer. We do not guarantee a job.</p>
  </section>
  <section>
    <div class="kh"><span class="num">01</span><h2>Modules</h2></div>
    <ol>
      <li><b>0 Orientation.</b> Placement self-check. Everyone starts at Module 1.</li>
      <li><b>1 How software works + HTML.</b> Files, folders, the browser, errors. Semantic HTML by hand.</li>
      <li><b>2 CSS.</b> Layout, not decoration. Match a spec, including one responsive rule.</li>
      <li><b>3 JavaScript you can read.</b> Variables, functions, events, DOM. Literacy gate. No Cursor yet.</li>
      <li><b>4 Specs and coding agents.</b> Acceptance criteria. In-browser = labeled simulation. Desktop Lab A required.</li>
      <li><b>5 Git and GitHub.</b> Commits, branches, PRs. Simulation here. Desktop Lab B: a repo you own.</li>
      <li><b>6 Testing and debugging.</b> Write a test that catches a planted bug.</li>
      <li><b>7 Multi-file features with AI.</b> Spec → Cursor → review → PR. We grade spec + test.</li>
      <li><b>8 Python for scripts.</b> Files, functions, JSON, a small CLI. Not RAG. Not agents.</li>
      <li><b>9 Capstone.</b> Live web app, tests, GitHub, write-up. Optional Python helper.</li>
    </ol>
  </section>
  <section>
    <div class="kh"><span class="num">02</span><h2>Gates</h2></div>
    <p>From Module 2 onward a module unlocks only after the previous module’s checkpoint quiz is ≥80% and its required exercise is done. The capstone also needs 3+ passed practice tasks in any two of HTML / CSS / JS, plus <b>both</b> Desktop Labs.</p>
  </section>
  <section>
    <div class="kh"><span class="num">03</span><h2>What we will not do</h2></div>
    <ul class="plain">
      <li>No in-browser fake Cursor that “runs the agent.”</li>
      <li>No AI tutor that does not exist.</li>
      <li>No invented task counts on the public catalog until a verifier agrees.</li>
      <li>No job guarantee. Career page lists the gaps: algorithms, systems design, incident ownership, team process.</li>
    </ul>
  </section>""",
    "",
)

print("core pages 1 done")
