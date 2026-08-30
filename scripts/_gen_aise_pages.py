from pathlib import Path
ROOT = Path(r"d:\zenith-studio\courses\ai-assisted-software-engineering")

SHELL = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<link rel="stylesheet" href="course.css">
</head>
<body>
<div class="bar"><div class="in"><span class="logo">ZENITH<b>LAB</b></span><span class="tag">AI-Assisted Software Engineering</span></div></div>
<div class="coursenav"><div class="in">{nav}</div></div>
<div class="wrap">
{body}
<footer>Zenith Lab · AI-Assisted Software Engineering</footer>
</div>
{scripts}
</body>
</html>
'''

def write(name, title, nav, body, scripts):
    (ROOT / name).write_text(SHELL.format(title=title, nav=nav, body=body, scripts=scripts), encoding="utf-8")
    print("wrote", name)

libs = [
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
sim = {"specs", "git", "review"}
for fname, title, tool, blurb in libs:
    note = '<div class="honestnote"><b>Simulation.</b> ' + blurb + ' These tasks do not unlock the capstone by themselves. Capstone needs 3+ passed tasks in two of HTML/CSS/JS plus both Desktop Labs.</div>' if tool in sim else '<div class="disclosure">' + blurb + '</div>'
    extra = ""
    if tool == "python":
        extra = '<script src="pyodide-sandbox-runner.js"></script>\n'
    body = f'''  <header class="hero">
    <span class="eyebrow">Practice library</span>
    <h1 class="serif">{title}</h1>
    <p class="sub">{blurb}</p>
    {note}
    <p class="mono" id="skillMeta" style="margin-top:14px;color:var(--mut2)">0 passed</p>
  </header>
  <div id="taskList"></div>'''
    scripts = f'''<script src="course-progress.js"></script>
<script src="practice-progress.js"></script>
<script src="practice-tasks.js"></script>
<script src="practice-kit.js"></script>
{extra}<script>
const TASKS = AISE_TASKS.filter(t => t.tool === "{tool}");
PracticeKit.renderLibrary(TASKS);
</script>
<script src="course-rail.js"></script>'''
    write(fname, title + ", AI-Assisted Software Engineering",
          '<a href="dashboard.html">&larr; Dashboard</a><a href="desktop-labs.html">Desktop Labs</a>',
          body, scripts)

print("practice pages done")
