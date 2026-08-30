# -*- coding: utf-8 -*-
"""Stage 4: engineering discipline. Testing/debugging, Git/review, refactoring."""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _aise_shell import section, module_page, write, trap, note, defbox, code

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "courses", "ai-assisted-software-engineering")

# ----------------------------------------------------------------- Module 9

M9 = (
    section("01", "Before you touch AI", """    <p>Two patients cannot book. It works for Priya. The function behind the button is four lines and looks ordinary. Predict the class of bug before you ask an agent to fix it.</p>
    <div id="beforeAi" class="interactive"></div>
    <p style="margin-top:16px">Then look at the test an agent is likely to write. If it cannot fail, it is not a test.</p>
    <div id="detectives"></div>
"""),

    section("02", "\u201cWorks on my machine\u201d is a clue, not a defence", """    <p>Priya says two patients hit Request and nothing happened. She tried it herself and it worked.</p>
    <p>Both statements are true. That is the useful part. If it works for her and not for them, then the behaviour depends on <b>something that differs between them</b> &mdash; and your job is to find out what. Candidates, roughly in order of likelihood:</p>
    <ul class="plain">
      <li><b>Different input.</b> They left a field blank, typed something unexpected, used a different date format, or had a name with an apostrophe in it.</li>
      <li><b>Different path through the interface.</b> She fills the form top to bottom every time. They tabbed, or pressed Enter, or came back to a half-filled form.</li>
      <li><b>Different data.</b> Their record has a field hers does not.</li>
      <li><b>Different environment.</b> Older browser, different phone, slow connection, blocked script.</li>
      <li><b>Different timing.</b> They clicked before something finished loading.</li>
    </ul>
    <p>Notice that the first two account for most real bugs, and both are about <i>what the user did</i>, not about the code. Which is why the most valuable question you can ask a non-technical reporter is not "what went wrong" but "walk me through exactly what you typed".</p>
""" + defbox("The word to strike from your vocabulary", "\u201cIntermittent.\u201d Almost nothing is genuinely intermittent. \u201cIntermittent\u201d nearly always means \u201cthe condition that triggers it has not been identified yet\u201d, and calling it intermittent is how a team gives up on a bug that has a perfectly findable cause.")),

    section("03", "Reproduce first. Always first.", """    <p>The temptation, especially with an agent available, is to read the report, form a theory, and start fixing. Resist it, because without a reproduction you cannot tell a fix from a coincidence.</p>
    <p>A reproduction is: <b>the exact steps and the exact data that make it fail every time.</b> It has three uses, and all three matter.</p>
    <ol>
      <li>It proves the bug exists and is not a misunderstanding.</li>
      <li>It tells you when you have actually fixed it, rather than changed something and hoped.</li>
      <li>It becomes the test. Literally &mdash; the reproduction is the failing test case you write next.</li>
    </ol>
    <p>Finding one is a search, and the search is narrowing. Vary one thing at a time. Start from a working case and remove things until it breaks, or start from the broken report and add things until it works. Both directions are fine. Changing three things at once is not.</p>
""" + trap("Hand an agent a bug report with no reproduction and it will confidently produce a fix, often with a plausible explanation attached. Sometimes it is right. You have no way of knowing, because you cannot check something you cannot trigger \u2014 and now there is a change in your codebase whose justification is a guess.")),

    section("04", "A test is only worth what it can catch", """    <p>Here is the whole idea, and it is not the one most courses lead with:</p>
    <div class="callout">A test that cannot fail is not a test. It is a comment that costs CPU time. Before you trust a test, break the thing it tests on purpose and watch it go red. If it stays green, you have learned something far more important than whether the code works.</div>
    <p>This matters enormously with agent-written tests, because a test that always passes looks identical to a test that works &mdash; green, named sensibly, sitting in the right file. Three shapes to recognise on sight:</p>
""" + code("""// Tests nothing. Cannot fail.
expect(true).toBe(true);

// Tests that the function exists. Not that it is correct.
expect(typeof calculateTotal).toBe("function");

// Tests that the code does what the code does. Always passes,
// including when the code is wrong.
expect(calculateTotal(items)).toBe(calculateTotal(items));""") + """    <p>A real test states an expectation <b>independently</b> of the implementation:</p>
""" + code("""// You worked out that 2 x 3 = 6 with your own brain.
// Now the code has to agree with you.
expect(calculateTotal([{ price: 3, quantity: 2 }])).toBe(6);""") + """    <p>The order matters: decide the expected answer first, then run. If you run it first and then write down whatever it produced, you have not tested anything &mdash; you have recorded the current behaviour, bug included.</p>
"""),

    section("05", "What to test, when there is never time to test everything", """    <p>You will not have time for exhaustive tests, and chasing a coverage percentage is a well-documented way to feel safe without being safe. Spend your effort where a failure would actually hurt:</p>
    <ul class="plain">
      <li><b>The thing the ticket was about.</b> If you fixed a bug, there is now a test that fails on the old behaviour. Non-negotiable.</li>
      <li><b>The boundaries.</b> Zero, one, empty, the first, the last, the day the window opens and the day it closes. Almost all off-by-one bugs live here.</li>
      <li><b>Anything involving money, dates, or personal data.</b> Highest consequence per line of code in almost any application.</li>
      <li><b>The unhappy paths.</b> Missing field, malformed input, failed request.</li>
    </ul>
    <p>And a habit worth more than any single test: <b>when you fix a bug, write the test before the fix.</b> Watch it go red. Then fix it. Watch it go green. You now have proof of the bug, proof of the fix, and permanent protection against it coming back. That last part is the point &mdash; the same bug returning six months later is one of the most demoralising things that happens in software, and this is the only thing that prevents it.</p>
"""),

    section("06", "Debugging is narrowing, not staring", """    <p>Staring at code hoping to spot the flaw is the slowest available method, and it is what everyone does first. Narrowing is faster and it always terminates.</p>
    <ol>
      <li><b>Read the error properly.</b> All of it. The message names the problem, and the stack trace names the line. An enormous number of people scroll past this to go and guess instead.</li>
      <li><b>Confirm your assumption about reality.</b> Print the value. <code>console.log("form:", form)</code>. Nine times in ten the bug is that a variable does not contain what you were certain it contained.</li>
      <li><b>Bisect.</b> Is it broken halfway through? Then the problem is in the first half. Repeat. Twenty steps of this will find a bug in a million lines.</li>
      <li><b>Change one thing.</b> If you change three and it works, you do not know why, and you cannot rely on it.</li>
      <li><b>Explain it out loud.</b> To a colleague, to a rubber duck, to the agent. Articulating it forces the assumption you never examined to the surface. This works absurdly often.</li>
    </ol>
""" + defbox("Where an agent genuinely helps debugging", "Paste the error and the relevant function and ask <i>\u201cwhat are five things that could produce this error?\u201d</i> It is excellent at generating a candidate list \u2014 breadth is its strength. Then <b>you</b> test the candidates. Asking it to \u201cfix the bug\u201d skips the step where you find out what the bug was, and you will meet the same bug again in a different costume.")),
)

