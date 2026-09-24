# -*- coding: utf-8 -*-
"""Course-wide system pages for AI-Assisted Software Engineering.

These are the thirteen pages that are not modules and not practice libraries:
dashboard, syllabus, roadmap, mastery, diagnostic, quiz centre, desktop labs,
projects, portfolio, career, cheat sheets, deploy guide, final assessment.

Every one of them previously hard-coded the old nine-module curriculum, so a
restructure left them quietly lying to the student: a syllabus listing modules
that no longer exist, a capstone gate checking module 9 when the capstone is
module 13. The rule here is that nothing about the curriculum is written into
these pages as prose. Stages, modules, tickets, loop steps, section
requirements, practice counts and gate rules are all read at runtime from
course-progress.js and skill-map.js, which are themselves generated. A page
can be wrong about tone; it can no longer be wrong about facts.

Replaces the page-emitting halves of _gen_aise_site.py, _gen_aise_rest.py and
_gen_aise_ship.py, all of which targeted the nine-module layout.
"""
import io
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..",
                   "courses", "ai-assisted-software-engineering")

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} \u2014 AI-Assisted Software Engineering</title>
<link rel="stylesheet" href="course.css">
</head>
<body>
<div class="bar"><div class="in"><span class="logo">ZENITH<b>LAB</b></span><span class="tag">{tag}</span></div></div>
<div class="coursenav"><div class="in">{nav}</div></div>
<div class="wrap">
  <header class="hero">
    <span class="eyebrow">{eyebrow}</span>
    <h1 class="serif">{h1}</h1>
    <p class="sub">{sub}</p>
{herox}  </header>
"""

FOOT = """  <footer>Zenith Lab &middot; AI-Assisted Software Engineering</footer>
</div>
{scripts}
<script src="course-rail.js"></script>
</body>
</html>
"""

NAV = ('<a href="dashboard.html">&larr; Dashboard</a>'
       '<a href="tickets.html">Ticket board</a>'
       '<a href="syllabus.html">Syllabus</a>'
       '<a href="cheatsheets.html">Cheat sheets</a>'
       '<a href="desktop-labs.html">Desktop Labs</a>')


def page(fname, title, tag, eyebrow, h1, sub, body, scripts,
         nav=NAV, herox=""):
    text = HEAD.format(title=title, tag=tag, nav=nav, eyebrow=eyebrow, h1=h1,
                       sub=sub, herox=herox) + body + FOOT.format(scripts=scripts)
    path = os.path.join(OUT, fname)
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("wrote %s (%d lines)" % (fname, text.count("\n") + 1))


def js(*srcs):
    return "\n".join('<script src="%s"></script>' % s for s in srcs)


def inline(code):
    return "<script>\n" + code + "\n</script>"


def section(num, heading, html):
    return ('  <section>\n    <div class="kh"><span class="num">%s</span><h2>%s</h2></div>\n%s\n  </section>\n'
            % (num, heading, html))


def note(html):
    return '    <div class="disclosure">%s</div>\n' % html


def honest(html):
    return '    <div class="honestnote">%s</div>\n' % html


# --------------------------------------------------------------- shared JS
# Rendered on several pages, so it lives once. Reads the gate rules rather
# than restating them, which is what kept drifting before.
GATE_JS = """
function gateRows(hostId) {
  const host = document.getElementById(hostId);
  if (!host) return;
  const ps = CourseProgress.capstonePracticeStatus();
  const labs = CourseProgress.desktopLabReady();
  const prev = CourseProgress.isModuleComplete(CourseProgress.CAPSTONE_ID - 1);
  const need = ps.needPerTool;
  const pillars = [["html", "HTML"], ["css", "CSS"], ["js", "JavaScript"], ["det", "Detective"]];
  const rows = [
    ["Module " + (CourseProgress.CAPSTONE_ID - 1) + " finished", prev,
     "quiz at " + Math.round(CourseProgress.PASS_THRESHOLD * 100) + "% and its exercise passed"],
    [need + "+ passed tasks in " + ps.toolsNeeded + " of these 4 libraries", ps.ready,
     pillars.map(function (p) {
       return p[1] + " " + ps[p[0]] + (ps[p[0]] >= need ? " \\u2713" : " of " + need);
     }).join(" \\u00b7 ")],
    ["Both Desktop Labs confirmed", labs, "the real Cursor session and the real GitHub repo"],
  ];
  host.innerHTML = rows.map(function (r) {
    return '<div class="gaterow"><span class="' + (r[1] ? "gok" : "gno") + '">' +
      (r[1] ? "\\u2713" : "\\u25cb") + "</span><span><b>" + r[0] + "</b> &mdash; " +
      CourseProgress.escapeHtml(r[2]) + "</span></div>";
  }).join("");
}
"""


# ============================================================== dashboard
DASH_BODY = """  <div class="overallwrap">
    <div class="overallrow"><span class="ov-lbl">Course progress</span><span class="ov-val" id="ovVal">&mdash;</span></div>
    <div class="overallbar"><div class="fill" id="ovFill"></div></div>
    <div class="nextaction" id="nextAction"></div>
    <p class="mut" style="margin-top:14px;font-size:12.5px">Progress is stored in this browser and syncs to your account when you are signed in. <a href="#" id="resetLink">Reset progress in this browser</a>.</p>
  </div>

  <div id="loopStripAll" style="margin-top:30px"></div>

  <section>
    <div class="kh"><span class="num">01</span><h2>The work</h2></div>
    <p class="mut">Thirteen tickets from Northline Digital, grouped into six stages. Each one unlocks when the previous module's checkpoint and exercise are done, because the next ticket assumes the last one.</p>
    <div id="stageList"></div>
  </section>

  <section>
    <div class="kh"><span class="num">02</span><h2>The capstone gate</h2></div>
    <p class="mut">The final module does not open on time served. These three things are checked:</p>
    <div id="gateRows" style="margin-top:12px"></div>
  </section>

  <section>
    <div class="kh"><span class="num">03</span><h2>Practice libraries</h2></div>
    <p class="mut">Reps, graded. Nothing in here is multiple choice: you write markup, CSS, functions, tests, requirements, Git commands, review notes, or a fix that has to pass hidden tests.</p>
    <div class="sysgrid" id="libGrid"></div>
  </section>

  <section>
    <div class="kh"><span class="num">04</span><h2>Everything else</h2></div>
    <div class="sysgrid" id="sysGrid"></div>
  </section>
"""

DASH_JS = GATE_JS + """
const SYS = [
  /* Orientation is not in MODULES because it is not graded, which previously
     left it reachable only from the side rail. It is still the page that
     explains the loop, so it belongs where a new student will look. */
  ["module-00.html", "Orientation", "Start here: what this course is"],
  ["tickets.html", "Ticket board", "All 13 tickets, in order"],
  ["syllabus.html", "Syllabus", "What each stage covers"],
  ["desktop-labs.html", "Desktop Labs", "Required: real Cursor, real repo"],
  ["learning-roadmap.html", "What next", "Your weakest unfinished task"],
  ["mastery-profile.html", "Mastery profile", "Evidence, by skill"],
  ["diagnostic.html", "Diagnostic", "Five questions, no skipping"],
  ["quiz-center.html", "Quiz centre", "Extra reps on any bank"],
  ["cheatsheets.html", "Cheat sheets", "The syntax you forget"],
  ["projects.html", "Projects", "Capstones and portfolio briefs"],
  ["portfolio.html", "My portfolio", "What you have submitted"],
  ["deploy-guide.html", "Deploy guide", "Get it on a real URL"],
  ["final-assessment.html", "Final assessment", "Ten items, later banks"],
  ["career.html", "Career path", "An honest read on where you are"],
];

const LIB_LABEL = {
  html: "HTML", css: "CSS", js: "JavaScript", specs: "Requirements",
  git: "Git commands", testing: "Tests", review: "PR review",
  detective: "AI Code Detective", python: "Python", integrated: "Whole tickets",
};
const LIB_DESC = {
  html: "Markup checked against a real DOM",
  css: "Computed styles against a spec",
  js: "Functions run against hidden tests",
  specs: "You write the acceptance criteria",
  git: "You write the actual command",
  testing: "Your test must catch a planted bug",
  review: "Verdict plus a reason, hunk by hunk",
  detective: "Find the defect, spare the innocent, prove the fix",
  python: "Graded in the browser via Pyodide",
  integrated: "More than one skill at once",
};

function card(href, title, desc) {
  return '<a class="syscard" href="' + href + '"><div class="systitle">' +
    CourseProgress.escapeHtml(title) + '</div><div class="sysdesc">' +
    CourseProgress.escapeHtml(desc) + "</div></a>";
}

