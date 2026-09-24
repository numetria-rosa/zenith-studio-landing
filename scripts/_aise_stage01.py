# -*- coding: utf-8 -*-
"""Generates Module 0 (orientation), Module 1, and Module 2."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _aise_shell import (page, section, module_page, write, trap, note, defbox,
                         code, DEFAULT_NAV, SCOREBOARD)

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "courses", "ai-assisted-software-engineering")

# ----------------------------------------------------------------- Module 0

M0_BODY = """  <header class="hero">
    <span class="eyebrow">Stage 0 &middot; Orientation &middot; ~35 min</span>
    <h1 class="serif">You are about to become the engineer, not the typist</h1>
    <p class="sub">An AI coding agent can produce more code in ten seconds than you will read in ten minutes. That has not made engineers unnecessary. It has moved the entire job to the part most courses skip: deciding what should exist, and proving that what got built actually works.</p>
    <div id="loopStrip"></div>
  </header>
  <section>
    <div class="kh"><span class="num">01</span><h2>What software engineers actually do</h2></div>
    <p>Ask someone what a software engineer does and they will mime typing. Sit next to one for a week and you will see something else. The typing is maybe fifteen percent of it. The rest is:</p>
    <ul class="plain">
      <li><b>Working out what is actually being asked.</b> The person filing the ticket describes a symptom. You have to find the cause.</li>
      <li><b>Deciding what to build, and what not to build.</b> Most feature requests contain three features, one of which is a bad idea.</li>
      <li><b>Reading code someone else wrote.</b> Including code you wrote four months ago, which counts as someone else.</li>
      <li><b>Proving it works.</b> Not believing it works. Proving it, with something that would have failed if you were wrong.</li>
      <li><b>Finding out why it stopped working.</b> Usually at an inconvenient hour, usually because of an assumption nobody wrote down.</li>
      <li><b>Explaining a decision.</b> To a reviewer, to a client, to whoever inherits it.</li>
    </ul>
    <p>Notice that only one of those six is "produce code". That is the one AI is good at.</p>
  </section>
  <section>
    <div class="kh"><span class="num">02</span><h2>What AI actually changed</h2></div>
    <p>Be precise about this, because the hype and the backlash are both wrong.</p>
    <div class="def"><div class="k">Genuinely changed</div><p>The cost of a first draft has collapsed. Boilerplate, scaffolding, the syntax of a language you have not used in a year, a regex you would have spent forty minutes on, a first pass at a test suite &mdash; these went from hours to seconds. Also: the cost of <i>asking a stupid question</i> went to zero, which matters more than people admit when you are learning.</p></div>
    <div class="def"><div class="k">Not changed at all</div><p>Whether the thing you built is the thing that was needed. Whether it breaks under a condition nobody mentioned. Whether it leaks data. Whether the next person can maintain it. Who gets called when it goes down at 2am. The agent has no stake in any of that. You do.</p></div>
    <p>Here is the uncomfortable version: AI made it much easier to produce code, and did nothing to make it easier to produce <i>correct</i> code. The gap between those two things is where your salary comes from.</p>
  </section>
  <section>
    <div class="kh"><span class="num">03</span><h2>The loop this whole course is built around</h2></div>
    <p>Every module drills part of the same eleven-step loop. It is not a framework we invented for the brochure &mdash; it is a compressed description of what actually happens when a competent engineer works with an agent.</p>
    <div id="loopDetail"></div>
    <div class="callout">Watch what happens if you delete steps. Skip <b>Specify</b> and you get code that does something adjacent to what you wanted. Skip <b>Inspect</b> and you have shipped a stranger's code under your name. Skip <b>Test</b> and "it works" means "it did not crash in the one case I happened to try". Skip <b>Review</b> and you cannot defend a single line of it. The loop is not bureaucracy. Each step exists because skipping it has a specific failure mode.</div>
  </section>
  <section>
    <div class="kh"><span class="num">04</span><h2>Meet Northline Digital</h2></div>
    <p>You are not going to learn this from abstract exercises. From Module 1 you work at a small agency, and every module is a real ticket from their board.</p>
    <p class="mut" id="companyBlurb"></p>
    <div id="people"></div>
    <p style="margin-top:18px">Priya will not tell you what to build. She will tell you that patients are showing up to a locked door. Dan will forward you one sentence and call it a brief. Sam will ask "how do you know?" until you have a real answer. The agent will write two hundred lines and sound completely certain. This is what the job feels like.</p>
    <p><a href="tickets.html">See the full ticket board &rarr;</a></p>
  </section>
  <section>
    <div class="kh"><span class="num">05</span><h2>What this course is, and what it is not</h2></div>
    <p><b>It is:</b> a beginner course that takes you from never having written a line of code to shipping a small web application at a live URL &mdash; built with an AI agent, reviewed by you, tested by you, deployed by you, and defensible line by line.</p>
    <p><b>It is not a prompt engineering course.</b> You will learn to write good requests to an agent, but that is one step out of eleven. Anyone selling you "37 prompts that make AI write perfect code" is selling you the easy fifteen percent.</p>
    <p><b>It is not AI Engineering.</b> That is a different course on this platform: building products <i>out of</i> language models &mdash; retrieval, tool-calling, evaluation. It assumes you can already program. If you cannot yet, this course is the one that comes first.</p>
    <p><b>It is not a job guarantee.</b> It is evidence: a repo you own, commits with your name on them, tests that catch real breaks, and a live URL. What you do with that is your business.</p>
  </section>
  <section>
    <div class="kh"><span class="num">06</span><h2>Setup, and when you actually need it</h2></div>
    <p>You need nothing but this browser for Modules 1 through 6. Every exercise in Stage 1 and Stage 2 runs and grades here. That is deliberate: installing tools is a terrible first lesson, and you should write code by hand before you let anything write it for you.</p>
    <p>From Module 7 you need a real editor with an agent in it, because that is the point of Module 7. Install it whenever you like &mdash; earlier is fine, and having it open while you do Stage 2 is a good way to get comfortable.</p>
    <ul class="plain">
      <li><b>Cursor</b> (recommended) &mdash; <a href="https://cursor.com" target="_blank" rel="noopener">cursor.com</a>. Free tier is enough for this course.</li>
      <li><b>Or VS Code</b> with Copilot, Continue, Cline, or similar. The course never depends on one vendor's button.</li>
      <li><b>Git</b> &mdash; <a href="https://git-scm.com" target="_blank" rel="noopener">git-scm.com</a>. Needed from Module 10.</li>
      <li><b>A GitHub account</b> &mdash; free. This is where your evidence lives.</li>
    </ul>
    <div class="honestnote"><b>No fake agent, ever.</b> This site will never pretend to be Cursor. There is no simulated chat panel that congratulates you. When a module needs real agent work, you do it in the real editor and bring the actual output back &mdash; and we run our own tests against it. A few practice libraries are explicitly labelled <i>simulation</i>; those build judgement and they never unlock the capstone on their own.</div>
  </section>
  <section>
    <div class="kh"><span class="num">07</span><h2>What we will not claim</h2></div>
    <ul class="plain">
      <li>This will not make you a senior engineer. Seniority is years of consequences.</li>
      <li>It does not cover computer science fundamentals &mdash; algorithms, data structures, complexity analysis. You will feel that gap if you interview at a company that screens on it.</li>
      <li>It does not cover backend systems, databases at scale, or infrastructure beyond deploying a static site.</li>
      <li>It does not cover working in a real team over years, which is where most of the actual skill lives.</li>
      <li>The <a href="career.html">career page</a> lists these gaps explicitly rather than hiding them behind a testimonial.</li>
    </ul>
  </section>
  <section>
    <div class="kh"><span class="num">08</span><h2>Where should you start?</h2></div>
    <p>Everyone starts at Module 1. This is a self-check, not a placement test &mdash; it just tells you which parts will feel slow and which will hurt.</p>
    <div class="interactive">
      <div class="ilbl">Self-check &middot; not graded &middot; nothing locks</div>
      <div id="selfCheck"></div>
      <div class="feedback" id="scFb"></div>
    </div>
  </section>
  <section>
    <div class="kh"><span class="num">09</span><h2>Ready</h2></div>
    <p>Module 1 takes about forty-five minutes and ends with you having fixed a real ticket and written the commit message for it. You will make something today.</p>
    <div class="interactive">
      <label class="check"><input type="checkbox" id="ackHonest"> I understand that this course will not simulate a coding agent, that real agent work happens in my own editor, and that the two Desktop Labs are required before the capstone.</label>
      <button class="primary" id="btnAck" style="margin-top:14px">Start Module 1</button>
      <div class="feedback" id="ackFb"></div>
    </div>
  </section>
