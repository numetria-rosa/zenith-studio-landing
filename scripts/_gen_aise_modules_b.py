"""Modules 4–9."""
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
{scoreboard}
<script src="course-progress.js"></script>
{scripts}
<script src="course-rail.js"></script>
</body>
</html>
"""

def write(name, title, tag, nav, body, scripts, scoreboard=""):
    (ROOT / name).write_text(
        SHELL.format(title=title, tag=tag, nav=nav, body=body, scripts=scripts, scoreboard=scoreboard),
        encoding="utf-8",
    )
    print("wrote", name)

NAV = '<a href="dashboard.html">&larr; Dashboard</a><a href="syllabus.html">Syllabus</a><a href="desktop-labs.html">Desktop Labs</a>'

def quiz_scripts(mid, next_label):
    return f"""<script src="quiz-data.js"></script>
<script src="module-kit.js"></script>
<script>
CourseProgress.touchVisited({mid});
function syncNext() {{
  const btn = document.getElementById("btnNext");
  const ok = CourseProgress.isModuleComplete({mid});
  if (btn) {{ btn.disabled = !ok; btn.textContent = ok ? {next_label!r} : "Complete the exercise and quiz (80%+) to continue"; }}
  const box = document.getElementById("reqList");
  if (box) {{
    box.innerHTML = CourseProgress.completionRequirements({mid}).map(function (r) {{
      return '<div class="req ' + (r.satisfied ? "ok" : "bad") + '">' + (r.satisfied ? "✓ " : "○ ") + r.label + "</div>";
    }}).join("");
  }}
}}
ModuleKit.renderQuiz({mid}, AISEQuizData.MODULE_QUIZZES[{mid}], syncNext);
syncNext();
</script>"""

def scoreboard(href, label):
    return f'''<div class="scoreboard"><div class="in">
  <span class="sc" id="scoreDisplay">Checkpoint score: —</span>
  <a id="btnNext" href="{href}" class="primary nextbtn" style="text-decoration:none">{label}</a>
</div></div>'''

write(
    "module-04.html",
    "Module 4 — Specs and coding agents",
    "Module 4",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Module 4 · ~50 min</span>
    <h1 class="serif">Specs and coding agents</h1>
    <p class="sub">A prompt that says “make a landing page” is how you get a gradient, three stock photos, and a form that posts to nowhere. Write checks a stranger could run.</p>
    <div class="honestnote"><b>Labeled simulation.</b> The exercise on this page does not run Cursor. Unlocking later modules still requires <a href="desktop-labs.html">Desktop Lab A</a> before the capstone — a real commit URL from Cursor or VS Code.</div>
    <div class="objectives"><div class="lbl">You will be able to</div>
      <ul>
        <li>Write Given / When / Then acceptance criteria</li>
        <li>Spot a prompt that is too wide to review</li>
        <li>Say no to a confident wrong diff</li>
      </ul>
    </div>
  </header>
  <section>
    <div class="kh"><span class="num">1</span><h2>What to put in the spec</h2></div>
    <p>Name the user, the visible change, the files that may change, and how you will know it worked. Mention files with <code>@</code> in Cursor so the agent reads them instead of inventing a second <code>styles.css</code>.</p>
    <div class="def"><div class="k">Bad</div><p>Make it pop. Use AI. Add auth maybe.</p></div>
    <div class="def"><div class="k">Good</div><p>Given I am on the Hours section, when I click Book, then a form with labeled Email and Date fields appears in <code>main</code>, and submit does not leave the page.</p></div>
  </section>
  <section>
    <div class="kh"><span class="num">2</span><h2>Graded: write criteria a stranger could implement</h2></div>
    <p>Write acceptance criteria for adding a Book button to the Northline landing page. Must include the words <b>Given</b>, <b>When</b>, and <b>Then</b>, mention a <b>label</b> or <b>labeled</b> field, and be at least 120 characters.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise · specWritingExercise</div>
      <textarea id="specEx" placeholder="Given ... When ... Then ..."></textarea>
      <button class="primary" id="btnSpec" style="margin-top:10px">Check spec</button>
      <div class="feedback" id="specFb"></div>
    </div>
    <p class="mut" style="margin-top:12px"><a href="practice-specs.html">Specs practice (simulation)</a> · <a href="desktop-labs.html">Desktop Lab A</a></p>
  </section>
  <section>
    <div class="kh"><span class="num">3</span><h2>Checkpoint</h2></div>
    <div id="quizRoot"></div>
    <div id="reqList"></div>
  </section>""",
    quiz_scripts(4, "Continue to Module 5") + """
<script>
document.getElementById("btnSpec").onclick = function () {
  const t = document.getElementById("specEx").value;
  const checks = [
    { name: "has Given", pass: /\\bgiven\\b/i.test(t) },
    { name: "has When", pass: /\\bwhen\\b/i.test(t) },
    { name: "has Then", pass: /\\bthen\\b/i.test(t) },
    { name: "mentions a label", pass: /label/i.test(t) },
    { name: "at least 120 characters", pass: t.trim().length >= 120 },
  ];
  const ok = checks.every(function (c) { return c.pass; });
  const fb = document.getElementById("specFb");
  fb.className = "feedback " + (ok ? "ok" : "bad");
  fb.innerHTML = checks.map(function (c) { return (c.pass ? "✓ " : "✗ ") + c.name; }).join("<br>");
  if (ok) CourseProgress.setSection(4, "specWritingExercise", true);
  syncNext();
};
</script>""",
    scoreboard("module-05.html", "Complete the exercise and quiz (80%+) to continue"),
)