M9_EX = """    <p>Ticket <b>NL-009</b>. Two patients report that Request does nothing. It works every time for Priya. Here is the function behind the button.</p>
    <div id="m9code"></div>
    <p class="mut" style="margin-top:10px">Three parts, in the order a professional actually does them: reproduce, then prove, then fix.</p>

    <div class="interactive">
      <div class="ilbl">Required exercise &middot; debugExercise &middot; 1 of 3 &middot; reproduce</div>
      <p><b>Find an input that breaks it.</b> Describe a form object as JSON. We will run the real buggy function against it. You pass this part when your input makes it either throw or return the wrong answer &mdash; that is a reproduction, and it is what Priya could not give you.</p>
      <p class="mut">Priya's own input, which works: <code>{"name":"Priya","email":"p@northline.co","date":"2026-09-02"}</code></p>
      <div class="formrow"><label>A form object that breaks it</label><textarea id="m9repro" spellcheck="false" style="min-height:70px">{"name":"Priya","email":"p@northline.co","date":"2026-09-02"}</textarea></div>
      <button type="button" class="primary" id="m9btn1" style="margin-top:10px">Run the buggy function against it</button>
      <div class="feedback" id="m9fb1"></div>
    </div>

    <div class="interactive" style="margin-top:20px">
      <div class="ilbl">Required exercise &middot; debugExercise &middot; 2 of 3 &middot; prove</div>
      <p><b>Write the failing test.</b> Write <code>test_canSubmit(impl)</code> which returns <code>true</code> when handed a correct implementation and <code>false</code> when handed the broken one. We run it against both. A test that returns <code>true</code> for everything fails this part, which is the entire lesson of section 3.</p>
      <div class="formrow"><label>Your test</label><textarea id="m9test" spellcheck="false" style="min-height:150px">function test_canSubmit(impl) {
  // Call impl with form objects. Return true only if it behaves correctly.
  return true;
}</textarea></div>
      <button type="button" class="primary" id="m9btn2" style="margin-top:10px">Run against a good and a broken implementation</button>
      <div class="feedback" id="m9fb2"></div>
    </div>

    <div class="interactive" style="margin-top:20px">
      <div class="ilbl">Required exercise &middot; debugExercise &middot; 3 of 3 &middot; fix</div>
      <p><b>Now fix it.</b> <code>canSubmit(form)</code> returns <code>true</code> only when name, email and date are all present and not blank &mdash; and it must never throw, whatever it is handed.</p>
      <div class="formrow"><label>The fix</label><textarea id="m9fix" spellcheck="false" style="min-height:140px">function canSubmit(form) {

}</textarea></div>
      <button type="button" class="primary" id="m9btn3" style="margin-top:10px">Run hidden tests</button>
      <div class="feedback" id="m9fb3"></div>
    </div>
    <p class="mut" style="margin-top:14px">More reps: <a href="practice-testing.html">testing practice</a> &middot; <a href="practice-detective.html">AI Code Detective</a>.</p>
"""

