# -*- coding: utf-8 -*-
"""Stage 3: AI as pair programmer (M7) and AI Code Detective (M8)."""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _aise_shell import section, module_page, write, trap, note, defbox, code

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "courses", "ai-assisted-software-engineering")

# ----------------------------------------------------------------- Module 7

M7 = (
    section("01", "Before you touch AI", """    <p>Priya wants three numbers. The dangerous one is the seven-day no-show window. Decide what counts <i>before</i> you open the editor. That prediction is the only thing that makes a failing hidden test useful.</p>
    <div id="beforeAi" class="interactive"></div>
"""),

    section("02", "You have been building up to this on purpose", """    <p>Six modules in and you have not used a coding agent for a single graded exercise. That was deliberate, and now it pays off.</p>
    <p>You can read markup and spot a missing label. You know what padding does. You have written a filter, handled an empty list, and wired a real click. Which means when an agent hands you two hundred lines, you are not guessing &mdash; you are checking. That difference is the entire value of this course.</p>
    <p>From here, the agent writes most of the characters. You are responsible for all of the consequences.</p>
"""),

    section("03", "The two workflows", """    <p>Watch what actually happens in each.</p>
    <div class="def"><div class="k">The workflow that feels fast</div><p>You type <i>"build me a dashboard for the clinic"</i>. Forty seconds later there are four new files, a charting library you did not choose, some placeholder data, and a layout in a style nobody asked for. It runs. It looks impressive. You have no idea which parts are real and which are scaffolding, you cannot explain a single decision in it, and when Priya asks why no-shows are counted from Monday instead of the last seven days you will have to read it all to find out. You have not saved time. You have moved the work to the worst possible place: after it is already written.</p></div>
    <div class="def"><div class="k">The workflow that is fast</div><p>You write down what the function must do, including the boundary cases. You name the file. You say what not to touch. You ask for one function. You read the diff &mdash; it is eleven lines, so this takes forty seconds. You run your tests. One fails on the seven-day boundary. You tell it exactly that, it fixes it, you read the new diff. You commit. Total elapsed time: about the same. Total code you cannot explain: zero.</p></div>
    <div id="wfCompare" class="interactive" style="margin-top:20px"><div class="ilbl">Choose the better request &middot; labelled simulation</div></div>
"""),

    section("04", "Context: the part people skip", """    <p>An agent's output quality depends far more on what it can see than on how politely you ask. Prompt phrasing is a rounding error next to context.</p>
    <ul class="plain">
      <li><b>Point at the actual files.</b> In Cursor, <code>@filename</code> puts a file in context. Without it the agent invents a plausible version of your code and writes against that &mdash; which is how you end up with a second <code>styles.css</code> and a function that calls something that does not exist.</li>
      <li><b>Include the data shape.</b> Paste one real record. Every wrong assumption about field names comes from this being missing.</li>
      <li><b>State the conventions.</b> "This project uses plain JavaScript, no framework, no build step." Otherwise you will get an import.</li>
      <li><b>Say what already exists.</b> "There is already a <code>filterOpen</code> in <code>appointments.js</code>; use it, do not reimplement it." Duplicated logic is a maintenance bill.</li>
    </ul>
""" + defbox("The shape of a request worth sending", "Context (which files, what the data looks like) &middot; Task (one thing, named) &middot; Constraints (what not to touch, what to reuse) &middot; Acceptance (the cases it must satisfy) &middot; Output (show me the diff).")),

    section("05", "Constraints are how you stay in control", """    <p>An agent with no constraints will do more than you asked, every time, because being helpful is what it is for. Constraints are not distrust; they are scope, written down.</p>
    <ul class="plain">
      <li><b>Name the files it may change.</b> "Only <code>dashboard.js</code>."</li>
      <li><b>Name what it must not touch.</b> "Do not modify existing functions. Do not change the HTML."</li>
      <li><b>Ban new dependencies.</b> "No new packages." Otherwise a date library arrives for one line of arithmetic.</li>
      <li><b>Bound the size.</b> "One function. If this needs more than one, tell me why instead of writing it."</li>
      <li><b>Ask for the diff.</b> Not the finished file. You want to see what changed, not read the whole thing again.</li>
    </ul>
""" + trap("The most expensive unconstrained request is the follow-up. You ask for a fix, and it also renames three things, reformats the file, and \u201ctidies\u201d a function you never mentioned. Now your one-line fix is a forty-line diff and you cannot see the fix inside it. Say <i>\u201cchange only what is needed for this; do not reformat\u201d</i> on every follow-up.")),

    section("06", "Inspect, and what you are looking for", """    <p>Reading a diff is a skill with a checklist. Green lines are additions, red are deletions, and the deletions are where the danger is &mdash; a removed line is the easiest thing in a diff to miss.</p>
    <ol>
      <li><b>Is it only what I asked for?</b> Count the files. Count the functions. Anything extra is unreviewed code you are about to own.</li>
      <li><b>Do I understand every line?</b> Not "does it look reasonable" &mdash; can you say what it does out loud? If not, that is the line to ask about.</li>
      <li><b>What got deleted?</b> Agents remove things they judge redundant. Sometimes they are right. Sometimes it was a guard clause that mattered.</li>
      <li><b>Does the logic match the acceptance criteria?</b> Walk one real case through it by hand. Especially a boundary.</li>
      <li><b>Any of the known failure shapes?</b> <code>innerHTML</code> with user data, <code>if (value)</code> on a number, a missing empty state, a half-completed rename, a magic number, a secret in a log.</li>
      <li><b>Would I defend this to Sam?</b> If the honest answer is "I would say the agent wrote it", it is not ready.</li>
    </ol>
"""),

    section("07", "Run and test, in that order", """    <p><b>Run it.</b> Open the thing. Click the thing. Watch the console. This catches an enormous class of defect in about four seconds, and it is the step people skip because the diff looked right.</p>
    <p><b>Then test it.</b> Which means: decide the expected answer <i>before</i> you run the code, then check. Reading a result and deciding it looks plausible is not testing; it is agreeing with yourself.</p>
    <p>And the sentence to be suspicious of, every single time:</p>
    <div class="honestnote"><b>&ldquo;All tests pass and the feature works correctly.&rdquo;</b> This is worth nothing until you have run the tests yourself and read what they assert. Agents write tests that cannot fail &mdash; asserting a function is defined, asserting <code>true === true</code>, asserting the output equals whatever the function currently returns. All green. All meaningless. Module 9 is about the difference.</div>
"""),

    section("08", "How this module is graded, and why", """    <p>This site will not pretend to be Cursor. There is no fake chat panel here that congratulates you for typing a prompt into it.</p>
    <p>So the exercise below works differently: <b>you do the work in your real editor, and bring the artifacts back.</b> The spec you wrote is checked for shape. Your review notes are checked for specificity. And the code the agent produced is <b>executed against tests you cannot see</b>.</p>
    <p>That last part is the honest bit. We are not asking whether you reviewed it and trusting your answer. We are running our own tests against whatever you paste. If the agent's first draft is wrong &mdash; and on the boundary case below it very often is &mdash; you will find out here, go back, tell it what failed, and return with something that works. That round trip <i>is</i> the module.</p>
""" + note("Any agent works: Cursor, Copilot, Continue, Cline, Claude, ChatGPT. The course is vendor-neutral. What is graded is the artifact, not the brand.")),
)