write(
    "module-05.html",
    "Module 5 — Git and GitHub",
    "Module 5",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Module 5 · ~50 min</span>
    <h1 class="serif">Git and GitHub</h1>
    <p class="sub">A Cursor transcript is not evidence. A commit is. A PR is how another human (or future you) reviews a branch without merging yet.</p>
    <div class="honestnote"><b>Labeled simulation.</b> Reading the diff below does not create a repo. <a href="desktop-labs.html">Desktop Lab B</a> requires a public repo you own, with a README and at least three commits.</div>
  </header>
  <section>
    <div class="kh"><span class="num">1</span><h2>The verbs</h2></div>
    <p><b>commit</b> — a snapshot with a message. <b>branch</b> — a movable pointer so main stays shippable. <b>push</b> — send commits to GitHub. <b>pull request</b> — propose merging a branch. Red <code>-</code> lines are removals; green <code>+</code> lines are additions.</p>
  </section>
  <section>
    <div class="kh"><span class="num">2</span><h2>Graded: reject the unsafe change</h2></div>
    <p>An agent opened this PR:</p>
    <pre> function checkout(cart, user) {
-  return charge(user.card, cart.total);
+  return charge(user.card, cart.total);
+  console.log("card", user.card);
 }</pre>
    <div class="interactive">
      <div class="ilbl">Required exercise · diffReadingExercise</div>
      <p>What do you do?</p>
      <button class="qopt" data-v="bad1">Approve. console.log is debugging, harmless.</button>
      <button class="qopt" data-v="bad2">Approve if CI is green.</button>
      <button class="qopt" data-v="good">Reject. Logging a card number is a leak. Ask to remove it and use a test instead.</button>
      <div class="feedback" id="diffFb"></div>
    </div>
    <p class="mut" style="margin-top:12px"><a href="practice-git.html">Git practice (simulation)</a> · <a href="desktop-labs.html">Desktop Lab B</a></p>
  </section>
  <section>
    <div class="kh"><span class="num">3</span><h2>Checkpoint</h2></div>
    <div id="quizRoot"></div>
    <div id="reqList"></div>
  </section>""",
    quiz_scripts(5, "Continue to Module 6") + """
<script>
document.querySelectorAll("#diffFb").forEach(function(){});
document.querySelectorAll(".qopt[data-v]").forEach(function (b) {
  b.onclick = function () {
    const ok = b.getAttribute("data-v") === "good";
    const fb = document.getElementById("diffFb");
    fb.className = "feedback " + (ok ? "ok" : "bad");
    fb.textContent = ok ? "Yes. Secrets in logs are a ship-stopper." : "CI green does not make a card log safe.";
    if (ok) CourseProgress.setSection(5, "diffReadingExercise", true);
    syncNext();
  };
});
</script>""",
    scoreboard("module-06.html", "Complete the exercise and quiz (80%+) to continue"),
)

write(
    "module-06.html",
    "Module 6 — Testing and debugging",
    "Module 6",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Module 6 · ~50 min</span>
    <h1 class="serif">Testing and debugging</h1>
    <p class="sub">“The agent said it works” is not an assertion. A useful test fails when the behavior you care about is wrong.</p>
  </header>
  <section>
    <div class="kh"><span class="num">1</span><h2>Console vs test</h2></div>
    <p><code>console.log</code> is a flashlight. A test is a contract. If you delete the flashlight, the contract should still fail on the bug.</p>
  </section>
  <section>
    <div class="kh"><span class="num">2</span><h2>Graded: catch the planted bug</h2></div>
    <p>Write <code>test_clamp(impl)</code> that returns true only if <code>impl(50, 0, 10) === 10</code> and <code>impl(-2, 0, 10) === 0</code>. We will run it on a correct clamp and on one that returns <code>n</code> unchanged.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise · failingTestExercise</div>
      <textarea id="tsEx" spellcheck="false">function test_clamp(impl) {
  return true;
}
</textarea>
      <button class="primary" id="btnTs" style="margin-top:10px">Run mutation check</button>
      <div class="feedback" id="tsFb"></div>
    </div>
    <p class="mut" style="margin-top:12px"><a href="practice-testing.html">Testing practice</a></p>
  </section>
  <section>
    <div class="kh"><span class="num">3</span><h2>Checkpoint</h2></div>
    <div id="quizRoot"></div>
    <div id="reqList"></div>
  </section>""",
    """<script src="practice-kit.js"></script>
""" + quiz_scripts(6, "Continue to Module 7") + """
<script>
document.getElementById("btnTs").onclick = function () {
  const out = PracticeKit.gradeTesting({
    functionName: "test_clamp",
    goodImpl: "function(n,lo,hi){return Math.min(hi,Math.max(lo,n));}",
    badImpl: "function(n,lo,hi){return n;}",
    bugHint: "The bad impl ignores bounds. Return false for impl(50,0,10).",
  }, document.getElementById("tsEx").value);
  const fb = document.getElementById("tsFb");
  fb.className = "feedback " + (out.passed ? "ok" : "bad");
  fb.innerHTML = out.results.map(function (r) { return (r.pass ? "✓ " : "✗ ") + r.name + (r.pass ? "" : " — " + r.hint); }).join("<br>");
  if (out.passed) CourseProgress.setSection(6, "failingTestExercise", true);
  syncNext();
};
</script>""",
    scoreboard("module-07.html", "Complete the exercise and quiz (80%+) to continue"),
)