"""

M0_SCRIPTS = """<script src="course-progress.js"></script>
<script src="northline.js"></script>
<script>
(function () {
  var host = document.getElementById("loopStrip");
  host.className = "loopstrip";
  host.innerHTML = '<div class="looplbl">The loop</div><ol class="loopsteps">' +
    CourseProgress.LOOP.map(function (s) { return '<li class="loopstep on">' + s.label + '</li>'; }).join("") + '</ol>';

  var detail = document.getElementById("loopDetail");
  detail.className = "whycare";
  detail.innerHTML = CourseProgress.LOOP.map(function (s, i) {
    return '<div class="whybox"><h4>' + (i + 1) + ' &middot; ' + s.label + '</h4><p>' +
      CourseProgress.escapeHtml(s.blurb) + '</p></div>';
  }).join("");

  document.getElementById("companyBlurb").textContent = Northline.COMPANY.blurb;
  Northline.renderPeople("people");

  var QS = [
    { id: "q1", t: "Have you written any code before, in any language?", opts: [
      ["Never", "Perfect. Modules 1 to 6 are built for you. Do not skip them."],
      ["A little (a tutorial, a spreadsheet formula, some HTML)", "Stage 2 will feel quick. Do the exercises anyway \\u2014 the graded ones check things tutorials skip."],
      ["Yes, I can write functions already", "Stage 2 will be revision. Stage 3 onward is where you will earn it."]] },
    { id: "q2", t: "Have you used an AI coding assistant?", opts: [
      ["No", "Module 7 is your first real session, and we build up to it deliberately."],
      ["Yes, for autocomplete or asking questions", "Module 7 will change how you use it. The difference is the review step."],
      ["Yes, I let it write whole features", "Module 8 is going to be uncomfortable. That is the module you paid for."]] },
    { id: "q3", t: "Have you used Git?", opts: [
      ["No idea what it is", "Module 10 starts from zero. Desktop Lab B is where it becomes real."],
      ["I have cloned something", "You will still need to branch, diff, and open a PR."],
      ["I commit and push regularly", "Skim Module 10's teaching, but the review half is probably new."]] },
    { id: "q4", t: "When code works on your machine, what do you do next?", opts: [
      ["Ship it", "Module 9 exists entirely for this answer. It is the most common junior mistake."],
      ["Try a couple of other cases by hand", "Good instinct. Module 9 turns it into something repeatable."],
      ["Write a test that would fail if I broke it", "You are ahead. Module 9 will push on whether your tests can actually fail."]] }
  ];
  var box = document.getElementById("selfCheck");
  var fb = document.getElementById("scFb");
  var said = {};
  QS.forEach(function (q) {
    var card = document.createElement("div");
    card.className = "qcard";
    card.innerHTML = '<div class="qtext">' + q.t + '</div>';
    q.opts.forEach(function (pair) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "qopt";
      b.textContent = pair[0];
      b.onclick = function () {
        card.querySelectorAll(".qopt").forEach(function (x) { x.classList.remove("chosen"); });
        b.classList.add("chosen");
        said[q.id] = pair[1];
        fb.className = "feedback ok";
        fb.innerHTML = "<b>What this means for you</b><br>" + QS.map(function (qq) {
          return said[qq.id] ? "&bull; " + said[qq.id] : "";
        }).filter(Boolean).join("<br>") + "<br><br>Either way: everyone starts at Module 1.";
        CourseProgress.setExtra("selfCheck", said);
      };
      card.appendChild(b);
    });
    box.appendChild(card);
  });

  var m0 = CourseProgress.getExtra("module0") || {};
  m0.visited = true;
  CourseProgress.setExtra("module0", m0);
  document.getElementById("ackHonest").checked = !!m0.completed;
  document.getElementById("btnAck").onclick = function () {
    var ok = document.getElementById("ackHonest").checked;
    var f = document.getElementById("ackFb");
    if (!ok) {
      f.className = "feedback bad";
      f.textContent = "Tick the box first. It is the one promise this course makes to you and asks back.";
      return;
    }
    CourseProgress.setExtra("module0", { visited: true, completed: true, at: new Date().toISOString() });
    location.href = "module-01.html";
  };
})();
</script>"""

write(os.path.join(OUT, "module-00.html"), page(
    title="Orientation — AI-Assisted Software Engineering",
    tag="Orientation",
    body=M0_BODY,
    nav=('<a href="dashboard.html">&larr; Dashboard</a>'
         '<a href="syllabus.html">Syllabus</a>'
         '<a href="tickets.html">Ticket board</a>'
         '<a href="career.html">Career path</a>'),
    scripts=M0_SCRIPTS,
))

# ----------------------------------------------------------------- Module 1

M1_SECTIONS = (
    section("01", "Read the ticket like an engineer", """    <p>Priya did not file a bug report. She described a consequence: people are showing up to a locked door. Underneath that sentence there are three separate facts, and only one of them is your job today.</p>
    <ul class="plain">
      <li><b>Fact:</b> the site says the clinic is closed on Saturday.</li>
      <li><b>Fact:</b> the clinic is actually open Saturday morning.</li>
      <li><b>Consequence:</b> patients are wasting a trip.</li>
    </ul>
    <p>The fix is to change what the page says. That is it. Notice what is <i>not</i> in scope: redesigning the hours section, adding an opening-hours widget, converting the site to a framework, or "modernising the styling while I am in there". Every one of those is a real thing juniors do, and every one of them turns a two-minute ticket into a two-day review.</p>