M7_EX = """    <p>Ticket <b>NL-007</b>. Priya wants three numbers on one screen for the 8am huddle.</p>
    <p>Here is the acceptance criteria Sam has already agreed with her. Your job is to turn it into a request, drive the agent, review the result, and come back with code that passes.</p>
    <div class="def"><div class="k">Acceptance criteria &mdash; dashboardCounts</div><p>Write <code>dashboardCounts(appointments, today)</code>.<br><br>
    Each appointment looks like <code>{ date: "2026-08-30", status: "open" }</code>, where <code>status</code> is <code>"open"</code>, <code>"done"</code>, or <code>"no-show"</code>. <code>today</code> is a date string in the same format.<br><br>
    It returns <code>{ today, open, noShows }</code> where:<br>
    &bull; <code>today</code> = how many appointments fall on <code>today</code><br>
    &bull; <code>open</code> = how many appointments on <code>today</code> have status <code>"open"</code><br>
    &bull; <code>noShows</code> = how many appointments have status <code>"no-show"</code> in the seven-day window ending on <code>today</code> <b>inclusive</b> &mdash; so <code>today</code> counts, and so does the date six days before it, and the date seven days before it does <b>not</b><br><br>
    An empty list returns <code>{ today: 0, open: 0, noShows: 0 }</code>. Dates in the future are ignored for <code>noShows</code>.</p></div>
    <div class="honestnote"><b>Prediction.</b> Most agents get the seven-day window off by one on the first attempt, because "the last seven days" is ambiguous in English and unambiguous in the criteria above. When our tests fail, that is not you failing &mdash; that is the module working. Go back, quote the exact failing case, and review the second diff as carefully as the first.</div>
    <div class="interactive">
      <div class="ilbl">Required exercise &middot; aiWorkflowExercise &middot; real agent work</div>
      <div id="aiwf"></div>
    </div>
    <p class="mut" style="margin-top:14px">The two required <a href="desktop-labs.html">Desktop Labs</a> are where this becomes a real commit and a real repo. Both are needed before the capstone.</p>
"""

