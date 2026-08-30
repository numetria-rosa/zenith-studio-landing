"""Projects, portfolio, career, deploy, cheatsheets, final assessment."""
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

NAV = '<a href="dashboard.html">&larr; Dashboard</a>'

write(
    "projects.html",
    "Projects — AI-Assisted Software Engineering",
    "Projects",
    NAV + '<a href="portfolio.html">Portfolio</a><a href="deploy-guide.html">Deploy</a>',
    """  <header class="hero">
    <span class="eyebrow">Evidence</span>
    <h1 class="serif">Projects</h1>
    <p class="sub">Capstone briefs are 1 and 2 (need Module 9 unlocked). Portfolio briefs 3–8 can be submitted anytime. Completion requires a real https URL (GitHub repo or live site), ≥80-character write-up, and every rubric line scored above 0.</p>
  </header>
  <div id="projList"></div>""",
    """<script>
function render() {
  const root = document.getElementById("projList");
  root.innerHTML = "";
  CourseProgress.PROJECTS.forEach(function (p) {
    const rec = CourseProgress.getProject(p.id);
    const locked = p.modules.indexOf(9) !== -1 && !CourseProgress.isUnlocked(9);
    const card = document.createElement("div");
    card.className = "projcard";
    const rubric = CourseProgress.rubricForProject(p.id);
    let form = "";
    if (!locked) {
      form = '<div class="formrow"><label>GitHub or live https URL</label><input type="url" class="purl" value="' + CourseProgress.escapeHtml(rec.githubUrl || "") + '"></div>' +
        '<div class="formrow"><label>Write-up</label><textarea class="pdesc">' + CourseProgress.escapeHtml(rec.description || "") + "</textarea></div>";
      rubric.forEach(function (r) {
        form += '<div class="formrow"><label>' + r.label + " (" + r.weight + "%)</label><input type='text' class='prub' data-key='" + r.key + "' value='" + (rec.rubricScores[r.key] || "") + "' placeholder='1–5'></div>";
      });
      form += '<button class="primary psave" style="margin-top:10px">Save / complete if valid</button><div class="feedback pfb"></div>';
    } else {
      form = '<p class="mut">Locked until the capstone gate opens (Module 8, practice bar, both Desktop Labs).</p>';
    }
    card.innerHTML = "<div class='modtitle'>" + CourseProgress.escapeHtml(p.title) + (rec.completed ? " · done" : "") + "</div>" +
      "<div class='moddesc'>" + CourseProgress.escapeHtml(p.summary) + "</div>" +
      "<div class='modmeta'>" + p.difficulty + " · " + p.stageLabel + "</div>" + form;
    if (!locked) {
      card.querySelector(".psave").onclick = function () {
        const url = card.querySelector(".purl").value;
        const safe = CourseProgress.safeHttpUrl(url);
        const desc = card.querySelector(".pdesc").value.trim();
        const scores = {};
        let rubOk = true;
        card.querySelectorAll(".prub").forEach(function (inp) {
          const n = Number(inp.value);
          scores[inp.getAttribute("data-key")] = n;
          if (!(n > 0)) rubOk = false;
        });
        const fb = card.querySelector(".pfb");
        if (!safe || !/^https:/i.test(safe)) {
          fb.className = "feedback bad"; fb.textContent = "Need a real https URL."; return;
        }
        if (desc.length < 80) { fb.className = "feedback bad"; fb.textContent = "Write-up must be at least 80 characters."; return; }
        if (!rubOk) { fb.className = "feedback bad"; fb.textContent = "Every rubric line needs a score above 0."; return; }
        CourseProgress.setProject(p.id, { githubUrl: safe, description: desc, rubricScores: scores, completed: true, completedAt: new Date().toISOString() });
        fb.className = "feedback ok"; fb.textContent = "Saved as complete.";
        render();
      };
    }
    root.appendChild(card);
  });
}
render();
</script>""",
)

