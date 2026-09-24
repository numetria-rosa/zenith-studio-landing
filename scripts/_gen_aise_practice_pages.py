# -*- coding: utf-8 -*-
"""Regenerate the practice library pages whose grading changed.

The specs, git and review libraries used to be multiple choice and were
labelled "(sim)" for honesty. They now grade real artefacts, so both the copy
and the label have to change. The detective library is new: it is the fourth
pillar of the capstone bar and six module pages already link to it.
"""
import io
import os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "courses", "ai-assisted-software-engineering")

NAV = ('<a href="dashboard.html">&larr; Dashboard</a>'
       '<a href="tickets.html">Ticket board</a>'
       '<a href="syllabus.html">Syllabus</a>'
       '<a href="desktop-labs.html">Desktop Labs</a>')

PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} &mdash; AI-Assisted Software Engineering</title>
<link rel="stylesheet" href="course.css">
</head>
<body>
<div class="bar"><div class="in"><span class="logo">ZENITH<b>LAB</b></span><span class="tag">Practice</span></div></div>
<div class="coursenav"><div class="in">{nav}</div></div>
<div class="wrap">
  <header class="hero">
    <span class="eyebrow">Practice library</span>
    <h1 class="serif">{h1}</h1>
    <p class="sub">{sub}</p>
    <div class="disclosure">{how}</div>
{extra}    <p class="mono" id="skillMeta" style="margin-top:14px;color:var(--mut2)">0 passed</p>
  </header>
  <div id="taskList"></div>
<footer>Zenith Lab &middot; AI-Assisted Software Engineering</footer>
</div>

<script src="course-progress.js"></script>
<script src="practice-progress.js"></script>
<script src="practice-tasks.js"></script>
{deps}<script src="practice-kit.js"></script>
<script>
const TASKS = AISE_TASKS.filter(t => t.tool === "{tool}");
PracticeKit.renderLibrary(TASKS);
</script>
<script src="course-rail.js"></script>
</body>
</html>
"""


def write(name, **kw):
    kw.setdefault("nav", NAV)
    kw.setdefault("extra", "")
    kw.setdefault("deps", "")
    path = os.path.join(OUT, name)
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(PAGE.format(**kw))
    print("wrote", path)


write("practice-detective.html",
      title="AI Code Detective", tool="detective",
      h1="AI Code Detective",
      sub="Eight cases of plausible AI-generated code. Find the real defects, spare the innocent lines, then prove the fix.",
      how=("Two phases per case. First the <b>charge sheet</b>: select every real defect and nothing else. "
           "Selecting everything fails, because a reviewer who rejects all eleven hunks is as useless as one "
           "who approves all eleven. Then the <b>proof</b>: fix the code so hidden tests pass. Spotting a bug "
           "and being able to prove you fixed it are different skills, and only the second one ships."),
      extra=('    <div class="objectives"><div class="lbl">Why the decoys are there</div>\n'
             "      <ul>\n"
             "        <li>Every case includes lines that look suspicious and are fine &mdash; a style preference, "
             "a naming quibble, a performance worry that does not apply at this scale</li>\n"
             "        <li>Charging them costs you the case, because in a real review three genuine findings mixed "
             "with four preferences get discounted as a whole</li>\n"
             "        <li>Reading the explanation on a decoy you charged is the most useful thing on this page</li>\n"
             "      </ul>\n"
             "    </div>\n"
             '    <div class="disclosure">Three passed cases count toward the capstone bar, alongside HTML, '
             "CSS and JavaScript.</div>\n"),
      deps='<script src="detective-kit.js"></script>\n')

write("practice-specs.html",
      title="Specs Practice", tool="specs",
      h1="Specs Practice",
      sub="Ten tasks where you write the requirements yourself. No options to pick from.",
      how=("You write the user story, the acceptance criteria, the edge cases, the constraints or the full "
           "request. The grader cannot judge whether your requirements are <i>good</i> &mdash; no automated check "
           "can &mdash; but it refuses the shapes that are definitely not requirements: no testable condition, "
           "no concrete value, no failure case, vibe words instead of behaviour. That is the same first pass a "
           "human reviewer makes."))

write("practice-git.html",
      title="Git Practice", tool="git",
      h1="Git Practice",
      sub="Ten tasks where you write the actual command. Recognising <code>git switch -c</code> in a list is not the same as producing it when you need it.",
      how=("You type the command or sequence a situation calls for, and the grader checks it would do the job "
           "&mdash; including the parts that matter for safety, like staging named files instead of everything, "
           "and reverting rather than force-pushing over history other people already have."),
      extra=('    <div class="disclosure">This page checks that you can write the commands. It does not run them. '
             'The real repository work is <a href="desktop-labs.html">Desktop Lab B</a>, which needs a GitHub URL '
             "from a repo you own.</div>\n"))

write("practice-review.html",
      title="Review Practice", tool="review",
      h1="Review Practice",
      sub="Six AI-authored pull requests. Accept or reject every hunk, and say why.",
      how=("Each rejection needs a reason that names the mechanism and its consequence &mdash; \u201cthis looks "
           "wrong\u201d is not review feedback. Accepting a regression fails the task, and so does rejecting "
           "everything. Read the deletions especially carefully: agents remove code they judge redundant, and a "
           "deleted guard clause is one quiet red line in a diff of forty green ones."))

write("practice-integrated.html",
      title="Integrated Challenges", tool="integrated",
      h1="Integrated Challenges",
      sub="Six tasks that need more than one skill at once, in the shapes real tickets arrive in.",
      how=("A mix of graded kinds: write the logic, write the test that catches an off-by-one, build markup a "
           "screen reader can use, and write the request you would actually send to an agent. Nothing here is "
           "multiple choice."))