M9_JS = """Northline.renderPrediction("beforeAi", {
  label: "Predict first \\u00b7 what differs",
  intro: "Priya's input works: { name, email, date } all filled. Two patients hit Request and nothing happened.",
  questions: [
    { q: "What is the most likely difference between Priya and the two patients?",
      opts: [
        { t: "They left a field untouched. The code reads .length on undefined and throws.", correct: true,
          whyOk: "Priya fills every field. A missing field is the case she has never triggered." },
        { t: "Their browsers cannot run JavaScript.", why: "Possible, last on the list. Start with input. That is where most of these live." },
        { t: "The function is fine and they mis-clicked.", why: "Two independent reports. Believe the report until you have a reproduction that fails." }
      ] },
    { q: "An agent offers a fix with no reproduction. What do you do?",
      opts: [
        { t: "Refuse it. Without a case that fails every time you cannot tell a fix from a coincidence.", correct: true,
          whyOk: "A confident explanation attached to an untriggerable change is how a guess lands in the codebase." },
        { t: "Merge it. Speed matters under pressure.", why: "Pressure is why you reproduce first. A wrong fix under pressure is two bugs." },
        { t: "Ask it to also write tests, then merge.", why: "Tests written after a guessed fix often record the guess." }
      ] }
  ],
  learned: ["You named the missing-field class before you saw the function.",
    "Reproduction first is not optional. It is the only way a later green test means anything."]
});
Northline.renderDetectiveSet(["testAlwaysTrue", "validate", "leftover"], "detectives");
var BUGGY = "function canSubmit(form) {\\n  return form.name.length > 0 && form.email.length > 0 && form.date.length > 0;\\n}";
document.getElementById("m9code").innerHTML = DetectiveKit.codeBlock(BUGGY, "js") +
  '<p class="mut" style="margin-top:8px">It works for Priya. It has worked for months. Nothing in it looks unusual.</p>';

var m9 = { a: false, b: false, c: false };
function m9sync() {
  if (m9.a && m9.b && m9.c) {
    CourseProgress.setSection(9, "debugExercise", { passed: true, at: new Date().toISOString() });
    MK.sync();
  }
}
function buggyFn() { return new Function(BUGGY + "\\n; return canSubmit;")(); }
function correctFn() {
  return function (form) {
    if (!form) return false;
    function filled(v) { return typeof v === "string" && v.trim().length > 0; }
    return filled(form.name) && filled(form.email) && filled(form.date);
  };
}

document.getElementById("m9btn1").onclick = function () {
  var raw = document.getElementById("m9repro").value;
  var parsed;
  try { parsed = JSON.parse(raw); } catch (e) {
    ModuleKit.showResults(document.getElementById("m9fb1"),
      { passed: false, results: [{ name: "your input is valid JSON", pass: false, hint: e.message }] });
    return;
  }
  var threw = false, got, err = "";
  try { got = buggyFn()(parsed); } catch (e) { threw = true; err = e.message; }
  var expected = correctFn()(parsed);
  var wrongAnswer = !threw && got !== expected;
  var reproduced = threw || wrongAnswer;
  var results = [
    { name: "your input is valid JSON", pass: true },
    { name: "the buggy function misbehaves on it", pass: reproduced,
      hint: "It returned " + JSON.stringify(got) + ", which is correct for that input. Keep looking \\u2014 what would a real patient do that Priya never does? Think about a field she always fills in and they might not touch at all." }
  ];
  if (reproduced) {
    results.push({ name: threw ? "it throws: " + err : "it returns " + JSON.stringify(got) + " when the answer is " + JSON.stringify(expected), pass: true });
  }
  var ok = reproduced;
  ModuleKit.showResults(document.getElementById("m9fb1"), { passed: ok, results: results });
  if (ok) {
    m9.a = true;
    document.getElementById("m9fb1").innerHTML =
      "<b>Reproduced.</b> " + (threw
        ? "It throws, because <code>.length</code> on a field the patient never touched is <code>.length</code> on <code>undefined</code>. Priya fills in every field, so she has never once triggered it."
        : "It returns the wrong answer for that input.") +
      " You now have something Priya could not give you: a case that fails every single time. That is what makes the next two parts possible.";
    m9sync();
  }
};

document.getElementById("m9btn2").onclick = function () {
  var out = PracticeKit.gradeTesting({
    functionName: "test_canSubmit",
    goodImpl: correctFn(),
    badImpl: buggyFn(),
    bugHint: "Your test passed the broken implementation. Give it a form with a missing or blank field \\u2014 that is the case that breaks."
  }, document.getElementById("m9test").value);
  ModuleKit.showResults(document.getElementById("m9fb2"), out);
  if (out.passed) {
    m9.b = true;
    document.getElementById("m9fb2").innerHTML =
      "<b>That test can fail.</b> Which is the only property that makes green mean anything. Note what you did: you decided the right answer yourself, then required the code to agree \\u2014 rather than recording whatever it happened to return.";
    m9sync();
  }
};

document.getElementById("m9btn3").onclick = function () {
  var out = PracticeKit.gradeJs({
    functionName: "canSubmit",
    testCases: [
      { name: "a complete form can submit", args: [{ name: "Priya", email: "p@northline.co", date: "2026-09-02" }], expected: true },
      { name: "a missing date does not throw, and blocks submit", args: [{ name: "Priya", email: "p@northline.co" }], expected: false },
      { name: "a missing email blocks submit", args: [{ name: "Priya", date: "2026-09-02" }], expected: false },
      { name: "a missing name blocks submit", args: [{ email: "p@northline.co", date: "2026-09-02" }], expected: false },
      { name: "an empty string blocks submit", args: [{ name: "", email: "p@northline.co", date: "2026-09-02" }], expected: false },
      { name: "whitespace only blocks submit", args: [{ name: "   ", email: "p@northline.co", date: "2026-09-02" }], expected: false },
      { name: "an entirely empty object does not throw", args: [{}], expected: false },
      { name: "a null form does not throw", args: [null], expected: false }
    ]
  }, document.getElementById("m9fix").value);
  ModuleKit.showResults(document.getElementById("m9fb3"), out);
  if (out.passed) {
    m9.c = true;
    document.getElementById("m9fb3").innerHTML =
      "<b>NL-009 closed properly.</b> Reproduction, then a test that proves the bug, then the fix. Priya's two patients can book, and if someone reintroduces this next quarter your test catches it before they do.<br><br>" +
      out.results.map(function (r) { return "\\u2713 " + r.name; }).join("<br>");
    Northline.showLearned(document.getElementById("m9fb3").parentNode,
      "You just closed a bug the way a team can trust.",
      "Reproduce, prove, then fix. The test is what stops this coming back in a different costume.");
    m9sync();
  }
};"""

write(os.path.join(OUT, "module-09.html"), module_page(
    num=9, stage_label="Stage 4", minutes=65,
    title="Testing and debugging under pressure",
    sub="Two patients cannot book. It works for Priya every time. Both facts are true, and the gap between them is where the bug lives.",
    objectives_list=[
        "Turn \u201cit works for me\u201d into a list of things that differ between you and the reporter",
        "Produce a reproduction before writing any fix, and say why that order is not optional",
        "Recognise a test that cannot fail, in three common shapes",
        "Write the failing test before the fix, and watch it go red",
        "Debug by narrowing rather than staring",
    ],
    why={
        "build": "A reproduction, a test that fails on the real bug, and the fix \u2014 in that order, all three graded.",
        "why": "This is the module that separates \u201cit ran once\u201d from \u201cI can prove it works\u201d. It is also the most common gap in self-taught developers.",
        "aiHelps": "Generating a list of possible causes from an error message. Breadth again.",
        "aiFails": "It will produce a confident fix for a bug it cannot reproduce, and write tests that cannot fail while reporting them as passing.",
        "without": "You find the breaking input yourself. Part 2 explicitly fails a test that always returns true, so there is no way through by guessing.",
    },
    sections_html="".join(M9),
    exercise_html=M9_EX,
    exercise_js=M9_JS,
    extra_scripts=("detective-kit.js",),
))