function renderStages() {
  const host = document.getElementById("stageList");
  host.innerHTML = CourseProgress.STAGES.map(function (st) {
    const sp = CourseProgress.stageProgress(st.id);
    const head = '<div class="stagehead"><span class="stagelbl">' + st.label +
      '</span><span class="stagetitle">' + CourseProgress.escapeHtml(st.title) +
      '</span><span class="stagepct">' + sp.completed + " / " + sp.total + "</span></div>";
    const cards = st.modules.map(function (id) {
      const m = CourseProgress.MODULES.filter(function (x) { return x.id === id; })[0];
      if (!m) return "";
      const status = CourseProgress.statusOf(m.id);
      const open = CourseProgress.isUnlocked(m.id);
      const tk = CourseProgress.ticketFor(m.id);
      let meta = "~" + m.minutes + " min";
      if (tk) meta = tk.id + " \\u00b7 " + meta;
      if (!open) {
        meta = m.id === CourseProgress.CAPSTONE_ID
          ? "Locked \\u2014 see the capstone gate below"
          : "Locked \\u2014 finish Module " + (m.id - 1);
      }
      const label = status === "completed" ? "done" : (open ? (status === "in-progress" ? "open" : "ready") : "locked");
      const cls = status === "completed" ? "completed" : (open ? "" : "locked");
      /* Divs, not spans: .modtitle / .moddesc / .modmeta carry no display rule,
         so as spans they run together on one line. */
      return '<a class="modcard' + (open ? "" : " locked") + '" href="' + (open ? m.file : "#") + '"' +
        (open ? "" : ' aria-disabled="true"') + '>' +
        '<div class="modnum">' + m.id + "</div>" +
        '<div class="modbody"><div class="modtitle">' + CourseProgress.escapeHtml(m.title) + "</div>" +
        '<div class="moddesc">' + CourseProgress.escapeHtml(m.teaser) + "</div>" +
        '<div class="modmeta">' + CourseProgress.escapeHtml(meta) + "</div></div>" +
        '<div class="modstatus ' + cls + '">' + label + "</div></a>";
    }).join("");
    return head + cards;
  }).join("");
}

function renderNext() {
  const ov = CourseProgress.overall();
  document.getElementById("ovVal").textContent = ov.completed + " / " + ov.total + " modules";
  document.getElementById("ovFill").style.width = ov.pct + "%";
  const next = CourseProgress.MODULES.filter(function (m) {
    return CourseProgress.isUnlocked(m.id) && !CourseProgress.isModuleComplete(m.id);
  })[0];
  const host = document.getElementById("nextAction");
  if (next) {
    /* On a completely fresh account, send them to orientation rather than
       straight into ticket NL-001: Module 1 assumes they know what the loop is
       and that an agent is going to be wrong sometimes. */
    if (next.id === 1 && !CourseProgress.getModule(1).lastVisited) {
      host.innerHTML = '<div class="ov-lbl">Start here</div><div style="margin-top:6px">' +
        '<a href="module-00.html"><b>Orientation \\u2014 what this course is</b></a></div>' +
        '<div class="mut" style="font-size:12.5px;margin-top:4px">Ten minutes, then ticket NL-001.</div>';
      return;
    }
    const tk = CourseProgress.ticketFor(next.id);
    host.innerHTML = '<div class="ov-lbl">Next</div><div style="margin-top:6px"><a href="' + next.file +
      '"><b>Module ' + next.id + " \\u2014 " + CourseProgress.escapeHtml(next.title) + "</b></a></div>" +
      (tk ? '<div class="mut" style="font-size:12.5px;margin-top:4px">' + tk.id + " \\u00b7 " +
        CourseProgress.escapeHtml(tk.title) + "</div>" : "");
    return;
  }
  const locked = CourseProgress.MODULES.filter(function (m) { return !CourseProgress.isUnlocked(m.id); })[0];
  host.innerHTML = locked
    ? '<div class="ov-lbl">Blocked</div><div style="margin-top:6px">Module ' + locked.id +
      " is gated. The three checks are in section 02 below.</div>"
    : '<div class="ov-lbl">Done</div><div style="margin-top:6px">Every module is complete. <a href="final-assessment.html">Final assessment</a> and <a href="career.html">where you actually stand</a>.</div>';
}

ModuleKit.renderLoopInto("loopStripAll", "all", "The loop you are learning \\u00b7 every module drills part of it");
renderStages();
renderNext();
gateRows("gateRows");
document.getElementById("libGrid").innerHTML = Object.keys(SkillMap.TOOL_LIBRARIES).map(function (t) {
  return card(SkillMap.TOOL_LIBRARIES[t], LIB_LABEL[t] + " \\u00b7 " + SkillMap.TOOL_COUNTS[t], LIB_DESC[t]);
}).join("");
document.getElementById("sysGrid").innerHTML = SYS.map(function (s) { return card(s[0], s[1], s[2]); }).join("");
document.getElementById("resetLink").onclick = function (e) {
  e.preventDefault();
  if (confirm("Clear all module, exercise and quiz progress in this browser?")) {
    CourseProgress.resetAll();
    location.reload();
  }
};
"""


def dashboard():
    page("dashboard.html", "Dashboard", "Dashboard",
         "Northline Digital \u00b7 junior developer",
         "Your work queue",
         "Thirteen client tickets. You are the junior developer, and an AI agent is the fastest "
         "colleague you have ever had and the one most willing to be confidently wrong.",
         DASH_BODY,
         js("course-progress.js", "practice-progress.js", "practice-tasks.js",
            "skill-map.js", "module-kit.js") + "\n" + inline(DASH_JS),
         # Absolute: these pages are served under /courses/<id>/..., so a
         # relative hop out of the content directory would not reach the app.
         nav=('<a href="/lab">&larr; Zenith Lab</a>'
              '<a href="tickets.html">Ticket board</a>'
              '<a href="syllabus.html">Syllabus</a>'
              '<a href="desktop-labs.html">Desktop Labs</a>'
              '<a href="career.html">Career</a>'))


# =============================================================== syllabus
SYL_BODY = """  <section>
    <div class="kh"><span class="num">00</span><h2>What this actually is</h2></div>
    <p>You are the junior developer at Northline Digital, a five-person shop that builds small
    internal tools and customer-facing sites. Tickets arrive from Priya, who manages a clinic and
    does not speak in requirements, and from Dan, who sells the work before it is scoped. You have
    an AI coding agent. It is fast, tireless, and quite capable of deleting a validation check while
    adding a feature and telling you it went well.</p>
    <p>So the course is not about typing better prompts. It is about the loop that makes AI output
    safe to ship: understand the request, specify the checks, ask for something small, read every
    line, run it, test it, debug it, review it, improve it, commit it, ship it. You will do that
    eleven-step loop thirteen times, on progressively harder tickets.</p>
    <div id="loopStripAll" style="margin-top:22px"></div>
    <div class="objectives"><div class="lbl">By the end you can</div>
      <ul>
        <li>Turn a sentence like &ldquo;make booking better&rdquo; into acceptance criteria, edge cases and out-of-scope notes</li>
        <li>Write the HTML, CSS and JavaScript yourself, well enough to review someone else's</li>
        <li>Run a real Cursor session and defend, reject or repair what it produced</li>
        <li>Find the defect in plausible AI code, and prove the fix with a test that fails first</li>
        <li>Use Git and review a pull request hunk by hunk, in writing</li>
        <li>Ship a live URL with tests, a repo, release notes and decisions you can explain</li>
      </ul>
    </div>
  </section>

  <section>
    <div class="kh"><span class="num">01</span><h2>The stages</h2></div>
    <p class="mut">Rendered from the course data, so this list cannot drift from what is actually in the modules.</p>
    <div id="stageList"></div>
  </section>

  <section>
    <div class="kh"><span class="num">02</span><h2>How you move forward</h2></div>
    <p>Each module has a graded exercise and a five-question checkpoint. Both have to be done to
    unlock the next one: the checkpoint at <b id="thresh">80%</b>, and the exercise judged by a
    grader that runs your work rather than accepting that you tried.</p>
    <div id="secList" style="margin-top:16px"></div>
    <p style="margin-top:20px">The final module has a harder gate, because a capstone you were let
    into by default is worth nothing to show anyone:</p>
    <div id="gateRows" style="margin-top:12px"></div>
  </section>

  <section>
    <div class="kh"><span class="num">03</span><h2>What this course will not do</h2></div>
