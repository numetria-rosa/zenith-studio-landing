# -*- coding: utf-8 -*-
"""Stage 2: the web, taught through Northline tickets NL-003 to NL-006."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _aise_shell import section, module_page, write, trap, note, defbox, code

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "courses", "ai-assisted-software-engineering")

# ----------------------------------------------------------------- Module 3

M3 = (
    section("01", "A page is a document, not a picture", """    <p>Before frameworks, before styling, before any of it: a web page is a document with a structure. Headings, sections, lists, forms. The browser reads that structure and builds a tree out of it, and everything else &mdash; how it looks, how it behaves, how a screen reader announces it, how Google indexes it &mdash; hangs off that tree.</p>
    <p>Which means the single most consequential decision in HTML is <b>which element to use</b>, and the criterion is not "which one looks right" (none of them look like anything without CSS). It is <b>which one means what I am trying to say</b>.</p>
""" + defbox("Semantic HTML", "Choosing elements for their meaning rather than their appearance. <code>&lt;nav&gt;</code> and <code>&lt;div class=\"nav\"&gt;</code> can render identically. Only one of them tells every other piece of software on Earth that this is the navigation.")),

    section("02", "The landmarks", """    <p>Five elements carve up almost every page you will ever build. Get these right and the page has a spine.</p>
""" + code("""<body>
  <header>        <!-- masthead: logo, site title -->
    <nav>         <!-- the primary links -->
    </nav>
  </header>

  <main>          <!-- exactly one. the unique content of THIS page -->
    <h1>Northline Clinic</h1>
    <section>     <!-- a themed chunk, with its own heading -->
      <h2>Opening hours</h2>
    </section>
  </main>

  <footer>        <!-- contact, legal, the boring but necessary -->
  </footer>
</body>""") + """    <p>Two rules that carry real weight:</p>
    <ul class="plain">
      <li><b>One <code>&lt;main&gt;</code> per page</b>, containing what makes this page different from every other page on the site. Not the header. Not the nav. Screen reader users jump straight to it, which is the equivalent of skipping a website's throat-clearing.</li>
      <li><b>One <code>&lt;h1&gt;</code>, then headings that descend in order.</b> <code>h2</code> under <code>h1</code>, <code>h3</code> under <code>h2</code>. Never skip a level because a smaller font looked nicer &mdash; that is what CSS is for. Headings are the page's table of contents, and a lot of people navigate by that table of contents rather than by scrolling.</li>
    </ul>
""" + trap("Ask an agent for \u201ca clinic landing page\u201d and you will very often get a <code>&lt;div&gt;</code> for every one of those landmarks, styled to look correct. It will look completely fine in the browser and be structurally mute. This is the most common invisible defect in AI-generated markup, and you can only catch it by reading the tags.")),

    section("03", "Forms, and the thing everyone skips", """    <p>Priya needs patients to request an appointment. That means a form, and forms are where accessibility either happens or does not.</p>
""" + code("""<form>
  <label for="email">Email address</label>
  <input type="email" id="email" name="email" required>

  <label for="date">Preferred date</label>
  <input type="date" id="date" name="date" required>

  <button type="submit">Request appointment</button>
</form>""") + """    <p>Every line there is doing work:</p>
    <ul class="plain">
      <li><code>&lt;label for="email"&gt;</code> matched to <code>id="email"</code> is what ties the visible words to the box. Two concrete consequences: a screen reader announces "Email address, edit text" instead of "edit text", and clicking the words focuses the field &mdash; which matters enormously on a phone.</li>
      <li><code>type="email"</code> gets you a keyboard with an @ on mobile and basic browser validation for free.</li>
      <li><code>required</code> stops empty submission without a line of JavaScript.</li>
      <li><code>name="email"</code> is the key the data arrives under when it is submitted.</li>
      <li><code>&lt;button type="submit"&gt;</code> is a real control: focusable, operable by Enter and Space, announced as a button.</li>
    </ul>
""" + defbox("A placeholder is not a label", "<code>placeholder=\"Email address\"</code> looks like it does the same job. It vanishes the moment someone types, so anyone who gets distracted mid-form loses the name of the field. It is often not announced by assistive technology. And it usually fails colour-contrast requirements. Use a label. Use a placeholder as well if you like, for an <i>example</i> of the format.")),

    section("04", "Accessibility is not a feature you add later", """    <p>Accessibility has a reputation as a compliance chore bolted on at the end. In practice, roughly eighty percent of it is a consequence of choosing correct elements, which costs nothing when you do it first and is expensive to retrofit.</p>
    <p>The four things that cover most of it on a page like this:</p>
    <ol>
      <li><b>Real controls for real actions.</b> <code>&lt;button&gt;</code> for actions, <code>&lt;a href&gt;</code> for navigation. A <code>&lt;div onclick&gt;</code> is invisible to a keyboard: it cannot be reached with Tab, cannot be pressed with Enter, and is not announced as anything.</li>
      <li><b>Every input has a label.</b> Covered above. This is the big one on forms.</li>
      <li><b>Images have <code>alt</code> text</b> describing their purpose. If an image is purely decorative, <code>alt=""</code> is correct and deliberate &mdash; it tells a screen reader to skip it rather than read a filename aloud.</li>
      <li><b>Link text names the destination.</b> "Click here" and "Read more" are meaningless out of context, and out of context is exactly how many people encounter them &mdash; skimming, or in a generated list of a page's links.</li>
    </ol>
""" + note("Try this on any page you build: put your mouse down and press Tab repeatedly. Can you reach every control? Can you tell where you are? If a control cannot be reached, it does not exist for a real portion of your users \u2014 and that is before you consider that keyboard navigation is also how power users move.")),

    section("05", "Reading markup like a reviewer", """    <p>You are going to spend far more time reading HTML an agent wrote than writing it yourself. Here is the checklist that finds most defects in under a minute:</p>
    <ul class="plain">
      <li>Is there exactly one <code>&lt;main&gt;</code>, and is the page's real content inside it?</li>
      <li>Exactly one <code>&lt;h1&gt;</code>? Do the heading levels descend without gaps?</li>
      <li>Does every <code>&lt;input&gt;</code> have a <code>&lt;label&gt;</code> that actually points at it?</li>
      <li>Is anything clickable that is not a <code>&lt;button&gt;</code> or an <code>&lt;a href&gt;</code>?</li>
      <li>Do images have <code>alt</code>? Is empty <code>alt</code> a decision or an omission?</li>
      <li>Are there <code>&lt;div&gt;</code>s doing a job that a named element already does?</li>
      <li>Did it add anything you did not ask for?</li>
    </ul>
    <p>That last question is the one juniors forget, and it is the one that catches the most. An agent asked for a contact form will sometimes hand back a contact form, a newsletter signup, a cookie banner, and a map embed. All plausible. None requested. Every line you keep, you own &mdash; including the legal implications of a cookie banner you never evaluated.</p>