# ----------------------------------------------------------------- Module 10

HUNKS = [
    {"id": "h1", "file": "notes.js", "verdict": "accept",
     "code": """+function clinicianNote(appointmentId, text) {
+  return { appointmentId: appointmentId, text: String(text || "").trim() };
+}""",
     "why": "Small, does one thing, defends against a missing text argument, and returns rather than mutating. This is what you asked for."},
    {"id": "h2", "file": "notes.js", "verdict": "reject",
     "code": """+function renderNote(note) {
+  const el = document.createElement("p");
+  el.innerHTML = note.text;
+  return el;
+}""",
     "why": "innerHTML with text a clinician typed. That is an injection point on a page handling patient data. textContent is the one-word fix."},
    {"id": "h3", "file": "booking.js", "verdict": "reject",
     "code": """-  if (!canSubmit(form)) return;
+  // validation moved to notes.js
   sendBooking(form);""",
     "why": "It deleted the booking guard and left a comment claiming the check moved somewhere it did not. This is the regression Dan explicitly told you not to cause, and it is a deletion \u2014 the easiest thing in a diff to skim past."},
    {"id": "h4", "file": "notes.js", "verdict": "accept",
     "code": """+// Notes are per appointment, not per patient: the same patient can
+// have contradictory notes on two visits and both are correct.
+const NOTES_BY_APPOINTMENT = new Map();""",
     "why": "A comment explaining a non-obvious domain decision, which is exactly what comments are for. Nothing to object to here."},
    {"id": "h5", "file": "notes.js", "verdict": "reject",
     "code": """+function saveNote(note) {
+  console.log("saving note for", note.patientEmail, note.text);
+  NOTES_BY_APPOINTMENT.set(note.appointmentId, note);
+}""",
     "why": "A patient email and clinical note written to the log. Logs get copied, shipped to third parties, and read by people with no clinical relationship to that patient."},
    {"id": "h6", "file": "styles.css", "verdict": "reject",
     "code": """+.note:focus {
+  outline: none;
+}""",
     "why": "Nobody asked for a CSS change, and this one removes the only cue a keyboard user has about where they are. Two reasons to reject in three lines."},
]

M10 = (
    section("01", "Before you approve anything", """    <p>The agent implemented notes on a branch. It also deleted a booking guard and logged a patient email. Before you open the hunks, decide what a review comment has to contain, and what you do with a deletion hidden behind a comment.</p>
    <div id="beforeAi" class="interactive"></div>
    <div id="detectives" style="margin-top:16px"></div>
"""),

    section("02", "Git in the amount you actually need", """    <p>Git is a time machine for your project with a reputation for being confusing. Most of the confusion comes from learning the commands before the model, so here is the model in four sentences.</p>
    <p>Your project has a <b>history</b>: a sequence of saved states. Each saved state is a <b>commit</b>, and a commit has a message explaining why it exists. A <b>branch</b> is a movable label pointing at a commit, which lets you build a parallel line of history without disturbing the main one. A <b>remote</b> (usually GitHub) is a copy of that history somewhere other than your laptop.</p>
""" + code("""git status                  # what has changed. run this constantly.
git diff                    # exactly what changed, line by line
git add notes.js            # stage this file for the next commit
git commit -m "Add clinician notes to appointments"
git switch -c notes-feature # new branch, and move onto it
git push -u origin notes-feature
git log --oneline           # the history, one line per commit""") + """    <p><code>git status</code> is the one to over-use. It tells you where you are and what is about to happen, and nearly every Git disaster starts with someone running a command without knowing either.</p>
""" + defbox("One reason per commit", "Not one file &mdash; one <i>reason</i>. A rename touching four files is a single commit. A bug fix plus an unrelated tidy-up is two commits, even if both are in the same file. The test: can you write the message without using the word \u201cand\u201d?")),

    section("03", "Why branches matter more when you work with an agent", """    <p>Branching is often taught as a team-coordination tool, which undersells it badly for your situation.</p>
    <p>When you are driving an agent, you are going to accept changes that turn out to be wrong. Not occasionally &mdash; regularly. A branch means the wrong version is contained: <code>main</code> still works, and abandoning the attempt costs you nothing but the time you already spent.</p>
    <p>Without a branch, a bad agent session leaves you picking apart a working state and a broken one in the same place, trying to remember which of forty changed lines you actually wanted.</p>
""" + code("""git switch -c notes-feature   # start
# ... work, commit, work, commit ...
# it went wrong:
git switch main               # main was never touched
git branch -D notes-feature   # and the mess is gone""")),

    section("04", "Reading a diff without missing the deletions", """    <p>A diff shows what changed: <code>+</code> lines added, <code>-</code> lines removed. The additions draw your eye. <b>The deletions are where the danger is</b>, and they are the thing people reliably skim past.</p>
    <p>Agents remove code they judge redundant. Sometimes correctly. Sometimes what looked redundant was the guard clause stopping an empty form being submitted &mdash; and its removal is one quiet red line in a diff of forty green ones.</p>
""" + code("""-  if (!canSubmit(form)) return;
+  // validation moved to notes.js
   sendBooking(form);""") + """    <p>Read that. The check is gone. A comment asserts it moved. Did it? The comment is not evidence &mdash; it is a claim, written by the same process that deleted the line. Go and look.</p>
""" + trap("This exact pattern \u2014 remove a check, add a comment explaining where it supposedly went \u2014 appears in AI-generated diffs often enough to be worth naming. It is not deception; the agent genuinely predicted that a comment like that would follow. But a comment describing a refactor that did not happen is worse than no comment, because it stops the next person checking.")),

    section("05", "A review is a set of named checks", """    <p>"LGTM" is not a review. Neither is "looks good, nice work". A review is an answer to a specific question: <b>what did you check, and what did you find?</b></p>
    <p>What a useful review comment contains:</p>
    <ul class="plain">
      <li><b>Where.</b> The file and roughly the line. "Somewhere in the notes code" wastes the author's time.</li>
      <li><b>What.</b> The specific problem, not a feeling. Not "this seems fragile" but "this throws when <code>note.text</code> is undefined".</li>
      <li><b>Why it matters.</b> Consequence, not doctrine. Not "innerHTML is bad practice" but "a clinician could paste markup here and it would execute".</li>
      <li><b>What would resolve it.</b> Give the author a route forward.</li>
    </ul>
    <p>And the rule from Module 8, which applies just as hard here: <b>do not pad the list.</b> Three real findings land. Three real findings mixed with four style preferences get discounted as a whole, including the one about the patient email in the log.</p>
""" + defbox("The question you cannot dodge", "Would you be comfortable if this broke in production and someone asked what you checked before approving it? If the honest answer is \u201cI would say the agent wrote it\u201d, you have not reviewed it. Approval means you vouch for it.")),

    section("06", "Pull requests, and what they are actually for", """    <p>A pull request says: <i>here is a branch, here is what it does, please look before it joins main.</i> Its value is almost entirely in the description.</p>
    <p>A PR description worth reading has four things:</p>
    <ol>
      <li><b>What changed</b>, in a sentence a non-author can follow.</li>
      <li><b>Why</b>, ideally with the ticket.</li>
      <li><b>How to verify it</b> &mdash; the steps a reviewer should take. This is the part people omit and it is the most useful.</li>
      <li><b>What the risk is.</b> What might this break? What did you deliberately not do?</li>
    </ol>
    <p>A 900-line PR with an empty description is not a review request; it is a request to be trusted. Ask for the description before you read a line, because without a stated intent you cannot distinguish a deliberate change from an accident.</p>
""" + note("Desktop Lab B is where this becomes real: a repository you own, with a README, at least three commits, and a pull request or a documented branch. A Cursor transcript is not evidence. A GitHub URL is.")),
)