write(
    "module-07.html",
    "Module 7 — Multi-file features with AI",
    "Module 7",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Module 7 · ~55 min</span>
    <h1 class="serif">Multi-file features with AI</h1>
    <p class="sub">Spec → implement in Cursor → review the whole diff → PR. This page grades the spec and the test, not a fake IDE.</p>
    <div class="disclosure">Do the Cursor work on your machine. Bring the spec and the test back here.</div>
  </header>
  <section>
    <div class="kh"><span class="num">1</span><h2>Scope the files</h2></div>
    <p>A feature that “just needs a button” often touches HTML, CSS, and JS. List them. If the agent edits a fourth file, that is scope creep until you say otherwise.</p>
  </section>
  <section>
    <div class="kh"><span class="num">2</span><h2>Graded: spec + test for a filter</h2></div>
    <p>Feature: a status page lists incidents; a JS function <code>filter_open(rows)</code> returns only rows whose <code>status</code> is <code>"open"</code>.</p>
    <p>1) Write a spec (≥80 chars) that names <code>filter_open</code> and the <code>open</code> status.<br>2) Write <code>test_filter_open(impl)</code> that returns true for a correct filter and false if the impl returns the full list.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise · featureSpecExercise</div>
      <label class="formrow">Spec<textarea id="featSpec"></textarea></label>
      <label class="formrow">Test<textarea id="featTest" spellcheck="false">function test_filter_open(impl) {
  return true;
}
</textarea></label>
      <button class="primary" id="btnFeat" style="margin-top:10px">Check spec + test</button>
      <div class="feedback" id="featFb"></div>
    </div>
  </section>
  <section>
    <div class="kh"><span class="num">3</span><h2>Checkpoint</h2></div>
    <div id="quizRoot"></div>
    <div id="reqList"></div>
  </section>""",
    """<script src="practice-kit.js"></script>
