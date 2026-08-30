"""Emit module 00–09 and remaining student pages."""
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

def quiz_scripts(mid, next_file, next_label):
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

def scoreboard(next_href, next_label):
    return f'''<div class="scoreboard"><div class="in">
  <span class="sc" id="scoreDisplay">Checkpoint score: —</span>
  <a id="btnNext" href="{next_href}" class="primary nextbtn" style="text-decoration:none">{next_label}</a>
</div></div>'''

# ---- Module 0 ----
write(
    "module-00.html",
    "Module 0 — What this job is",
    "Module 0",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Module 0 · Orientation · ~20 min</span>
    <h1 class="serif">What this job is</h1>
    <p class="sub">AI will write most of the characters. You are paid to specify, reject, test, and ship. Everyone starts at Module 1. Later modules are not shortcuts unless you already write HTML and JavaScript.</p>
    <div class="honestnote"><b>Two different courses.</b> This course: ship and review software <i>with</i> a coding agent (Cursor + GitHub + browser). <a href="../ai-engineering/module-00.html">AI Engineering</a> is a follow-on for people who already have programming logic and want to build LLM products (RAG, tools, eval). Do not take them as the same class.</div>
    <div class="objectives"><div class="lbl">You will be able to</div>
      <ul>
        <li>State the honest outcome of this course in one sentence</li>
        <li>Tell this job apart from AI Engineering</li>
        <li>Accept that in-browser “agent practice” is a labeled simulation</li>
      </ul>
    </div>
  </header>
  <section>
    <div class="kh"><span class="num">1</span><h2>The job, without marketing</h2></div>
    <p>A junior who can specify a small web feature, drive Cursor, read the diff, write and run tests, open a GitHub PR, and deploy a live URL. Not a senior. No job guarantee.</p>
    <div class="def"><div class="k">You are accountable</div><p>If the agent invents an API, ships a test that only asserts <code>true === true</code>, or “fixes” a flake with a five-second sleep, the person who opened the PR is you.</p></div>
  </section>
  <section>
    <div class="kh"><span class="num">2</span><h2>Placement self-check</h2></div>
    <p>Can you already write a function that takes a list of objects and returns the sum of <code>amount</code>? If yes, you still start at Module 1. The HTML and CSS weeks are short if you already know them; skipping them is how people fail the review week.</p>
    <p class="mut">There is no placement exam that jumps you to Module 4. Optional shortcuts later mean “this practice library will feel easy,” not “the gate is off.”</p>
  </section>
  <section>
    <div class="kh"><span class="num">3</span><h2>How grading works</h2></div>
    <p>From Module 2, the next module is locked until the previous checkpoint quiz is at least 80% and the required exercise is done. The capstone also needs practice evidence in two of HTML/CSS/JS and <b>both</b> Desktop Labs (Cursor commit URL + a GitHub repo you own).</p>
    <div class="disclosure"><b>No fake tutor.</b> Recommendations on the roadmap are rule-based from your pass/fail ticks. Nothing here “runs Cursor” in the tab.</div>
  </section>
  <section>
    <div class="kh"><span class="num">4</span><h2>Confirm you read this</h2></div>
    <div class="interactive">
      <div class="ilbl">Required</div>
      <label class="check"><input type="checkbox" id="ackJob"> I understand I am paid to specify, reject, test, and ship — not to paste the first agent draft.</label>
      <label class="check"><input type="checkbox" id="ackSim"> I understand in-browser spec/git/review tasks are labeled simulations and do not unlock the capstone.</label>
      <label class="check"><input type="checkbox" id="ackOther"> I understand this is not the AI Engineering course.</label>
      <button class="primary" id="btnAck" style="margin-top:14px">Mark orientation complete</button>
      <div class="feedback" id="ackFb"></div>
    </div>
    <p style="margin-top:18px"><a class="nextbtn" href="module-01.html" style="display:inline-block;text-decoration:none">Start Module 1</a></p>
  </section>""",
    """<script>
CourseProgress.setExtra("module0", Object.assign({}, CourseProgress.getExtra("module0") || {}, { visited: true }));
document.getElementById("btnAck").onclick = function () {
  const ok = document.getElementById("ackJob").checked && document.getElementById("ackSim").checked && document.getElementById("ackOther").checked;
  const fb = document.getElementById("ackFb");
  if (!ok) { fb.className = "feedback bad"; fb.textContent = "Check all three. This is the honesty bar, not a skip button."; return; }
  CourseProgress.setExtra("module0", { visited: true, completed: true, completedAt: new Date().toISOString() });
  fb.className = "feedback ok";
  fb.textContent = "Orientation noted. Module 1 is unlocked for everyone.";
};
</script>""",
)

# ---- Module 1 ----
write(
    "module-01.html",
    "Module 1 — How software works + HTML",
    "Module 1",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Module 1 · ~50 min</span>
    <h1 class="serif">How software works + HTML</h1>
    <p class="sub">A site is files in folders. The browser requests a URL, gets HTML, builds a tree, then paints. If the tree is wrong, CSS and JavaScript cannot save the meaning.</p>
    <div class="objectives"><div class="lbl">You will be able to</div>
      <ul>
        <li>Name file, folder, URL, and 404 without hand-waving</li>
        <li>Write semantic landmarks: header, nav, main, footer</li>
        <li>Build a real page structure from a brief</li>
      </ul>
    </div>
  </header>
  <section>
    <div class="kh"><span class="num">1</span><h2>The path to a pixel</h2></div>
    <p>You save <code>index.html</code> in a folder. A server (or a local preview) maps a URL to that file. The browser parses tags into a document. A missing file is a 404. A JS error is a console message — different layer.</p>
    <pre>&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;&lt;meta charset="UTF-8"&gt;&lt;title&gt;Northline&lt;/title&gt;&lt;/head&gt;
&lt;body&gt;
  &lt;header&gt;&lt;p&gt;Northline Clinic&lt;/p&gt;&lt;/header&gt;
  &lt;nav&gt;&lt;a href="#hours"&gt;Hours&lt;/a&gt;&lt;/nav&gt;
  &lt;main&gt;&lt;h1&gt;Same-week appointments&lt;/h1&gt;&lt;/main&gt;
  &lt;footer&gt;&lt;p&gt;Fictional clinic for class.&lt;/p&gt;&lt;/footer&gt;
&lt;/body&gt;
&lt;/html&gt;</pre>
  </section>
  <section>
    <div class="kh"><span class="num">2</span><h2>Semantic, not div soup</h2></div>
    <p>Use <code>&lt;h1&gt;</code> once for the page title. Put unique content in <code>&lt;main&gt;</code>. Give every form control a <code>&lt;label&gt;</code>. A <code>&lt;div&gt;</code> is a box with no meaning — fine for layout, wrong as your only structure.</p>
  </section>
  <section>
    <div class="kh"><span class="num">3</span><h2>Graded: page from a brief</h2></div>
    <p>Northline Clinic needs a one-page skeleton: a header with the clinic name, a nav with links to Hours and Contact, a main with an <code>h1</code> that includes the word “Northline”, and a footer.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise · htmlPageExercise</div>
      <textarea id="htmlEx" spellcheck="false" style="min-height:200px">&lt;!-- Write a full HTML document --&gt;
</textarea>
      <button class="primary" id="btnHtml" style="margin-top:10px">Check structure</button>
      <div class="feedback" id="htmlFb"></div>
    </div>
    <p class="mut" style="margin-top:12px">More reps: <a href="practice-html.html">HTML practice library</a>.</p>
  </section>
  <section>
    <div class="kh"><span class="num">4</span><h2>Checkpoint</h2></div>
    <div id="quizRoot"></div>
    <div id="reqList"></div>
  </section>""",
    """<script src="practice-kit.js"></script>
""" + quiz_scripts(1, "module-02.html", "Continue to Module 2") + """
<script>
document.getElementById("btnHtml").onclick = function () {
  const html = document.getElementById("htmlEx").value;
  const doc = PracticeKit.parseHtml(html);
  const checks = [
    { name: "has header", pass: !!doc.querySelector("header") },
    { name: "has nav", pass: !!doc.querySelector("nav") },
    { name: "nav has 2+ links", pass: doc.querySelectorAll("nav a").length >= 2 },
    { name: "has main", pass: !!doc.querySelector("main") },
    { name: "h1 mentions Northline", pass: !!(doc.querySelector("h1") && /northline/i.test(doc.querySelector("h1").textContent)) },
    { name: "has footer", pass: !!doc.querySelector("footer") },
  ];
  const ok = checks.every(function (c) { return c.pass; });
  const fb = document.getElementById("htmlFb");
  fb.className = "feedback " + (ok ? "ok" : "bad");
  fb.innerHTML = checks.map(function (c) { return (c.pass ? "✓ " : "✗ ") + c.name; }).join("<br>");
  if (ok) CourseProgress.setSection(1, "htmlPageExercise", true);
  syncNext();
};
</script>""",
    scoreboard("module-02.html", "Complete the exercise and quiz (80%+) to continue"),
)