"""

SYL_TAIL = """  </section>
"""

SYL_JS = GATE_JS + """
ModuleKit.renderLoopInto("loopStripAll", "all", "The loop \\u00b7 all eleven steps, thirteen times");
document.getElementById("thresh").textContent = Math.round(CourseProgress.PASS_THRESHOLD * 100) + "%";
document.getElementById("stageList").innerHTML = CourseProgress.STAGES.map(function (st) {
  const head = '<div class="stagehead"><span class="stagelbl">' + st.label +
    '</span><span class="stagetitle">' + CourseProgress.escapeHtml(st.title) + "</span></div>";
  const items = st.modules.map(function (id) {
    const m = CourseProgress.MODULES.filter(function (x) { return x.id === id; })[0];
    const tk = CourseProgress.ticketFor(id);
    const steps = CourseProgress.loopFor(id).map(function (s) {
      const step = CourseProgress.LOOP.filter(function (l) { return l.id === s; })[0];
      return step ? step.label : s;
    }).join(" \\u00b7 ");
    return '<div class="def"><div class="k">Module ' + m.id + " \\u2014 " +
      CourseProgress.escapeHtml(m.title) + "</div><p>" +
      (tk ? "<b>" + tk.id + "</b> " + CourseProgress.escapeHtml(tk.title) + ". " : "") +
      CourseProgress.escapeHtml(m.teaser) +
      '</p><p class="mut" style="font-size:12px;margin-top:6px">~' + m.minutes +
      " min \\u00b7 loop steps: " + CourseProgress.escapeHtml(steps) + "</p></div>";
  }).join("");
  return head + items;
}).join("");
document.getElementById("secList").innerHTML = CourseProgress.MODULES.map(function (m) {
  const secs = (CourseProgress.REQUIRED_SECTIONS[m.id] || []).map(function (k) {
    return CourseProgress.SECTION_LABELS[k] || k;
  }).join("; ");
  return '<div class="gaterow"><span class="mono" style="color:var(--accent);min-width:34px">' + m.id +
    "</span><span>" + CourseProgress.escapeHtml(secs) + "</span></div>";
}).join("");
gateRows("gateRows");
"""


def syllabus():
    body = SYL_BODY + honest(
        "<b>No job guarantee, and no pretending.</b> Thirteen modules of graded work is a real "
        "foundation and it is not three years of experience. What you will have is a live product, "
        "a repo with your commits, a written review of AI-generated code, and the ability to say "
        "why you rejected a hunk. That is a genuinely strong position for a first role, and it is "
        "not the same as being a senior engineer.") + note(
        "We do not cover React, TypeScript, backends, databases, RAG pipelines or agent frameworks. "
        "Everything here is HTML, CSS, JavaScript, Python and Git, because those are what the "
        "AI-generated code you are asked to review will be made of. Frameworks are a later problem "
        "and a much easier one once you can read a diff.") + note(
        "The in-browser graders run your code, parse your markup and read your writing. They cannot "
        "watch you work in Cursor, which is exactly why Module 7 asks you to bring the agent's real "
        "output back and run tests against it, and why both Desktop Labs are required rather than "
        "optional.") + SYL_TAIL
    page("syllabus.html", "Syllabus", "Syllabus",
         "6 stages \u00b7 13 tickets", "What you are signing up for",
         "The whole curriculum, the gates, and the things this course deliberately refuses to claim.",
         body,
         js("course-progress.js", "module-kit.js") + "\n" + inline(SYL_JS))


# ================================================================ roadmap
ROAD_BODY = """  <section>
    <div class="kh"><span class="num">01</span><h2>Where you are</h2></div>
    <div id="whereList"></div>
  </section>

  <section>
    <div class="kh"><span class="num">02</span><h2>Do this next</h2></div>
    <p class="mut">Chosen by retries and by which libraries you have not touched, not by order. If you have been avoiding a library, this will keep sending you back to it.</p>
    <div id="rec" style="margin-top:14px"></div>
  </section>

  <section>
    <div class="kh"><span class="num">03</span><h2>Coverage</h2></div>
    <p class="mut">Passed tasks per library. Three of HTML, CSS, JavaScript and Detective at three each is the capstone bar; everything else is reps you take because you want them.</p>
    <div id="covList" style="margin-top:14px"></div>
  </section>
"""

ROAD_JS = """
const LIB_LABEL = {
  html: "HTML", css: "CSS", js: "JavaScript", specs: "Requirements",
  git: "Git commands", testing: "Tests", review: "PR review",
  detective: "AI Code Detective", python: "Python", integrated: "Whole tickets",
};
const LEVEL_LABEL = { guided: "guided", semiguided: "semi-guided", challenge: "challenge", mastery: "mastery" };
const ov = CourseProgress.overall();
const passed = SkillMap.totalTasksPassed();
const total = SkillMap.TASKS.length;
document.getElementById("whereList").innerHTML =
  '<div class="gaterow"><span class="mono" style="color:var(--accent)">' + ov.completed + "/" + ov.total +
  "</span><span>modules complete</span></div>" +
  '<div class="gaterow"><span class="mono" style="color:var(--accent)">' + passed + "/" + total +
  "</span><span>practice tasks passed</span></div>" +
  '<div class="gaterow"><span class="mono" style="color:var(--accent)">' +
  (CourseProgress.desktopLabReady() ? "\\u2713" : "\\u25cb") + "</span><span>both Desktop Labs confirmed</span></div>";

const out = AdaptiveEngine.recommend();
const rec = out && out.primary;
const host = document.getElementById("rec");
if (!rec) {
  host.innerHTML = '<div class="def"><div class="k">Nothing left</div><p>Every task in the map is passed. Go and finish a <a href="projects.html">project brief</a> instead.</p></div>';
} else {
  const tool = rec.tool;
  const label = LIB_LABEL[tool] || tool;
  host.innerHTML = '<div class="def"><div class="k">' + CourseProgress.escapeHtml(rec.id) + " \\u00b7 " +
    CourseProgress.escapeHtml(label) + " \\u00b7 " + CourseProgress.escapeHtml(LEVEL_LABEL[rec.level] || rec.level) +
    "</div><p>" + CourseProgress.escapeHtml(rec.title || "") + "</p>" +
    '<ul style="margin:10px 0 0 18px;font-size:13px;color:var(--mut)">' +
    (rec.why || []).map(function (w) { return "<li>" + CourseProgress.escapeHtml(w) + "</li>"; }).join("") +
    '</ul><p style="margin-top:12px"><a class="primary" style="text-decoration:none;padding:9px 14px;border-radius:8px;display:inline-block" href="' +
    (rec.file || SkillMap.TOOL_LIBRARIES[tool]) + '">Open ' + CourseProgress.escapeHtml(label) + " practice</a></p></div>";
}

document.getElementById("covList").innerHTML = Object.keys(SkillMap.TOOL_LIBRARIES).map(function (t) {
  const n = SkillMap.TASKS.filter(function (x) { return x.tool === t; })
    .filter(function (x) { return PracticeProgress.getTaskState(x.id).passed; }).length;
  const tot = SkillMap.TOOL_COUNTS[t];
  const pct = tot ? Math.round((n / tot) * 100) : 0;
  return '<div style="margin-top:12px"><div class="overallrow"><span style="font-size:13.5px"><a href="' +
    SkillMap.TOOL_LIBRARIES[t] + '">' + CourseProgress.escapeHtml(LIB_LABEL[t] || t) + '</a></span>' +
    '<span class="mono" style="font-size:12px;color:var(--mut2)">' + n + " / " + tot + '</span></div>' +
    '<div class="overallbar" style="margin-top:6px"><div class="fill" style="width:' + pct + '%"></div></div></div>';
}).join("");
"""


def roadmap():
    page("learning-roadmap.html", "Learning Roadmap", "Roadmap",
         "Adaptive", "What to do next",
         "One recommendation, based on what you have retried and what you have been quietly avoiding.",
         ROAD_BODY,
         js("course-progress.js", "practice-progress.js", "practice-tasks.js",
            "skill-map.js", "adaptive-engine.js") + "\n" + inline(ROAD_JS))


# ================================================================ mastery
MAST_BODY = """  <section>
    <div class="kh"><span class="num">01</span><h2>Evidence by skill</h2></div>
    <p class="mut">Every tier below comes from work a grader ran: markup parsed, styles computed, functions executed against hidden tests, writing checked against rules, defects found without charging the innocent lines. None of it comes from watching a video.</p>
    <div id="masteryList" style="margin-top:18px"></div>
  </section>

  <section>
    <div class="kh"><span class="num">02</span><h2>How to read this</h2></div>
    <div class="def"><div class="k">The tiers</div><p><b>Introduced</b> is one pass. <b>Practising</b> is 30% of the library. <b>Competent</b> is 60%. <b>Mastered</b> is 90%. They are proportions, so a small library is not automatically mastered by doing two tasks.</p></div>