""" + quiz_scripts(7, "Continue to Module 8") + """
<script>
document.getElementById("btnFeat").onclick = function () {
  const spec = document.getElementById("featSpec").value;
  const specOk = spec.trim().length >= 80 && /filter_open/i.test(spec) && /open/i.test(spec);
  const out = PracticeKit.gradeTesting({
    functionName: "test_filter_open",
    goodImpl: "function(rows){return rows.filter(r=>r.status==='open');}",
    badImpl: "function(rows){return rows;}",
    bugHint: "Bad impl returns every row. Your test must fail that.",
  }, document.getElementById("featTest").value);
  const ok = specOk && out.passed;
  const fb = document.getElementById("featFb");
  fb.className = "feedback " + (ok ? "ok" : "bad");
  fb.innerHTML = (specOk ? "✓ spec" : "✗ spec needs filter_open, open, and 80+ characters") + "<br>" +
    out.results.map(function (r) { return (r.pass ? "✓ " : "✗ ") + r.name; }).join("<br>");
  if (ok) CourseProgress.setSection(7, "featureSpecExercise", true);
  syncNext();
};
</script>""",
    scoreboard("module-08.html", "Complete the exercise and quiz (80%+) to continue"),
)

write(
    "module-08.html",
    "Module 8 — Python for scripts",
    "Module 8",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Module 8 · ~55 min</span>
    <h1 class="serif">Python for scripts</h1>
    <p class="sub">Enough Python to drive Cursor on <code>.py</code> files: functions, JSON, a small CLI. Not RAG. Not agents. That is <b>AI Engineering</b>.</p>
  </header>
  <section>
    <div class="kh"><span class="num">1</span><h2>The shape</h2></div>
    <pre>import json

def keep_open(rows):
    return [r for r in rows if r.get("status") == "open"]

if __name__ == "__main__":
    data = json.loads(open("incidents.json", encoding="utf-8").read())
    print(len(keep_open(data)))</pre>
    <p>In the browser we grade the function with Pyodide — the same idea as the JavaScript library.</p>
  </section>
  <section>
    <div class="kh"><span class="num">2</span><h2>Graded: transform a JSON list</h2></div>
    <p>Write <code>keep_open(rows)</code> that returns only dicts whose <code>status</code> is <code>"open"</code>.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise · pythonScriptExercise</div>
      <textarea id="pyEx" spellcheck="false">def keep_open(rows):
    return rows
</textarea>
      <button class="primary" id="btnPy" style="margin-top:10px">Run in Pyodide</button>
      <div class="feedback" id="pyFb"></div>
    </div>
    <p class="mut" style="margin-top:12px"><a href="practice-python.html">Python practice library</a></p>
  </section>
  <section>
    <div class="kh"><span class="num">3</span><h2>Checkpoint</h2></div>
    <div id="quizRoot"></div>
    <div id="reqList"></div>
  </section>""",
    """<script src="pyodide-sandbox-runner.js"></script>
<script src="practice-kit.js"></script>
""" + quiz_scripts(8, "Continue toward the capstone") + """
<script>
document.getElementById("btnPy").onclick = function () {
  const fb = document.getElementById("pyFb");
  fb.className = "feedback";
  fb.textContent = "Loading Python sandbox…";
  PracticeKit.gradePython({
    functionName: "keep_open",
    testCases: [
      { name: "filters", args: [[{"status": "open"}, {"status": "closed"}]], expected: [{"status": "open"}] },
      { name: "empty", args: [[]], expected: [] },
    ],
  }, document.getElementById("pyEx").value, function (out) {
    fb.className = "feedback " + (out.passed ? "ok" : "bad");
    fb.innerHTML = (out.results || []).map(function (r) { return (r.pass ? "✓ " : "✗ ") + r.name + (r.pass ? "" : " — " + (r.hint || "")); }).join("<br>");
    if (out.passed) CourseProgress.setSection(8, "pythonScriptExercise", true);
    syncNext();
  });
};
</script>""",
    scoreboard("module-09.html", "Complete the exercise and quiz (80%+) to continue"),
)

