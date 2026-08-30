# -*- coding: utf-8 -*-
"""Stage 5: ship it. Python tooling, then release and the capstone."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _aise_shell import section, module_page, write, trap, note, defbox, code

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "courses", "ai-assisted-software-engineering")

# ----------------------------------------------------------------- Module 12

M12 = (
    section("01", "Before you touch AI", """    <p>4,000 rows. Duplicate emails, blank rows, mixed capitals. Before anyone writes a script, decide what \u201cthe same person\u201d means and what a tool is not allowed to do to the original file.</p>
    <div id="beforeAi" class="interactive"></div>
    <div id="detectives" style="margin-top:16px"></div>
    <div id="wfCompare" class="interactive" style="margin-top:16px"><div class="ilbl">Choose the better request &middot; labelled simulation</div></div>
"""),

    section("02", "Why a second language, and why this one", """    <p>Dan has a 4,000-row export from the old booking system. Duplicates, blank rows, emails in six different capitalisations. Nobody is fixing that by hand, and it is not a job for the website.</p>
    <p>This is the category of work Python owns: <b>a script that reads a file, does something to it, and writes a file out.</b> Data cleanup, renaming a thousand images, pulling numbers off an API into a spreadsheet, generating a report every Monday. JavaScript can do all of it; Python is simply less ceremony for this shape of problem, and it is what the rest of the industry reaches for.</p>
    <p>You already know how to program. Almost everything from Module 5 transfers directly &mdash; variables, functions, conditions, loops, collections. What changes is spelling and a few habits.</p>
""" + code("""// JavaScript                        # Python
const total = 0;                      total = 0
function add(a, b) { return a + b; }  def add(a, b):
                                          return a + b
if (x > 3) { ... }                    if x > 3:
                                          ...
items.forEach(i => { ... })           for i in items:
                                          ...
[1, 2, 3]                             [1, 2, 3]
{ name: "Priya" }                     {"name": "Priya"}
null                                  None
true / false                          True / False""") + """    <p>The one difference that will actually bite you: <b>indentation is the syntax</b>. Python has no braces. The block is whatever is indented under the <code>def</code> or the <code>if</code>. Get it wrong and the code does something different, not nothing.</p>
"""),

    section("03", "Lists, dictionaries, and the shape of messy data", """    <p>Two collections carry most of the weight, and the export you are about to clean is made of both: a <b>list</b> of rows, where each row is a <b>dictionary</b>.</p>
""" + code("""rows = [
    {"name": "Priya Raman", "email": "P.Raman@Northline.co "},
    {"name": "Priya Raman", "email": "p.raman@northline.co"},
    {"name": "", "email": ""},
]

for row in rows:
    print(row["email"])          # square brackets, like JS
    print(row.get("phone"))      # None instead of an error, if absent""") + """    <p>Look at the first two rows. To a computer comparing strings they are different: different capitals, a trailing space. To a human they are obviously the same person, which is why the email will get sent twice and Dan will hear about it.</p>
    <p>So <b>normalise before you compare</b>. Not after, not sometimes:</p>
""" + code("""key = row["email"].strip().lower()   # "p.raman@northline.co"

seen = set()                          # a set remembers what it has seen
if key not in seen:
    seen.add(key)
    keep.append(row)""") + defbox("The pattern behind almost every cleanup script", "Walk the rows once. For each row, build a normalised key. If you have not seen that key, keep the row and remember the key. That is deduplication, and it is worth recognising because you will write it in some form for the rest of your career.")),

    section("04", "A script is a tool other people run", """    <p>The moment a script does something useful, someone else runs it &mdash; and \u201csomeone else\u201d includes you in four months. Three things make that survivable.</p>
    <p><b>Take input, do not hardcode it.</b> A path baked into line 3 is a script that works exactly once.</p>
""" + code("""import argparse

parser = argparse.ArgumentParser(description="Clean a booking export.")
parser.add_argument("infile")
parser.add_argument("outfile")
args = parser.parse_args()