"""

MAST_TAIL = """  </section>
"""

MAST_JS = """
const TIER_LABEL = { "not-started": "not started", introduced: "introduced", practicing: "practising", competent: "competent", mastered: "mastered" };
const groups = {};
SkillMap.allMasterSkillProgress().forEach(function (m) {
  (groups[m.category] = groups[m.category] || []).push(m);
});
document.getElementById("masteryList").innerHTML = Object.keys(groups).map(function (cat) {
  const head = '<div class="stagehead"><span class="stagelbl">' + CourseProgress.escapeHtml(cat) + "</span></div>";
  const cards = groups[cat].map(function (m) {
    return '<div class="projcard" style="margin-top:12px"><div class="overallrow">' +
      '<span class="modtitle">' + CourseProgress.escapeHtml(m.label) + "</span>" +
      '<span class="mono" style="font-size:11.5px;color:var(--mut2)">' +
      CourseProgress.escapeHtml(TIER_LABEL[m.tier] || m.tier) + " \\u00b7 " + m.passedCount + "/" + m.totalCount +
      "</span></div>" +
      '<div class="overallbar" style="margin-top:10px"><div class="fill" style="width:' + m.pct + '%"></div></div></div>';
  }).join("");
  return head + cards;
}).join("");
"""


def mastery():
    body = MAST_BODY + honest(
        "<b>This is not a job-readiness score.</b> It says what you have demonstrated inside this "
        "course, on tasks we wrote. Nobody hiring you will see this page; they will see your repo, "
        "your live URL and how you answer questions about them.") + MAST_TAIL
    page("mastery-profile.html", "Mastery Profile", "Mastery",
         "Evidence", "What you have actually proved",
         "Tiers built from graded work, grouped by the part of the job they belong to.",
         body,
         js("course-progress.js", "practice-progress.js", "practice-tasks.js",
            "skill-map.js") + "\n" + inline(MAST_JS))


# ============================================================= diagnostic
DIAG_BODY = """  <section>
    <div class="kh"><span class="num">01</span><h2>Five questions</h2></div>
    <p class="mut">This does not let you skip anything. It tells you which library will feel least familiar so you know where the reps should go.</p>
    <div id="quizRoot" style="margin-top:16px"></div>
    <div id="diagOut" style="margin-top:20px"></div>
  </section>
"""

DIAG_JS = """
const Q = AISEQuizData.MODULE_QUIZZES;
const pool = [Q[1][1], Q[2][1], Q[3][0], Q[5][2], Q[6][0]].filter(Boolean);
ModuleKit.renderQuiz("diagnostic", pool, null, function (res) {
  const pct = res.total ? Math.round((res.score / res.total) * 100) : 0;
  CourseProgress.setExtra("diagnostic", { score: res.score, total: res.total, at: Date.now() });
  const out = document.getElementById("diagOut");
  const advice = pct >= 80
    ? "You can read this material already. Start at Module 1 anyway \\u2014 it is 45 minutes and it ends with something shipped \\u2014 then spend your spare time in the JavaScript and Detective libraries."
    : pct >= 40
      ? "Normal starting point. Work the modules in order and use HTML, then CSS, then JavaScript practice alongside them."
      : "Nothing here is assumed knowledge. Go to Module 1 and use the cheat sheets while you work; the guided tasks in each library exist for exactly this.";
  out.innerHTML = '<div class="def"><div class="k">' + pct + "%</div><p>" + advice +
    '</p><p style="margin-top:10px"><a class="primary" style="text-decoration:none;padding:9px 14px;border-radius:8px;display:inline-block" href="module-01.html">Start Module 1</a></p></div>';
});
"""


def diagnostic():
    page("diagnostic.html", "Skill Diagnostic", "Diagnostic",
         "Placement", "Where are you starting from",
         "Five questions, answered honestly, so you know which practice library to lean on.",
         DIAG_BODY,
         js("course-progress.js", "quiz-data.js", "module-kit.js") + "\n" + inline(DIAG_JS))


# ============================================================ quiz centre
QUIZ_BODY = """  <section>
    <div class="kh"><span class="num">01</span><h2>Draw a set</h2></div>
    <div class="formrow"><label for="bank">Question bank</label>
      <select id="bank"></select></div>
    <button type="button" class="primary" id="draw" style="margin-top:12px">Draw five</button>
    <div id="quizRoot" style="margin-top:22px"></div>
  </section>
"""

QUIZ_JS = """
const Q = AISEQuizData.MODULE_QUIZZES;
const EXTRA = AISEQuizData.CENTER_EXTRA || [];
const sel = document.getElementById("bank");
const opts = ['<option value="mix">Mixed \\u2014 every bank</option>'];
CourseProgress.MODULES.forEach(function (m) {
  if (Q[m.id] && Q[m.id].length) {
    opts.push('<option value="' + m.id + '">Module ' + m.id + " \\u2014 " +
      CourseProgress.escapeHtml(m.title) + "</option>");
  }
});
if (EXTRA.length) opts.push('<option value="extra">Extra questions</option>');
sel.innerHTML = opts.join("");

function shuffle(a) {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = x[i]; x[i] = x[j]; x[j] = t;
  }
  return x;
}

document.getElementById("draw").onclick = function () {
  const v = sel.value;
  let pool = [];
  if (v === "mix") {
    Object.keys(Q).forEach(function (k) { pool = pool.concat(Q[k]); });
    pool = pool.concat(EXTRA);
  } else if (v === "extra") {
    pool = EXTRA.slice();
  } else {
    pool = (Q[v] || []).slice();
  }
  const picked = shuffle(pool).slice(0, 5);
  if (!picked.length) {
    document.getElementById("quizRoot").innerHTML = '<p class="mut">That bank is empty.</p>';
    return;
  }
  /* One stable storage key: a fresh key per draw would fill the progress
     record with throwaway entries, and nothing here counts toward a gate. */
  ModuleKit.renderQuiz("quizcenter", picked, null, null);
};
document.getElementById("draw").click();
"""


def quiz_center():
    body = QUIZ_BODY + section(
        "02", "What this is not",
        note("Drawing questions here does not unlock modules and does not count toward any gate. "
             "It is for reps on a topic you got wrong, which is a different job from the checkpoint "
             "that proves you can move on."))
    page("quiz-center.html", "Quiz Center", "Quiz centre",
         "Extra reps", "Quiz centre",
         "Any bank, five at a time, shuffled. Read the explanations on the ones you miss.",
         body,
         js("course-progress.js", "quiz-data.js", "module-kit.js") + "\n" + inline(QUIZ_JS))


# =========================================================== desktop labs
LABS_BODY = """  <section>
    <div class="kh"><span class="num">00</span><h2>Why these are required</h2></div>
    <p>Everything else in this course runs in your browser, and browsers cannot install Cursor or
    push to GitHub. The graders can check the markup you write, run the functions you write and read
    the review notes you write. They cannot watch you accept a diff or resolve a merge conflict.</p>
    <p>So these two labs are the part where you do the work on your own machine and record the
    evidence. Both are needed before the capstone opens. Not because a checkbox matters, but because
    &ldquo;I have used an AI coding agent on a real repo&rdquo; is a claim you should be able to make
    without flinching.</p>
    <div class="statusrow" id="labStatus" style="margin-top:18px"></div>
  </section>

  <section>
    <div class="kh"><span class="num">A</span><h2>Lab A &mdash; a real Cursor session</h2></div>
    <p>Install <a href="https://cursor.com" target="_blank" rel="noopener noreferrer">Cursor</a>, open
    the starter folder from Module 1, and run one full loop on a small change: specify it, ask, read
    the diff, run it, then accept or reject. Module 7 grades the output of a session like this, so
    doing it now makes that module a formality rather than a wall.</p>
    <div class="checklist">
      <div class="check">Cursor installed and a folder open, not a single file</div>
      <div class="check">You wrote the request as a specification, including what must not change</div>
      <div class="check">You read the diff before accepting anything</div>
      <div class="check">You ran the page afterwards and clicked the thing you changed</div>
      <div class="check">You rejected at least one suggestion, or can say why nothing needed rejecting</div>
    </div>
    <div id="labA" style="margin-top:20px"></div>
  </section>

  <section>
    <div class="kh"><span class="num">B</span><h2>Lab B &mdash; a repo you own</h2></div>
    <p>Create a GitHub repository, push the work from Lab A, and make at least one commit whose
    message a stranger could search for. Module 10 is about branches, diffs and pull requests; this
    is the account and the repo it needs.</p>
    <div class="checklist">
      <div class="check">A repository exists under your own account</div>
      <div class="check">Your files are pushed and visible on github.com</div>
      <div class="check">At least one commit message names what changed and why</div>
      <div class="check">You can find the commit's own URL</div>
    </div>
    <div id="labB" style="margin-top:20px"></div>
  </section>
"""

LABS_JS = """
const LABS = [
  { tool: "cursor", host: "labA", title: "Lab A evidence",
    urlLabel: "Link to the repo or a screenshot you can point at (optional)",
    confirm: "I ran a real Cursor session on my own machine, read the diff, and ran the result.",
    notesLabel: "What did you ask for, and what did the agent get wrong or right?" },
  { tool: "github", host: "labB", title: "Lab B evidence",
    urlLabel: "Your repository URL (https://github.com/you/repo)",
    confirm: "This repository is mine, it is pushed, and the commit message says what changed.",
    notesLabel: "Paste your commit message and say why you phrased it that way." },
];