M7_JS = """Northline.renderPrediction("beforeAi", {
  label: "Predict first \\u00b7 the window, not the prompt",
  intro: "today is 2026-08-30. A no-show on 2026-08-24 is six days before. A no-show on 2026-08-23 is seven days before. A no-show on 2026-08-31 is tomorrow.",
  questions: [
    { q: "Which no-shows count in the seven-day window ending on today, inclusive?",
      opts: [
        { t: "08-24 counts. 08-23 does not. 08-31 does not. Today itself does.", correct: true,
          whyOk: "Inclusive means today and the six days before it. Seven days back is outside. The future is outside." },
        { t: "Anything in the same calendar week, Monday to Sunday.", why: "Priya said this week at 8am, but the criteria spelled out seven days ending today. Do not invent a week start." },
        { t: "08-23 through 08-30, because last seven days means seven previous days plus today.", why: "That is eight days. 'Last seven inclusive' is today and six back." }
      ] },
    { q: "The agent says all tests pass. What do you do?",
      opts: [
        { t: "Run the tests yourself and read what they assert. Then walk the 08-23 and 08-24 cases by hand.", correct: true,
          whyOk: "The sentence is a claim. The boundary is where the claim usually dies." },
        { t: "Trust it. The model is good at dates.", why: "Dates are exactly where fluent wrong arithmetic lives." },
        { t: "Ask it to write more tests.", why: "More tests that cannot fail are more green. Read the ones you have." }
      ] }
  ],
  learned: ["You decided the window before anyone wrote a line.",
    "When the hidden test fails on 08-23, you will know it is the module working, not you failing."]
});
Northline.renderWorkflowCompare("wfCompare", {
  situation: "You have the acceptance criteria for the dashboard. You open Cursor with dashboard.js in front of you. First message?",
  bad: { t: "Build a dashboard for the clinic showing appointments today, open appointments and no-shows this week. Make it look good.",
    why: "You will get HTML, CSS, a chart, and a counting function buried somewhere inside it. Every one of those is a decision you did not make, and the only part you specified \\u2014 the seven-day window \\u2014 is the part most likely to be wrong and hardest to find." },
  good: { t: "@dashboard.js Add one function dashboardCounts(appointments, today). A record is { date: '2026-08-30', status: 'open' | 'done' | 'no-show' }. Return { today, open, noShows }: today = records on `today`; open = records on `today` with status 'open'; noShows = status 'no-show' within the 7-day window ending on `today` inclusive, so 6 days before counts and 7 days before does not. Empty list returns all zeros. No new dependencies, do not change existing functions, show me the diff.",
    why: "One function, one file, the data shape included, the ambiguous boundary spelled out explicitly, no new dependencies, and a diff. If it still gets the window wrong you will see it in eleven lines instead of hunting through four files." }
});

AIWorkflowKit.render("aiwf", {
  specPlaceholder: "@dashboard.js Add one function dashboardCounts(appointments, today) ...",
  specChecks: [
    { name: "names the function dashboardCounts", test: function (t) { return /dashboardCounts/.test(t); } },
    { name: "points at a specific file", test: function (t) { return /@|\\.js\\b|dashboard\\.js/.test(t); } },
    { name: "includes the data shape (a date and a status)", test: function (t) { return /date/i.test(t) && /status/i.test(t); } },
    { name: "spells out the seven-day boundary", test: function (t) { return /(7|seven)[\\s-]*day/i.test(t) && /(inclusive|includ|boundary|6|six)/i.test(t); } },
    { name: "states a constraint \\u2014 what not to change, or no new dependencies",
      test: function (t) { return /(do not|don't|only|without changing|no new|do no)/i.test(t); } },
    { name: "asks for the diff", test: function (t) { return /diff/i.test(t); } },
    { name: "at least 200 characters of actual specification", test: function (t) { return t.trim().length >= 200; } }
  ],
  code: {
    functionName: "dashboardCounts",
    starter: "// Paste the function the agent wrote, exactly as it wrote it.\\n",
    testCases: (function () {
      var rows = [
        { date: "2026-08-30", status: "open" },
        { date: "2026-08-30", status: "done" },
        { date: "2026-08-30", status: "no-show" },
        { date: "2026-08-29", status: "no-show" },
        { date: "2026-08-25", status: "no-show" },
        { date: "2026-08-24", status: "no-show" },
        { date: "2026-08-23", status: "no-show" },
        { date: "2026-08-31", status: "no-show" },
        { date: "2026-08-28", status: "open" }
      ];
      return [
        /* noShows is 4, not 5: the window is 2026-08-24..2026-08-30, so
           08-30, 08-29, 08-25 and 08-24 count while 08-23 (7 days back)
           and 08-31 (future) do not. */
        { name: "counts today's appointments", args: [rows, "2026-08-30"], expected: { today: 3, open: 1, noShows: 4 } },
        { name: "an empty list returns all zeros", args: [[], "2026-08-30"], expected: { today: 0, open: 0, noShows: 0 } },
        { name: "the 7-day window includes 6 days before today",
          args: [[{ date: "2026-08-24", status: "no-show" }], "2026-08-30"], expected: { today: 0, open: 0, noShows: 1 } },
        { name: "the 7-day window EXCLUDES 7 days before today",
          args: [[{ date: "2026-08-23", status: "no-show" }], "2026-08-30"], expected: { today: 0, open: 0, noShows: 0 } },
        { name: "future dates are not counted as no-shows",
          args: [[{ date: "2026-08-31", status: "no-show" }], "2026-08-30"], expected: { today: 0, open: 0, noShows: 0 } },
        { name: "a day with no open appointments reports 0, not nothing",
          args: [[{ date: "2026-08-30", status: "done" }], "2026-08-30"], expected: { today: 1, open: 0, noShows: 0 } }
      ];
    })()
  },
  reviewHint: "Name one specific thing you checked in the diff and one specific thing you changed, rejected, or had to correct. If the first attempt got the window boundary wrong, say so and say how you found out."
}, function (st) {
  if (st.passed) {
    CourseProgress.setSection(7, "aiWorkflowExercise",
      { passed: true, firstTry: st.firstTry, at: new Date().toISOString() });
    var host = document.getElementById("aiwf");
    if (host) {
      Northline.showLearned(host,
        "You just closed the loop with evidence, not a screenshot.",
        "The spec was yours, the review was yours, and the function survived tests you did not write.");
    }
    MK.sync();
  }
});"""