# python clean.py messy.csv clean.csv""") + """    <p><b>Never overwrite the input.</b> Read one file, write a different one. A cleanup script with a bug that has already eaten the only copy of the original data is a bad afternoon that no amount of care afterwards can undo.</p>
    <p><b>Say what it did.</b> <code>print(f"Read {len(rows)} rows, wrote {len(clean)}, removed {len(rows) - len(clean)}")</code>. Silence is indistinguishable from failure. And this is the number Dan will ask you for.</p>
""" + trap("Ask an agent for a cleanup script and it will very often write one that reads and writes the same path, or that assumes every row has every column. It also loves <code>except: pass</code>, which converts \u201cthis file was malformed\u201d into \u201cthe file was fine, here are 200 rows instead of 4,000\u201d. Silent data loss is the worst failure mode there is, because nothing tells you it happened.")),

    section("05", "Tools need tests more than web pages do", """    <p>Counter-intuitive but true. If a web page breaks, someone sees it break. If a cleanup script breaks, it produces a file &mdash; a plausible-looking file, with the wrong contents, that goes on to be used for something.</p>
    <p>You do not need a framework to start. A function, a few assertions, run it:</p>
""" + code("""def test_clean_rows():
    rows = [
        {"name": "A", "email": "a@x.co"},
        {"name": "A", "email": "A@X.CO "},     # same person
        {"name": "", "email": ""},             # blank row
    ]
    out = clean_rows(rows)
    assert len(out) == 1, f"expected 1 row, got {len(out)}"
    assert out[0]["email"] == "a@x.co", "email should be normalised"

test_clean_rows()
print("ok")""") + """    <p>Now break <code>clean_rows</code> on purpose and run it again. If it still prints <code>ok</code>, your test is decoration &mdash; the same check from Module 9, and it applies to every test you will ever write, in any language.</p>
""" + note("The exercise below runs real CPython in your browser, compiled to WebAssembly. It is genuinely executing your code, not pattern-matching it, which is why the first run takes a few seconds to warm up.")),

    section("06", "Where this goes next", """    <p>You are not going to become a Python specialist from one module, and you do not need to. What you have is the ability to recognise the shape of problem Python suits and write a small, tested, honest tool for it.</p>
    <p>The natural next steps, when a real need appears:</p>
    <ul class="plain">
      <li><b><code>csv</code> and <code>json</code></b> from the standard library. Reading tabular data properly, rather than splitting on commas and discovering that one of the names contains a comma.</li>
      <li><b><code>pathlib</code></b> for files and folders without string-concatenating paths.</li>
      <li><b><code>requests</code></b> for pulling data from an API.</li>
      <li><b><code>pytest</code></b> when a handful of asserts stops being enough.</li>
    </ul>
    <p>And the habit that matters more than any library: when you reach for an agent to write a script, you still specify the behaviour, you still read what came back, and you still write the test that would catch it being wrong. The language changed. The loop did not.</p>
"""),
)

M12_EX = """    <p>Ticket <b>NL-012</b>: <i>"4,000 rows from the old system. Duplicate emails, blank rows, inconsistent capitalisation. I need one clean file and I need to know how many rows you dropped."</i></p>
    <div class="interactive">
      <div class="ilbl">Required exercise &middot; pythonToolExercise &middot; real CPython</div>
      <p>Write <code>clean_rows(rows)</code>. It takes a list of dictionaries and returns a new list where:</p>
      <ul class="plain">
        <li>rows with a blank or missing email are dropped</li>
        <li>duplicates are removed by email compared <b>after</b> stripping whitespace and lowercasing</li>
        <li>the <b>first</b> occurrence of each email survives, in its original position</li>
        <li>the surviving row's <code>email</code> is stored stripped and lowercased</li>
      </ul>
      <p class="mut">Hidden tests include the cases an agent usually misses: the blank row, a row with no <code>email</code> key at all, the trailing space, and keeping the first occurrence rather than the last.</p>
      <p class="mut">One thing the grader cannot check but a reviewer would: build a new dictionary rather than editing the one you were handed. Writing <code>row["email"] = key</code> silently changes the caller's data, which is exactly the class of surprise that makes a shared function untrustworthy.</p>
      <div class="formrow"><label>clean.py</label><textarea id="m12py" spellcheck="false" style="min-height:220px">def clean_rows(rows):
    clean = []
    seen = set()
    for row in rows:
        pass
    return clean
