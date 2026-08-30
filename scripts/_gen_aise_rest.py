"""Desktop labs, quiz center, career, projects, and remaining pages."""
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
<script src="course-progress.js"></script>
{scripts}
<script src="course-rail.js"></script>
</body>
</html>
"""

def write(name, title, tag, nav, body, scripts):
    (ROOT / name).write_text(
        SHELL.format(title=title, tag=tag, nav=nav, body=body, scripts=scripts),
        encoding="utf-8",
    )
    print("wrote", name)

NAV = '<a href="dashboard.html">&larr; Dashboard</a><a href="syllabus.html">Syllabus</a>'

write(
    "desktop-labs.html",
    "Desktop Labs — Cursor and GitHub",
    "Desktop Labs",
    NAV + '<a href="practice-specs.html">Spec sim</a><a href="practice-git.html">Git sim</a>',
    """  <header class="hero">
    <span class="eyebrow">Required · both labs</span>
    <h1 class="serif">Desktop Labs</h1>
    <p class="sub">Unlike Data Science (Tableau <i>or</i> Power BI), this course needs <b>both</b> Cursor evidence and a GitHub repo you own. In-browser spec/git/review libraries are labeled simulations. They do not satisfy this page.</p>
    <div class="disclosure"><b>This page cannot open Cursor or GitHub Desktop for you.</b> Install the tools, do the work, paste an allowlisted https://github.com URL plus 80+ characters of notes.</div>
    <div class="statusrow">
      <span class="pill" id="stCursor">Lab A Cursor: not submitted</span>
      <span class="pill" id="stGithub">Lab B GitHub: not submitted</span>
      <span class="pill" id="stGate">Capstone labs: missing</span>
    </div>
  </header>
  <section>
    <div class="kh"><span class="num">A</span><h2>Lab A — Cursor</h2></div>
    <p>Install <a href="https://cursor.com" target="_blank" rel="noopener">Cursor</a> (VS Code + Copilot is accepted if you confirm it). Open the starter in <code>starters/northline-landing/</code> (download the folder from this course). Change the clinic hours to <b>Tue–Sat 9:00–17:00</b> and add a button whose visible text is <b>Book</b>. Commit and push.</p>
    <p>Evidence: a commit URL shaped like <code>https://github.com/you/repo/commit/abc123</code>, notes (≥80 characters) on what you changed and how you checked it, and a confirmation this was not the in-browser simulation.</p>
    <div class="interactive">
      <div class="formrow"><label for="cUrl">GitHub commit URL</label><input id="cUrl" type="url" placeholder="https://github.com/you/repo/commit/…"></div>
      <div class="formrow"><label for="cNotes">Notes</label><textarea id="cNotes"></textarea></div>
      <label class="check"><input type="checkbox" id="cOk"> I made this change in Cursor or VS Code + Copilot, not the in-browser simulation.</label>
      <button class="primary" id="btnCursor">Submit Lab A</button>
      <div class="feedback" id="cFb"></div>
    </div>
  </section>
  <section>
    <div class="kh"><span class="num">B</span><h2>Lab B — GitHub</h2></div>
    <p>A public repo you own with a README, at least three commits, and either one pull request or a documented feature branch. One repo may satisfy both labs if the commit URL is valid <i>and</i> the repo checks pass.</p>
    <div class="interactive">
      <div class="formrow"><label for="gUrl">GitHub repo URL</label><input id="gUrl" type="url" placeholder="https://github.com/you/repo"></div>
      <div class="formrow"><label for="gNotes">Notes</label><textarea id="gNotes"></textarea></div>
      <label class="check"><input type="checkbox" id="gOk"> This is a repo I own. It has a README and at least three commits.</label>
      <button class="primary" id="btnGithub">Submit Lab B</button>
      <div class="feedback" id="gFb"></div>
    </div>
  </section>""",
    """<script>