M10_EX = """    <p>Ticket <b>NL-010</b>. The agent has implemented clinician notes on a branch. Dan's instruction was explicit: new feature, same release, and <i>if booking regresses I have to call the client myself</i>.</p>
    <p>Six hunks. Accept or reject each one, and for every rejection say what is wrong. Same standard as Module 8: rejecting all six fails, and so does accepting a regression.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise &middot; reviewExercise</div>
      <div id="prReview"></div>
      <button class="primary" id="m10check" style="margin-top:16px">Submit review</button>
      <div class="feedback" id="m10fb"></div>
    </div>
    <p class="mut" style="margin-top:14px">More reps: <a href="practice-git.html">Git practice</a> (write the commands) and <a href="practice-review.html">review practice</a> (five more AI pull requests) &middot; <a href="desktop-labs.html">Desktop Lab B</a> is the real repo.</p>
"""

M10_JS = """Northline.renderPrediction("beforeAi", {
  label: "Predict first \\u00b7 what a review comment is",
  questions: [
    { q: "A review comment that Dan can act on contains what?",
      opts: [
        { t: "A location, the mechanism, and the consequence.", correct: true,
          whyOk: "Without those three, it is a vibe. With them, someone can fix it." },
        { t: "LGTM and a compliment, so the author stays motivated.", why: "Kindness is free. It is not a review." },
        { t: "A request to rewrite it in a different style.", why: "Style without a consequence is noise. Save your credibility for the deletion." }
      ] },
    { q: "The diff deletes a canSubmit guard and adds a comment saying validation moved. Merge?",
      opts: [
        { t: "Reject it. A comment is not a move. Booking will accept empty forms.", correct: true,
          whyOk: "Deletions hide. A sentence claiming a refactor that did not happen is how this ships." },
        { t: "Accept it if the new file exists.", why: "Existing is not moved. Read the new file. If the check is not there, the comment is a lie." },
        { t: "Accept it. Comments document intent.", why: "This comment documents a fiction. That is worse than silence." }
      ] }
  ],
  learned: ["You decided what a review has to contain before you saw the hunks.",
    "Approving means your name is on it, whoever typed it."]
});
Northline.renderDetectiveSet(["leftover", "leak", "xssInnerHtml"], "detectives");
var HUNKS = %s;
(function () {
  var host = document.getElementById("prReview");
  host.innerHTML = HUNKS.map(function (h, i) {
    return '<div class="detcase" style="margin-top:14px" data-h="' + h.id + '">' +
      '<div class="detmeta"><span class="detticket">Hunk ' + (i + 1) + ' of ' + HUNKS.length + '</span>' +
      '<span class="detwho">' + h.file + '</span></div>' +
      DetectiveKit.codeBlock(h.code, h.file.indexOf(".css") !== -1 ? "css" : "js") +
      '<div class="verdicts"><button type="button" class="vbtn" data-v="accept">Accept</button>' +
      '<button type="button" class="vbtn" data-v="reject">Reject</button></div>' +
      '<div class="formrow reasonbox" hidden><label>Why are you rejecting it?</label>' +
      '<textarea class="reason" style="min-height:64px" placeholder="File, what is wrong, and the consequence."></textarea></div>' +
      '</div>';
  }).join("");
  host.querySelectorAll(".detcase").forEach(function (card) {
    card.querySelectorAll(".vbtn").forEach(function (btn) {
      btn.onclick = function () {
        card.querySelectorAll(".vbtn").forEach(function (b) { b.classList.remove("chosen"); });
        btn.classList.add("chosen");
        card.dataset.verdict = btn.getAttribute("data-v");
        card.querySelector(".reasonbox").hidden = btn.getAttribute("data-v") !== "reject";
      };
    });
  });
})();

document.getElementById("m10check").onclick = function () {
  var results = [];
  var cards = document.querySelectorAll("#prReview .detcase");
  var unanswered = 0;
  cards.forEach(function (card) { if (!card.dataset.verdict) unanswered += 1; });
  if (unanswered) {
    ModuleKit.showResults(document.getElementById("m10fb"),
      { passed: false, results: [{ name: "every hunk has a verdict", pass: false, hint: unanswered + " still undecided. A reviewer does not leave hunks blank." }] });
    return;
  }
  HUNKS.forEach(function (h, i) {
    var card = cards[i];
    var got = card.dataset.verdict;
    var right = got === h.verdict;
    results.push({
      name: "Hunk " + (i + 1) + " (" + h.file + ") \\u2014 " + (h.verdict === "accept" ? "should be accepted" : "should be rejected"),
      pass: right,
      hint: h.verdict === "accept"
        ? "You rejected a hunk that is fine. " + h.why
        : "You accepted a hunk that should not ship. " + h.why
    });
    if (h.verdict === "reject" && right) {
      var reason = (card.querySelector(".reason") || { value: "" }).value.trim();
      var specific = reason.length >= 60 && /(innerHTML|textContent|log|email|outline|focus|keyboard|delet|remov|guard|check|valid|regress|inject|xss|scope|css|patient)/i.test(reason);
      results.push({
        name: "Hunk " + (i + 1) + " \\u2014 your reason names the problem and its consequence",
        pass: specific,
        hint: "At least 60 characters, and it has to name the actual mechanism. \\u201cThis looks wrong\\u201d is not a review comment. " + h.why
      });
    }
  });
  var ok = results.every(function (r) { return r.pass; });
  ModuleKit.showResults(document.getElementById("m10fb"), { passed: ok, results: results });
  if (ok) {
    document.getElementById("m10fb").innerHTML =
      "<b>That is a review Dan can act on.</b> You cleared the two hunks that were genuinely fine, and you caught the deleted booking guard \\u2014 which was hiding behind a comment claiming the validation had moved. That one is the regression Dan said he would have to phone the client about.<br><br>" +
      results.map(function (r) { return "\\u2713 " + r.name; }).join("<br>");
    CourseProgress.setSection(10, "reviewExercise", { passed: true, at: new Date().toISOString() });
    Northline.showLearned(document.getElementById("m10fb").parentNode,
      "You just wrote a review someone can act on.",
      "You cleared the two hunks that were fine and caught the deleted booking guard. That is discrimination, not volume.");
    MK.sync();
  }
};""" % json.dumps(HUNKS, ensure_ascii=False)