""" + defbox("The question that saves you", "Before touching anything, ask: <i>what is the smallest change that makes this complaint go away?</i> If your answer involves more than one file on a ticket like this, you have misunderstood the ticket.")
    + trap("Give an agent this ticket and there is a good chance it returns a rewritten hours section with a new CSS class, a <code>&lt;table&gt;</code> where there was a list, and an <code>aria-label</code> it invented. All of that might be fine. None of it was asked for, and now the reviewer has to evaluate five changes instead of one. Scope creep is not a style preference; it is the main reason AI-authored changes get rejected.")),

    section("02", "Where the words on a page actually live", """    <p>A web page is a text file. That is the whole secret. When you open the clinic site, your browser downloads a file full of angle brackets and turns it into something that looks designed.</p>
""" + code("""<dl class="hours">
  <dt>Monday &ndash; Friday</dt><dd>08:00 &ndash; 18:00</dd>
  <dt>Saturday</dt><dd>Closed</dd>
</dl>""") + """    <p>Three things are happening here, and they are the three things every HTML element does:</p>
    <ul class="plain">
      <li><b>A tag</b> like <code>&lt;dd&gt;</code> says what kind of thing this is. This one means "description" &mdash; the value paired with a term.</li>
      <li><b>Content</b> between the opening and closing tag is what humans read. <code>Closed</code> is content. Change it and the page changes.</li>
      <li><b>An attribute</b> like <code>class="hours"</code> is metadata. It does not show on screen; it is a handle so CSS and JavaScript can find this element later.</li>
    </ul>
    <p>So "the website says the wrong thing" is almost always "some content between two tags is wrong". You are about to fix exactly that.</p>