# ---- Module 2 ----
write(
    "module-02.html",
    "Module 2 — CSS: layout, not decoration",
    "Module 2",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Module 2 · ~50 min</span>
    <h1 class="serif">CSS: layout, not decoration</h1>
    <p class="sub">Pretty is optional. Spacing, hierarchy, and one responsive rule are not. The agent loves gradients. You are paid for the spec.</p>
    <div class="objectives"><div class="lbl">You will be able to</div>
      <ul>
        <li>Explain margin vs padding on a box</li>
        <li>Use flexbox for a simple row or column</li>
        <li>Write one media query that changes the layout</li>
      </ul>
    </div>
  </header>
  <section>
    <div class="kh"><span class="num">1</span><h2>The box model</h2></div>
    <p>Every element is a box: content, padding, border, margin. <code>gap</code> on a flex parent is the modern way to space children without fighting margins.</p>
    <pre>#card { max-width: 640px; padding: 24px; }
#row { display: flex; gap: 24px; }
@media (max-width: 640px) { #row { flex-direction: column; } }</pre>
  </section>
  <section>
    <div class="kh"><span class="num">2</span><h2>Graded: match the spec</h2></div>
    <p>The fixture is a <code>#card</code> with a <code>#row</code> of two children. Your CSS must: give <code>#card</code> padding of 24px, make <code>#row</code> a flex row with 24px gap, and at max-width 640px stack <code>#row</code> as a column.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise · cssLayoutExercise</div>
      <textarea id="cssEx" spellcheck="false">/* #card, #row */</textarea>
      <button class="primary" id="btnCss" style="margin-top:10px">Check CSS</button>
      <div class="feedback" id="cssFb"></div>
    </div>
    <p class="mut" style="margin-top:12px"><a href="practice-css.html">CSS practice library</a></p>
  </section>
  <section>
    <div class="kh"><span class="num">3</span><h2>Checkpoint</h2></div>
    <div id="quizRoot"></div>
    <div id="reqList"></div>
  </section>""",
    """<script src="practice-kit.js"></script>
""" + quiz_scripts(2, "module-03.html", "Continue to Module 3") + """
<script>
document.getElementById("btnCss").onclick = function () {
  const css = document.getElementById("cssEx").value;
  const task = {
    fixtureHtml: '<div id="card"><div id="row"><div>A</div><div>B</div></div></div>',
    checks: [
      { name: "card padding 24px", test: function (host) {
        const el = host.querySelector("#card");
        return el && getComputedStyle(el).paddingTop === "24px";
      }},
      { name: "row is flex", test: function (host) {
        return getComputedStyle(host.querySelector("#row")).display === "flex";
      }},
      { name: "row gap 24px", test: function (host) {
        const g = getComputedStyle(host.querySelector("#row")).gap;
        return g === "24px" || g === "24px 24px";
      }},
      { name: "has a 640px media query", test: function (host, src) {
        return /@media[^{]*640px/.test(src) && /flex-direction\\s*:\\s*column/.test(src);
      }},
    ],
  };
  const out = PracticeKit.gradeCss(task, css);
  const fb = document.getElementById("cssFb");
  fb.className = "feedback " + (out.passed ? "ok" : "bad");
  fb.innerHTML = out.results.map(function (r) { return (r.pass ? "✓ " : "✗ ") + r.name; }).join("<br>");
  if (out.passed) CourseProgress.setSection(2, "cssLayoutExercise", true);
  syncNext();
};
</script>""",
    scoreboard("module-03.html", "Complete the exercise and quiz (80%+) to continue"),
)

# ---- Module 3 ----
write(
    "module-03.html",
    "Module 3 — JavaScript you can read",
    "Module 3",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Module 3 · ~60 min · literacy gate</span>
    <h1 class="serif">JavaScript you can read</h1>
    <p class="sub">If you cannot write a ten-line function, you cannot tell when the agent invented <code>orders.totalize()</code>. Cursor comes after this module, not instead of it.</p>
    <div class="objectives"><div class="lbl">You will be able to</div>
      <ul>
        <li>Write a named function with arguments and a return value</li>
        <li>Loop an array and build a new one</li>
        <li>Attach a click handler with querySelector</li>
      </ul>
    </div>
  </header>
  <section>
    <div class="kh"><span class="num">1</span><h2>The units you will see in agent output</h2></div>
    <pre>function total_revenue(orders) {
  let sum = 0;
  for (const row of orders) sum += row.amount;
  return sum;
}
document.querySelector("#save").addEventListener("click", function () {
  // read inputs, call a function, write to the page
});</pre>
    <p>Prefer <code>const</code> and <code>let</code>. Return a value the test can see. Side effects (the DOM) belong in a thin handler, not buried inside math.</p>
  </section>
  <section>
    <div class="kh"><span class="num">2</span><h2>Graded: write the functions</h2></div>
    <p>Implement <code>total_revenue(orders)</code> (sum <code>amount</code>, empty is 0) and <code>pluck_names(rows)</code> (array of <code>name</code>).</p>
    <div class="interactive">
      <div class="ilbl">Required exercise · jsFunctionExercise</div>
      <textarea id="jsEx" spellcheck="false" style="min-height:160px">function total_revenue(orders) {
  return 0;
}
function pluck_names(rows) {
  return [];
}
</textarea>
      <button class="primary" id="btnJs" style="margin-top:10px">Run tests</button>
      <div class="feedback" id="jsFb"></div>
    </div>
    <p class="mut" style="margin-top:12px"><a href="practice-js.html">JavaScript practice library</a> — largest library. This is the literacy gate.</p>
  </section>
  <section>
    <div class="kh"><span class="num">3</span><h2>Checkpoint</h2></div>
    <div id="quizRoot"></div>
    <div id="reqList"></div>
  </section>""",
    """<script src="practice-kit.js"></script>
""" + quiz_scripts(3, "module-04.html", "Continue to Module 4") + """
<script>
document.getElementById("btnJs").onclick = function () {
  const src = document.getElementById("jsEx").value;
  const a = PracticeKit.gradeJs({
    functionName: "total_revenue",
    testCases: [
      { name: "two", args: [[{ amount: 10 }, { amount: 2.5 }]], expected: 12.5 },
      { name: "empty", args: [[]], expected: 0 },
    ],
  }, src);
  const b = PracticeKit.gradeJs({
    functionName: "pluck_names",
    testCases: [{ name: "two", args: [[{ name: "A" }, { name: "B" }]], expected: ["A", "B"] }],
  }, src);
  const results = a.results.concat(b.results);
  const ok = a.passed && b.passed;
  const fb = document.getElementById("jsFb");
  fb.className = "feedback " + (ok ? "ok" : "bad");
  fb.innerHTML = results.map(function (r) { return (r.pass ? "✓ " : "✗ ") + r.hint; }).join("<br>");
  if (ok) CourseProgress.setSection(3, "jsFunctionExercise", true);
  syncNext();
};
</script>""",
    scoreboard("module-04.html", "Complete the exercise and quiz (80%+) to continue"),
)

print("modules 0-3 done")