</textarea></div>
      <button class="primary" id="m12run" style="margin-top:12px">Run in CPython</button>
      <p class="mut" id="m12note" style="margin-top:8px">First run downloads the Python interpreter. Give it a few seconds.</p>
      <div class="feedback" id="m12fb"></div>
    </div>
    <p class="mut" style="margin-top:14px">More reps: <a href="practice-python.html">Python practice</a> &middot; the finished tool is portfolio project <a href="projects.html">"CSV Cleaner"</a>.</p>
"""

M12_JS = """Northline.renderPrediction("beforeAi", {
  label: "Predict first \\u00b7 what clean means",
  questions: [
    { q: "P.Raman@Northline.co[space] and p.raman@northline.co. Same person?",
      opts: [
        { t: "Yes, after strip and lower. Compare the normalised key, store the normalised email.", correct: true,
          whyOk: "To a computer they are different strings. To Dan they are one inbox, twice." },
        { t: "No. Different spelling means different people.", why: "Capitals and a trailing space are not a different person." },
        { t: "Keep both and let Priya decide.", why: "That is the Monday chore this ticket exists to kill." }
      ] },
    { q: "The agent writes a script that reads and writes the same path, with except: pass around the load. Ship it?",
      opts: [
        { t: "No. A wrong run eats the only export, and a malformed file becomes a silent success.", correct: true,
          whyOk: "Two failure modes in two lines. Read one path, write another, and say what you did." },
        { t: "Yes if it prints ok at the end.", why: "ok is what except: pass is designed to print." },
        { t: "Yes if you keep a backup on your desktop.", why: "Your desktop is not the tool. The tool has to be safe when someone else runs it." }
      ] }
  ],
  learned: ["You defined same-person and non-negotiable safety before anyone wrote Python.",
    "Normalise before you compare. Never overwrite the input."]
});
Northline.renderDetectiveSet(["pyExceptPass", "pyOverwrite"], "detectives");
Northline.renderWorkflowCompare("wfCompare", {
  situation: "You are about to ask an agent for the cleanup script. First message?",
  bad: { t: "Write a Python script that cleans our booking export. Make it robust.",
    why: "Robust will arrive as except: pass and a single path. You will not see the data-loss until Monday." },
  good: { t: "Write clean_rows(rows) only. Drop blank or missing emails. Dedupe by email after strip and lower, keep the first occurrence, store the normalised email. Return a new list. Do not mutate the input rows. Do not write any files. Include a test that fails if A@X.CO[space] and a@x.co both survive.",
    why: "One function, the normalisation rule, first-vs-last, and a test that can fail. Files come after the function is proven." }
});
document.getElementById("m12run").onclick = function () {
  var btn = this;
  btn.disabled = true;
  btn.textContent = "Running in CPython\\u2026";
  var fb = document.getElementById("m12fb");
  fb.className = "feedback";
  fb.innerHTML = "Starting the interpreter\\u2026";
  PracticeKit.gradePython({
    functionName: "clean_rows",
    testCases: [
      { name: "an exact duplicate email is removed",
        args: [[{ name: "A", email: "a@x.co" }, { name: "A", email: "a@x.co" }]],
        expected: [{ name: "A", email: "a@x.co" }] },
      { name: "capitalisation and trailing spaces still count as the same person",
        args: [[{ name: "A", email: "a@x.co" }, { name: "A", email: "A@X.CO " }]],
        expected: [{ name: "A", email: "a@x.co" }] },
      { name: "the stored email is normalised, not left as typed",
        args: [[{ name: "P", email: "  P.Raman@Northline.co " }]],
        expected: [{ name: "P", email: "p.raman@northline.co" }] },
      { name: "a blank email is dropped",
        args: [[{ name: "", email: "" }, { name: "B", email: "b@x.co" }]],
        expected: [{ name: "B", email: "b@x.co" }] },
      { name: "a whitespace-only email is dropped",
        args: [[{ name: "C", email: "   " }, { name: "B", email: "b@x.co" }]],
        expected: [{ name: "B", email: "b@x.co" }] },
      { name: "a missing email key does not crash the run",
        args: [[{ name: "D" }, { name: "B", email: "b@x.co" }]],
        expected: [{ name: "B", email: "b@x.co" }] },
      { name: "the FIRST occurrence survives, not the last",
        args: [[{ name: "First", email: "a@x.co" }, { name: "Second", email: "a@x.co" }]],
        expected: [{ name: "First", email: "a@x.co" }] },
      { name: "original order is preserved",
        args: [[{ name: "1", email: "c@x.co" }, { name: "2", email: "a@x.co" }, { name: "3", email: "b@x.co" }]],
        expected: [{ name: "1", email: "c@x.co" }, { name: "2", email: "a@x.co" }, { name: "3", email: "b@x.co" }] },
      { name: "an empty list returns an empty list",
        args: [[]], expected: [] }
    ]
  }, document.getElementById("m12py").value, function (out) {
    btn.disabled = false;
    btn.textContent = "Run in CPython";
    document.getElementById("m12note").hidden = true;
    ModuleKit.showResults(fb, out);
    if (out.passed) {
      fb.innerHTML = "<b>That is a tool Dan can run on the real export.</b> It survives the blank row, treats <code>A@X.CO </code> and <code>a@x.co</code> as one person, and keeps the first occurrence rather than the last \\u2014 which is the difference between the original record and whatever got typed second.<br><br>" +
        out.results.map(function (r) { return "\\u2713 " + r.name; }).join("<br>");
      CourseProgress.setSection(12, "pythonToolExercise", { passed: true, at: new Date().toISOString() });
      Northline.showLearned(fb.parentNode,
        "You just shipped a tool Dan can run on the real export.",
        "Blank rows drop, capitals collapse, the first record wins. That is the Monday chore, finished.");
      MK.sync();
    }
  });
};"""

write(os.path.join(OUT, "module-12.html"), module_page(
    num=12, stage_label="Stage 5", minutes=60,
    title="Python for tools and automation",
    sub="4,000 rows of duplicated, blank, inconsistently capitalised booking data. Not a job for a web page, and not a job for a human.",
    objectives_list=[
        "Read and write Python having learned JavaScript, including the indentation rule",
        "Work with lists of dictionaries, the shape almost all real data arrives in",
        "Normalise before comparing, and explain why deduplication fails without it",
        "Write a script that takes arguments, never overwrites its input, and reports what it did",
        "Write assertions for a tool, and check that they can fail",
    ],
    why={
        "build": "clean_rows() \u2014 a real deduplicator, graded by CPython running in your browser.",
        "why": "Most automation, data work, and glue in the industry is written in Python. This is also the shape of task agents are asked for most.",
        "aiHelps": "Boilerplate: argparse, csv reading, file handling. It is fast at all of it.",
        "aiFails": "Reading and writing the same path, assuming every row has every column, and bare except: pass turning malformed data into silent data loss.",
        "without": "You write the dedupe logic. The hidden tests are the three cases agents miss: the blank row, the trailing space, and first-versus-last.",
    },
    sections_html="".join(M12),
    exercise_html=M12_EX,
    exercise_js=M12_JS,
    extra_scripts=("pyodide-sandbox-runner.js", "detective-kit.js"),
))

# ----------------------------------------------------------------- Module 13

M13 = (
    section("01", "Before you declare it shipped", """    <p>Dan wants a live URL, notes he can read on a phone, and a way back. Before you paste a URL, decide what \u201cshipped\u201d excludes, and what you write down while you are still calm.</p>
    <div id="beforeAi" class="interactive"></div>
