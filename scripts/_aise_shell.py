"""Shared page shell for the AI-Assisted Software Engineering course.

Every module page has the same chrome: brand bar, course nav, hero with the
Northline ticket card and the loop strip, a "why care" grid, teaching
sections, one graded exercise, a checkpoint, and the sticky next button.

Keeping that in one template is the only reason 14 pages stay consistent.
Content lives in the per-stage generators; this file owns structure only.
"""

HEAD = """<!DOCTYPE html>
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
"""

FOOT = """<footer>Zenith Lab &middot; AI-Assisted Software Engineering</footer>
</div>
{scoreboard}
{scripts}
<script src="course-rail.js"></script>
</body>
</html>
"""

DEFAULT_NAV = ('<a href="dashboard.html">&larr; Dashboard</a>'
               '<a href="tickets.html">Ticket board</a>'
               '<a href="syllabus.html">Syllabus</a>'
               '<a href="cheatsheets.html">Cheat sheets</a>'
               '<a href="desktop-labs.html">Desktop Labs</a>')


def page(title, tag, body, nav=DEFAULT_NAV, scoreboard="", scripts=""):
    return HEAD.format(title=title, tag=tag, nav=nav) + body + FOOT.format(
        scoreboard=scoreboard, scripts=scripts)


def kh(num, heading):
    return '  <div class="kh"><span class="num">%s</span><h2>%s</h2></div>\n' % (num, heading)


def section(num, heading, html):
    return "  <section>\n" + kh(num, heading) + html + "\n  </section>\n"


def objectives(items):
    lis = "\n".join("        <li>%s</li>" % i for i in items)
    return ('    <div class="objectives"><div class="lbl">By the end of this module you can</div>\n'
            "      <ul>\n%s\n      </ul>\n    </div>\n" % lis)


def trap(html):
    """A place the coding agent reliably gets this topic wrong."""
    return '    <div class="honestnote"><b>Where the agent trips.</b> %s</div>\n' % html


def note(html):
    return '    <div class="disclosure">%s</div>\n' % html


def defbox(k, html):
    return '    <div class="def"><div class="k">%s</div><p>%s</p></div>\n' % (k, html)


def code(text):
    esc = (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
    return "    <pre>%s</pre>\n" % esc


SCOREBOARD = """<div class="scoreboard"><div class="in">
  <span class="sc" id="scoreDisplay">Checkpoint: &mdash;</span>
  <a id="btnNext" class="primary nextbtn isdisabled" aria-disabled="true" style="text-decoration:none;margin-left:auto">Finish the exercise and checkpoint (80%) to continue</a>
</div></div>"""


def module_page(num, stage_label, minutes, title, sub, objectives_list, why,
                sections_html, exercise_html, exercise_js, next_file=None,
                extra_scripts=(), extra_head_scripts=()):
    """Assemble one module page.

    `why` is the five-cell grid every module owes the student: what they
    build, why it matters, where AI helps, where AI fails, and what they
    must do without AI.
    """
    hero = (
        '  <header class="hero">\n'
        '    <span class="eyebrow">%s &middot; Module %d &middot; ~%d min</span>\n'
        '    <h1 class="serif">%s</h1>\n'
        '    <p class="sub">%s</p>\n'
        '    <div id="ticketCard"></div>\n'
        '    <div id="loopStrip"></div>\n'
        "%s"
        "  </header>\n" % (stage_label, num, minutes, title, sub, objectives(objectives_list))
    )
    why_section = section("00", "Why you should care", '    <div id="whyGrid"></div>\n')
    exercise = section("EX", "Graded exercise", exercise_html)
    checkpoint = section(
        "CP", "Checkpoint",
        '    <p class="mut">Five questions. You need 80% to move on. Getting one wrong is '
        "information, not failure &mdash; read the explanation.</p>\n"
        '    <div id="quizRoot"></div>\n'
        '    <div style="margin-top:22px"><div class="ov-lbl">To finish this module</div><div id="reqList"></div></div>\n'
    )
    body = hero + why_section + sections_html + exercise + checkpoint

    scripts = "\n".join(
        ['<script src="course-progress.js"></script>',
         '<script src="northline.js"></script>',
         '<script src="quiz-data.js"></script>',
         '<script src="practice-kit.js"></script>']
        + ['<script src="%s"></script>' % s for s in extra_scripts]
        + ['<script src="module-kit.js"></script>',
           "<script>",
           "Northline.renderWhy('whyGrid', %s);" % _js_obj(why),
           "const MK = ModuleKit.mount(%d, AISEQuizData.MODULE_QUIZZES[%d]);" % (num, num),
           "</script>",
           "<script>",
           exercise_js,
           "</script>"]
    )
    return page(
        title="Module %d — %s" % (num, title),
        tag="Module %d" % num,
        body=body,
        scoreboard=SCOREBOARD,
        scripts=scripts,
    )


def _js_obj(d):
    import json
    return json.dumps(d, ensure_ascii=False)


def write(path, text):
    import io
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("wrote %s (%d lines)" % (path, text.count("\n") + 1))