function render() {
  LABS.forEach(function (lab) {
    const rec = CourseProgress.desktopLabRecord(lab.tool);
    const host = document.getElementById(lab.host);
    host.innerHTML =
      '<div class="formrow"><label for="u-' + lab.tool + '">' + lab.urlLabel + '</label>' +
      '<input id="u-' + lab.tool + '" type="url" value="' + CourseProgress.escapeHtml(rec.url || "") + '"></div>' +
      '<div class="formrow"><label for="n-' + lab.tool + '">' + lab.notesLabel + '</label>' +
      '<textarea id="n-' + lab.tool + '" style="min-height:90px">' + CourseProgress.escapeHtml(rec.notes || "") + '</textarea></div>' +
      '<div class="wf-check"><label><input type="checkbox" id="c-' + lab.tool + '"' + (rec.confirmed ? " checked" : "") + '><span>' + lab.confirm + '</span></label></div>' +
      '<button type="button" class="primary" id="s-' + lab.tool + '" style="margin-top:12px">Save ' + lab.title + '</button>' +
      '<div class="feedback" id="f-' + lab.tool + '" aria-live="polite"></div>';
    document.getElementById("s-" + lab.tool).onclick = function () {
      const res = CourseProgress.completeDesktopLab(lab.tool, {
        url: document.getElementById("u-" + lab.tool).value,
        notes: document.getElementById("n-" + lab.tool).value,
        confirmed: document.getElementById("c-" + lab.tool).checked,
      });
      const fb = document.getElementById("f-" + lab.tool);
      fb.className = "feedback " + (res.ok ? "ok" : "bad");
      fb.innerHTML = res.ok
        ? "\\u2713 Saved. This syncs with your account when you are signed in."
        : "\\u2717 " + CourseProgress.escapeHtml(res.error || "Could not save.");
      status();
    };
  });
  status();
}

function status() {
  const a = CourseProgress.desktopLabRecord("cursor").completed;
  const b = CourseProgress.desktopLabRecord("github").completed;
  document.getElementById("labStatus").innerHTML =
    '<span class="pill' + (a ? " done" : "") + '">Lab A ' + (a ? "confirmed" : "outstanding") + "</span>" +
    '<span class="pill' + (b ? " done" : "") + '">Lab B ' + (b ? "confirmed" : "outstanding") + "</span>" +
    '<span class="pill' + (a && b ? " done" : "") + '">Capstone requirement ' + (a && b ? "met" : "not met") + "</span>";
}

render();
"""


def desktop_labs():
    body = LABS_BODY + section(
        "C", "The honest part",
        honest("<b>Nothing here is verified against GitHub's API.</b> You could tick these boxes "
               "without doing the work. The reason not to is that Module 7 grades the actual output "
               "of an agent session and Module 13 wants a live URL, so the lie costs you later "
               "rather than never."))
    page("desktop-labs.html", "Desktop Labs", "Desktop Labs",
         "Required \u00b7 your machine, not the browser",
         "The two things a browser cannot teach you",
         "One real Cursor session and one repo you own. Both are needed before the capstone opens.",
         body,
         js("course-progress.js") + "\n" + inline(LABS_JS))


# ================================================================ projects
PROJ_BODY = """  <section>
    <div class="kh"><span class="num">01</span><h2>Capstones</h2></div>
    <p class="mut">Pick one. Both are the whole loop end to end, and both need the gate below to open.</p>
    <div id="gateRows" style="margin-top:12px;margin-bottom:8px"></div>
    <div id="capList"></div>
  </section>

  <section>
    <div class="kh"><span class="num">02</span><h2>Portfolio briefs</h2></div>
    <p class="mut">Smaller and open from the start. These are the pieces you point at in an interview when someone asks what you have built on your own.</p>
    <div id="portList"></div>
  </section>
"""

PROJ_JS = GATE_JS + """
function rubricLine(p) {
  return CourseProgress.rubricForProject(p.id).map(function (r) {
    return r.label + " " + r.weight + "%";
  }).join(" \\u00b7 ");
}

/* Field names are the ones getProject() normalises to (liveUrl, githubUrl,
   description). Inventing url/repo/notes here would leave two half-filled
   copies of the same submission in one record. */
function card(p, locked) {
  const rec = CourseProgress.getProject(p.id);
  const url = CourseProgress.safeHttpUrl(rec.liveUrl || "");
  const head = '<div class="overallrow"><span class="modtitle">' + p.title + "</span>" +
    '<span class="mono" style="font-size:11px;color:var(--mut2)">' + CourseProgress.escapeHtml(p.difficulty) + "</span></div>" +
    '<p class="moddesc" style="margin-top:8px">' + CourseProgress.escapeHtml(p.summary) + "</p>" +
    '<p class="mut" style="font-size:12px;margin-top:8px">Graded on: ' + CourseProgress.escapeHtml(rubricLine(p)) + "</p>";
  if (locked) {
    return '<div class="projcard capstone-locked" style="margin-top:14px">' + head +
      '<p class="mut" style="margin-top:10px">Locked until the capstone gate above is fully green.</p></div>';
  }
  return '<div class="projcard" style="margin-top:14px">' + head +
    '<div class="formrow" style="margin-top:14px"><label for="u' + p.id + '">Live URL</label>' +
    '<input id="u' + p.id + '" type="url" value="' + CourseProgress.escapeHtml(rec.liveUrl || "") + '"></div>' +
    '<div class="formrow"><label for="r' + p.id + '">Repository URL</label>' +
    '<input id="r' + p.id + '" type="url" value="' + CourseProgress.escapeHtml(rec.githubUrl || "") + '"></div>' +
    '<div class="formrow"><label for="n' + p.id + '">Write-up: what you decided, what you rejected from the AI, and how you verified it</label>' +
    '<textarea id="n' + p.id + '" style="min-height:110px">' + CourseProgress.escapeHtml(rec.description || "") + '</textarea></div>' +
    '<div class="wf-check"><label><input type="checkbox" id="d' + p.id + '"' + (rec.completed ? " checked" : "") +
    '><span>This is finished and I can walk someone through every decision in it.</span></label></div>' +
    '<button type="button" class="primary" data-save="' + p.id + '" style="margin-top:12px">Save</button>' +
    (url ? ' <a href="' + url + '" target="_blank" rel="noopener noreferrer" style="margin-left:10px">Open live URL</a>' : "") +
    '<div class="feedback" id="f' + p.id + '" aria-live="polite"></div></div>';
}

function render() {
  const capId = CourseProgress.CAPSTONE_ID;
  const locked = !CourseProgress.isUnlocked(capId);
  const caps = CourseProgress.PROJECTS.filter(function (p) { return p.modules.indexOf(capId) !== -1; });
  const rest = CourseProgress.PROJECTS.filter(function (p) { return p.modules.indexOf(capId) === -1; });
  document.getElementById("capList").innerHTML = caps.map(function (p) { return card(p, locked); }).join("");
  document.getElementById("portList").innerHTML = rest.map(function (p) { return card(p, false); }).join("");
  document.querySelectorAll("[data-save]").forEach(function (btn) {
    btn.onclick = function () {
      const id = Number(btn.getAttribute("data-save"));
      CourseProgress.setProject(id, {
        liveUrl: document.getElementById("u" + id).value,
        githubUrl: document.getElementById("r" + id).value,
        description: document.getElementById("n" + id).value,
        completed: document.getElementById("d" + id).checked,
      });
      const fb = document.getElementById("f" + id);
      fb.className = "feedback ok";
      fb.innerHTML = "\\u2713 Saved. It shows on your <a href='portfolio.html'>portfolio</a>.";
    };
  });
}
gateRows("gateRows");
render();
"""


def projects():
    page("projects.html", "Projects", "Projects",
         "Briefs", "Things you can show someone",
         "Two capstones and six portfolio briefs. Each one is graded on a rubric you can read before you start.",
         PROJ_BODY,
         js("course-progress.js") + "\n" + inline(PROJ_JS))


# =============================================================== portfolio
PORT_BODY = """  <section>
    <div class="kh"><span class="num">01</span><h2>Submitted work</h2></div>
    <div id="portList" style="margin-top:14px"></div>
  </section>
"""

PORT_JS = """
const items = CourseProgress.PROJECTS.map(function (p) {
  return { p: p, rec: CourseProgress.getProject(p.id) };
}).filter(function (x) { return x.rec.liveUrl || x.rec.githubUrl || x.rec.description || x.rec.completed; });