""" + note("Why <code>&lt;dl&gt;</code> and not a <code>&lt;table&gt;</code>? A definition list pairs a term with a value, which is precisely what opening hours are. A table implies rows and columns of comparable data. Choosing the element that matches the meaning is a real skill and Module 3 is entirely about it.")),

    section("03", "The smallest change that solves it", """    <p>Professional discipline, on day one: <b>change only what the ticket asks for.</b></p>
    <p>This is not pedantry, and it is not about being timid. It is about making your work reviewable. A change with one reason in it can be checked in thirty seconds. A change with six reasons in it &mdash; one of which is the actual fix and five of which are "while I was in there" &mdash; takes twenty minutes and usually gets sent back.</p>
    <p>It also matters when something breaks. If Saturday's hours are wrong next month, a one-line change is trivially findable. If your change touched forty lines, nobody knows which one did it.</p>
""" + defbox("Say this out loud before you commit", "\u201cI changed X, because Y, and here is how I know it worked.\u201d If you cannot fill in all three blanks in one breath, your change is doing too much.")),

    section("04", "Prove it, then say what you did", """    <p>Two steps that separate a change from a shipped change.</p>
    <p><b>Run it.</b> Open the page. Look at the thing you changed. This sounds too obvious to state, until you have watched someone confidently push a fix they never looked at. The agent saying "I have updated the hours" is not evidence. Your eyes on the rendered page are evidence.</p>
    <p><b>Then write the commit message.</b> A commit is a labelled point in your project's history. The label is for a future human &mdash; often you, six months from now, trying to work out when Saturday broke.</p>
    <div class="def"><div class="k">Useless</div><p><code>update</code> &middot; <code>fix</code> &middot; <code>changes</code> &middot; <code>asdf</code> &middot; <code>final v2</code></p></div>
    <div class="def"><div class="k">Useful</div><p><code>Correct Saturday hours to 09:00-13:00</code></p></div>
    <p>The pattern: start with a verb in the imperative &mdash; <i>Correct</i>, <i>Add</i>, <i>Remove</i>, <i>Fix</i> &mdash; as though completing the sentence "this commit will…". Say what changed. Keep the first line short enough to read in a list, roughly seventy characters. One reason per commit.</p>
""" + trap("Agents write commit messages that describe the code instead of the reason: <code>Modified dd element in dl.hours</code>. That tells a future reader what the diff already shows and hides the only thing they wanted to know, which is <i>why</i>. Rewrite them.")),
)

M1_EXERCISE = """    <p>Ticket <b>NL-001</b>. Below is the real markup from the clinic's hours section. The clinic is now open <b>09:00 &ndash; 13:00 on Saturday</b>. Sunday is still closed. Weekday hours have not changed.</p>
    <p>Fix it &mdash; and <i>only</i> it. The grader checks both that Saturday is right and that you left everything else alone, because that is the actual skill.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise &middot; shipFirstChange</div>
      <div class="formrow"><label>The markup</label><textarea id="m1html" spellcheck="false">&lt;dl class="hours"&gt;
  &lt;dt&gt;Monday &ndash; Friday&lt;/dt&gt;
  &lt;dd&gt;08:00 &ndash; 18:00&lt;/dd&gt;
  &lt;dt&gt;Saturday&lt;/dt&gt;
  &lt;dd&gt;Closed&lt;/dd&gt;
  &lt;dt&gt;Sunday&lt;/dt&gt;
  &lt;dd&gt;Closed&lt;/dd&gt;