"""),
)

M3_EX = """    <p>Ticket <b>NL-003</b>. Priya needs a real page. From her message, the requirements are: opening hours, services, how to reach the clinic, and a way to request an appointment.</p>
    <p>Build the structure. No CSS &mdash; this is about the document, and it will look plain. That is correct.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise &middot; htmlStructureExercise</div>
      <p class="mut" style="margin-bottom:10px">Must include: the landmark elements, exactly one <code>h1</code>, a <code>section</code> per topic with an <code>h2</code>, the hours as a <code>dl</code>, and a request form with a properly labelled email field, a labelled date field, and a real submit button.</p>
      <textarea id="m3html" spellcheck="false" style="min-height:300px">&lt;body&gt;

&lt;/body&gt;</textarea>
      <button type="button" id="m3preview" style="margin-top:10px">Run it</button>
      <div class="previewbox" id="m3prev"><span class="mut" style="font-size:13px">Renders here. It will look unstyled. Structure first.</span></div>
      <button class="primary" id="m3check" style="margin-top:12px">Submit structure</button>
      <div class="feedback" id="m3fb"></div>
    </div>
    <p class="mut" style="margin-top:14px">More reps: <a href="practice-html.html">HTML practice</a> &middot; <a href="practice-detective.html">AI Code Detective</a>.</p>
"""

M3_JS = """document.getElementById("m3preview").onclick = function () {
  document.getElementById("m3prev").innerHTML = document.getElementById("m3html").value;
};

document.getElementById("m3check").onclick = function () {
  var src = document.getElementById("m3html").value;
  var doc = PracticeKit.parseHtml(src);
  var inputs = Array.prototype.slice.call(doc.querySelectorAll("input"));
  function labelled(sel) {
    var el = doc.querySelector(sel);
    if (!el) return false;
    if (el.id && doc.querySelector('label[for="' + el.id + '"]')) return true;
    return !!el.closest("label");
  }
  var clickableDivs = Array.prototype.slice.call(doc.querySelectorAll("div[onclick], span[onclick]"));
  var checks = [
    { name: "a <header> containing a <nav>", pass: !!doc.querySelector("header nav"),
      hint: "Wrap the site links in <nav>, inside <header>." },
    { name: "exactly one <main>", pass: doc.querySelectorAll("main").length === 1,
      hint: "One <main> per page, holding this page's unique content." },
    { name: "exactly one <h1>", pass: doc.querySelectorAll("h1").length === 1,
      hint: "One top-level heading. Found " + doc.querySelectorAll("h1").length + "." },
    { name: "a <footer>", pass: !!doc.querySelector("footer"), hint: "Add a footer." },
    { name: "three or more <section> elements inside <main>", pass: doc.querySelectorAll("main section").length >= 3,
      hint: "Hours, services, and contact are three topics. Found " + doc.querySelectorAll("main section").length + "." },
    { name: "every section has its own <h2>", pass: doc.querySelectorAll("main section").length >= 3 &&
        Array.prototype.every.call(doc.querySelectorAll("main section"), function (s) { return !!s.querySelector("h2"); }),
      hint: "A section without a heading is a div with ambitions." },
    { name: "no skipped heading levels (no h3 before an h2)", pass: !(doc.querySelector("h3") && !doc.querySelector("h2")),
      hint: "Headings descend in order." },
    { name: "opening hours marked up as a <dl> with day/value pairs", pass: !!doc.querySelector("dl") && doc.querySelectorAll("dl dt").length >= 2 && doc.querySelectorAll("dl dd").length >= 2,
      hint: "A definition list pairs a term with a value, which is what hours are." },
    { name: "a <form>", pass: !!doc.querySelector("form"), hint: "The request form is the point of the page." },
    { name: "an email input of type=email", pass: !!doc.querySelector('form input[type="email"]'),
      hint: 'Use type="email" so mobile keyboards and browser validation help you.' },
    { name: "the email input has a label pointing at it", pass: labelled('form input[type="email"]'),
      hint: 'Give the input an id and add <label for="that-id">, or wrap it in the label. A placeholder is not a label.' },
    { name: "a date input of type=date", pass: !!doc.querySelector('form input[type="date"]'),
      hint: 'Use type="date".' },
    { name: "the date input has a label pointing at it", pass: labelled('form input[type="date"]'),
      hint: "Same rule. Every input gets a label." },
    { name: "at least one input marked required", pass: inputs.some(function (i) { return i.hasAttribute("required"); }),
      hint: "required stops empty submission with no JavaScript at all." },
    { name: "a real <button type=submit>", pass: !!doc.querySelector('form button[type="submit"], form button:not([type])'),
      hint: "A real button is focusable and works with Enter and Space." },
    { name: "nothing clickable that is not a button or link", pass: clickableDivs.length === 0,
      hint: "Found " + clickableDivs.length + " div/span with onclick. A keyboard cannot reach those." },
    { name: "every <img> has an alt attribute", pass: Array.prototype.every.call(doc.querySelectorAll("img"), function (i) { return i.hasAttribute("alt"); }),
      hint: 'Every image needs alt. Decorative images get alt="" deliberately.' },
    { name: "no vague link text", pass: !Array.prototype.some.call(doc.querySelectorAll("a"), function (a) {
        return /^(click here|here|read more|more|link)$/i.test(a.textContent.trim()); }),
      hint: "Link text should name the destination." }
  ];
  var ok = checks.every(function (c) { return c.pass; });
  ModuleKit.showResults(document.getElementById("m3fb"), { passed: ok, results: checks });
  if (ok) {
    document.getElementById("m3fb").innerHTML =
      "<b>That is a well-structured document.</b> It is also, right now, the exact checklist you will run against agent-generated markup for the rest of your career \\u2014 and it will fail more often than you expect." +
      "<br><br>" + checks.map(function (c) { return "\\u2713 " + c.name; }).join("<br>");
    CourseProgress.setSection(3, "htmlStructureExercise", true);
    MK.sync();
  }
};"""

write(os.path.join(OUT, "module-03.html"), module_page(
    num=3, stage_label="Stage 2", minutes=55,
    title="HTML: the structure under every page",
    sub="Two pages can look identical and only one of them works with a keyboard, a screen reader, or a search engine. The difference is invisible in the browser and obvious in the markup \u2014 which is why you have to be able to read it.",
    objectives_list=[
        "Choose elements for meaning instead of appearance",
        "Lay out a page with the five landmark elements and a correct heading outline",
        "Build a form whose fields are properly labelled and validated by the browser",
        "Name the four accessibility rules that cover most of a page like this",
        "Run a seven-point review pass over markup you did not write",
    ],
    why={
        "build": "The full structure of the Northline Clinic page: landmarks, headings, an hours list, and a working request form.",
        "why": "Structure is what makes a page usable by a keyboard, a screen reader, and every tool that reads the web. It is also the layer agents most reliably get subtly wrong.",
        "aiHelps": "Producing a lot of correct-looking markup instantly, and remembering attributes you forget.",
        "aiFails": "Divs where landmarks belong, placeholders instead of labels, clickable divs instead of buttons, and features nobody asked for.",
        "without": "You write every tag in the graded exercise. The review checklist only works if you have built the thing yourself.",
    },
    sections_html="".join(M3),
    exercise_html=M3_EX,
    exercise_js=M3_JS,
))

# ----------------------------------------------------------------- Module 4

M4 = (
    section("01", "CSS is layout, not decoration", """    <p>Beginners think CSS is about colours. Then they spend four hours trying to get two boxes to sit next to each other. Colour is the easy part; <b>layout</b> is the part that has a right answer, and <b>hierarchy</b> is the part that makes a page usable rather than merely coloured.</p>
    <p>A rule has three parts, and that is the whole syntax:</p>