write(os.path.join(OUT, "module-10.html"), module_page(
    num=10, stage_label="Stage 4", minutes=60,
    title="Git, GitHub, and code review",
    sub="The agent implemented the feature on a branch. It also quietly deleted the check that stops an empty booking being sent, and left a comment claiming the validation moved. You are the last line.",
    objectives_list=[
        "Use the eight Git commands that cover almost all daily work",
        "Explain why a branch matters more when an agent is writing the code",
        "Read a diff without skimming past the deletions",
        "Write a review comment with a location, a mechanism, and a consequence",
        "Write a PR description that tells a reviewer how to verify it",
    ],
    why={
        "build": "A hunk-by-hunk review of an AI-authored pull request, with written reasons for every rejection.",
        "why": "Review is where accountability actually happens. Approving means you vouch for it, whoever typed it.",
        "aiHelps": "Drafting commit messages and PR descriptions from a diff \u2014 genuinely useful, then you correct them.",
        "aiFails": "Deleting guard clauses it judged redundant, then adding a comment describing a refactor that never happened.",
        "without": "Every verdict and every reason is yours, and the grader checks that your reasons name a real mechanism.",
    },
    sections_html="".join(M10),
    exercise_html=M10_EX,
    exercise_js=M10_JS,
    extra_scripts=("detective-kit.js",),
))

# ----------------------------------------------------------------- Module 11