write(
    "portfolio.html",
    "Portfolio — AI-Assisted Software Engineering",
    "Portfolio",
    NAV + '<a href="projects.html">Projects</a>',
    """  <header class="hero">
    <span class="eyebrow">What you can show</span>
    <h1 class="serif">My portfolio</h1>
    <p class="sub">Only projects you marked complete appear here. A hiring manager needs the URL and the write-up, not a screenshot of a chat.</p>
  </header>
  <div id="portList"></div>""",
    """<script>
const done = CourseProgress.PROJECTS.filter(function (p) { return CourseProgress.getProject(p.id).completed; });
const root = document.getElementById("portList");
if (!done.length) root.innerHTML = "<p class='mut'>Nothing completed yet. Finish a project card first.</p>";
done.forEach(function (p) {
  const rec = CourseProgress.getProject(p.id);
  const d = document.createElement("div");
  d.className = "projcard";
  const href = CourseProgress.safeHttpUrl(rec.githubUrl);
  d.innerHTML = "<div class='modtitle'>" + CourseProgress.escapeHtml(p.title) + "</div>" +
    (href ? '<p><a href="' + href + '" target="_blank" rel="noopener">' + CourseProgress.escapeHtml(href) + "</a></p>" : "") +
    "<p class='mut'>" + CourseProgress.escapeHtml(rec.description || "") + "</p>";
  root.appendChild(d);
});
</script>""",
)

write(
    "deploy-guide.html",
    "Deploy Guide — AI-Assisted Software Engineering",
    "Deploy",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Live https URL</span>
    <h1 class="serif">Deploy guide</h1>
    <p class="sub">The capstone needs a URL someone else can open. GitHub Pages, Cloudflare Pages, Netlify, or Vercel all work for a static HTML/CSS/JS app. We do not host it for you.</p>
  </header>
  <section>
    <div class="kh"><span class="num">1</span><h2>GitHub Pages (simplest for this course)</h2></div>
    <ol>
      <li>Push the site to a public repo. Put <code>index.html</code> at the repo root (or document the <code>/docs</code> folder).</li>
      <li>Repo Settings → Pages → Deploy from branch → <code>main</code>.</li>
      <li>Wait for the green check. Open the <code>https://you.github.io/repo/</code> URL in a private window.</li>
    </ol>
    <div class="honestnote">A repo URL is not a live app URL. The capstone wants a page that renders, plus the repo for the code.</div>
  </section>
  <section>
    <div class="kh"><span class="num">2</span><h2>Before you paste the link</h2></div>
    <ul class="plain">
      <li>Form or buttons do something visible (even if they only validate).</li>
      <li>No secrets in the client. API keys in frontend JS are public.</li>
      <li>README says how to run tests locally.</li>
    </ul>
  </section>""",
    "",
)

write(
    "career.html",
    "Career Path — AI-Assisted Software Engineering",
    "Career",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">Honest non-claims</span>
    <h1 class="serif">Career path</h1>
    <p class="sub">A junior who can specify, review, test, and ship a small web feature with a coding agent. Not a senior engineer. Completing this course does not guarantee a job.</p>
    <div class="honestnote"><b>Follow-on, not a twin.</b> If you later want to build LLM products (RAG, tools, eval), that is <b>AI Engineering</b> — a different catalog course that assumes programming logic. Do not list both as the same skill.</div>
  </header>
  <section>
    <div class="kh"><span class="num">1</span><h2>What this course can evidence</h2></div>
    <ul class="plain">
      <li>Hand-written HTML/CSS/JS literacy</li>
      <li>Specs and review notes</li>
      <li>GitHub history and a PR</li>
      <li>Tests that fail on a broken change</li>
      <li>A live https URL</li>
      <li>Small Python scripts (not production ML)</li>
    </ul>
  </section>
  <section>
    <div class="kh"><span class="num">2</span><h2>Gaps we will not pretend to fill</h2></div>
    <ul class="plain">
      <li>CS degree-level algorithms and complexity</li>
      <li>Systems design for large distributed systems</li>
      <li>Production incident ownership and on-call process</li>
      <li>Team process at a company (standups, design docs, code owners) beyond what you simulate here</li>
    </ul>
  </section>
  <section>
    <div class="kh"><span class="num">3</span><h2>Titles to research, not promises</h2></div>
    <p>Junior frontend, junior full-stack, implementation engineer, “AI-assisted” internships that still expect you to own Git. Read the posting. If it asks for RAG or eval harnesses, that is the other course.</p>
    <div id="ready" class="overallwrap"></div>
  </section>""",
    """<script>
const ov = CourseProgress.overall();
const labs = CourseProgress.desktopLabReady();
const pr = CourseProgress.capstonePracticeStatus();
const shipped = CourseProgress.PROJECTS.filter(function (p) { return CourseProgress.getProject(p.id).completed; }).length;
document.getElementById("ready").innerHTML =
  "<p>Modules complete: " + ov.completed + "/" + ov.total + "</p>" +
  "<p>Desktop labs: " + (labs ? "both submitted" : "not both submitted") + "</p>" +
  "<p>Practice bar (3+ in two of HTML/CSS/JS): " + (pr.ready ? "met" : "not met") + "</p>" +
  "<p>Completed project cards: " + shipped + "</p>" +
  "<p class='assume'>These numbers are course evidence, not an employment probability.</p>";
</script>""",
)