const host = document.getElementById("portList");
if (!items.length) {
  host.innerHTML = '<div class="def"><div class="k">Nothing here yet</div><p>Finish a brief on the <a href="projects.html">projects page</a> and it appears here with its links.</p></div>';
} else {
  host.innerHTML = items.map(function (x) {
    const url = CourseProgress.safeHttpUrl(x.rec.liveUrl || "");
    const repo = CourseProgress.safeHttpUrl(x.rec.githubUrl || "");
    return '<div class="projcard" style="margin-top:14px"><div class="overallrow">' +
      '<span class="modtitle">' + x.p.title + "</span>" +
      '<span class="mono" style="font-size:11px;color:' + (x.rec.completed ? "var(--good)" : "var(--mut2)") + '">' +
      (x.rec.completed ? "finished" : "in progress") + "</span></div>" +
      (url ? '<p style="margin-top:8px"><a href="' + url + '" target="_blank" rel="noopener noreferrer">Live URL</a></p>' : "") +
      (repo ? '<p style="margin-top:4px"><a href="' + repo + '" target="_blank" rel="noopener noreferrer">Repository</a></p>' : "") +
      (x.rec.description ? '<p class="moddesc" style="margin-top:10px">' + CourseProgress.escapeHtml(x.rec.description) + "</p>" : "") +
      "</div>";
  }).join("");
}
"""


def portfolio():
    body = PORT_BODY + section(
        "02", "Before you send this to anyone",
        note("A live URL that loads, a repo with more than one commit, and a write-up that names one "
             "thing you rejected from the AI and why. Those three together are more convincing than "
             "any certificate, including ours."))
    page("portfolio.html", "My Portfolio", "Portfolio",
         "Your work", "What you have built",
         "Everything you have submitted, with the links you would actually send someone.",
         body,
         js("course-progress.js") + "\n" + inline(PORT_JS))


# ================================================================== career
CAREER_BODY = """  <section>
    <div class="kh"><span class="num">01</span><h2>What you can honestly claim</h2></div>
    <div id="ready" style="margin-top:14px"></div>
  </section>

  <section>
    <div class="kh"><span class="num">02</span><h2>How to talk about AI in an interview</h2></div>
    <p>The wrong answer is &ldquo;I use AI to write code fast&rdquo;. Every candidate says that now,
    and it invites the follow-up nobody wants: <i>so what do you actually contribute?</i></p>
    <p>The answer that lands is the loop. You wrote the acceptance criteria first. You asked for a
    small change with the constraints stated. You read the diff. You ran it. You wrote a test that
    failed before the fix and passed after. You rejected the hunk that removed a validation check
    and you can say what would have broken. That is an engineer describing judgement, and it is
    exactly what the AI cannot do for them.</p>
    <div class="def"><div class="k">Have one story ready</div><p>Pick a real moment from Module 8 or
    Module 10 where the agent produced something plausible and wrong, and be able to tell it in
    ninety seconds: what it wrote, how you noticed, what you did. Specific beats impressive.</p></div>
  </section>

  <section>
    <div class="kh"><span class="num">03</span><h2>The gaps you still have</h2></div>
    <p class="mut">Said plainly, because finding out in an interview is worse.</p>
    <div class="def"><div class="k">No framework experience</div><p>React, Vue and Svelte are not in this course. Plenty of junior roles expect one. The upside is that the DOM, events and state work you did in Modules 5 and 6 is what frameworks are built on, so learning one is weeks, not months.</p></div>
    <div class="def"><div class="k">No backend, no database</div><p>You have read JSON from a file. You have not designed a schema, written an API or thought about auth. If a job description says &ldquo;full stack&rdquo;, this course covers one half.</p></div>
    <div class="def"><div class="k">No team experience</div><p>You reviewed AI-authored pull requests, which is genuinely the right practice. You have not disagreed with a human colleague about a design decision, been on call, or inherited five years of someone else's code.</p></div>
    <div class="def"><div class="k">Small scale</div><p>Everything here is a few files. Nothing here teaches you what happens when a codebase is too big to read, which is the normal condition of professional work.</p></div>
  </section>

  <section>
    <div class="kh"><span class="num">04</span><h2>Roles this points at</h2></div>
    <div class="def"><div class="k">Junior front-end developer</div><p>The most direct fit. You will be asked to write HTML, CSS and JavaScript and to review code you did not write. Both are in here.</p></div>
    <div class="def"><div class="k">Internal tools / automation</div><p>Module 12 is the shape of this job: a recurring manual chore, a small script, a test that stops it silently breaking. Often the easiest way in at a non-technical company.</p></div>
    <div class="def"><div class="k">QA and test engineering</div><p>Writing a test that fails first is the core skill, and the detective work in Module 8 is close to what a good QA engineer does with an AI-generated PR.</p></div>
    <div class="def"><div class="k">Technical support escalation</div><p>Reproducing a bug from a vague report, which is exactly ticket NL-009, is most of this job.</p></div>
  </section>
"""

CAREER_JS = """
const ov = CourseProgress.overall();
const ps = CourseProgress.capstonePracticeStatus();
const labs = CourseProgress.desktopLabReady();
const caps = CourseProgress.PROJECTS.filter(function (p) {
  return p.modules.indexOf(CourseProgress.CAPSTONE_ID) !== -1 && CourseProgress.getProject(p.id).completed;
});
const shipped = CourseProgress.PROJECTS.filter(function (p) {
  const r = CourseProgress.getProject(p.id);
  return r.completed && CourseProgress.safeHttpUrl(r.liveUrl || "");
});
const pillars = [["html", "HTML"], ["css", "CSS"], ["js", "JavaScript"], ["det", "Detective"]];

function row(ok, label, detail) {
  return '<div class="gaterow"><span class="' + (ok ? "gok" : "gno") + '">' + (ok ? "\\u2713" : "\\u25cb") +
    "</span><span><b>" + label + "</b> &mdash; " + detail + "</span></div>";
}

document.getElementById("ready").innerHTML =
  row(ov.completed === ov.total, "All thirteen modules", ov.completed + " of " + ov.total + " complete") +
  row(ps.ready, "The practice bar",
      pillars.map(function (p) {
        return p[1] + " " + ps[p[0]] + (ps[p[0]] >= ps.needPerTool ? " \\u2713" : " of " + ps.needPerTool);
      }).join(" \\u00b7 ") + " (need " + ps.toolsNeeded + " of the 4)") +
  row(labs, "Real agent and real repo", labs ? "both Desktop Labs confirmed" : "Desktop Labs outstanding") +
  row(caps.length > 0, "A finished capstone", caps.length ? caps[0].title : "not submitted yet") +
  row(shipped.length > 0, "Something live", shipped.length + " project" + (shipped.length === 1 ? "" : "s") + " with a working URL");