&lt;/dl&gt;</textarea></div>
      <button type="button" id="m1preview" style="margin-top:10px">Run it (render the page)</button>
      <div class="previewbox" id="m1prev"><span class="mut" style="font-size:13px">Your markup renders here. Look at it before you submit &mdash; that is the Run step.</span></div>
      <div class="formrow" style="margin-top:18px"><label>Commit message (first line)</label><input type="text" id="m1commit" placeholder="Correct ..." autocomplete="off"></div>
      <button class="primary" id="m1check" style="margin-top:12px">Submit the fix</button>
      <div class="feedback" id="m1fb"></div>
    </div>
    <p class="mut" style="margin-top:14px">More reps: <a href="practice-html.html">HTML practice</a>.</p>
"""

M1_JS = """document.getElementById("m1preview").onclick = function () {
  /* Rendering the student's own markup is the point of the Run step, so this
     has to be real HTML in the document. It is their own input echoed back
     to them, never persisted and never shown to anyone else. */
  document.getElementById("m1prev").innerHTML = document.getElementById("m1html").value;
};

document.getElementById("m1check").onclick = function () {
  var src = document.getElementById("m1html").value;
  var msg = document.getElementById("m1commit").value.trim();
  var doc = PracticeKit.parseHtml(src);
  var dl = doc.querySelector("dl.hours");
  var dts = Array.prototype.map.call(doc.querySelectorAll("dt"), function (n) { return n.textContent.trim(); });
  var dds = Array.prototype.map.call(doc.querySelectorAll("dd"), function (n) { return n.textContent.trim(); });
  function ddFor(term) {
    var i = dts.findIndex(function (t) { return t.toLowerCase().indexOf(term) === 0; });
    return i === -1 ? "" : (dds[i] || "");
  }
  var sat = ddFor("saturday");
  var checks = [
    { name: "the hours list is still a dl with class \\"hours\\"", pass: !!dl,
      hint: "You removed or replaced the list. The ticket asked for a content fix, not a rewrite." },
    { name: "still exactly three days listed", pass: dts.length === 3 && dds.length === 3,
      hint: "There should still be three terms and three values. Do not add or drop days." },
    { name: "Saturday now shows 09:00", pass: /\\b0?9[:.]00\\b|\\b9\\s*am\\b/i.test(sat),
      hint: "Saturday's value needs the opening time. It currently reads: " + (sat || "(nothing)") },
    { name: "Saturday now shows 13:00", pass: /\\b13[:.]00\\b|\\b1\\s*pm\\b/i.test(sat),
      hint: "Saturday's value needs the closing time too." },
    { name: "Saturday no longer says Closed", pass: !/closed/i.test(sat),
      hint: "The old value is still in there." },
    { name: "weekday hours untouched (08:00 - 18:00)", pass: /08[:.]00/.test(ddFor("monday")) && /18[:.]00/.test(ddFor("monday")),
      hint: "You changed a line the ticket did not mention. Put it back." },
    { name: "Sunday still Closed", pass: /closed/i.test(ddFor("sunday")),
      hint: "Sunday was not in scope. Priya said Saturday." },
    { name: "commit message starts with an imperative verb", pass: /^(correct|fix|update|change|add|remove|set)\\b/i.test(msg),
      hint: "Complete the sentence \\"this commit will...\\". Start with a verb." },
    { name: "commit message says what changed", pass: /saturday|hours/i.test(msg),
      hint: "A future reader searching for \\"saturday\\" should find this commit." },
    { name: "commit message is not vague filler", pass: msg.length >= 18 && !/^(update|fix|changes?|final|wip|stuff)$/i.test(msg),
      hint: "\\"update\\" tells the next person nothing." },
    { name: "commit first line under 72 characters", pass: msg.length > 0 && msg.length <= 72,
      hint: "Keep the subject line short so it reads in a log. Currently " + msg.length + "." }
  ];
  var ok = checks.every(function (c) { return c.pass; });
  ModuleKit.showResults(document.getElementById("m1fb"),
    { passed: ok, results: checks });
  if (ok) {
    document.getElementById("m1fb").innerHTML =
      "<b>Shipped.</b> You read a ticket, found the smallest change that resolved it, rendered it to check, left everything else alone, and labelled it for the next human. That is the whole job in miniature &mdash; every module from here adds one more thing you can prove." +
      "<br><br>" + checks.map(function (c) { return "\\u2713 " + c.name; }).join("<br>");
    CourseProgress.setSection(1, "shipFirstChange", true);
    MK.sync();
  }
};"""

write(os.path.join(OUT, "module-01.html"), module_page(
    num=1, stage_label="Stage 0", minutes=45,
    title="Your first shipped change",
    sub="No setup, no theory warm-up. There is a ticket, there is a real bug, and by the end of this page you will have fixed it and written the commit message a colleague would accept.",
    objectives_list=[
        "Read a non-technical complaint and extract the actual defect",
        "Explain what a tag, its content, and an attribute each do",
        "Make the smallest change that resolves a ticket, and say why that matters",
        "Render your change and check it with your own eyes before claiming it works",
        "Write a commit message a stranger could search for in six months",
    ],
    why={
        "build": "The real fix for Northline Clinic's opening hours, plus the commit message that ships it.",
        "why": "Patients are turning up to a locked door. This is the smallest possible version of the only thing that matters: someone was affected, and you fixed it.",
        "aiHelps": "An agent would find and change this line instantly, and correctly.",
        "aiFails": "It will also cheerfully restructure the section you did not ask it to touch, and describe the diff instead of the reason in the commit message.",
        "without": "You type this fix yourself. You cannot judge an agent's diff until you know what a small, correct diff looks like.",
    },
    sections_html="".join(M1_SECTIONS),
    exercise_html=M1_EXERCISE,
    exercise_js=M1_JS,
))

# ----------------------------------------------------------------- Module 2

M2_SECTIONS = (
    section("01", "The most expensive bug is building the wrong thing", """    <p>Every other kind of bug is cheap by comparison. A crash gets found in minutes. A logic error gets found by a test. A feature that works perfectly and solves a problem nobody had gets found in six weeks, by an unhappy client, after you have built the whole thing.</p>
    <p>Now consider what an agent does to that risk. Ask one to "make the booking system better" and it will not push back. It will not say "better in what way?" It will produce four hundred lines of confident, plausible, well-formatted code implementing <i>its</i> guess at what better means. And it will be a good guess. It just will not be Priya's.</p>
    <div class="callout">This is the single most important idea in the course: <b>the faster your tools can build, the more expensive it becomes to be wrong about what to build.</b> Cheap implementation makes requirements more valuable, not less.</div>