""" + code(""".hours dd {          /* selector: which elements */
  font-weight: 600;  /* property: what aspect */
  color: #333;       /* value: what setting */
}""") + """    <p>Everything difficult about CSS comes from two things: which rule wins when several apply, and how boxes size themselves.</p>
"""),

    section("02", "The box model, and the arithmetic that bites", """    <p>Every element is a box with four layers, from the inside out: <b>content</b>, <b>padding</b>, <b>border</b>, <b>margin</b>.</p>
    <ul class="plain">
      <li><b>Padding</b> is space <i>inside</i> the border. It is part of the element, so the background colour extends into it.</li>
      <li><b>Border</b> is the edge itself.</li>
      <li><b>Margin</b> is space <i>outside</i> the border, pushing other elements away. The background does not reach it.</li>
    </ul>
    <p>That background behaviour is the fastest way to tell them apart when you are staring at a page wondering which one you want.</p>
    <p>Now the part that catches everyone. By default, <code>width</code> means the width of the <i>content</i> only:</p>
""" + code(""".card {
  width: 300px;
  padding: 20px;
  border: 2px solid;
}
/* Actual rendered width: 300 + 20 + 20 + 2 + 2 = 344px */""") + """    <p>Which is why your three 33%-wide cards do not fit in a row. The standard fix, and the reason you will see it at the top of nearly every real stylesheet:</p>
""" + code("""*, *::before, *::after {
  box-sizing: border-box;
}
/* Now width: 300px means 300px on screen, padding and border included. */""")
    + defbox("Say it back", "Padding is inside and the background reaches it. Margin is outside and it does not. <code>border-box</code> makes <code>width</code> mean what you assumed it meant.")),

    section("03", "Flexbox: one dimension, properly", """    <p>Flexbox arranges children along one axis. It replaced roughly a decade of layout hacks and it is the tool for the majority of everyday jobs.</p>
    <p>The critical thing to internalise: <b>you set flex properties on the parent</b>, and the children respond.</p>
""" + code(""".nav {
  display: flex;              /* children now sit in a row */
  gap: 20px;                  /* space between them, no margin needed */
  align-items: center;        /* vertical alignment (the cross axis) */
  justify-content: space-between;  /* horizontal distribution (the main axis) */
}""") + """    <p>Four properties that do most of the work:</p>
    <ul class="plain">
      <li><code>display: flex</code> &mdash; children become a row.</li>
      <li><code>gap</code> &mdash; space between children. Before <code>gap</code>, this required margin gymnastics and a rule to remove the margin from the last child. Use <code>gap</code>.</li>
      <li><code>justify-content</code> &mdash; distribution along the main axis: <code>flex-start</code>, <code>center</code>, <code>space-between</code>.</li>
      <li><code>align-items</code> &mdash; alignment across the other axis. <code>center</code> here is the answer to "how do I vertically centre this".</li>
    </ul>
    <p>And the one that turns a desktop row into a phone column:</p>
""" + code("""flex-direction: column;   /* stack instead of row */""")),

    section("04", "Grid, and when to reach for it", """    <p>Grid handles two dimensions &mdash; rows and columns together. For a page like Priya's you mostly need one line of it:</p>
""" + code(""".services {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}""") + """    <p>Read that middle line in English: <i>fit as many columns as you can, each at least 240px wide, sharing the leftover space equally.</i> On a wide screen you get four columns. On a phone you get one. No breakpoint, no media query &mdash; the layout responds because you described a constraint instead of a fixed number.</p>
""" + defbox("Choosing between them", "One direction &mdash; a nav bar, a row of buttons, a stack &mdash; use flexbox. Two directions, or a set of equal cards that should reflow &mdash; use grid. When both would work, either is fine. This is not a moral question.")),

    section("05", "Responsive: the fix for ticket NL-004", """    <p>Somebody's phone shows the clinic page as an unreadable column pinned to the left. Nothing is broken; the layout was written with numbers that assume a wide screen.</p>
    <p>Three things fix nearly every case of this, in order of importance:</p>
    <ol>
      <li><b>The viewport meta tag.</b> Without it, a phone pretends to be a 980px desktop and shrinks everything. Every page needs this in the <code>&lt;head&gt;</code>:
""" + code("""<meta name="viewport" content="width=device-width, initial-scale=1.0">""") + """      </li>
      <li><b>Stop using fixed widths for layout.</b> <code>max-width</code> with a percentage or <code>ch</code> unit lets a container be smaller when it has to be:
""" + code("""main {
  max-width: 68ch;   /* about 68 characters: a comfortable reading measure */
  margin: 0 auto;    /* centred */
  padding: 0 20px;   /* never touching the screen edge */
}""") + """      </li>
      <li><b>Then, and only then, a media query</b> for the point where the layout genuinely stops working:
""" + code("""@media (max-width: 640px) {
  .layout { flex-direction: column; }
}""") + """      </li>
    </ol>
    <p>Where does 640 come from? From you, shrinking the browser window until the layout actually breaks, and putting the breakpoint there. It does not come from a list of device widths, which is a list that changes every year and never matched all devices anyway.</p>
""" + trap("Two reliable agent failures here. First, it will hand you four or five breakpoints at \u201cstandard\u201d device widths, none of which correspond to where your content breaks \u2014 that is five times the maintenance for no benefit. Second, when a style does not apply, it reaches for <code>!important</code> instead of finding out why the rule was losing. Both work today. Both make the next change harder.")),

    section("06", "Visual hierarchy in four moves", """    <p>Hierarchy is what makes a page scannable. It is mostly not colour.</p>
    <ul class="plain">
      <li><b>Size and weight.</b> Important things are bigger or bolder. Two or three sizes on a page, not seven.</li>
      <li><b>Space.</b> The most underrated tool in the list. Related things sit close together; unrelated things get a gap. Grouping by proximity does more for comprehension than any border.</li>
      <li><b>Contrast.</b> Body text needs a real contrast ratio against its background &mdash; the 4.5:1 minimum is not decoration, it is whether a substantial number of people can read your page at all. Light grey on white fails.</li>
      <li><b>Consistency.</b> Same kind of thing, same treatment. Inconsistency reads as randomness and makes people slow down.</li>
    </ul>
    <p>And one rule that costs nothing: <b>never remove focus outlines.</b> <code>outline: none</code> appears in an enormous amount of generated CSS because the default ring is considered ugly. It is also the only way a keyboard user can tell where they are. If you dislike it, restyle it; do not delete it.</p>