write(os.path.join(OUT, "module-07.html"), module_page(
    num=7, stage_label="Stage 3", minutes=65,
    title="AI as your pair programmer",
    sub="The full loop, for real, in your own editor. You write the spec, drive the agent, read the diff, and bring the actual code back \u2014 where our tests, not your opinion, decide whether it works.",
    objectives_list=[
        "Give an agent context, task, constraints, acceptance criteria, and an output format",
        "Say what not to touch, and why that sentence saves you a forty-line diff",
        "Read a diff with a six-point checklist, including what got deleted",
        "Treat \u201call tests pass\u201d as a claim requiring verification",
        "Iterate on a failing case with specific evidence instead of \u201cthat\u2019s wrong, fix it\u201d",
    ],
    why={
        "build": "The dashboardCounts function for NL-007, specified by you, written by an agent, and passing tests you did not write.",
        "why": "This is the loop the whole course is named after, run end to end for the first time.",
        "aiHelps": "Everywhere. It writes the function, and if your criteria are precise it will usually get it nearly right.",
        "aiFails": "The seven-day boundary. \u201cThe last seven days\u201d is ambiguous in English, and confident wrong arithmetic is the house speciality.",
        "without": "The spec is yours, the review is yours, and the accountability is yours. You cannot pass by claiming you reviewed it \u2014 the code has to survive our tests.",
    },
    sections_html="".join(M7),
    exercise_html=M7_EX,
    exercise_js=M7_JS,
    extra_scripts=("ai-workflow-kit.js",),
))