"""),

    section("02", "From complaint to requirement", """    <p>Dan's message is: <i>"Client says booking is confusing. Can you just make it better?"</i></p>
    <p>There are no requirements in that sentence. There is a symptom, reported second-hand, with a verdict attached. Your first move is not to open an editor. It is to work out what "confusing" means by asking questions that have factual answers.</p>
    <div class="def"><div class="k">Useless question</div><p>"What would you like it to look like?" &mdash; Priya is not a designer. You are outsourcing your job to someone who cannot do it.</p></div>
    <div class="def"><div class="k">Useful questions</div><p>"When someone gets confused, what do they do next &mdash; call you, or give up?" &middot; "How many bookings come in by phone because the form did not work?" &middot; "Show me the last person who got stuck." &middot; "What do you have to fix by hand afterwards?"</p></div>
    <p>Those questions produce facts: <i>eight people a week call because they could not tell whether the form submitted.</i> That is a requirement in disguise. "Confusing" was not.</p>
""" + trap("An agent is genuinely good at generating candidate questions, and genuinely bad at knowing which answers matter, because it has never had to phone a client back. Use it to widen the list, then cut the list yourself.")),

    section("03", "User stories: role, want, reason", """    <p>A user story is one sentence in a fixed shape, and the shape exists to stop you skipping a part.</p>
""" + code("As a [role], I want [capability], so that [outcome].") + """    <p>Applied to what Priya actually told you:</p>
    <div class="def"><div class="k">Example</div><p>As a <b>patient</b>, I want <b>a clear confirmation after I submit a booking request</b>, so that <b>I do not phone the clinic to check whether it went through</b>.</p></div>
    <p>The third clause is the one everybody drops, and it is the one that earns its place. Without <i>so that</i> you cannot tell whether a proposed solution is any good. With it, you can: does a green "Request received &mdash; we will call you within one working day" message stop someone phoning? Probably. Does a fancier submit button? No. The reason clause is a test for solutions.</p>
    <p>It also protects you politically. When someone asks why you built the confirmation message instead of the redesign, the answer is a sentence, not an argument.</p>
"""),

    section("04", "Acceptance criteria: Given, When, Then", """    <p>A story says what someone wants. Acceptance criteria say how anyone can check whether you delivered it. The standard shape:</p>