M11 = (
    section("01", "Before you tidy anything", """    <p>Three copies of a date function and a patient email in the log. Before you rewrite, decide what \u201crefactor\u201d allows you to change, and what a cleanup is not allowed to do.</p>
    <div id="beforeAi" class="interactive"></div>
    <div id="detectives" style="margin-top:16px"></div>
"""),

    section("02", "Refactoring has exactly one rule", """    <p><b>Behaviour does not change. Only structure does.</b></p>
    <p>That is the whole definition, and it is worth being pedantic about, because the word gets used for any change that feels like tidying. If observable behaviour changes &mdash; even in one edge case, even for the better &mdash; it is not a refactor. It is a fix or a feature, and it needs its own review and its own test.</p>
    <p>Why the distinction matters practically: it sets what a reviewer checks. Told "this is a refactor", Sam checks that nothing moved. Told "this changes how blank names are handled", he checks that the new handling is right. Mislabel it and he checks for the wrong thing.</p>
""" + defbox("What makes a refactor safe at all", "Tests that would fail if behaviour changed. Without them you are rearranging code and hoping, and \u201cI was only tidying\u201d is the preamble to a surprising number of outages. This is why Module 9 comes before this one.")),

    section("03", "Duplication is a correctness problem", """    <p>Dan says there are three copies of the same date function. This gets filed as untidiness. It is not; it is a bug waiting for a schedule.</p>
    <p>Here is what happens. Someone finds a bug in one copy and fixes it. The other two stay broken. Nobody knows which callers use which copy, so the bug is now <i>intermittent</i> from the user's point of view &mdash; it depends on which screen you came from. Then the three copies drift further, because each gets patched for its own caller, until they are genuinely different functions with the same name and nobody dares merge them.</p>
    <p>The fix is boring and that is fine: one function, one place, every caller pointing at it.</p>
""" + trap("Agents create duplication constantly, and it is structural rather than careless. Ask for a date formatter and it writes one, because it usually cannot see that <code>utils.js</code> already has one. This is why \u201cthere is already a formatDate in utils.js, use it\u201d belongs in your request \u2014 the context you provide is the only thing preventing a third copy.")),

    section("04", "The refactors worth knowing", """    <p>Four moves cover most of what you will do:</p>
    <ul class="plain">
      <li><b>Extract a function.</b> A block of code that needs a comment to explain what it does usually wants to be a function whose name says it. The comment becomes unnecessary, which is the sign you did it right.</li>
      <li><b>Name a value.</b> <code>if (days > 86400000)</code> becomes <code>if (days > MS_PER_DAY)</code>. Magic numbers are where off-by-a-factor-of-sixty bugs live.</li>
      <li><b>Remove a duplicate.</b> Three copies to one. Point the callers at it.</li>
      <li><b>Reduce nesting.</b> Return early instead of wrapping the whole body in an <code>if</code>. Four levels of indentation is a reliable sign that something wants extracting.</li>
    </ul>
    <p>Notice what is not on the list: renaming things to your personal taste, introducing an abstraction for a single caller, converting working loops to a different style. Those are changes with a cost and no stated benefit, and in a review they read as noise.</p>
""" + code("""// Before: nested, magic number, unnamed intent
function check(a) {
  if (a) {
    if (a.date) {
      if (Date.now() - Date.parse(a.date) < 604800000) {
        return true;
      }
    }
  }
  return false;
}

// After: same behaviour, one reason per line
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function isWithinLastWeek(appointment) {
  if (!appointment || !appointment.date) return false;
  return Date.now() - Date.parse(appointment.date) < MS_PER_WEEK;
}""")),

    section("05", "Security you can actually apply this week", """    <p>Not a compliance course. Five things that come up in real small projects, all of which you have now met at least once:</p>
    <ul class="plain">
      <li><b>Never log personal data.</b> Patient emails, names, clinical notes, card numbers, tokens. Logs get copied to third-party services, pasted into tickets, and read by people with no relationship to that patient. Dan's ticket mentions exactly this.</li>
      <li><b>Never commit secrets.</b> API keys go in environment configuration, and the file goes in <code>.gitignore</code>. And note: deleting a committed secret does not remove it from history. It has to be rotated. Treat a committed key as compromised, because it is.</li>
      <li><b>Never put untrusted input into <code>innerHTML</code>.</b> <code>textContent</code> for anything a person typed.</li>
      <li><b>Validate on arrival.</b> Check input at the boundary where it enters your system, not in the middle where you have already used it twice.</li>
      <li><b>Do not disable a check to make something work.</b> The <code>// TEMP: skipping validation for the demo</code> comment is honest and the code is broken. Demo shortcuts become production behaviour, because nothing forces anyone to come back.</li>
    </ul>
""" + note("None of these need a security specialist. They need somebody who reads the diff, which is now your job.")),

    section("06", "Maintenance: writing for the person who inherits it", """    <p>Most of a codebase's life is after it is written, and most of the reading is done by someone with no memory of why. Often you.</p>
    <ul class="plain">
      <li><b>A README that says how to run it.</b> Not what it is &mdash; how to start it. This is the single highest-value document in any small project.</li>
      <li><b>Comments that say why, never what.</b> <code>// increment i</code> is noise. <code>// Notes are per appointment, not per patient: the same patient can have contradictory notes on two visits</code> is worth its space forever.</li>
      <li><b>Names that survive.</b> <code>data</code>, <code>temp</code>, <code>result2</code>, <code>handleIt</code> mean nothing a month later.</li>
      <li><b>Record decisions and their alternatives.</b> "We store notes per appointment rather than per patient because visits can legitimately contradict each other." Without this, someone reverses it in six months, reasonably, and breaks something.</li>
    </ul>
""" + defbox("The maintenance test", "Could someone who has never seen this project run it, find the thing that handles bookings, and understand why the odd-looking decision was made? If not, the gap is documentation, not cleverness.")),
)

M11_EX = """    <p>Ticket <b>NL-011</b>: <i>"Three copies of the same date function and a console.log with a patient email in it. Tidy it without changing behaviour."</i></p>
    <div id="m11code"></div>
    <div class="interactive">
      <div class="ilbl">Required exercise &middot; refactorExercise</div>
      <p>Replace all of that with <b>one</b> function, <code>isWithinDays(dateStr, today, days)</code>, returning <code>true</code> when <code>dateStr</code> falls inside the window of <code>days</code> ending on <code>today</code> inclusive. It must not throw on missing input. Then declare the constant and drop the logging.</p>
      <p class="mut">Graded on three things at once: the behaviour is preserved for every window the three originals covered, there is only one function, and the patient email is no longer written to the log. That is what \u201crefactor\u201d means.</p>
      <div class="formrow"><label>Your refactor</label><textarea id="m11js" spellcheck="false" style="min-height:200px">const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isWithinDays(dateStr, today, days) {

}
</textarea></div>
      <button class="primary" id="m11check" style="margin-top:12px">Check behaviour and cleanliness</button>
      <div class="feedback" id="m11fb"></div>
    </div>
    <p class="mut" style="margin-top:14px">More reps: <a href="practice-detective.html">AI Code Detective</a> &middot; <a href="practice-integrated.html">integrated challenges</a>.</p>
"""