"""),

    section("02", "\u201cDone\u201d has a specific meaning", """    <p>There is a gap between "it works on my laptop" and "it works", and almost everything painful in software lives in that gap.</p>
    <p>On your machine the file paths are yours, the data is the sample you have been testing with, the browser is the one you always use, the connection is instant, and you know which order to click things in. None of that is true for anyone else. Shipping is the act of finding out which of those assumptions you were relying on.</p>
    <p>Which is why the definition of done is not "I finished writing it" but something closer to:</p>
    <div class="callout">Someone who has never seen this can reach it, use it for its intended purpose, and not hit a broken state &mdash; and if they do, you can put it back the way it was within a few minutes.</div>
    <p>That last clause is the one people forget, and it is the one that separates a nervous release from a routine one.</p>
"""),

    section("03", "What deploying a static site actually does", """    <p>Your site is files: HTML, CSS, JavaScript, images. Deploying means putting those files on a computer that is always on and has a public address. That is the entire concept. The tooling around it is convenience.</p>
    <p>Two routes worth knowing, both free for this:</p>
    <ul class="plain">
      <li><b>GitHub Pages.</b> Your repository already holds the files. Turn Pages on and GitHub serves them at a URL. Push to the branch and the live site updates. Nothing to configure.</li>
      <li><b>Netlify or Vercel.</b> Connect the repository once; every push triggers a deploy, and each gets its own preview URL. The preview URLs are the genuinely useful part &mdash; you can send Dan a link to a change before it is live.</li>
    </ul>
    <p>Both give you the property that matters: <b>the live site is a function of what is in Git.</b> No dragging files over FTP, no wondering which version is up there. If it is in the branch, it is live; if it is not, it is not.</p>