"""),
)

M4_EX = """    <p>Ticket <b>NL-004</b>. The markup below is fixed &mdash; you cannot change it. Write CSS that satisfies the layout spec, including the phone case.</p>
    <div class="def"><div class="k">Layout spec</div><p>1. Border-box sizing applied to everything.<br>2. <code>.layout</code> puts <code>.main</code> and <code>.side</code> in a row with at least 16px between them.<br>3. <code>.page</code> is centred with a <code>max-width</code> no greater than 900px.<br>4. <code>.services</code> is a grid whose columns are at least 200px and reflow on their own.<br>5. At 640px and below, <code>.layout</code> stacks into a column.<br>6. Focus outlines are not removed anywhere.</p></div>
    <div class="interactive">
      <div class="ilbl">Required exercise &middot; cssResponsiveExercise</div>
      <p class="mut" style="margin-bottom:8px">The markup you are styling (read-only):</p>
      <pre id="m4fixture">&lt;div class="page"&gt;
  &lt;div class="layout"&gt;
    &lt;main class="main"&gt;&lt;h1&gt;Northline Clinic&lt;/h1&gt;&lt;/main&gt;
    &lt;aside class="side"&gt;&lt;h2&gt;Hours&lt;/h2&gt;&lt;/aside&gt;
  &lt;/div&gt;
  &lt;div class="services"&gt;&lt;div&gt;A&lt;/div&gt;&lt;div&gt;B&lt;/div&gt;&lt;div&gt;C&lt;/div&gt;&lt;/div&gt;
&lt;/div&gt;</pre>
      <textarea id="m4css" spellcheck="false" style="min-height:240px">*, *::before, *::after {
  /* start here */
}
</textarea>
      <button class="primary" id="m4check" style="margin-top:12px">Check against the spec</button>
      <div class="feedback" id="m4fb"></div>
    </div>
    <p class="mut" style="margin-top:14px">More reps: <a href="practice-css.html">CSS practice</a>.</p>