write(
    "module-09.html",
    "Module 9 — Capstone: ship a real app",
    "Module 9",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Module 9 · capstone</span>
    <h1 class="serif">Ship a real app</h1>
    <p class="sub">One product: a small web app (JavaScript) plus an optional Python helper. Tests, a GitHub repo, and a live <code>https</code> URL. Rubric: spec, review notes, tests that fail on a broken change, deploy, write-up.</p>
    <div id="capGate" class="honestnote"></div>
    <div class="statusrow">
      <span class="pill" id="stM8">Module 8</span>
      <span class="pill" id="stPr">Practice bar</span>
      <span class="pill" id="stLabs">Desktop Labs</span>
    </div>
  </header>
  <section>
    <div class="kh"><span class="num">1</span><h2>Pick a brief</h2></div>
    <p>Use project 1 (Northline Landing) or project 2 (Shift Board) on <a href="projects.html">Projects</a>. Same rubric either way. Optional Python helper can live in the same repo.</p>
  </section>
  <section>
    <div class="kh"><span class="num">2</span><h2>Evidence on this page</h2></div>
    <p>When the gate is open, complete the project card (live URL, GitHub, ≥80-character write-up, rubric scores above zero). That is the capstone completion — there is no fake “Cursor finished it” button.</p>
    <p><a href="deploy-guide.html">Deploy guide</a> · <a href="portfolio.html">Portfolio</a> · <a href="final-assessment.html">Final assessment</a> (after you ship)</p>
  </section>""",
    """<script>
(function () {
  const m8 = CourseProgress.isModuleComplete(8);
  const pr = CourseProgress.capstonePracticeStatus();
  const labs = CourseProgress.desktopLabReady();
  const ready = CourseProgress.isUnlocked(9);
  function pill(id, ok, label) {
    const el = document.getElementById(id);
    el.textContent = label;
    el.className = "pill" + (ok ? " done" : "");
  }
  pill("stM8", m8, m8 ? "Module 8 complete" : "Module 8 incomplete");
  pill("stPr", pr.ready, pr.ready ? "Practice bar met" : "Practice: need 3+ in two of HTML/CSS/JS (now " + pr.html + "/" + pr.css + "/" + pr.js + ")");
  pill("stLabs", labs, labs ? "Both Desktop Labs done" : "Desktop Labs missing");
  const gate = document.getElementById("capGate");
  if (ready) {
    gate.className = "disclosure";
    gate.innerHTML = "<b>Unlocked.</b> Submit evidence on Projects (1 or 2). In-browser simulations still do not count as the live URL.";
  } else {
    document.body.classList.add("capstone-locked");
    gate.innerHTML = "<b>Locked.</b> Finish Module 8, pass 3+ tasks in any two of the HTML / CSS / JS libraries, and complete both Desktop Labs. This page stays visible so you can see the bar — it is not a skip.";
  }
})();
</script>""",
)

print("modules 4-9 done")