# ----------------------------------------------------------------- Module 8

CASE1 = {
    "ticket": "NL-008 \u00b7 hunk 3 of 11",
    "author": "Written by the coding agent, approved by nobody",
    "ask": "\u201cAdd a function that totals a supply order, including quantities.\u201d",
    "lang": "js",
    "note": "It runs. It has no syntax errors. A linter is silent. Finance is off by thousands a year.",
    "code": """// Calculates the order total, including quantity
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total.toFixed(2);
}""",
    "findings": [
        {"id": "qty", "cat": "logic", "real": True,
         "label": "Quantity is never used \u2014 two units of a \u00a33 item total \u00a33.",
         "why": "The one that costs money. It reads correctly because it has the shape you expected a total to have."},
        {"id": "comment", "cat": "comment", "real": True,
         "label": "The comment claims it includes quantity, so it actively misleads the next reader.",
         "why": "A wrong comment is worse than no comment: it stops the next person looking, which is exactly how this survives review twice."},
        {"id": "string", "cat": "assumption", "real": True,
         "label": "toFixed returns a string, so any caller doing arithmetic on the result gets concatenation.",
         "why": "total + shipping becomes \"6.00\" + 5 = \"6.005\". A formatting decision buried inside a calculation function."},
        {"id": "forloop", "cat": "complexity", "real": False,
         "label": "It uses an indexed for loop instead of reduce.",
         "why": "Not a defect. reduce would be more idiomatic; the loop is perfectly clear and correct. Style preferences are not review findings."},
        {"id": "let", "cat": "naming", "real": False,
         "label": "total is declared with let instead of const.",
         "why": "Not a defect \u2014 it has to be reassigned. Applying \u201cprefer const\u201d without thinking is how reviews lose credibility."},
        {"id": "empty", "cat": "edge", "real": False,
         "label": "It does not handle an empty items array.",
         "why": "It handles it fine: the loop does not execute and it returns 0.00. Check the claim before you make it."},
    ],
    "fix": {
        "functionName": "calculateTotal",
        "note": "Rewrite it. Return a <b>number</b> (not a string) rounded to 2 decimal places, and use quantity. An empty list returns 0.",
        "starter": """function calculateTotal(items) {

}""",
        "testCases": [
            {"name": "two units of a \u00a33 item totals 6", "args": [[{"price": 3, "quantity": 2}]], "expected": 6},
            {"name": "an empty order totals 0", "args": [[]], "expected": 0},
            {"name": "mixed lines add up", "args": [[{"price": 2.5, "quantity": 2}, {"price": 1, "quantity": 3}]], "expected": 8},
            {"name": "single units still work", "args": [[{"price": 4, "quantity": 1}, {"price": 6, "quantity": 1}]], "expected": 10},
            {"name": "returns a number, not a string", "args": [[{"price": 1, "quantity": 1}]], "expected": 1},
            {"name": "rounds to 2 decimal places", "args": [[{"price": 0.1, "quantity": 3}]], "expected": 0.3},
        ],
    },
}