""" + trap("Local paths. <code>&lt;img src='C:/Users/you/Desktop/logo.png'&gt;</code> works perfectly on your machine and is a broken image for the entire rest of the world. Same for <code>file:///</code> links and any absolute path starting from your own drive. Agents produce these routinely because they have no way to know which files will exist on the server. Always open the deployed URL, not the local file.")),

    section("04", "The pre-flight checklist", """    <p>Run this before every release. It takes five minutes and it catches the things that generate a phone call.</p>
    <ul class="plain">
      <li><b>Open the deployed URL, not your local file.</b> Different origin, different paths, different behaviour.</li>
      <li><b>Open it on an actual phone.</b> Not just a narrow browser window. Real touch targets, real fonts, real network.</li>
      <li><b>Check the console for errors.</b> A red error the user cannot see is still a broken feature.</li>
      <li><b>Use the main path with a keyboard only.</b> Tab to the form, fill it, submit it. If you cannot, some of your users cannot.</li>
      <li><b>Submit the form empty, and with nonsense.</b> Then with something valid.</li>
      <li><b>Check every link and image.</b> This is where the local paths surface.</li>
      <li><b>Run your tests one more time.</b> On the branch you are actually shipping.</li>
      <li><b>Confirm no secrets and no personal data</b> in the repo, the logs, or the committed files.</li>
    </ul>
""" + defbox("Do it in that order", "Deployed URL first, because everything after it is only meaningful against the version people will actually load. Checking the console on your local copy and then deploying tells you about a site nobody is going to visit.")),

    section("05", "Release notes, and the rollback plan you write before you need it", """    <p>A release note is for the person who did not do the work. Dan reading it on his phone, or you in three months trying to work out when something changed. Four lines:</p>
""" + code("""v1.2.0 - 2026-08-30

Added:   Appointment filtering by status on the clinic page.
Fixed:   NL-009 - Request button did nothing when a field was left untouched.
Changed: Date formatting unified into one function (no behaviour change).
Known:   Filtering is client-side only; with 500+ appointments it will need paging.""")
    + """    <p>That "Known" line is what a professional release note has and an amateur one does not. Naming a limitation before someone finds it turns a bug report into a planned piece of work.</p>
    <p>Then the part that gets skipped: <b>how do you undo this?</b> Write it down before you deploy, while you are calm and nothing is on fire.</p>
    <ul class="plain">
      <li><b>Static site:</b> revert the commit and push, or redeploy the previous deployment. Both are about a minute.</li>
      <li><b>Know which commit was good.</b> "The one before mine" is only obvious to you and only today.</li>
      <li><b>Decide the trigger in advance.</b> What symptom means roll back rather than fix forward? Booking broken is a rollback. A misaligned heading is not.</li>
    </ul>