""" + code("""Given   some starting situation
When    someone does something specific
Then    something specific and observable happens""") + """    <div class="def"><div class="k">Not a criterion</div><p>"The form should work properly and be user friendly."</p></div>
    <div class="def"><div class="k">A criterion</div><p><b>Given</b> I have filled in name, email, and a preferred date, <b>when</b> I press Request appointment, <b>then</b> the form is replaced by the message "Request received &mdash; we will call you within one working day" and my details stay visible above it.</p></div>
    <p>The difference is that a stranger could run the second one. They could follow those steps on your finished work and reach a verdict of yes or no, without asking you what you meant. That is the whole bar: <b>could someone who has never spoken to you check this?</b></p>
    <p>Two habits that make criteria checkable: use a real value rather than a category (<i>"09:00 &ndash; 13:00"</i>, not <i>"the correct hours"</i>), and quote the exact text the user will see. "An appropriate message" is where arguments come from.</p>
""" + note("Criteria written this way are the input to two later modules almost verbatim. In Module 7 they become the prompt you hand the agent. In Module 9 they become the tests. Time spent here is not overhead; it is the same work, done once, in the cheapest place to change it.")),

    section("05", "Edge cases: the unhappy half", """    <p>The happy path is one path. Beginners specify it and stop. Then real people arrive.</p>
    <p>A useful way to find edge cases is to walk your criteria and ask, at each step, <i>what if this is not normal?</i></p>
    <ul class="plain">
      <li><b>Empty</b> &mdash; nothing filled in at all. Blank name. Blank date.</li>
      <li><b>Wrong</b> &mdash; "next tuesday" typed into a date field. An email with no <code>@</code>. A phone number with letters.</li>
      <li><b>Too much</b> &mdash; a 4,000-character message. A name with an apostrophe. Emoji.</li>
      <li><b>Too many</b> &mdash; the same person pressing Request four times because nothing appeared to happen.</li>
      <li><b>Impossible</b> &mdash; a date in the past. A Sunday, when the clinic is closed.</li>
      <li><b>Broken world</b> &mdash; the connection drops mid-submit. The server is down. The patient is on a train.</li>
    </ul>
    <p>Every one of those has a right answer, and the right answer is a decision, not an accident. If you do not decide, the code decides for you &mdash; and what code does by default when handed a blank field is usually to accept it silently.</p>
""" + trap("Ask an agent to \u201chandle edge cases\u201d and you will get validation for the ones that are famous \u2014 empty string, null, negative numbers. You will not get <i>the clinic is closed on Sunday, so a Sunday request is a promise you cannot keep</i>. Domain edge cases come from the domain, and the agent has never met Priya.")),

    section("06", "Decomposition, and the word that makes it finite", """    <p>You now have stories, criteria, and edge cases. Turn them into work: pieces small enough that you could finish one in a sitting and know it is done.</p>
    <p>The test for a good task is that it has a visible result and an obvious finish line. "Improve the form" fails both. "Add a required <code>email</code> field with a label and an inline error when it is empty or missing an @" passes both.</p>
    <p>And then the step that almost nobody does, which is the one that turns "make it better" from an infinite request into a job you can complete:</p>
    <div class="def"><div class="k">Out of scope, this ticket</div><p>Rescheduling. SMS reminders. Online payment. Visual redesign. Accounts and login. We are fixing whether a patient can tell that their request arrived. Everything else is a separate conversation.</p></div>
    <p>Written down, that paragraph is a shield. It is how you say no once, in writing, instead of six times, defensively, in meetings. Sam will look for it in your ticket before he looks at your code.</p>
"""),

    section("07", "Where the agent earns its place here", """    <p>None of this means working alone. It means knowing which half is yours.</p>
    <div id="wfCompare" class="interactive"><div class="ilbl">Choose the better request &middot; labelled simulation</div></div>
    <p style="margin-top:20px">Good uses of an agent at the requirements stage:</p>
    <ul class="plain">
      <li><b>Widen the edge-case list.</b> "Here are my acceptance criteria for a booking form. List twenty ways a real user could break this." It will find things you missed. You decide which ones matter.</li>
      <li><b>Attack your own spec.</b> "Read these criteria as a hostile reviewer. Where are they ambiguous?" Genuinely useful, and cheap.</li>
      <li><b>Tighten wording.</b> Turning a rambling criterion into a crisp Given/When/Then.</li>
    </ul>
    <p>Bad uses, all of which produce confident output:</p>
    <ul class="plain">
      <li>Asking it to <i>decide</i> what the client needs. It will decide. It has no information.</li>
      <li>Asking it to prioritise. Priority comes from consequences it cannot see.</li>
      <li>Accepting its edge cases wholesale. A list of thirty makes a ten-line feature into a month.</li>
    </ul>