CASE2 = {
    "ticket": "NL-008 \u00b7 hunk 7 of 11",
    "author": "Written by the coding agent, tests reported green",
    "ask": "\u201cValidate the booking form before we submit it.\u201d",
    "lang": "js",
    "note": "The contractor's note on the PR says \u201cadds validation, all tests passing\u201d. Read it properly.",
    "code": """// Returns true if the booking is valid
function validateBooking(form, today) {
  const errors = [];
  if (!form.name) errors.push("Name is required");
  if (!form.email.includes("@")) errors.push("Email is not valid");
  if (form.date < today) errors.push("Date cannot be in the past");
  return errors.length = 0;
}""",
    "findings": [
        {"id": "assign", "cat": "logic", "real": True,
         "label": "errors.length = 0 assigns instead of comparing, so it always returns 0 \u2014 every booking is rejected.",
         "why": "One character. It is valid JavaScript, so nothing complains, and it also empties the array as a side effect. This is why === matters."},
        {"id": "throws", "cat": "validation", "real": True,
         "label": "If email is missing entirely, .includes throws and the whole function dies.",
         "why": "A validator that crashes on absent input is the one thing a validator must never do. Test it with {} and watch."},
        {"id": "discard", "cat": "assumption", "real": True,
         "label": "It collects specific error messages and then throws them all away, returning only a boolean.",
         "why": "The caller cannot tell the patient what was wrong, so the form can only say \u201cinvalid\u201d. The useful information was computed and discarded."},
        {"id": "blank", "cat": "edge", "real": True,
         "label": "A name of \" \" passes, because a space is truthy.",
         "why": "!form.name catches empty string but not whitespace. Trim before checking."},
        {"id": "datestr", "cat": "logic", "real": False,
         "label": "Comparing dates as strings with < is broken.",
         "why": "Not a defect. ISO format (YYYY-MM-DD) sorts correctly as text, which is the whole reason that format exists. A very common false positive \u2014 charging it costs you credibility."},
        {"id": "lib", "cat": "complexity", "real": False,
         "label": "It should use a date library rather than hand-rolled comparison.",
         "why": "Adding a dependency for one string comparison is the wrong trade. \u201cUse a library\u201d is not automatically a review finding."},
        {"id": "arrow", "cat": "naming", "real": False,
         "label": "errors is a poor variable name.",
         "why": "It is an array of errors. The name is fine. Do not pad a review."},
    ],
    "fix": {
        "functionName": "validateBooking",
        "note": "Rewrite it to return an <b>array of error strings</b> so the form can tell the patient what to fix. Use exactly these messages, in this order: <code>\"Name is required\"</code>, <code>\"Email is not valid\"</code>, <code>\"Date cannot be in the past\"</code>. A blank or whitespace-only name fails. A missing email fails without throwing. An email must contain an @ with a dot after it. A missing date fails. Valid input returns <code>[]</code>.",
        "starter": """function validateBooking(form, today) {

}""",
        "testCases": [
            {"name": "a valid booking returns no errors",
             "args": [{"name": "Priya", "email": "p@northline.co", "date": "2026-09-02"}, "2026-08-30"], "expected": []},
            {"name": "a whitespace-only name is rejected",
             "args": [{"name": "   ", "email": "p@northline.co", "date": "2026-09-02"}, "2026-08-30"], "expected": ["Name is required"]},
            {"name": "a missing email does not throw",
             "args": [{"name": "Priya", "date": "2026-09-02"}, "2026-08-30"], "expected": ["Email is not valid"]},
            {"name": "an email with no dot after the @ is rejected",
             "args": [{"name": "Priya", "email": "p@northline", "date": "2026-09-02"}, "2026-08-30"], "expected": ["Email is not valid"]},
            {"name": "a past date is rejected",
             "args": [{"name": "Priya", "email": "p@northline.co", "date": "2026-08-01"}, "2026-08-30"], "expected": ["Date cannot be in the past"]},
            {"name": "today itself is allowed",
             "args": [{"name": "Priya", "email": "p@northline.co", "date": "2026-08-30"}, "2026-08-30"], "expected": []},
            {"name": "several problems are all reported, in order",
             "args": [{"name": "", "email": "nope", "date": "2026-01-01"}, "2026-08-30"],
             "expected": ["Name is required", "Email is not valid", "Date cannot be in the past"]},
            {"name": "a missing date is rejected",
             "args": [{"name": "Priya", "email": "p@northline.co"}, "2026-08-30"], "expected": ["Date cannot be in the past"]},
        ],
    },
}