"""


def career():
    body = CAREER_BODY + section(
        "05", "The honest note",
        honest("<b>Finishing this course does not get you a job.</b> It gets you a live product, a "
               "repo with your commits, written evidence that you can review AI-generated code, and "
               "a specific answer to &ldquo;how do you work with AI?&rdquo;. Whether that converts "
               "depends on your market, your applications and how you talk about the work. Anyone "
               "promising you more than that is selling something."))
    page("career.html", "Career Path", "Career",
         "After the course", "Where this actually leaves you",
         "What you can claim, what you cannot, and how to talk about working with an AI agent without sounding like everyone else.",
         body,
         js("course-progress.js") + "\n" + inline(CAREER_JS))


# ============================================================ cheat sheets
SHEETS = [
    ("HTML", "html", [
        ("Landmarks", "<code>&lt;header&gt;</code> <code>&lt;nav&gt;</code> <code>&lt;main&gt;</code> <code>&lt;footer&gt;</code> once each per page. One <code>&lt;h1&gt;</code>. Headings go down one level at a time."),
        ("A labelled field", "<code>&lt;label for=\"email\"&gt;Email&lt;/label&gt;&lt;input id=\"email\" type=\"email\" required&gt;</code>. The <code>for</code> must equal the <code>id</code>. A placeholder is not a label."),
        ("Images", "<code>alt</code> describes the image for someone who cannot see it. <code>alt=\"\"</code> is correct for decoration. A missing <code>alt</code> is never correct."),
        ("New-tab links", "<code>target=\"_blank\"</code> needs <code>rel=\"noopener noreferrer\"</code>."),
        ("Tables", "<code>&lt;thead&gt;</code> with <code>&lt;th scope=\"col\"&gt;</code>, data in <code>&lt;tbody&gt;</code>. Never for layout."),
    ]),
    ("CSS", "css", [
        ("Box model", "<code>box-sizing: border-box</code> makes <code>width</code> include padding and border. Set it once on <code>*</code> and stop fighting arithmetic."),
        ("Flex row", "<code>display:flex; gap:16px; align-items:center</code>. Use <code>justify-content:space-between</code> to push things apart."),
        ("Two columns", "<code>display:grid; grid-template-columns:1fr 1fr; gap:20px</code>."),
        ("One breakpoint", "<code>@media (max-width:720px){ .row{ flex-direction:column } }</code>. Design the narrow case first and the wide case is easy."),
        ("Centre a column", "<code>max-width:720px; margin-left:auto; margin-right:auto</code>."),
        ("Hide from sight, not from screen readers", "<code>position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%)</code>. <code>display:none</code> hides it from everyone."),
    ]),
    ("JavaScript", "js", [
        ("Function", "<code>function total(items){ return items.reduce(function(t,i){ return t + i.price * i.quantity; }, 0); }</code>. The <code>0</code> is why an empty array does not throw."),
        ("Guard the input", "<code>const rows = list || [];</code> then work with <code>rows</code>. Most AI bugs are a missing value, not a wrong algorithm."),
        ("Arrays", "<code>filter</code> keeps some, <code>map</code> changes each, <code>reduce</code> collapses to one, <code>find</code> returns the first or <code>undefined</code>."),
        ("Compare text properly", "<code>a.trim().toLowerCase() === b.trim().toLowerCase()</code>. Users paste values with spaces and capitals."),
        ("Round money in pence", "Work in integers. <code>Math.round(x*100)/100</code> on floats will lose you a penny and it will be the penny somebody notices."),
        ("Read the console", "<code>console.log(\"label\", value)</code>, then delete it before you commit. A stray log with an email in it is a real finding in review."),
    ]),
    ("The DOM and events", "dom", [
        ("Find and change", "<code>document.querySelector(\"#list\")</code>, then <code>el.textContent = \"3 appointments\"</code>. Use <code>textContent</code>, not <code>innerHTML</code>, for anything a person typed."),
        ("Listen", "<code>btn.addEventListener(\"click\", function(e){ e.preventDefault(); ... })</code>. On a form submit, <code>preventDefault</code> or the page reloads."),
        ("Build rows", "Create elements and <code>appendChild</code>, or build a string and assign <code>innerHTML</code> once. Never <code>innerHTML +=</code> in a loop."),
        ("Data that arrives late", "<code>fetch(\"appointments.json\").then(r =&gt; r.json())</code> and handle three states: loading, error, empty. Agents usually write one."),
    ]),
    ("Requirements", "specs", [
        ("Acceptance criterion", "<b>Given</b> a state, <b>When</b> an action, <b>Then</b> an observable result. If a stranger cannot run it, it is not a criterion."),
        ("User story", "As a <i>named role</i>, I want <i>a thing</i>, so that <i>an outcome</i>. &ldquo;As a user&rdquo; tells you nothing."),
        ("Words that are not requirements", "Polished, intuitive, clean, modern, better, seamless. None of them can fail a test."),
        ("Always write the exclusions", "&ldquo;Not touching payments. No redesign. No SMS reminders.&rdquo; Out-of-scope is how a two-day ticket stays a two-day ticket."),
        ("Edge cases to ask about every time", "Empty, missing, whitespace, very long, duplicate, wrong type, slow network, and the boundary itself."),
    ]),
    ("Git", "git", [
        ("Where am I", "<code>git status</code>, then <code>git diff</code> to read the actual lines. Over-use both."),
        ("Branch before a risky change", "<code>git switch -c notes-feature</code>."),
        ("Commit one reason", "<code>git add hours.html</code> then <code>git commit -m \"correct Saturday opening hours\"</code>. <code>git add .</code> sweeps in whatever else you left lying around."),
        ("Publish", "<code>git push -u origin notes-feature</code> the first time, <code>git push</code> after that."),
        ("Undo, safely", "<code>git restore --staged file</code> unstages and keeps your edits. <code>git revert &lt;sha&gt;</code> undoes a published commit. <code>reset --hard</code> and <code>push --force</code> destroy work, including other people's."),
        ("Abandon a bad agent session", "<code>git switch main</code> then <code>git branch -D notes-feature</code>. This is why you branched."),
    ]),
    ("Tests and debugging", "testing", [
        ("A test that cannot fail proves nothing", "Before you trust a test, break the code on purpose and check the test goes red."),
        ("The order", "Reproduce it, write the failing test, then fix it. Fixing first means you never learn whether you fixed the right thing."),
        ("Reproduce from a vague report", "&ldquo;Nothing happened&rdquo; means find the input they had and you did not: an empty field, a pasted space, a date in the past."),
        ("Boundaries", "Test the value at the edge and the one either side. Off-by-one lives exactly there."),
        ("Bisect", "Comment out half. Still broken? The cause is in the half that is left. Repeat. It is unglamorous and it always works."),
    ]),
    ("Reviewing AI code", "review", [
        ("Read the deletions first", "The dangerous hunk is usually a removed guard, not an added feature."),
        ("Nine things worth rejecting", "Removed validation, <code>innerHTML</code> with user text, an empty <code>catch</code>, a hard-coded secret, a leftover <code>console.log</code> with personal data, a magic number, a comment claiming something the diff does not do, no empty state, an arbitrary <code>setTimeout</code> standing in for a real condition."),
        ("Say the consequence", "&ldquo;This is bad&rdquo; is not review. &ldquo;A clinician typing <code>&lt;b&gt;</code> gets it executed&rdquo; is."),
        ("Do not pad the list", "Three real findings mixed with four style preferences get discounted together. Precision is the whole value you add."),
        ("Unrequested changes", "Reject them even when they are improvements. They belong in their own ticket where someone can review them properly."),
    ]),
    ("Python", "python", [
        ("A function", "<code>def total(orders):\n    return sum(o[\"amount\"] for o in orders)</code>. Indentation is the syntax."),
        ("Read a file", "<code>with open(\"in.csv\", encoding=\"utf-8\") as f:</code> then iterate <code>f</code>. The <code>with</code> closes it for you."),
        ("Clean text", "<code>s.strip().lower()</code>. Do it before comparing anything a human typed."),
        ("De-duplicate, keeping the first", "<code>seen = set()</code>, then <code>if key in seen: continue</code> before appending. Keeping the last is a different answer and usually the wrong one."),
        ("JSON", "<code>json.load(f)</code> to read, <code>json.dump(data, f, indent=2)</code> to write."),
        ("Assert while you build", "<code>assert clean([{\"email\": \"\"}]) == []</code> at the bottom of the file catches a regression the moment you cause it."),
    ]),
]

SHEET_BODY_HEAD = """  <section>
    <div class="kh"><span class="num">00</span><h2>How to use these</h2></div>
    <p class="mut">Not for memorising. These are the things worth checking when you are reading a diff and something feels off, and the syntax you will forget the exact shape of at exactly the wrong moment. Every entry maps to a practice library, so if one of these is unfamiliar there are reps for it.</p>
  </section>
"""


def cheatsheets():
    body = SHEET_BODY_HEAD
    libs = {
        "html": "practice-html.html", "css": "practice-css.html", "js": "practice-js.html",
        "dom": "practice-js.html", "specs": "practice-specs.html", "git": "practice-git.html",
        "testing": "practice-testing.html", "review": "practice-review.html",
        "python": "practice-python.html",
    }
    for i, (title, key, items) in enumerate(SHEETS, start=1):
        rows = "".join('    <div class="def"><div class="k">%s</div><p>%s</p></div>\n' % (k, v)
                       for k, v in items)
        rows += ('    <p class="mut" style="margin-top:12px">Reps: <a href="%s">%s practice</a></p>\n'
                 % (libs[key], title))
        body += section("%02d" % i, title, rows)
    body += section("10", "AI Code Detective",
                    '    <div class="def"><div class="k">The categories that catch real defects</div>'
                    "<p>Logic error, missing validation, unhandled edge case, wrong assumption, "
                    "security hole, silent failure, misleading comment.</p></div>\n"
                    '    <div class="def"><div class="k">The categories that usually do not</div>'
                    "<p>Naming preferences, <code>reduce</code> versus <code>for</code>, "
                    "&ldquo;a Map would be cleaner&rdquo;, and performance worries at a scale that "
                    "does not exist. They are sometimes right and they are rarely the reason to "
                    "reject.</p></div>\n"
                    '    <p class="mut" style="margin-top:12px">Reps: <a href="practice-detective.html">eight cases</a></p>\n')
    page("cheatsheets.html", "Cheat Sheets", "Cheat sheets",
         "Reference", "The things you will forget",
         "Ten sheets, each one the short version of a module. Skim before an exercise, search during one.",
         body, js("course-progress.js"))


# ============================================================ deploy guide
DEPLOY_BODY = """  <section>
    <div class="kh"><span class="num">01</span><h2>GitHub Pages, start to finish</h2></div>
    <p class="mut">Free, no build step, and it works with exactly the files you already have.</p>
    <div class="checklist">
      <div class="check"><b>1.</b> Push your project to a GitHub repository. Your <code>index.html</code> must be at the top level of the repo, not inside a folder.</div>
      <div class="check"><b>2.</b> On the repo page open <b>Settings</b>, then <b>Pages</b> in the left sidebar.</div>
      <div class="check"><b>3.</b> Under <b>Source</b> choose <b>Deploy from a branch</b>, pick <code>main</code> and the <code>/ (root)</code> folder, and save.</div>
      <div class="check"><b>4.</b> Wait. The first deploy takes a couple of minutes. The URL appears at the top of the same page.</div>
      <div class="check"><b>5.</b> Open the URL on your phone, not just your laptop. This is where a broken image path or a missing breakpoint shows up.</div>
    </div>
  </section>

  <section>
    <div class="kh"><span class="num">02</span><h2>Why it works locally and breaks live</h2></div>
    <div class="def"><div class="k">Capital letters in filenames</div><p>Windows treats <code>Logo.png</code> and <code>logo.png</code> as the same file. The server does not. This is the single most common cause of a missing image after deploying.</p></div>
    <div class="def"><div class="k">A path off your own disk</div><p><code>src="C:/Users/you/Desktop/logo.png"</code> works perfectly on your machine and nowhere else. Every path must be relative to the project folder.</p></div>
    <div class="def"><div class="k">A file you never committed</div><p>It exists locally, so the page works locally. Run <code>git status</code> before you assume the deploy is broken.</p></div>
    <div class="def"><div class="k">Fetching a file that is not there</div><p>A missing <code>appointments.json</code> is a 404, and a 404 body is HTML, so <code>r.json()</code> throws a parse error rather than saying &ldquo;not found&rdquo;. Check the Network tab.</p></div>
  </section>

  <section>
    <div class="kh"><span class="num">03</span><h2>Before you call it shipped</h2></div>
    <div class="checklist">
      <div class="check">Opened the live URL in a private window, so nothing is coming from your cache</div>
      <div class="check">Opened it on a phone-sized screen and read the whole page without pinching</div>
      <div class="check">Console is clean: no errors, and no leftover logging</div>
      <div class="check">Every link and image loads from the live URL, not from your disk</div>
      <div class="check">The form does the right thing when submitted empty</div>
      <div class="check">The empty state appears when a filter matches nothing</div>
      <div class="check">Your tests still pass against the code you actually deployed</div>
      <div class="check">The repo has a README saying what this is and how to run it</div>
    </div>
  </section>