""" + note("Rolling back is not a failure or an embarrassment. It is the thing that makes shipping frequently safe. Teams that cannot roll back ship rarely and nervously, and their releases are worse for it.")),

    section("06", "After the release, the loop starts again", """    <p>Shipping is not the end of the ticket. It is where the ticket meets reality, and reality has opinions.</p>
    <ul class="plain">
      <li><b>Watch it.</b> For a static site: load it yourself, and ask one person to use it while you are there. Watching someone use your interface for ninety seconds is worth more feedback than any amount of self-testing.</li>
      <li><b>Expect a report you did not anticipate.</b> This is normal and is not a sign you did it badly.</li>
      <li><b>Turn the report into the next ticket.</b> Which puts you back at UNDERSTAND, which is where you started.</li>
    </ul>
    <div id="loopStripEnd"></div>
    <p style="margin-top:16px">That is the whole course. Not a list of technologies &mdash; a loop you can run on any ticket, in any language, with or without an agent. The web knowledge from Stage 2 will date. The Python from Module 12 will date. The loop will not, because it is a description of how you establish that something is correct, and that problem does not change when the tools do.</p>
""" + defbox("What you can now say about yourself, accurately", "Not \u201cI know HTML, CSS and JavaScript.\u201d Anyone can claim that. Instead: <i>\u201cI can take a vague request, turn it into acceptance criteria, drive a coding agent against them, find the bugs in what it produces, prove the fix with a test, review the diff, and ship it with a rollback plan.\u201d</i> That is a considerably rarer sentence, and every clause of it is something you were graded on.")),
)

M13_EX = """    <p>Ticket <b>NL-013</b>: <i>"Ship it. And write me something I can read on my phone that tells me what changed and what to do if it goes wrong."</i></p>
    <p>This is the last graded exercise in the course, and it is deliberately not code. Deploy your site, then write the release the way you would hand it to Dan.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise &middot; releasePlan</div>
      <div class="formrow"><label for="rpUrl">The live URL (https, publicly reachable)</label><input id="rpUrl" type="url" placeholder="https://yourname.github.io/northline-clinic/"></div>
      <div class="formrow" style="margin-top:12px"><label for="rpNotes">Release notes &mdash; Added / Fixed / Changed / Known</label><textarea id="rpNotes" style="min-height:130px" placeholder="Added:   ...&#10;Fixed:   ...&#10;Changed: ...&#10;Known:   ..."></textarea></div>
      <div class="formrow" style="margin-top:12px"><label for="rpVerify">How you verified it, on the deployed URL</label><textarea id="rpVerify" style="min-height:110px" placeholder="The actual steps you took. Which browser, which device, what you submitted, what the console said."></textarea></div>
      <div class="formrow" style="margin-top:12px"><label for="rpRisk">What might break, and what you deliberately did not do</label><textarea id="rpRisk" style="min-height:90px"></textarea></div>
      <div class="formrow" style="margin-top:12px"><label for="rpRollback">The rollback plan &mdash; the mechanism, and the symptom that triggers it</label><textarea id="rpRollback" style="min-height:90px" placeholder="If X happens, I will ... (name the actual command or button, and the known-good commit)"></textarea></div>
      <div class="wf-check" style="margin-top:14px"><label><input type="checkbox" id="rpPhone"> I opened the deployed URL on a real phone, not a narrow browser window</label></div>
      <div class="wf-check"><label><input type="checkbox" id="rpConsole"> I checked the browser console on the deployed site and there are no errors</label></div>
      <div class="wf-check"><label><input type="checkbox" id="rpKeyboard"> I completed the main task using only the keyboard</label></div>
      <button class="primary" id="rpCheck" style="margin-top:14px">Submit the release</button>
      <div class="feedback" id="rpFb"></div>
    </div>

    <div class="interactive" style="margin-top:24px">
      <div class="ilbl">Capstone</div>
      <p>The capstone is assessed on <a href="projects.html">the projects page</a> against the published rubric: spec, review, tests, deploy, write-up. Pick <b>Northline Clinic</b> (the site you have built since Module 3) or <b>Shift Board</b> if you want a harder one.</p>
      <div id="capGate"></div>
    </div>
    <p class="mut" style="margin-top:14px">Reference: <a href="deploy-guide.html">deploy guide</a> &middot; <a href="desktop-labs.html">Desktop Labs</a> &middot; <a href="career.html">what to do next</a>.</p>