write(
    "cheatsheets.html",
    "Cheat sheets — AI-Assisted Software Engineering",
    "Cheat sheets",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">One page</span>
    <h1 class="serif">Cheat sheets</h1>
  </header>
  <section>
    <div class="kh"><span class="num">01</span><h2>HTML</h2></div>
    <p><code>&lt;main&gt;</code> once. One <code>h1</code>. Every input has a <code>&lt;label&gt;</code>. Links name the destination.</p>
  </section>
  <section>
    <div class="kh"><span class="num">02</span><h2>CSS</h2></div>
    <p>Padding inside, margin outside. Flex on the parent. One breakpoint you can defend.</p>
  </section>
  <section>
    <div class="kh"><span class="num">03</span><h2>JavaScript</h2></div>
    <p>Name the function. Return a value. Tests call it. <code>querySelector</code> + <code>addEventListener</code> for the DOM.</p>
  </section>
  <section>
    <div class="kh"><span class="num">04</span><h2>Specs</h2></div>
    <p>Given / When / Then. Name files. Name the failing check. Say no to unbounded prompts.</p>
  </section>
  <section>
    <div class="kh"><span class="num">05</span><h2>Git</h2></div>
    <p>One idea per commit. Branch off main. PR is the review unit. Minus is deletion.</p>
  </section>
  <section>
    <div class="kh"><span class="num">06</span><h2>Tests</h2></div>
    <p>Must be able to fail. Mutation mindset: plant a bug, watch the test go red.</p>
  </section>
  <section>
    <div class="kh"><span class="num">07</span><h2>Python scripts</h2></div>
    <p><code>def</code>, <code>json.loads</code> / <code>dumps</code>, nonzero exit on bad input. Not RAG.</p>
  </section>""",
    "",
)

write(
    "final-assessment.html",
    "Final assessment — AI-Assisted Software Engineering",
    "Final",
    NAV,
    """  <header class="hero">
    <span class="eyebrow">After the capstone</span>
    <h1 class="serif">Final competency assessment</h1>
    <p class="sub">Ten items drawn from later banks. Passing here is extra evidence. It does not replace the live URL.</p>
    <div id="faGate" class="honestnote"></div>
    <div id="quizRoot"></div>
    <p class="mono" id="scoreDisplay" style="margin-top:16px"></p>
  </header>""",
    """<script src="quiz-data.js"></script>
<script src="module-kit.js"></script>
<script>
const shipped = CourseProgress.PROJECTS.some(function (p) { return p.modules.indexOf(9) !== -1 && CourseProgress.getProject(p.id).completed; });
const gate = document.getElementById("faGate");
if (!shipped) {
  gate.textContent = "Complete project 1 or 2 on Projects (capstone evidence) before this assessment counts as passed.";
} else {
  gate.className = "disclosure";
  gate.textContent = "Capstone project is on file. Draw is 10 items. 80% stores a pass.";
}
const pool = []
  .concat(AISEQuizData.MODULE_QUIZZES[4], AISEQuizData.MODULE_QUIZZES[5], AISEQuizData.MODULE_QUIZZES[6], AISEQuizData.MODULE_QUIZZES[7], AISEQuizData.MODULE_QUIZZES[8], AISEQuizData.CENTER_EXTRA);
function shuffle(a){ const x=a.slice(); for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); const t=x[i]; x[i]=x[j]; x[j]=t;} return x; }
ModuleKit.renderQuiz("final", shuffle(pool).slice(0, 10), function () {
  const m = CourseProgress.getModule("final");
  if (shipped && m.total && m.score / m.total >= 0.8) {
    CourseProgress.setExtra("finalAssessment", { passed: true, score: m.score, total: m.total, at: new Date().toISOString() });
  }
});
</script>""",
)

print("ship pages done")