M8 = (
    section("01", "Before you charge anything", """    <p>Two hunks are coming. Both run. Both look like code you have seen before. Before you open them, decide what you are hunting and what you will refuse to flag.</p>
    <div id="beforeAi" class="interactive"></div>
"""),

    section("02", "The defect that matters is the one that looks fine", """    <p>There are two kinds of wrong code. The first kind announces itself: it crashes, it fails to parse, the page goes blank. That kind is cheap, because you find it in seconds and nobody ships it.</p>
    <p>The second kind runs perfectly, produces a plausible number, and is wrong. Nobody notices for four months. Then an accountant does.</p>
    <p>Agents are extraordinarily good at producing the second kind, and it is not a flaw in the models &mdash; it is a direct consequence of how they work. They generate what code <i>usually looks like</i> in this situation. Code that usually looks right is, by construction, code that passes a skim. It has the correct shape, idiomatic style, sensible variable names, and reasonable formatting. Every surface signal you unconsciously use to judge code quality has been satisfied.</p>
    <div class="callout">Which means the review habits you inherited from reading human code do not transfer cleanly. A tired human writes sloppy code with obvious bugs. An agent writes immaculate code with subtle ones. You have to read for <b>meaning</b>, not for smell.</div>
"""),

    section("03", "The eleven failure shapes", """    <p>Across a lot of AI-generated code, the defects cluster. These are the categories you are hunting, and after a while you start seeing them by reflex.</p>
    <div class="whycare">
      <div class="whybox"><h4>Logic</h4><p>Right shape, wrong arithmetic. Quantity omitted. Off by one on a boundary. <code>=</code> where <code>===</code> belonged.</p></div>
      <div class="whybox"><h4>Edge cases</h4><p>Works for the case in your example. Empty list, single item, zero, missing field, duplicate: unconsidered.</p></div>
      <div class="whybox"><h4>Missing validation</h4><p>Assumes input is well-formed. Crashes on an absent field. Trusts a string is a number.</p></div>
      <div class="whybox"><h4>Security</h4><p><code>innerHTML</code> with user data. A secret in a log. A disabled check with a TEMP comment. <code>eval</code>.</p></div>
      <div class="whybox"><h4>Accessibility</h4><p>Clickable divs. Missing labels. <code>outline: none</code>. Colour as the only signal.</p></div>
      <div class="whybox"><h4>Misleading comments</h4><p>A comment describing what the code was supposed to do rather than what it does. Worse than silence.</p></div>
      <div class="whybox"><h4>Wrong assumptions</h4><p>Invented field names. A returned string where a number was needed. Assumed sort order.</p></div>
      <div class="whybox"><h4>Duplication</h4><p>A third copy of a function that already exists twice, so a fix in one leaves two broken.</p></div>
      <div class="whybox"><h4>Needless complexity</h4><p>Forty lines and an abstraction layer for something that was six lines.</p></div>
      <div class="whybox"><h4>Performance</h4><p>A DOM query inside a loop over ten thousand rows. Re-reading a file every iteration.</p></div>
      <div class="whybox"><h4>Naming</h4><p><code>data</code>, <code>temp</code>, <code>handleIt</code>, <code>result2</code>. Names that describe nothing.</p></div>
    </div>
"""),

    section("04", "The skill nobody teaches: not charging the innocent", """    <p>Here is the thing that separates a reviewer people trust from one they route around.</p>
    <p>When a nervous junior is handed a large AI-written pull request, the safe-feeling move is to object to everything. Flag the loop, flag the variable name, ask for a library, request more comments. It feels rigorous. It is the opposite.</p>
    <p><b>A review that rejects everything carries exactly as much information as one that approves everything.</b> Both are refusals to discriminate. And there is a practical cost: if three of your five objections are wrong, the author starts discounting all five &mdash; including the one about the money.</p>
    <div class="def"><div class="k">Real finding</div><p>"Line 4 sums price but never multiplies by quantity, so an order of two \u00a33 items returns \u00a33. Here is a failing case."</p></div>
    <div class="def"><div class="k">Not a finding</div><p>"You should use reduce instead of a for loop." &mdash; A preference. The loop is correct and readable. Saying this alongside the real finding dilutes it.</p></div>
    <p>So the exercise below is graded both ways. Miss a real defect and you fail. Charge a line that is actually fine and you also fail. Selecting everything is not caution; it is the same abdication with better optics.</p>
""" + trap("The single most common false positive in this whole course: flagging <code>a &lt; b</code> on ISO date strings as broken. Comparing <code>\"2026-08-30\"</code> to <code>\"2026-08-24\"</code> as text gives the correct answer, because that format was designed to sort lexicographically. It appears in Case 2 below. Do not charge it.")),

    section("05", "Finding it is half. Proving it is the half that ships.", """    <p>Plenty of people can look at code and feel uneasy. Far fewer can produce a version that provably works, which is the only thing anyone is paying for.</p>
    <p>So every case here has two phases. First the charge sheet: name the real defects, spare the innocent lines. Then the proof: rewrite it so hidden tests pass. Phase two stays locked until phase one is clean, because otherwise you could brute-force the charge sheet by watching which tests go green.</p>
    <p>The proof phase is also where you discover that "I know what is wrong with this" and "I can fix it correctly" are genuinely different states. Case 1's fix has five separate requirements and most people miss one on the first attempt.</p>
"""),
)