"""

M13_JS = """Northline.renderPrediction("beforeAi", {
  label: "Predict first \\u00b7 what shipped excludes",
  questions: [
    { q: "Which of these is not shipped?",
      opts: [
        { t: "file:///Users/you/northline/index.html or http://localhost:5173.", correct: true,
          whyOk: "Nobody else can open that. Shipped is a public https URL that is a function of what is in Git." },
        { t: "A GitHub Pages URL you opened on your phone.", why: "That is the bar. Someone who has never seen it can reach it." },
        { t: "A Netlify preview you sent Dan before merging.", why: "A preview is a valid way to show work. The release still needs the production URL." }
      ] },
    { q: "When do you write the rollback plan?",
      opts: [
        { t: "Before you deploy, while you are calm, with the mechanism and the trigger named.", correct: true,
          whyOk: "After it is on fire you will not remember the last good commit. Write it now." },
        { t: "After the first production bug, when you know what went wrong.", why: "That is when you need it, which is why it has to already exist." },
        { t: "You do not need one for a static site.", why: "Revert and push is a one-minute rollback \\u2014 only if you wrote down which commit was good." }
      ] }
  ],
  learned: ["You separated 'works on my laptop' from 'works' before you pasted a URL.",
    "A release you cannot undo is why teams ship rarely and nervously."]
});
ModuleKit.renderLoopInto("loopStripEnd", "all", "The whole loop \\u00b7 every step you were graded on");

(function () {
  var host = document.getElementById("capGate");
  if (!host) return;
  var st = CourseProgress.capstonePracticeStatus();
  var labs = CourseProgress.desktopLabReady();
  function row(ok, label) {
    return '<div class="gaterow"><span class="' + (ok ? "gok" : "gno") + '">' + (ok ? "\\u2713" : "\\u25cb") + '</span> ' + label + '</div>';
  }
  host.innerHTML =
    row(st.html >= 3, "3+ HTML practice tasks passed (" + st.html + ")") +
    row(st.css >= 3, "3+ CSS practice tasks passed (" + st.css + ")") +
    row(st.js >= 3, "3+ JavaScript practice tasks passed (" + st.js + ")") +
    row(st.det >= 3, "3+ AI Code Detective cases solved (" + st.det + ")") +
    row(labs, "Both Desktop Labs recorded with real GitHub URLs") +
    '<p class="mut" style="margin-top:10px">You need at least three of the four practice tracks plus both Desktop Labs. ' +
    (CourseProgress.capstonePracticeReady() ? "<b>You are clear to start.</b>" : "Not there yet \\u2014 <a href=\\"dashboard.html\\">the dashboard</a> shows what is short.") + '</p>';
})();