"""

M4_JS = """document.getElementById("m4check").onclick = function () {
  var css = document.getElementById("m4css").value;
  var fixture = '<div class="page"><div class="layout">' +
    '<main class="main"><h1>Northline Clinic</h1></main>' +
    '<aside class="side"><h2>Hours</h2></aside></div>' +
    '<div class="services"><div>A</div><div>B</div><div>C</div></div></div>';

  /* Rules inside a media query cannot be checked with computed styles here:
     the fixture lives in this document, so the query resolves against the
     real viewport rather than a simulated 640px phone. So the breakpoint is
     verified by reading the declaration out of the stylesheet text, and
     everything unconditional is verified for real via getComputedStyle. */
  function mediaBlocks(text) {
    var out = [];
    var re = /@media([^{]+)\\{/g;
    var m;
    while ((m = re.exec(text))) {
      var i = m.index + m[0].length, depth = 1, start = i;
      while (i < text.length && depth > 0) {
        if (text[i] === "{") depth++;
        else if (text[i] === "}") depth--;
        i++;
      }
      out.push({ cond: m[1], body: text.slice(start, i - 1) });
    }
    return out;
  }
  var narrow = mediaBlocks(css).filter(function (b) {
    var m = b.cond.match(/max-width\\s*:\\s*(\\d+)/);
    return m && Number(m[1]) <= 900;
  });
  var stacks = narrow.some(function (b) {
    return /\\.layout\\b[^{]*\\{[^}]*flex-direction\\s*:\\s*column/.test(b.body);
  });

  var out = PracticeKit.gradeCss({
    fixtureHtml: fixture,
    checks: [
      { name: "border-box sizing applied to elements",
        test: function (host) { return getComputedStyle(host.querySelector(".main")).boxSizing === "border-box"; },
        hint: "Set box-sizing: border-box on *, *::before, *::after." },
      { name: ".layout is a flex container",
        test: function (host) { return getComputedStyle(host.querySelector(".layout")).display === "flex"; },
        hint: "display: flex on .layout." },
      { name: ".layout has a gap of at least 16px",
        test: function (host) { return parseFloat(getComputedStyle(host.querySelector(".layout")).columnGap) >= 16; },
        hint: "Use gap rather than margins on the children." },
      { name: ".page has a max-width of 900px or less",
        test: function (host) {
          var w = getComputedStyle(host.querySelector(".page")).maxWidth;
          return w !== "none" && parseFloat(w) > 0 && parseFloat(w) <= 900;
        },
        hint: "max-width lets the container shrink on a phone; width does not." },
      { name: ".page is horizontally centred",
        test: function (host) {
          var s = getComputedStyle(host.querySelector(".page"));
          return s.marginLeft === s.marginRight && (s.marginLeft === "auto" || parseFloat(s.marginLeft) > 0);
        },
        hint: "margin: 0 auto centres a block with a max-width." },
      { name: ".services is a grid",
        test: function (host) { return getComputedStyle(host.querySelector(".services")).display === "grid"; },
        hint: "display: grid on .services." },
      { name: ".services columns are at least 200px and reflow",
        test: function (host, text) { return /repeat\\(\\s*auto-(fit|fill)\\s*,\\s*minmax\\(\\s*2[0-9][0-9]px/.test(text); },
        hint: "grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));" },
      { name: "a max-width media query exists for narrow screens",
        test: function () { return narrow.length > 0; },
        hint: "Add @media (max-width: 640px) { ... }." },
      { name: ".layout stacks to a column inside that media query",
        test: function () { return stacks; },
        hint: "Inside the media query: .layout { flex-direction: column; }" },
      { name: "focus outlines are not removed",
        test: function (host, text) { return !/outline\\s*:\\s*(none|0)\\b/.test(text); },
        hint: "outline: none removes the only cue a keyboard user has. Restyle it instead of deleting it." }
    ]
  }, css);

  ModuleKit.showResults(document.getElementById("m4fb"), out);
  if (out.passed) {
    document.getElementById("m4fb").innerHTML =
      "<b>NL-004 closed.</b> Note what fixed it: border-box, a max-width instead of a width, a grid that describes a constraint rather than a count, and exactly one breakpoint you could justify. Not five." +
      "<br><br>" + out.results.map(function (r) { return "\\u2713 " + r.name; }).join("<br>");
    CourseProgress.setSection(4, "cssResponsiveExercise", true);
    MK.sync();
  }
};"""

write(os.path.join(OUT, "module-04.html"), module_page(
    num=4, stage_label="Stage 2", minutes=60,
    title="CSS: layout that survives a phone",
    sub="Somebody has opened the clinic page on a phone and it is unusable. Nothing is broken \u2014 the layout was written with numbers that assume a wide screen. This is the most common bug in the world.",
    objectives_list=[
        "Explain padding, margin, border, and why box-sizing exists",
        "Lay out a row with flexbox and a reflowing card set with grid",
        "Make a layout responsive with a viewport tag, max-width, and one justified breakpoint",
        "Choose a breakpoint from your content instead of a device list",
        "Recognise !important and outline: none as review problems, not fixes",
    ],
    why={
        "build": "The stylesheet that closes NL-004: a two-column layout that stacks on a phone and a card grid that reflows without a media query.",
        "why": "A layout that fails on a phone fails for most of your users. This ticket is the single most common real-world CSS complaint.",
        "aiHelps": "It knows the flexbox and grid syntax you will keep forgetting, and writes it instantly.",
        "aiFails": "Five unjustifiable breakpoints, !important instead of resolving specificity, and outline: none because the focus ring looked untidy.",
        "without": "You write the CSS. The graded checks read real computed styles from the browser, so guessing does not work.",
    },
    sections_html="".join(M4),
    exercise_html=M4_EX,
    exercise_js=M4_JS,
))

# ----------------------------------------------------------------- Module 5

M5 = (
    section("01", "Why you write this part yourself", """    <p>This is the module people want to skip. An agent writes JavaScript fluently; why type it by hand?</p>
    <p>Because <b>reading code is harder than writing it</b>, and from Module 7 onward your job is almost entirely reading. You cannot evaluate a diff in a shape you have never produced. You will not notice that a total omits quantity if you have never written a total. The fluency you are building here is not typing fluency &mdash; it is the ability to look at eleven lines and know, quickly, whether they do what the ticket said.</p>
    <div class="callout">Concretely: at the end of this module you will be handed <code>items.reduce((total, item) =&gt; total + item.price, 0)</code> and asked what is wrong with it. Everyone who skipped this module says "nothing". It is off by every quantity greater than one, and it is the most common real defect in AI-written commercial code.</div>
"""),

    section("02", "Values, and names for them", """    <p>A variable is a name for a value. Two ways to make one, and one of them is the default:</p>
""" + code("""const clinicName = "Northline";   // cannot be reassigned. use this.
let openCount = 0;                // can be reassigned. use when it must change.""") + """    <p>Prefer <code>const</code>. Not out of pedantry: when you read a <code>const</code> you know that name means the same thing for the rest of the block, which is one fewer thing to hold in your head. <code>let</code> is a signal that this value moves.</p>
    <p>The types you will actually use:</p>
""" + code("""const name = "Priya";        // string  - text, in quotes
const total = 42;            // number  - integers and decimals alike
const isOpen = true;         // boolean - true or false
const rows = [1, 2, 3];      // array   - an ordered list
const patient = {            // object  - named fields
  name: "Priya",
  status: "open"
};""") + """    <p>Reaching into an object and an array:</p>
""" + code("""patient.name      // "Priya"      - a named field
rows[0]           // 1            - arrays count from zero
rows.length       // 3            - how many
patient.phone     // undefined    - asking for a field that is not there""") + """    <p><code>undefined</code> is worth pausing on. JavaScript does not object when you ask for a field that does not exist; it hands you <code>undefined</code> and carries on. That is why <code>undefined</code> shows up on screen where a name should be, several steps away from the actual mistake.</p>
"""),

    section("03", "Functions: input, output, and nothing else", """    <p>A function takes input and returns output. Keeping it to that is what makes code testable.</p>
""" + code("""function isOpen(appointment) {
  return appointment.status === "open";
}

isOpen({ status: "open" });   // true""") + """    <p>Three parts: a <b>name</b> that says what it does, <b>parameters</b> naming the input, and a <b>return</b> handing back the answer.</p>
    <p>Now the distinction that Module 9 depends on entirely:</p>
    <div class="def"><div class="k">Testable</div><p><code>function isOpen(a) { return a.status === "open"; }</code><br>Give it input, check the output. No setup, no context, no surprises.</p></div>
    <div class="def"><div class="k">Hard to test</div><p><code>function markOpen() { globalCount = globalCount + 1; }</code><br>Returns nothing. Depends on something outside itself. Changes something outside itself. To test it you must construct a world first, and then inspect that world afterwards.</p></div>
    <p>You will need both kinds eventually. But when you have a choice, take the input-and-output version, because the alternative is where hard-to-find bugs live.</p>
"""),

    section("04", "Conditions, and the falsy trap", """    <p><code>if</code> runs a block when something is true. The comparison operators are mostly obvious, with one exception:</p>
""" + code("""a === b    // equal, and the same type. use this one.
a !== b    // not equal
a > b      // greater than
a == b     // equal after type juggling. "1" == 1 is true. avoid.""") + """    <p>Use <code>===</code>. <code>==</code> converts types before comparing, which produces results that are entirely logical and never what you wanted.</p>
    <p>And the trap that produces quiet bugs:</p>
""" + code("""if (patient.name) { ... }

// This is false for ALL of these:
//   undefined, null, "" (empty string), 0, NaN

// Which means on a numeric field:
if (appointment.count) { ... }   // skips a count of 0. probably a bug.""") + """    <p>Six values are "falsy" and the two that catch people are the empty string and zero. If you mean "this field was provided", say so:</p>
""" + code("""if (patient.name !== undefined) { ... }
if (patient.name.trim() !== "") { ... }""")
    + trap("Agents write <code>if (value)</code> constantly, because it is idiomatic and usually right. On a quantity, a price, or a count, it is a bug that only appears when the number is zero \u2014 which in a clinic is exactly the day nothing is booked.")),

    section("05", "Arrays: the three methods you will actually use", """    <p>Priya's ticket is a list problem. Almost all list problems are one of these three:</p>
""" + code("""const rows = [
  { patient: "A", clinician: "Okafor", status: "open" },
  { patient: "B", clinician: "Reid",   status: "done" },
  { patient: "C", clinician: "Okafor", status: "open" }
];

// filter: keep the ones that match. returns a NEW, SHORTER array.
rows.filter(r => r.status === "open");     // the two open rows

// map: transform every one. returns a NEW array of the SAME length.
rows.map(r => r.patient);                  // ["A", "B", "C"]

// reduce: collapse the whole list into ONE value.
rows.reduce((count, r) => count + 1, 0);   // 3""") + """    <p>The arrow is just a compact function. <code>r =&gt; r.status === "open"</code> means "given r, return whether its status is open".</p>
    <p>The distinction to hold onto: <b>filter changes the length, map changes the contents, reduce produces a single value.</b> When you review AI code, checking that against what the ticket asked catches a lot &mdash; a <code>map</code> where a <code>filter</code> belonged returns a list of the right length full of <code>undefined</code>, which is a very confusing thing to debug.</p>
    <p>Also: none of these change the original array. That is a feature. Code that quietly modifies the list it was handed is a large category of bug.</p>
"""),

    section("06", "Now read the famous one", """    <p>Here is the code from the callout at the top. An agent was asked to total a supply order.</p>
""" + code("""function calculateTotal(items) {
  return items.reduce((total, item) => total + item.price, 0);
}""") + """    <p>It is idiomatic. It is correctly formatted. It uses <code>reduce</code> appropriately. It has a sensible initial value. A reviewer skimming for style finds nothing.</p>
    <p>And for an order of two gauze packs at &pound;3, it returns &pound;3.</p>
    <p>It sums <code>price</code> and never touches <code>quantity</code>. The fix is one word:</p>
""" + code("""return items.reduce((total, item) => total + item.price * item.quantity, 0);""") + """    <p>This is the shape of the defect you are being trained to find. Not a crash. Not a syntax error. Not something a linter or a type checker flags. Plausible, idiomatic, confident, and financially wrong &mdash; and it will pass any test that only checks quantities of one.</p>
""" + note("Module 8 is an entire module of these, with the fix graded. This is the point where the course stops being a web development tutorial.")),
)

M5_EX = """    <p>Ticket <b>NL-005</b>. The front desk sees forty appointments a day and needs two views: only the ones still open, and how many belong to a given clinician.</p>
    <p>Write both functions. No agent. The hidden tests include an empty list and a name that is not present, because those are the cases that break in production.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise &middot; jsLogicExercise</div>
      <p class="mut" style="margin-bottom:10px">Each row looks like <code>{ patient: "A", clinician: "Okafor", status: "open" }</code>. Write <code>filterOpen(rows)</code> returning only rows whose status is exactly <code>"open"</code>, and <code>countFor(rows, clinician)</code> returning how many rows belong to that clinician. Neither may modify the array it was given.</p>
      <textarea id="m5js" spellcheck="false" style="min-height:220px">function filterOpen(rows) {

}

function countFor(rows, clinician) {

}
</textarea>
      <button class="primary" id="m5check" style="margin-top:12px">Run hidden tests</button>
      <div class="feedback" id="m5fb"></div>
    </div>
    <p class="mut" style="margin-top:14px">More reps: <a href="practice-js.html">JavaScript practice</a>.</p>
"""

M5_JS = """document.getElementById("m5check").onclick = function () {
  var src = document.getElementById("m5js").value;
  var ROWS = [
    { patient: "A", clinician: "Okafor", status: "open" },
    { patient: "B", clinician: "Reid", status: "done" },
    { patient: "C", clinician: "Okafor", status: "open" },
    { patient: "D", clinician: "Okafor", status: "cancelled" }
  ];
  var a = PracticeKit.gradeJs({
    functionName: "filterOpen",
    testCases: [
      { name: "keeps only open rows", args: [ROWS], expected: [ROWS[0], ROWS[2]] },
      { name: "an empty list returns an empty list", args: [[]], expected: [] },
      { name: "a list with no open rows returns empty", args: [[ROWS[1], ROWS[3]]], expected: [] },
      { name: "does not treat 'cancelled' as open", args: [[ROWS[3]]], expected: [] }
    ]
  }, src);
  var b = PracticeKit.gradeJs({
    functionName: "countFor",
    testCases: [
      { name: "counts every row for a clinician", args: [ROWS, "Okafor"], expected: 3 },
      { name: "counts a clinician with one row", args: [ROWS, "Reid"], expected: 1 },
      { name: "returns 0 for an unknown clinician", args: [ROWS, "Nobody"], expected: 0 },
      { name: "returns 0 for an empty list", args: [[], "Okafor"], expected: 0 }
    ]
  }, src);

  /* Mutation check: filter and map return new arrays, so a correct answer
     leaves the input untouched. A student who used splice or a for loop
     that deletes will pass the value tests and fail this one. */
  var probe = ROWS.map(function (r) { return Object.assign({}, r); });
  var before = JSON.stringify(probe);
  var mutated = false;
  try {
    var fn = new Function(src + "\\n; return typeof filterOpen === 'function' ? filterOpen : null;")();
    if (fn) { fn(probe); mutated = JSON.stringify(probe) !== before; }
  } catch (e) { mutated = false; }

  var results = a.results.concat(b.results);
  results.push({ name: "filterOpen leaves the original list untouched", pass: !mutated,
    hint: "Your version modified the array it was given. filter returns a new array; splice edits in place." });
  var ok = a.passed && b.passed && !mutated;
  ModuleKit.showResults(document.getElementById("m5fb"), { passed: ok, results: results });
  if (ok) {
    document.getElementById("m5fb").innerHTML =
      "<b>Both functions hold up.</b> Including the empty list, the unknown clinician, and not mutating the input \\u2014 which is the difference between code that works on your sample and code that works on Priya's forty rows." +
      "<br><br>" + results.map(function (r) { return "\\u2713 " + r.name; }).join("<br>");
    CourseProgress.setSection(5, "jsLogicExercise", true);
    MK.sync();
  }
};"""

write(os.path.join(OUT, "module-05.html"), module_page(
    num=5, stage_label="Stage 2", minutes=70,
    title="JavaScript: logic you can defend",
    sub="This is the module people want to skip because an agent writes JavaScript fluently. It is also the module that makes reviewing an agent possible, because you cannot evaluate a shape you have never produced.",
    objectives_list=[
        "Use const, let, and the five types you will actually meet",
        "Write functions that take input and return output, and say why that matters for testing",
        "Avoid the falsy trap on empty strings and zero",
        "Use filter, map, and reduce, and know which one a ticket needs",
        "Look at plausible, idiomatic AI code and find the arithmetic error in it",
    ],
    why={
        "build": "The filtering and counting logic behind NL-005, tested against an empty list and an unknown clinician.",
        "why": "Every module after this one is about reading code. This is where you learn what correct code looks like from the inside.",
        "aiHelps": "It writes this fluently and instantly, which is exactly the problem.",
        "aiFails": "reduce that omits quantity, map where filter belonged, if (value) on a numeric field, and functions that quietly mutate their input.",
        "without": "Every line of the graded exercise is yours. No agent. This is the last module before you are allowed one.",
    },
    sections_html="".join(M5),
    exercise_html=M5_EX,
    exercise_js=M5_JS,
))

# ----------------------------------------------------------------- Module 6

M6 = (
    section("01", "Before you touch AI", """    <p>Dan wants the list loaded from a file, and a toggle that shows only open appointments. Before anyone writes <code>fetch</code> or a click handler, decide what the page must say in each state, and what a second click must do.</p>
    <div id="beforeAi" class="interactive"></div>
"""),

    section("02", "AI Code Detective", """    <p>The agent \u201cwired the list.\u201d Each snippet compiles. Find the defect. Options are shuffled.</p>
    <div id="detectives"></div>
    <div class="honestnote"><b>What AI got wrong, in one sentence each.</b> It parsed a patient name as HTML. It treated a 404 as success. It hid rows on setup instead of on click. All of that can look fine in a demo on a fast laptop with clean data.</div>
"""),

    section("03", "The DOM is not your HTML file", """    <p>You wrote a file. The browser read it and built something else out of it: a live tree of objects. That tree is the DOM, and it is what is actually on screen.</p>
    <p>This distinction matters because they can diverge immediately. JavaScript changes the DOM; the file on disk is untouched. Reload and your changes are gone. Every "why did my change disappear" question is this.</p>
""" + code("""// find things
document.querySelector("#hoursList");      // the first match for a CSS selector
document.querySelectorAll(".row");         // all matches

// read and change
el.textContent = "Closed today";           // the text inside
el.classList.add("is-open");               // add a class
el.hidden = true;                          // hide it""") + """    <p><code>querySelector</code> takes exactly the selectors you learned in Module 4, which is a genuine kindness.</p>
"""),

    section("04", "textContent versus innerHTML, and why it is a security question", """    <p>Two ways to put content into an element. They are not interchangeable.</p>
""" + code("""el.textContent = value;   // inserts value as TEXT. tags become visible characters.
el.innerHTML  = value;    // PARSES value as markup. tags become elements.""") + """    <p>For content you wrote, <code>innerHTML</code> is fine and often convenient. For anything a user typed, it is a vulnerability:</p>
""" + code("""const name = '<img src=x onerror="alert(document.cookie)">';

el.textContent = name;   // shows those characters on screen. harmless.
el.innerHTML  = name;    // creates a real element and runs the handler.""") + """    <p>That is cross-site scripting, in one line, from a name field. The rule is simple: <b>user data goes in with <code>textContent</code></b>. If you genuinely need markup from user input, that is a real problem requiring a real sanitiser, not a convenient property.</p>
""" + trap("Agents reach for <code>innerHTML</code> by default when rendering a list, because it is the shortest way to build rows from data. On a page rendering patient names it is an injection point. This is the single most common security defect you will find in AI-generated front-end code, and it is completely invisible until someone types the wrong thing.")),

    section("05", "Events: reacting to a person", """    <p>An event is something happening &mdash; a click, a keystroke, a form submission. You attach a listener and it runs.</p>
""" + code("""button.addEventListener("click", function () {
  // runs each time it is clicked
});

input.addEventListener("input", function (event) {
  const typed = event.target.value;   // what is in the box now
});

form.addEventListener("submit", function (event) {
  event.preventDefault();   // stop the browser navigating away
  // now handle it yourself
});""") + """    <p><code>event.preventDefault()</code> on a submit handler is the one to remember. The browser's default is to leave the page, which takes your JavaScript with it. Without that line your handler appears not to run at all &mdash; it runs, and then everything is thrown away.</p>
    <p>Two habits that matter:</p>
    <ul class="plain">
      <li><b>Attach to real controls.</b> A listener on a <code>&lt;div&gt;</code> only fires for a mouse. Put it on a <code>&lt;button&gt;</code> and Enter, Space, and assistive technology all work for free.</li>
      <li><b>Guard against the double press.</b> If nothing visible happens when someone submits, they press again. That is not user error; that is your interface failing to acknowledge them &mdash; and it is why NL-002 was really about a confirmation message.</li>
    </ul>
"""),

    section("06", "Data that arrives late", """    <p>Ticket NL-006: stop hard-coding the list, read <code>appointments.json</code>. That introduces time.</p>
    <p>Fetching a file takes a while &mdash; milliseconds on your laptop, seconds on a phone on a train. JavaScript does not wait. It fires the request and keeps going, and the data turns up later.</p>
""" + code("""// Wrong, and the classic first mistake:
const rows = fetch("appointments.json");
console.log(rows.length);   // undefined. nothing has arrived yet.

// Right: await says "pause here until it resolves".
async function loadAppointments() {
  const response = await fetch("appointments.json");
  const rows = await response.json();
  return rows;
}""") + """    <p><code>async</code> marks a function as one that can wait. <code>await</code> is where it waits. Anything depending on the data goes after the <code>await</code>, not before.</p>
    <p>And then the part the happy path never exercises. <b>Four states, not one:</b></p>
    <ul class="plain">
      <li><b>Loading</b> &mdash; the request is out. Say so, or the page looks broken.</li>
      <li><b>Success with data</b> &mdash; render it.</li>
      <li><b>Success with nothing</b> &mdash; the file was fine and the list is empty. "No appointments today" is a real, correct, designed state. A blank area is not.</li>
      <li><b>Failure</b> &mdash; the file is missing, the connection dropped, the JSON is malformed. Say something honest and, if you can, offer a retry.</li>
    </ul>
""" + code("""async function loadAppointments() {
  try {
    const response = await fetch("appointments.json");
    if (!response.ok) return { ok: false, rows: [] };   // 404, 500
    return { ok: true, rows: await response.json() };
  } catch (err) {
    return { ok: false, rows: [] };                     // offline, bad JSON
  }
}""") + """    <p>Note that <code>fetch</code> does <i>not</i> throw on a 404. It resolves successfully with a response whose <code>ok</code> is false. Forgetting to check <code>response.ok</code> means your code cheerfully tries to parse an error page as JSON.</p>
""" + trap("Ask an agent for data loading and you will get the happy path, correctly. Ask twice and you may get a try/catch. You will almost never get the <i>empty</i> state, because an empty list is not an error and nothing about it looks like a bug \u2014 until Priya opens the dashboard on a quiet Tuesday and sees a blank rectangle and calls Dan.")),
)

M6_EX = """    <p>Ticket <b>NL-006</b>, in two parts. Both are graded.</p>
    <div class="interactive">
      <div class="ilbl">Required exercise &middot; domDataExercise &middot; part 1 of 2</div>
      <p><b>All four states.</b> Write <code>summarise(result)</code> where <code>result</code> is what the loader returns: <code>{ ok, rows }</code>, or <code>null</code> while the request is still in flight.</p>
      <ul class="plain" style="font-size:14px">
        <li><code>null</code> &rarr; <code>"Loading appointments..."</code></li>
        <li><code>ok: false</code> &rarr; <code>"Could not load appointments."</code></li>
        <li><code>ok: true</code> with an empty list &rarr; <code>"No appointments today."</code></li>
        <li><code>ok: true</code> with rows &rarr; <code>"4 appointments, 2 still open"</code> &mdash; and <code>"1 appointment, 1 still open"</code> for a single row.</li>
      </ul>
      <textarea id="m6a" spellcheck="false" style="min-height:180px">function summarise(result) {

}
</textarea>
      <button type="button" class="primary" id="m6acheck" style="margin-top:10px">Test the four states</button>
      <div class="feedback" id="m6afb"></div>
    </div>
    <div class="interactive" style="margin-top:20px">
      <div class="ilbl">Required exercise &middot; domDataExercise &middot; part 2 of 2</div>
      <p><b>Wire it to a real interface.</b> Write <code>wireFilter(root)</code>. Inside <code>root</code> there is a <code>&lt;button id="toggle"&gt;</code> and a <code>&lt;ul id="list"&gt;</code> whose <code>&lt;li&gt;</code> elements each carry <code>data-status</code>. Clicking the button hides every row that is not <code>open</code>; clicking it again shows them all. Hide with the <code>hidden</code> property.</p>
      <p class="mut">This runs for real: we build the elements, call your function, dispatch actual clicks, and read the resulting DOM.</p>
      <textarea id="m6b" spellcheck="false" style="min-height:200px">function wireFilter(root) {

}
</textarea>
      <button type="button" class="primary" id="m6bcheck" style="margin-top:10px">Dispatch real clicks</button>
      <div class="feedback" id="m6bfb"></div>
    </div>
    <p class="mut" style="margin-top:14px">More reps: <a href="practice-js.html">JavaScript practice</a> &middot; <a href="practice-detective.html">AI Code Detective</a>.</p>
"""

M6_JS = """Northline.renderPrediction("beforeAi", {
  label: "Predict first \\u00b7 no AI, no running it",
  intro: "The loader returns { ok, rows }, or null while the request is still in flight. The toggle must hide non-open rows, then show them again.",
  questions: [
    { q: "The request is still in flight. What should the page say?",
      opts: [
        { t: "Loading appointments...", correct: true,
          whyOk: "A blank rectangle looks broken. Loading is a designed state." },
        { t: "No appointments today.", why: "You do not know that yet. Empty and loading are different." },
        { t: "Nothing. Wait for the JSON.", why: "Waiting silently is how Priya thinks the dashboard is down." }
      ] },
    { q: "The file is missing. fetch returned 404. What should the page say?",
      opts: [
        { t: "Could not load appointments.", correct: true,
          whyOk: "A 404 is a failed load, not an empty clinic day." },
        { t: "No appointments today.", why: "That is the empty-success state. A missing file is a failure." },
        { t: "Throw, so the console shows it.", why: "The console is not the interface. Say something honest on the page." }
      ] },
    { q: "The file loaded and the list is empty. What should the page say?",
      opts: [
        { t: "No appointments today.", correct: true,
          whyOk: "Empty is valid. It is the quiet Tuesday. Design it." },
        { t: "Could not load appointments.", why: "The load worked. Lying about failure trains people to ignore the real one." },
        { t: "Leave the list blank.", why: "Blank is indistinguishable from broken." }
      ] },
    { q: "After one click the list shows only open rows. What must the second click do?",
      opts: [
        { t: "Show every row again. A filter is a view, not a delete.", correct: true,
          whyOk: "Everyone tests the first click. The second click is what breaks in production." },
        { t: "Keep them hidden. She asked for open only.", why: "She also needs to get back. A one-way filter is a trap." },
        { t: "Reload the JSON.", why: "The data is already there. Toggle the view." }
      ] }
  ],
  learned: ["You specified the four states and the toggle-back before anyone wrote fetch.",
    "That is the only way you can tell a happy-path agent draft from a finished feature."]
});
Northline.renderDetectiveSet(["xssInnerHtml", "fetchNoOk", "a11y"], "detectives");

var m6state = { a: false, b: false };
function m6sync() {
  if (m6state.a && m6state.b) {
    CourseProgress.setSection(6, "domDataExercise", true);
    MK.sync();
  }
}

document.getElementById("m6acheck").onclick = function () {
  var src = document.getElementById("m6a").value;
  var rows4 = [{ status: "open" }, { status: "done" }, { status: "open" }, { status: "cancelled" }];
  var out = PracticeKit.gradeJs({
    functionName: "summarise",
    testCases: [
      { name: "loading state (null)", args: [null], expected: "Loading appointments..." },
      { name: "failure state (ok: false)", args: [{ ok: false, rows: [] }], expected: "Could not load appointments." },
      { name: "loaded but empty", args: [{ ok: true, rows: [] }], expected: "No appointments today." },
      { name: "four rows, two open", args: [{ ok: true, rows: rows4 }], expected: "4 appointments, 2 still open" },
      { name: "one row, singular wording", args: [{ ok: true, rows: [{ status: "open" }] }], expected: "1 appointment, 1 still open" },
      { name: "rows present but none open", args: [{ ok: true, rows: [{ status: "done" }] }], expected: "1 appointment, 0 still open" }
    ]
  }, src);
  ModuleKit.showResults(document.getElementById("m6afb"), out);
  if (out.passed) {
    m6state.a = true;
    document.getElementById("m6afb").innerHTML =
      "<b>Four states handled.</b> The empty one is the one agents skip, and the one Priya will actually hit on a quiet Tuesday.<br><br>" +
      out.results.map(function (r) { return "\\u2713 " + r.name; }).join("<br>");
    Northline.showLearned(document.getElementById("m6afb").parentNode,
      "You just designed the states the happy path never exercises.",
      "Loading, failed, empty, and success are four different sentences. An agent will usually write one.");
    m6sync();
  }
};

document.getElementById("m6bcheck").onclick = function () {
  var src = document.getElementById("m6b").value;
  var results = [];
  var fn = null;
  try {
    fn = new Function(src + "\\n; return typeof wireFilter === 'function' ? wireFilter : null;")();
  } catch (e) {
    ModuleKit.showResults(document.getElementById("m6bfb"),
      { passed: false, results: [{ name: "your code parses", pass: false, hint: e.message }] });
    return;
  }
  if (!fn) {
    ModuleKit.showResults(document.getElementById("m6bfb"),
      { passed: false, results: [{ name: "wireFilter is defined", pass: false, hint: "Define a function named exactly wireFilter." }] });
    return;
  }

  /* Build a detached fixture, hand it to the student's function, then fire
     genuine click events. Detached from the document so nothing they write
     can disturb the page around it. */
  var root = document.createElement("div");
  root.innerHTML = '<button id="toggle">Open only</button><ul id="list">' +
    '<li data-status="open">A</li><li data-status="done">B</li>' +
    '<li data-status="open">C</li><li data-status="cancelled">D</li></ul>';
  var btn = root.querySelector("#toggle");
  var lis = Array.prototype.slice.call(root.querySelectorAll("li"));
  function hiddenPattern() { return lis.map(function (li) { return li.hidden ? "H" : "-"; }).join(""); }

  try { fn(root); } catch (e) {
    results.push({ name: "wireFilter runs without throwing", pass: false, hint: e.message });
  }
  if (!results.length) {
    results.push({ name: "nothing is hidden before the first click", pass: hiddenPattern() === "----",
      hint: "Do not filter on setup. Wait for the click. Currently: " + hiddenPattern() });
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    results.push({ name: "after one click, only non-open rows are hidden", pass: hiddenPattern() === "-H-H",
      hint: "Expected -H-H (B and D hidden), got " + hiddenPattern() + ". Set li.hidden = true on rows whose data-status is not 'open'." });
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    results.push({ name: "a second click shows everything again", pass: hiddenPattern() === "----",
      hint: "Expected ---- after toggling back, got " + hiddenPattern() + ". Track the current state and reverse it." });
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    results.push({ name: "a third click filters again", pass: hiddenPattern() === "-H-H",
      hint: "The toggle should keep working, got " + hiddenPattern() + "." });
    results.push({ name: "you read data-status rather than the visible text", pass: !/textContent\\s*===|innerText\\s*===/.test(src),
      hint: "Read li.dataset.status. Matching on the visible label breaks the moment the wording changes." });
  }
  var ok = results.every(function (r) { return r.pass; });
  ModuleKit.showResults(document.getElementById("m6bfb"), { passed: ok, results: results });
  if (ok) {
    m6state.b = true;
    document.getElementById("m6bfb").innerHTML =
      "<b>Real clicks, real DOM, correct both ways.</b> Toggling back is the half that breaks in production, because everyone tests the first click.<br><br>" +
      results.map(function (r) { return "\\u2713 " + r.name; }).join("<br>");
    Northline.showLearned(document.getElementById("m6bfb").parentNode,
      "You just proved the toggle both ways with real clicks.",
      "The second click is the half that breaks in production, because everyone tests the first.");
    m6sync();
  }
};"""

write(os.path.join(OUT, "module-06.html"), module_page(
    num=6, stage_label="Stage 2", minutes=65,
    title="The DOM, events, and data that arrives late",
    sub="Logic in a file does nothing. Now wire it to something a person can press, load real data over a real network, and handle the three states that only show up after you have shipped.",
    objectives_list=[
        "Explain why the DOM and your HTML file are different things",
        "Choose textContent over innerHTML for user data, and say what the attack is",
        "Attach event listeners to real controls, and stop a form navigating away",
        "Load JSON with async and await, and check response.ok",
        "Handle loading, empty, and failed states \u2014 not just the happy path",
    ],
    why={
        "build": "The state summary for NL-006 and a working filter toggle, both graded by dispatching real clicks against a real DOM.",
        "why": "This is where a page stops being a document and becomes software. It is also where the security and timing bugs live.",
        "aiHelps": "It writes fetch and event wiring quickly and usually correctly on the happy path.",
        "aiFails": "innerHTML with user data, no empty state, unchecked response.ok, and a toggle that only works the first time.",
        "without": "You write both functions. The grader fires genuine click events at your code, so a plausible-looking answer is not enough.",
    },
    sections_html="".join(M6),
    exercise_html=M6_EX,
    exercise_js=M6_JS,
    extra_scripts=("detective-kit.js",),
))