"""


def deploy_guide():
    body = DEPLOY_BODY + section(
        "04", "The rollback you should have ready",
        note("Before the demo, know the answer to &ldquo;it is broken and the client is on the "
             "phone&rdquo;. With Git it is <code>git revert &lt;sha&gt;</code> then "
             "<code>git push</code>, which puts the previous behaviour back without rewriting "
             "history anyone else has. Module 13 asks you to write this down as part of the release "
             "plan, because deciding it under pressure is how people force-push main."))
    page("deploy-guide.html", "Deploy Guide", "Deploy",
         "Ship it", "Getting it on a real URL",
         "The capstone needs a link someone else can open. This is the whole process and the four reasons it usually fails.",
         body, js("course-progress.js"))


# ======================================================= final assessment
FINAL_BODY = """  <section>
    <div class="kh"><span class="num">01</span><h2>Eligibility</h2></div>
    <div id="faGate" style="margin-top:12px"></div>
  </section>

  <section>
    <div class="kh"><span class="num">02</span><h2>Ten questions</h2></div>
    <p class="mut">Drawn from the later banks: the loop, AI failure modes, review, testing, refactoring, security and release. Judgement, not recall.</p>
    <div id="quizRoot" style="margin-top:16px"></div>
    <div id="faOut" style="margin-top:20px"></div>
  </section>
"""

FINAL_JS = """
const Q = AISEQuizData.MODULE_QUIZZES;
const ov = CourseProgress.overall();
const capDone = CourseProgress.PROJECTS.some(function (p) {
  return p.modules.indexOf(CourseProgress.CAPSTONE_ID) !== -1 && CourseProgress.getProject(p.id).completed;
});
const eligible = ov.completed === ov.total && capDone;

document.getElementById("faGate").innerHTML =
  '<div class="gaterow"><span class="' + (ov.completed === ov.total ? "gok" : "gno") + '">' +
  (ov.completed === ov.total ? "\\u2713" : "\\u25cb") + "</span><span><b>All modules complete</b> &mdash; " +
  ov.completed + " of " + ov.total + "</span></div>" +
  '<div class="gaterow"><span class="' + (capDone ? "gok" : "gno") + '">' + (capDone ? "\\u2713" : "\\u25cb") +
  "</span><span><b>A capstone submitted and marked finished</b> &mdash; on the " +
  "<a href='projects.html'>projects page</a></span></div>" +
  (eligible ? "" : '<p class="mut" style="margin-top:10px">You can still take it now. It just means less when the work behind it is not done.</p>');

let pool = [];
[7, 8, 9, 10, 11, 12, 13].forEach(function (k) { if (Q[k]) pool = pool.concat(Q[k]); });
if (AISEQuizData.CENTER_EXTRA) pool = pool.concat(AISEQuizData.CENTER_EXTRA);
for (let i = pool.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
}
ModuleKit.renderQuiz("final", pool.slice(0, 10), null, function (res) {
  const pct = res.total ? Math.round((res.score / res.total) * 100) : 0;
  CourseProgress.setExtra("finalAssessment", { score: res.score, total: res.total, pct: pct, at: Date.now() });
  document.getElementById("faOut").innerHTML = '<div class="def"><div class="k">' + pct + '%</div><p>' +
    (pct >= 80
      ? "Recorded. Now go and make sure the <a href='portfolio.html'>portfolio</a> behind it is something you would send to a stranger, because that is what actually gets read."
      : "Recorded. Under 80% here usually means one specific module rather than a general gap \\u2014 the explanations name which, and the <a href='quiz-center.html'>quiz centre</a> will drill that bank.") +
    "</p></div>";
});
"""


def final_assessment():
    body = FINAL_BODY + section(
        "03", "What this is worth",
        honest("<b>This is not a certification.</b> Ten multiple-choice questions cannot demonstrate "
               "that you can build software, which is why it is the last thing on the course rather "
               "than the point of it. The capstone is the assessment. This is a check that the "
               "judgement travelled."))
    page("final-assessment.html", "Final Assessment", "Final",
         "The end", "Final assessment",
         "Ten items from the later banks. The real assessment was the thing you shipped.",
         body,
         js("course-progress.js", "quiz-data.js", "module-kit.js") + "\n" + inline(FINAL_JS))


# ============================================================ ticket board
TICKETS_BODY = """  <section>
    <div class="kh"><span class="num">01</span><h2>Your queue</h2></div>
    <p class="mut" id="boardIntro">&mdash;</p>
    <div id="ticketBoard" class="ticketboard" style="margin-top:18px"></div>
  </section>
"""

# The old hand-written version of this page named ticket numbers and a gating
# module in prose, so restructuring left it claiming #009 waited on Module 8.
# The numbers below are counted, and the gate sentence is assembled from the
# same CAPSTONE_ID everything else uses.
TICKETS_JS = """
Northline.renderBoard("ticketBoard");
const cap = CourseProgress.ticketFor(CourseProgress.CAPSTONE_ID);
const total = CourseProgress.MODULES.filter(function (m) {
  return !!CourseProgress.ticketFor(m.id);
}).length;
document.getElementById("boardIntro").innerHTML =
  "You are the junior developer. " + total + " tickets, one per module, in the order Northline would " +
  "actually hand them to you. A ticket is done when the module's quiz and its graded exercise are both " +
  "passed \\u2014 not when you have read it. " +
  (cap ? "The last one, <b>" + CourseProgress.escapeHtml(cap.id) + "</b>, also waits on the practice bar and both Desktop Labs." : "");
"""


def tickets():
    body = TICKETS_BODY + section(
        "02", "Why it is a board and not a syllabus",
        '    <p>Real work does not arrive as “Chapter 4: Arrays”. It arrives as a person with a '
        "problem, usually described badly, often with a deadline attached. Every module here starts "
        "from the sentence Priya or Dan actually said, and part of the work is deciding what they "
        "meant.</p>\n"
        + note("Northline Digital and Northline Clinic are invented. The tickets are not: every one "
               "is a shape of request you will get, including the vague one and the one that is "
               "already someone else's half-finished AI-written pull request."))
    page("tickets.html", "Ticket board", "Tickets",
         "Northline Digital", "Ticket board",
         "Thirteen client tickets. You are the junior developer with an AI pair programmer.",
         body,
         js("course-progress.js", "northline.js") + "\n" + inline(TICKETS_JS))


if __name__ == "__main__":
    dashboard()
    tickets()
    syllabus()
    roadmap()
    mastery()
    diagnostic()
    quiz_center()
    desktop_labs()
    projects()
    portfolio()
    career()
    cheatsheets()
    deploy_guide()
    final_assessment()