M11_JS = """Northline.renderPrediction("beforeAi", {
  label: "Predict first \\u00b7 what refactor allows",
  questions: [
    { q: "You improve a date helper and also start treating a blank date as today. What is that change?",
      opts: [
        { t: "A fix or a feature, not a refactor. Behaviour moved. It needs its own review and test.", correct: true,
          whyOk: "Told 'this is a refactor', Sam checks that nothing moved. Mislabel it and he checks for the wrong thing." },
        { t: "A refactor, because the code is cleaner.", why: "Cleaner is not the definition. Behaviour did not stay still." },
        { t: "A refactor if the tests still pass.", why: "Tests that never covered blank dates will stay green. That is the hole." }
      ] },
    { q: "The tidy-up still has console.log('checking', d.patientEmail). Merge?",
      opts: [
        { t: "No. Personal data in a log is a disclosure. Remove it, do not comment it out.", correct: true,
          whyOk: "Logs get copied. A patient email in a cleanup PR is the leak Dan named." },
        { t: "Yes if it is only on the server.", why: "Server logs get shipped too. Still a leak." },
        { t: "Yes. Debug logs are part of maintenance.", why: "Maintenance is a README and a named constant, not a inbox dump." }
      ] }
  ],
  learned: ["You drew the line before you touched the three copies.",
    "Behaviour stays. Structure moves. A log of a patient email does neither \\u2014 it just leaves."]
});
Northline.renderDetectiveSet(["leak", "leftover", "xssInnerHtml"], "detectives");
var LEGACY = "// checks if within a week\\nfunction withinWeek(d) {\\n  console.log('checking', d.patientEmail);\\n  return Date.now() - Date.parse(d.date) < 604800000;\\n}\\n\\n// same thing but 30 days\\nfunction within30(d) {\\n  return Date.now() - Date.parse(d.date) < 2592000000;\\n}\\n\\n// same thing but a day\\nfunction isToday(d) {\\n  return Date.now() - Date.parse(d.date) < 86400000;\\n}";
document.getElementById("m11code").innerHTML = DetectiveKit.codeBlock(LEGACY, "js") +
  '<p class="mut" style="margin-top:8px">Three functions, one idea, three magic numbers, and a patient email going to the log.</p>';

document.getElementById("m11check").onclick = function () {
  var src = document.getElementById("m11js").value;
  var out = PracticeKit.gradeJs({
    functionName: "isWithinDays",
    testCases: [
      { name: "today is inside a 1-day window", args: ["2026-08-30", "2026-08-30", 1], expected: true },
      { name: "yesterday is outside a 1-day window", args: ["2026-08-29", "2026-08-30", 1], expected: false },
      { name: "6 days back is inside a 7-day window", args: ["2026-08-24", "2026-08-30", 7], expected: true },
      { name: "7 days back is outside a 7-day window", args: ["2026-08-23", "2026-08-30", 7], expected: false },
      { name: "29 days back is inside a 30-day window", args: ["2026-08-01", "2026-08-30", 30], expected: true },
      { name: "a future date is outside the window", args: ["2026-08-31", "2026-08-30", 7], expected: false },
      { name: "a missing date does not throw", args: [null, "2026-08-30", 7], expected: false },
      { name: "an unparseable date does not throw", args: ["not a date", "2026-08-30", 7], expected: false }
    ]
  }, src);

  var extra = [
    { name: "exactly one function is declared", pass: (src.match(/function\\s+[A-Za-z_$][\\w$]*\\s*\\(/g) || []).length === 1,
      hint: "The point of the ticket is one function, not three. Found " + (src.match(/function\\s+[A-Za-z_$][\\w$]*\\s*\\(/g) || []).length + "." },
    { name: "the patient email is no longer logged", pass: !/console\\.(log|info|warn|debug)[\\s\\S]*?(patientEmail|email)/i.test(src),
      hint: "Personal data in logs is a disclosure. Remove it, do not comment it out." },
    { name: "no leftover console logging at all", pass: !/console\\.(log|info|debug)\\s*\\(/.test(src),
      hint: "Debug logging is not part of a finished refactor." },
    { name: "the day length is a named constant, not a magic number", pass: /MS_PER_DAY/.test(src) && !/\\b(604800000|2592000000|86400000)\\b/.test(src),
      hint: "Use MS_PER_DAY and multiply by days. 604800000 tells the next reader nothing." }
  ];
  var results = out.results.concat(extra);
  var ok = out.passed && extra.every(function (r) { return r.pass; });
  ModuleKit.showResults(document.getElementById("m11fb"), { passed: ok, results: results });
  if (ok) {
    document.getElementById("m11fb").innerHTML =
      "<b>Same behaviour, one third of the code, and no patient data in the log.</b> Every window the three originals handled still returns what it returned before \\u2014 which is the only thing that entitles you to call this a refactor rather than a rewrite.<br><br>" +
      results.map(function (r) { return "\\u2713 " + r.name; }).join("<br>");
    CourseProgress.setSection(11, "refactorExercise", { passed: true, at: new Date().toISOString() });
    Northline.showLearned(document.getElementById("m11fb").parentNode,
      "You just changed the shape and left the behaviour where it was.",
      "One function, named constants, no patient data in the log. That is what entitles you to call it a refactor.");
    MK.sync();
  }
};"""

write(os.path.join(OUT, "module-11.html"), module_page(
    num=11, stage_label="Stage 4", minutes=60,
    title="Refactoring, security, and maintenance",
    sub="Three copies of the same function and a patient email in the log. Change the shape without changing the behaviour \u2014 and understand why that constraint is the whole point.",
    objectives_list=[
        "State the one rule of refactoring, and why mislabelling a change misleads your reviewer",
        "Explain why duplicated logic is a correctness problem rather than an aesthetic one",
        "Apply the four refactors that cover most real work",
        "Apply five security rules that come up in small projects every week",
        "Leave a project someone else can pick up",
    ],
    why={
        "build": "One function replacing three, with the magic numbers named and the patient email out of the log.",
        "why": "Most of a codebase's life happens after it is written, and most of that reading is done by someone with no memory of why.",
        "aiHelps": "Mechanical refactors are something it does quickly and usually well.",
        "aiFails": "It creates the duplication in the first place, and it will change behaviour while \u201ctidying\u201d and describe it as cleanup.",
        "without": "You do the refactor. The grader checks behaviour is preserved across every window the three originals covered.",
    },
    sections_html="".join(M11),
    exercise_html=M11_EX,
    exercise_js=M11_JS,
    extra_scripts=("detective-kit.js",),
))