document.getElementById("rpCheck").onclick = function () {
  var url = CourseProgress.safeHttpUrl(document.getElementById("rpUrl").value);
  var notes = document.getElementById("rpNotes").value.trim();
  var verify = document.getElementById("rpVerify").value.trim();
  var risk = document.getElementById("rpRisk").value.trim();
  var rollback = document.getElementById("rpRollback").value.trim();
  var results = [
    { name: "a live https URL", pass: !!url && /^https:/i.test(url),
      hint: "It has to be a public https address. A file:// path or localhost is not shipped." },
    { name: "release notes cover what changed", pass: notes.length >= 80 && /added|fixed|changed/i.test(notes),
      hint: "At least 80 characters, and name what was Added, Fixed or Changed. Dan cannot read a diff." },
    { name: "release notes state a known limitation", pass: /known|limit|only|not yet|does not|doesn't|future|paging|client-side/i.test(notes),
      hint: "Name something it does not do. A limitation you declare is planned work; one someone else finds is a bug report." },
    { name: "verification names concrete steps on the deployed URL", pass: verify.length >= 100 && /(phone|mobile|chrome|safari|firefox|console|submit|tab|keyboard|empty|blank|refresh|reload)/i.test(verify),
      hint: "At least 100 characters describing what you actually did. \\u201cI tested it\\u201d is not a verification record." },
    { name: "you named a risk and something out of scope", pass: risk.length >= 60,
      hint: "At least 60 characters. What could this break, and what did you consciously leave out?" },
    { name: "the rollback plan names a real mechanism", pass: rollback.length >= 60 && /(revert|rollback|roll back|redeploy|previous (commit|deploy)|git reset|restore|reset --hard|last known good)/i.test(rollback),
      hint: "Name the actual mechanism \\u2014 revert the commit, redeploy the previous build \\u2014 and the symptom that triggers it. \\u201cI would fix it\\u201d is not a rollback plan." },
    { name: "checked on a real phone", pass: document.getElementById("rpPhone").checked, hint: "A narrow window is not a phone." },
    { name: "console clean on the deployed site", pass: document.getElementById("rpConsole").checked, hint: "Open devtools on the live URL." },
    { name: "main task completed with the keyboard only", pass: document.getElementById("rpKeyboard").checked, hint: "Tab to the form, fill it, submit it." }
  ];
  var ok = results.every(function (r) { return r.pass; });
  ModuleKit.showResults(document.getElementById("rpFb"), { passed: ok, results: results });
  if (ok) {
    CourseProgress.setExtra("releasePlan", { url: url, notes: notes, verify: verify, risk: risk, rollback: rollback, at: new Date().toISOString() });
    CourseProgress.setSection(13, "releasePlan", { passed: true, at: new Date().toISOString() });
    document.getElementById("rpFb").innerHTML =
      "<b>Shipped, documented, and reversible.</b> That is the whole loop closed: you understood a ticket, specified it, built it with an agent, inspected it, tested it, debugged it, reviewed it, and released it with a way back. Pass the checkpoint below and the course is complete \\u2014 then <a href=\\"projects.html\\">the capstone</a> is where you prove you can do it unaided.";
    Northline.showLearned(document.getElementById("rpFb").parentNode,
      "You just shipped something someone else can open, and you can undo.",
      "That sentence is the course. The loop starts again the first time reality files a ticket.");
    MK.sync();
  }
};"""

write(os.path.join(OUT, "module-13.html"), module_page(
    num=13, stage_label="Stage 5", minutes=150,
    title="Release, ship, and the loop that does not end",
    sub="\u201cIt works on my laptop\u201d and \u201cit works\u201d are different claims. This module is about the distance between them, and about writing down how to undo it before you need to.",
    objectives_list=[
        "State what \u201cdone\u201d means in terms someone else can check",
        "Deploy a static site so that the live version is a function of what is in Git",
        "Run a pre-flight checklist in the order that makes it meaningful",
        "Write release notes that name a limitation before a user finds it",
        "Write a rollback plan with a mechanism and a trigger, before deploying",
    ],
    why={
        "build": "A real deployment, release notes, a verification record, and a rollback plan \u2014 all graded.",
        "why": "Code nobody can reach is not software. And a release you cannot undo is the reason teams ship rarely and nervously.",
        "aiHelps": "Drafting release notes from your commit history, and walking you through a Pages or Netlify setup.",
        "aiFails": "Absolute local paths that work perfectly for you and are broken images for everyone else. It cannot know what exists on the server.",
        "without": "You deploy it, you verify it on a real phone with a real keyboard, and you write the rollback plan yourself.",
    },
    sections_html="".join(M13),
    exercise_html=M13_EX,
    exercise_js=M13_JS,
))