function paint() {
  const a = CourseProgress.desktopLabRecord("cursor");
  const b = CourseProgress.desktopLabRecord("github");
  const el = function (id, rec, label) {
    const n = document.getElementById(id);
    n.textContent = rec.completed ? label + ": submitted" : label + ": not submitted";
    n.className = "pill" + (rec.completed ? " done" : "");
  };
  el("stCursor", a, "Lab A Cursor");
  el("stGithub", b, "Lab B GitHub");
  const g = document.getElementById("stGate");
  const ready = CourseProgress.desktopLabReady();
  g.textContent = ready ? "Capstone labs: both done" : "Capstone labs: missing";
  g.className = "pill" + (ready ? " done" : "");
  if (a.url) document.getElementById("cUrl").value = a.url;
  if (a.notes) document.getElementById("cNotes").value = a.notes;
  if (b.url) document.getElementById("gUrl").value = b.url;
  if (b.notes) document.getElementById("gNotes").value = b.notes;
}
function submit(tool, urlId, notesId, okId, fbId) {
  const out = CourseProgress.completeDesktopLab(tool, {
    url: document.getElementById(urlId).value,
    notes: document.getElementById(notesId).value,
    confirmed: document.getElementById(okId).checked,
  });
  const fb = document.getElementById(fbId);
  fb.className = "feedback " + (out.ok ? "ok" : "bad");
  fb.textContent = out.ok ? "Saved. This syncs with module progress when you are signed in." : out.error;
  paint();
}
document.getElementById("btnCursor").onclick = function () { submit("cursor", "cUrl", "cNotes", "cOk", "cFb"); };
document.getElementById("btnGithub").onclick = function () { submit("github", "gUrl", "gNotes", "gOk", "gFb"); };
paint();
</script>""",
)

write(
    "quiz-center.html",
    "Quiz Center — AI-Assisted Software Engineering",
    "Quiz Center",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Extra reps</span>
    <h1 class="serif">Quiz Center</h1>
    <p class="sub">Shuffled questions from module banks plus extras. This does not replace module checkpoints and does not unlock modules by itself.</p>
  </header>
  <div class="formrow"><label for="modPick">Bank</label>
    <select id="modPick" style="width:auto;padding:8px 10px;border-radius:8px;background:var(--bg2);color:var(--tx);border:1px solid var(--bd2)">
      <option value="mix">Mixed extra + modules</option>
      <option value="1">Module 1</option><option value="2">Module 2</option><option value="3">Module 3</option>
      <option value="4">Module 4</option><option value="5">Module 5</option><option value="6">Module 6</option>
      <option value="7">Module 7</option><option value="8">Module 8</option>
    </select>
    <button class="primary" id="btnGo" style="margin-left:8px">Draw 5</button>
  </div>
  <div id="quizRoot"></div>
  <p class="mono" id="scoreDisplay" style="margin-top:16px"></p>""",
    """<script src="quiz-data.js"></script>
<script src="module-kit.js"></script>
<script>
function pool(key) {
  if (key === "mix") {
    let all = AISEQuizData.CENTER_EXTRA.slice();
    Object.keys(AISEQuizData.MODULE_QUIZZES).forEach(function (k) {
      all = all.concat(AISEQuizData.MODULE_QUIZZES[k]);
    });
    return all;
  }
  return (AISEQuizData.MODULE_QUIZZES[key] || []).slice();
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
document.getElementById("btnGo").onclick = function () {
  const qs = shuffle(pool(document.getElementById("modPick").value)).slice(0, 5);
  ModuleKit.renderQuiz("quiz-center", qs, function () {});
};
</script>""",
)

write(
    "diagnostic.html",
    "Skill Diagnostic — AI-Assisted Software Engineering",
    "Diagnostic",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Placement check</span>
    <h1 class="serif">Skill diagnostic</h1>
    <p class="sub">Five questions. This does not skip Module 1. It only tells you which practice library will feel least familiar.</p>
    <div id="quizRoot"></div>
    <p class="mono" id="scoreDisplay" style="margin-top:16px"></p>
    <div id="diagOut" class="disclosure" style="display:none;margin-top:18px"></div>
  </header>""",
    """<script src="quiz-data.js"></script>
<script src="module-kit.js"></script>
<script>
const Q = [
  AISEQuizData.MODULE_QUIZZES[1][1],
  AISEQuizData.MODULE_QUIZZES[2][1],
  AISEQuizData.MODULE_QUIZZES[3][0],
  AISEQuizData.MODULE_QUIZZES[5][2],
  AISEQuizData.MODULE_QUIZZES[6][0],
];
ModuleKit.renderQuiz("diagnostic", Q, function () {
  const m = CourseProgress.getModule("diagnostic");
  const box = document.getElementById("diagOut");
  box.style.display = "block";
  box.innerHTML = "<b>Still start at Module 1.</b> Score stored as a diagnostic only (" + m.score + "/" + m.total + "). Weakest feeling area: use HTML, CSS, then JS practice in that order if the score is under 80%.";
  CourseProgress.setExtra("diagnostic", { score: m.score, total: m.total, at: new Date().toISOString() });
});
</script>""",
)

write(
    "mastery-profile.html",
    "Mastery Profile — AI-Assisted Software Engineering",
    "Mastery",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Evidence</span>
    <h1 class="serif">Mastery profile</h1>
    <p class="sub">Tiers come from passed practice tasks and completed projects. Simulations are labeled. This is not a job-readiness score.</p>
  </header>
  <div id="masteryList"></div>""",
    """<script src="practice-progress.js"></script>
<script src="practice-tasks.js"></script>
<script src="skill-map.js"></script>
<script>
SkillMap.allMasterSkillProgress().forEach(function (m) {
  const d = document.createElement("div");
  d.className = "projcard";
  d.innerHTML = "<div class='modtitle'>" + m.label + (m.simulation ? " <span class='pill'>simulation</span>" : "") + "</div>" +
    "<div class='moddesc'>" + m.category + " · " + m.tier + " · " + m.passedCount + "/" + m.totalCount + "</div>" +
    "<div class='overallbar' style='margin-top:10px'><div class='fill' style='width:" + m.pct + "%'></div></div>";
  document.getElementById("masteryList").appendChild(d);
});
</script>""",
)

write(
    "learning-roadmap.html",
    "Learning Roadmap — AI-Assisted Software Engineering",
    "Roadmap",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Rule-based · not an AI tutor</span>
    <h1 class="serif">Learning roadmap</h1>
    <p class="sub">The next task is whichever unfinished practice item scores highest on retries and uncovered tools. No model is choosing this.</p>
    <div class="projcard" id="rec"></div>
  </header>""",
    """<script src="practice-progress.js"></script>
<script src="practice-tasks.js"></script>
<script src="skill-map.js"></script>
<script src="adaptive-engine.js"></script>
<script>
const r = AdaptiveEngine.recommend();
const el = document.getElementById("rec");
if (r.done) el.innerHTML = "<p>No unfinished practice tasks in the map, or SkillMap failed to load.</p>";
else {
  const p = r.primary;
  el.innerHTML = "<div class='modtitle'>" + (p.title || p.id) + "</div><p class='moddesc'>" + (p.why || []).join(" ") +
    '</p><p style="margin-top:10px"><a href="' + p.file + '">Open ' + p.tool + " practice</a></p>";
}
</script>""",
)

print("labs + systems pages done")