M8_EX = """    <p>Ticket <b>NL-008</b>. A contractor pushed a large AI-written pull request and went on leave. It runs. Dan will not merge it blind, and you are the reviewer of record.</p>
    <p>Two hunks. Both must be cleared &mdash; charge sheet clean, fix passing.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise &middot; detectiveExercise &middot; case 1 of 2</div>
      <div id="det1"></div>
    </div>
    <div class="interactive" style="margin-top:24px">
      <div class="ilbl">Required exercise &middot; detectiveExercise &middot; case 2 of 2</div>
      <div id="det2"></div>
    </div>
    <p class="mut" style="margin-top:16px">Twenty-four more cases in the <a href="practice-detective.html">AI Code Detective library</a>. Three of those are part of the capstone practice bar.</p>
"""

M8_JS = """Northline.renderPrediction("beforeAi", {
  label: "Predict first \\u00b7 what a finding is",
  questions: [
    { q: "Which of these is a real review finding?",
      opts: [
        { t: "It sums price and ignores quantity, so two \\u00a33 items total \\u00a33. Here is a failing case.", correct: true,
          whyOk: "Location, mechanism, consequence. That is a finding someone can act on." },
        { t: "It uses a for loop instead of reduce.", why: "A preference. The loop can be correct. Charging it next to the money bug dilutes the money bug." },
        { t: "Variable names should be more descriptive.", why: "Sometimes true. Not a defect until you can name the misunderstanding it causes." }
      ] },
    { q: "ISO dates compared with < . Do you charge it?",
      opts: [
        { t: "No. YYYY-MM-DD sorts as text. Charging it is the most common false positive in this course.", correct: true,
          whyOk: "The format exists so this comparison works. Check the claim before you make it." },
        { t: "Yes. Dates must always use a library.", why: "A library for one string compare is the wrong trade. This is not automatically a finding." },
        { t: "Yes if the names are startDate and endDate.", why: "The names do not change the format. The format is what makes < safe." }
      ] }
  ],
  learned: ["You decided what counts as a finding before you saw the hunks.",
    "Rejecting everything is the same abdication as approving everything."]
});
var detState = { c1: false, c2: false };
function detSync() {
  var box = document.getElementById("detProgress");
  if (box) {
    box.textContent = "Cases cleared: " + ((detState.c1 ? 1 : 0) + (detState.c2 ? 1 : 0)) + " / 2";
  }
  if (detState.c1 && detState.c2) {
    CourseProgress.setSection(8, "detectiveExercise", { passed: true, cases: 2, at: new Date().toISOString() });
    var host = document.getElementById("det2");
    if (host) {
      Northline.showLearned(host.parentNode,
        "You just reviewed like someone whose name goes on the merge.",
        "You named real defects, spared the innocent lines, and proved the fix. That is the whole skill.");
    }
    MK.sync();
  }
}
DetectiveKit.render("det1", %s, function (st) { detState.c1 = st.passed; detSync(); });
DetectiveKit.render("det2", %s, function (st) { detState.c2 = st.passed; detSync(); });""" % (
    json.dumps(CASE1, ensure_ascii=False), json.dumps(CASE2, ensure_ascii=False))

write(os.path.join(OUT, "module-08.html"), module_page(
    num=8, stage_label="Stage 3", minutes=65,
    title="AI Code Detective",
    sub="Two hunks from a real AI-authored pull request. Both run. Both are wrong. Find the defects, spare the lines that are actually fine, and prove the fix against tests you cannot see.",
    objectives_list=[
        "Explain why AI defects are systematically harder to spot than human ones",
        "Recognise the eleven failure shapes by category",
        "Distinguish a real finding from a style preference \u2014 and know why that distinction protects your credibility",
        "Avoid the most common false positive in code review",
        "Turn a diagnosis into a fix that passes an independent test",
    ],
    why={
        "build": "A clean charge sheet and a working fix for two hunks of an AI-written pull request.",
        "why": "This is the skill that makes you worth hiring in a world where code is cheap. Anyone can generate a feature; you can tell whether it is correct.",
        "aiHelps": "Nowhere in this module. You are the review.",
        "aiFails": "This entire module is a catalogue of how.",
        "without": "Both phases are yours. And rejecting everything fails just as hard as approving everything \u2014 the decoys are graded.",
    },
    sections_html="".join(M8),
    exercise_html=M8_EX,
    exercise_js=M8_JS,
    extra_scripts=("detective-kit.js",),
))