"""),
)

M2_EXERCISE = """    <p>Ticket <b>NL-002</b>, in full: <i>"Client says booking is confusing. Can you just make it better?"</i></p>
    <p>Turn it into work. Five boxes. This is the exercise Sam would set you in your first week, and it is graded on shape, not on style &mdash; we check that these are actually stories, that the criteria are checkable, that you thought about failure, that the work is broken down, and that you wrote down what you are <i>not</i> doing.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise &middot; requirementsExercise</div>
      <div class="formrow"><label>User stories &mdash; one per line, three or more</label><textarea id="rqStories" placeholder="As a patient, I want ... so that ...&#10;As a receptionist, I want ... so that ..."></textarea></div>
      <div class="formrow"><label>Acceptance criteria &mdash; three or more, Given / When / Then</label><textarea id="rqCriteria" placeholder="Given I have filled in name, email and date, when I press Request appointment, then ..."></textarea></div>
      <div class="formrow"><label>Edge cases &mdash; one per line, three or more</label><textarea id="rqEdges" placeholder="Empty email field&#10;Date in the past&#10;Submitted twice by mistake"></textarea></div>
      <div class="formrow"><label>Tasks &mdash; one per line, four or more, each finishable in a sitting</label><textarea id="rqTasks"></textarea></div>
      <div class="formrow"><label>Explicitly out of scope</label><textarea id="rqScope" placeholder="Not doing in this ticket, and why:"></textarea></div>
      <button class="primary" id="rqCheck" style="margin-top:12px">Submit requirements</button>
      <div class="feedback" id="rqFb"></div>
    </div>
    <p class="mut" style="margin-top:14px">More reps: <a href="practice-specs.html">specs practice</a> &mdash; ten more, all written by you, none of them multiple choice.</p>
"""

M2_JS = """Northline.renderWorkflowCompare("wfCompare", {
  situation: "Dan forwards the booking complaint. You open Cursor. Which request do you send first?",
  bad: { t: "The booking form is confusing. Make it better and follow UX best practices.",
    why: "It will produce a redesign. Possibly a nice one. It will not add the confirmation message that stops eight phone calls a week, because nobody told it that was the actual problem \\u2014 you had not worked it out yet." },
  good: { t: "Read these three acceptance criteria for the booking form. Act as a hostile reviewer: list every ambiguity and every user behaviour these criteria fail to cover. Do not write code.",
    why: "You are using it for the thing it is good at \\u2014 breadth \\u2014 while keeping the decision. You will get edge cases you missed, and you will cut two thirds of them, and the spec that survives is yours." }
});

document.getElementById("rqCheck").onclick = function () {
  var out = ModuleKit.gradeRequirements({
    stories: document.getElementById("rqStories").value,
    criteria: document.getElementById("rqCriteria").value,
    edges: document.getElementById("rqEdges").value,
    tasks: document.getElementById("rqTasks").value,
    outOfScope: document.getElementById("rqScope").value
  });
  ModuleKit.showResults(document.getElementById("rqFb"), out);
  if (out.passed) {
    document.getElementById("rqFb").innerHTML =
      "<b>That is a spec.</b> A stranger could pick this up, build it, and check their own work against it \\u2014 and you could defend every line of it to Dan. Keep it: in Module 7 these criteria become the prompt you hand the agent, and in Module 9 they become the tests." +
      "<br><br>" + out.results.map(function (r) { return "\\u2713 " + r.name; }).join("<br>");
    CourseProgress.setSection(2, "requirementsExercise", true);
    MK.sync();
  }
};"""

write(os.path.join(OUT, "module-02.html"), module_page(
    num=2, stage_label="Stage 1", minutes=60,
    title="Requirements: turning \u201cmake it better\u201d into work",
    sub="An agent will never ask you what you meant. It will guess, instantly, in four hundred confident lines. So the most valuable half hour of your week is the one before any code exists.",
    objectives_list=[
        "Turn a second-hand complaint into questions that have factual answers",
        "Write user stories with a reason clause that can rule solutions out",
        "Write acceptance criteria a stranger could check without asking you what you meant",
        "Find edge cases systematically instead of hoping",
        "Break a vague request into finishable tasks, and write down what you are not doing",
        "Use an agent to widen a spec without letting it decide the spec",
    ],
    why={
        "build": "A complete, defensible spec for the booking ticket: stories, criteria, edge cases, tasks, and an explicit out-of-scope list.",
        "why": "This is the highest-leverage skill in the course. Cheap code makes being wrong about what to build more expensive, not less.",
        "aiHelps": "Generating candidate edge cases and attacking your own criteria for ambiguity. It is genuinely good at breadth.",
        "aiFails": "It cannot decide what matters, cannot prioritise, and will never say \u201cthat is out of scope\u201d. Domain rules \u2014 like the clinic being shut on Sunday \u2014 are invisible to it.",
        "without": "Every word of the spec is yours. No agent involvement in the graded exercise at all.",
    },
    sections_html="".join(M2_SECTIONS),
    exercise_html=M2_EXERCISE,
    exercise_js=M2_JS,
))
