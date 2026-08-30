/* Northline Digital — the fictional shop the whole course is set in, plus the
   reusable interactive components the module pages mount.

   Ownership note: the ticket text, the eleven-step loop, and the module list
   live in course-progress.js. This file does not keep a second copy of them.
   It holds the cast, the "why care" grid, the request-comparison drill, the
   AI Code Detective option banks, and the supervision components.

   Nothing here runs a coding agent. Anything that shows agent output is
   canned text and is labelled as a simulation on the page that mounts it. */
(function (global) {
  const COMPANY = {
    name: "Northline Digital",
    blurb: "Northline Digital is five people in a converted mill unit: two developers, " +
      "an account lead, a reviewer who used to keep a bank's systems upright, and a designer " +
      "who is permanently on someone else's project. The clients are small — a physiotherapy " +
      "clinic, a letting agent, a food wholesaler. You were hired last week as the junior " +
      "developer, and you have an AI coding agent, the same as everyone else here.",
  };

  const PEOPLE = [
    { name: "Priya Raman", role: "Office manager, Northline Clinic (client)",
      note: "Describes symptoms, never solutions, because that is not her job. She knows exactly " +
        "what goes wrong at the front desk and nothing about what is possible to build." },
    { name: "Dan Whitfield", role: "Account lead, Northline Digital",
      note: "Forwards one sentence and calls it a brief. Has usually already told the client a date. " +
        "Not malicious — he simply cannot tell a ten-minute change from a two-week one." },
    { name: "Sam Oyelaran", role: "Senior developer, your reviewer",
      note: "Asks \u201chow do you know?\u201d until the answer stops being a feeling. Reads your ticket " +
        "before your code, and will send a working pull request back if you cannot defend it." },
    { name: "The agent", role: "Your coding assistant",
      note: "Fast, tireless, fluent, and completely confident whether or not it is right. Has never " +
        "spoken to Priya, never been on call, and carries none of the consequences. You do." },
  ];

  /* ---------------------------------------------------------------- *
   * AI Code Detective option banks.
   * Each case: realistic agent output, a question, options where every
   * wrong answer has a reason, and the engineering principle behind it.
   * Options are shuffled at render time.
   * ---------------------------------------------------------------- */
  const DETECTIVES = {
    a11y: {
      title: "The Book control",
      code: '<div onclick="openModal()">Book</div>',
      prompt: "The agent shipped this as the Book button. What is wrong?",
      principle: "A control must be a real control. Semantics carry behaviour.",
      opts: [
        { t: "A div with onclick is not a button. Keyboard and assistive tech lose.", correct: true,
          whyOk: "A real control is <button> or a link. onclick on a div is a fake affordance." },
        { t: "onclick is illegal in HTML.", why: "It is legal. It is still the wrong element." },
        { t: "Patients cannot see blue.", why: "Color is not the defect." },
      ],
    },
    leftover: {
      title: "TEMP comment",
      code: "// TEMP: skip expiry check so the demo works",
      prompt: "The agent left this in a PR. What do you do?",
      principle: "A demo shortcut inside shipped code is a product defect.",
      opts: [
        { t: "Reject it. A leftover skip is a product defect, not a comment style issue.", correct: true,
          whyOk: "Demo shortcuts become production. Delete the skip or the ticket is not done." },
        { t: "Ship it. Comments are free.", why: "The skip is the product." },
        { t: "Ask the agent to add more comments.", why: "More words will not restore the check." },
      ],
    },
    total: {
      title: "Supply cart total",
      code: "return items.reduce((t, item) => t + item.price, 0);",
      prompt: "Two gauze packs at $3. What does this return, and is that the bill?",
      principle: "Check the formula against the business rule, not against the syntax.",
      opts: [
        { t: "It sums price only. Quantity is ignored. The bill is wrong.", correct: true,
          whyOk: "A pack of two is 2 * price. Forgetting quantity is a classic agent miss." },
        { t: "reduce is always wrong.", why: "reduce is fine. The formula is not." },
        { t: "price already includes quantity.", why: "Not in this object. Do not invent fields." },
      ],
    },
    validate: {
      title: "Email check",
      code: 'return s.includes("@");',
      prompt: "The agent validated email this way. What fails?",
      principle: "A presence check is not a validation rule.",
      opts: [
        { t: '"@" and "a@" pass. That is not an email.', correct: true,
          whyOk: "includes('@') is a presence check, not a mailbox." },
        { t: "includes is banned in browsers.", why: "It works. The rule is too weak." },
        { t: "You must use a library.", why: "A tighter rule here is enough for class." },
      ],
    },
    leak: {
      title: "Checkout log",
      code: "console.log('card', payload.cardNumber);",
      prompt: "The agent added this to debug checkout. Merge?",
      principle: "Logs are output. Secrets do not belong in output.",
      opts: [
        { t: "No. Card numbers do not belong in logs.", correct: true,
          whyOk: "Logs leak. CI green does not make a secret safe." },
        { t: "Yes if tests pass.", why: "Tests do not see the log." },
        { t: "Only on staging.", why: "Staging logs get copied. Still a leak." },
      ],
    },
    xssInnerHtml: {
      title: "Rendering a patient name",
      code: "list.innerHTML += '<li>' + row.name + '</li>';",
      prompt: "The agent rendered the appointment list this way. What is the defect?",
      principle: "User data is text. innerHTML parses it as markup.",
      opts: [
        { t: "A name can become a real element and run a handler. textContent would have shown the characters and stopped.", correct: true,
          whyOk: "This is XSS from a name field. Agents reach for innerHTML because it is the shortest way to build rows." },
        { t: "innerHTML is illegal in browsers.", why: "It is legal. That is why it is dangerous." },
        { t: "You must never render a list.", why: "Render it. Just do not parse the patient's name as HTML." },
      ],
    },
    fetchNoOk: {
      title: "Loading appointments.json",
      code: "const rows = await fetch('appointments.json').then(r => r.json());",
      prompt: "The file is missing. The server returns 404. What happens?",
      principle: "fetch does not throw on HTTP errors. response.ok is the check.",
      opts: [
        { t: "fetch succeeds with a 404 body. .json() then fails or you parse an error page. The empty and failed states never appear.", correct: true,
          whyOk: "You must check response.ok. A missing file is not an exception; it is a response." },
        { t: "fetch throws, so a try/catch is enough.", why: "It does not throw on 404. That is the trap." },
        { t: "The browser shows a 404 page and your code never runs.", why: "Your JS still runs. You just got the wrong body." },
      ],
    },
    testAlwaysTrue: {
      title: "The agent's passing test",
      code: "function test_canSubmit(impl) {\n  impl({ name: 'Priya', email: 'p@x.co', date: '2026-09-02' });\n  return true;\n}",
      prompt: "This test is green on the broken function and the fixed one. What is it worth?",
      principle: "A test that cannot fail is a comment that costs CPU.",
      opts: [
        { t: "Nothing. It never looks at the return value, and it always returns true.", correct: true,
          whyOk: "Green here means the function existed and did not throw on Priya's input \u2014 the case that already works." },
        { t: "It proves the happy path, which is enough.", why: "Priya's path was never the bug. A test that cannot fail on the report is not a test of the report." },
        { t: "return true is a standard pass signal.", why: "The signal has to be earned. This one is hardcoded." },
      ],
    },
    pyExceptPass: {
      title: "The cleanup script's error handling",
      code: "try:\n    rows = json.load(open(path))\nexcept:\n    pass",
      prompt: "The agent added this so the script 'never crashes'. What did it actually do?",
      principle: "Silent except is silent data loss.",
      opts: [
        { t: "A missing file, a malformed row, or a permission error becomes an empty success. Nobody is told.", correct: true,
          whyOk: "except: pass converts 'this file was malformed' into 'the file was fine, here are 200 rows instead of 4,000'." },
        { t: "pass is required in Python after except.", why: "A body is required. The body should raise, log, or return a failure \u2014 not disappear." },
        { t: "This is how you skip blank rows.", why: "Blank rows are data. Handle them in the loop. Do not swallow every error to get there." },
      ],
    },
    pyOverwrite: {
      title: "Writing the clean file",
      code: "clean_csv(path, path)  # read and write the same file",
      prompt: "What is wrong with this tool?",
      principle: "A cleanup script that overwrites its input can eat the only copy.",
      opts: [
        { t: "If the script is wrong, the original export is gone. Read one path, write another.", correct: true,
          whyOk: "The first rule of a destructive tool: never eat the input. Dan cannot re-export last Monday." },
        { t: "Python cannot write the file it is reading.", why: "It can. That is the problem." },
        { t: "You should copy the file in the same function after writing.", why: "Too late. Write a different path first." },
      ],
    },

    /* ---- HTML structure ---- */
    htmlDivSoup: {
      title: "A page with no landmarks",
      code: "<div class=\"top\">\n  <div class=\"menu\"><div class=\"item\">Hours</div></div>\n</div>\n<div class=\"content\">\n  <div class=\"big\">Northline Clinic</div>\n</div>",
      prompt: "The agent produced the clinic page. It looks correct in the browser. What did it get wrong?",
      principle: "CSS makes it look right. Only markup makes it mean something.",
      opts: [
        { t: "There is no header, nav, main, or heading \u2014 just styled divs. Nothing can find the page's structure: screen readers, skip links, or search engines.", correct: true,
          whyOk: "\u201cLooks right\u201d and \u201cis right\u201d come apart here. A div named .big is not a heading." },
        { t: "The class names are not descriptive enough.", why: "Renaming .big to .heading changes nothing for assistive tech. The element is still a div." },
        { t: "It should use tables for the layout.", why: "Tables are for tabular data. That would be a second, older mistake." },
        { t: "Nothing \u2014 divs are valid HTML.", why: "Valid and meaningful are different bars. This passes a validator and fails a screen reader." },
      ],
    },
    htmlLabel: {
      title: "The form field with no label",
      code: "<input type=\"email\" placeholder=\"Email address\">",
      prompt: "The agent used a placeholder instead of a label. Front desk say older patients keep losing track of which box is which. Why?",
      principle: "A placeholder is a hint that leaves. A label is a name that stays.",
      opts: [
        { t: "The placeholder disappears the moment you start typing, and it is not reliably read as the field's name. A <label for> gives a permanent name and makes the label clickable.", correct: true,
          whyOk: "Also the reason those patients struggle: once they type, the only clue is gone." },
        { t: "type=\"email\" is not a real input type.", why: "It is real and useful \u2014 it gets the right keyboard on phones. The missing label is the defect." },
        { t: "Placeholders are fine as long as the contrast is good.", why: "Contrast is a separate problem. Even a perfectly legible placeholder still vanishes on input." },
        { t: "It needs a title attribute instead.", why: "title is a tooltip, unreliable on touch and often unread. Use a label." },
      ],
    },
    htmlHeadingSkip: {
      title: "Heading levels chosen by size",
      code: "<h1>Northline Clinic</h1>\n<h4>Opening hours</h4>\n<h2>Tuesday to Saturday</h2>",
      prompt: "The agent picked heading levels to get the font sizes it wanted. What is the problem?",
      principle: "Heading level is document outline, not font size. Size is CSS's job.",
      opts: [
        { t: "Levels describe nesting, so this claims \u201cOpening hours\u201d is three levels deep and the days are above it. The outline is now nonsense to anyone navigating by headings.", correct: true,
          whyOk: "Many screen-reader users navigate by heading list. This one reads as a scrambled table of contents." },
        { t: "You may only ever use h1 and h2.", why: "All six levels are fine. They just have to nest in order." },
        { t: "h4 is deprecated.", why: "It is not deprecated. It is misused here." },
        { t: "Nothing, as long as the CSS makes them look right.", why: "That is exactly the reasoning that caused the bug. Set size in CSS and keep the levels honest." },
      ],
    },
    htmlAltText: {
      title: "Alt text written by an agent",
      code: "<img src=\"clinic-front.jpg\" alt=\"image\">\n<img src=\"logo.svg\" alt=\"logo\">\n<img src=\"divider.png\" alt=\"decorative divider line\">",
      prompt: "Three images, three alt attributes, and every one is wrong in a different way. Which describes the set best?",
      principle: "Alt text answers \u201cwhat would a sighted user get from this?\u201d \u2014 not \u201cwhat file is this?\u201d",
      opts: [
        { t: "\u201cimage\u201d and \u201clogo\u201d describe the file, not the content, and the purely decorative divider should have alt=\"\" so it is skipped rather than announced.", correct: true,
          whyOk: "Empty alt is a real, correct answer for decoration \u2014 the one agents almost never produce." },
        { t: "All three need longer, more detailed descriptions.", why: "Longer is not the goal, and the divider needs none at all. Describing decoration is noise." },
        { t: "Images should not have alt attributes if they are decorative \u2014 just omit it.", why: "Omitting alt makes some screen readers read the filename. Use alt=\"\" instead." },
        { t: "Only the SVG is a problem, because SVG needs a title element.", why: "The img alt is what matters here, and two of the three are uninformative." },
      ],
    },

    /* ---- CSS layout ---- */
    cssFixedWidth: {
      title: "The card that will not shrink",
      code: ".appointment-card {\n  width: 420px;\n  padding: 24px;\n}",
      prompt: "On a 375px phone the card runs off the right edge. The agent says the width came from the design file. What is the defect?",
      principle: "For content boxes prefer max-width. width is a promise the viewport cannot always keep.",
      opts: [
        { t: "A hard 420px cannot fit a 375px viewport, so the box overflows. max-width: 420px caps it on desktop and still lets it shrink.", correct: true,
          whyOk: "width is a fixed contract. max-width is a ceiling. Content boxes want a ceiling." },
        { t: "The padding should be in rem instead of px.", why: "Unit choice is a preference here. 24px padding is fine \u2014 the fixed width is what overflows." },
        { t: "Add overflow: hidden to the card.", why: "That hides the evidence and clips the patient's text. The box is still too wide." },
        { t: "Phones cannot render a 420px box.", why: "They render it fine and then scroll sideways. Sideways scroll is the symptom, not the cause." },
      ],
    },
    cssNoWrap: {
      title: "The nav that clips",
      code: "nav ul {\n  display: flex;\n  gap: 24px;\n}",
      prompt: "The nav has six links. On a phone the last two are cut off. The agent's proposed fix was font-size: 11px. What is actually wrong?",
      principle: "Flex items do not wrap unless you ask. Shrinking text hides a layout bug behind an accessibility bug.",
      opts: [
        { t: "Flex items stay on one line by default. flex-wrap: wrap lets the links form a second row, and the existing gap spaces both rows.", correct: true,
          whyOk: "One property. No redesign, no unreadable text." },
        { t: "gap is not supported on flex containers.", why: "gap works on flex in every current browser. It is not the bug." },
        { t: "The nav needs position: absolute so it stops pushing.", why: "Absolute positioning removes it from normal flow and usually makes overflow worse and harder to reason about." },
        { t: "11px text is the correct fix \u2014 it makes everything fit.", why: "It fits by making the page unreadable and the tap targets tiny. You traded a layout bug for an accessibility bug." },
      ],
    },
    cssMediaSelector: {
      title: "The breakpoint that fires backwards",
      code: "/* markup: <div class=\"appointment-row\"> two columns </div> */\n@media (min-width: 640px) {\n  .appointment-row { flex-direction: column; }\n}",
      prompt: "The ticket said stack at 640px and below. This stacks on desktop and stays side-by-side on phones. Why?",
      principle: "Read the breakpoint condition before you read the rules inside it.",
      opts: [
        { t: "min-width: 640px applies at 640px and wider, so the rule runs on desktop. The ticket needed max-width: 640px.", correct: true,
          whyOk: "The rules inside were right. The condition was inverted \u2014 easy to miss because the CSS itself looks correct." },
        { t: "flex-direction: column is not a valid value.", why: "It is valid. The declaration is fine; the query is not." },
        { t: "The selector should be an id, not a class.", why: "The class matches the markup, so the selector resolves. The condition is the bug." },
        { t: "Media queries cannot change flex-direction.", why: "They can change any property. The breakpoint side is the problem." },
      ],
    },
    cssTouchTarget: {
      title: "The Book button nobody can hit",
      code: ".btn-book {\n  padding: 2px 6px;\n  font-size: 11px;\n}",
      prompt: "The agent \u201ccompacted the mobile UI\u201d. Front desk report patients tapping and missing. What is the engineering problem?",
      principle: "Touch target size is an accessibility requirement with a number attached, not a matter of taste.",
      opts: [
        { t: "The tap target ends up around 15px tall. Thumbs and users with motor impairments need roughly 44px. Give it real padding and a min-height.", correct: true,
          whyOk: "\u201cLooks tidy\u201d is not a requirement. \u201cA patient can hit it\u201d is." },
        { t: "CSS forbids font sizes under 16px.", why: "No such rule. 16px matters for form inputs and iOS zoom, but the defect here is the hit area." },
        { t: "The button should be a background image instead.", why: "That removes the text from the accessibility tree and does nothing for the hit area." },
        { t: "Nothing \u2014 desktop looks great, so the CSS is correct.", why: "The ticket was about phones. Desktop passing is not evidence for the case you were asked to fix." },
      ],
    },
    cssBoxSizing: {
      title: "100% plus padding",
      code: ".field {\n  width: 100%;\n  padding: 12px;\n  border: 1px solid #ccc;\n}",
      prompt: "Every form field pokes slightly past the edge of its container. The agent says width is already 100%. Why is it still too wide?",
      principle: "box-sizing decides whether width means the content box or the whole box.",
      opts: [
        { t: "By default width sizes the content box, so padding and border are added on top \u2014 100% + 24px + 2px. box-sizing: border-box makes width include them.", correct: true,
          whyOk: "This is why border-box is set globally in most stylesheets, including this course's." },
        { t: "100% is invalid for width; use auto.", why: "100% is valid. The default box model is what adds the extra pixels." },
        { t: "The border must be removed.", why: "That hides two of the twenty-six extra pixels and costs you the field outline." },
        { t: "The parent needs overflow: scroll.", why: "That papers over the overflow rather than sizing the field correctly." },
      ],
    },
    cssAbsolute: {
      title: "The layout held together with pins",
      code: ".appointment-card {\n  position: absolute;\n  top: 120px;\n  left: 40px;\n  width: 420px;\n}",
      prompt: "The agent \u201cfixed\u201d the desktop card with absolute positioning. What happens on a phone?",
      principle: "Absolute positioning takes a box out of flow. It is a last resort, not a layout system.",
      opts: [
        { t: "The card is pinned to desktop coordinates, so on a 375px screen it overflows and ignores document flow. Use normal flow, flex, or grid.", correct: true,
          whyOk: "Absolute is a pin. Pins do not reflow when the viewport changes." },
        { t: "position: absolute is invalid on a class selector.", why: "It is valid. The problem is what it does to flow, not the syntax." },
        { t: "You need a higher z-index so it stays on top.", why: "Stacking is not the defect. The coordinates are." },
        { t: "This is the professional way to lock a signed-off design.", why: "It locks a design to one viewport. That is the opposite of responsive." },
      ],
    },

    /* ---- JavaScript literacy (Module 5) ---- */
    jsMutate: {
      title: "The filter that edits the list",
      code: "function filterOpen(rows) {\n  for (let i = rows.length - 1; i >= 0; i--) {\n    if (rows[i].status !== \"open\") rows.splice(i, 1);\n  }\n  return rows;\n}",
      prompt: "This returns the open rows. Tests that only check the return value go green. What is still wrong?",
      principle: "A function that filters should not destroy the list it was handed. The front desk still needs the full day.",
      opts: [
        { t: "splice edits the original array. After one filter the cancelled and done rows are gone from Priya's list, not just from this view.", correct: true,
          whyOk: "Return value tests lie when they never look at the input afterwards. filter returns a new array." },
        { t: "A for loop is illegal in modern JavaScript.", why: "Loops are fine. The mutation is the defect." },
        { t: "It should use == instead of !==.", why: "=== / !== is correct here. The comparison is not the bug." },
        { t: "Nothing \u2014 if the return value is right, the function is right.", why: "That is exactly the test gap this snippet exploits." },
      ],
    },
    jsWrongField: {
      title: "Open, but the wrong field",
      code: "function filterOpen(rows) {\n  return rows.filter(r => r.state === \"open\");\n}",
      prompt: "The agent says it filtered by status. The rows look like { patient, clinician, status }. What happens?",
      principle: "Read the field name against the data, not against the comment above the function.",
      opts: [
        { t: "r.state is always undefined, so nothing matches. You get an empty list and a confident function.", correct: true,
          whyOk: "The field is status. state is a plausible synonym and a complete miss." },
        { t: "filter cannot compare strings.", why: "It can. It is comparing the wrong one." },
        { t: "You must use a for loop to read object fields.", why: "filter reads fields fine. The name is wrong." },
        { t: "state is an alias JavaScript provides for status.", why: "It is not. Do not invent fields." },
      ],
    },
    jsMapNotFilter: {
      title: "map where filter belonged",
      code: "function filterOpen(rows) {\n  return rows.map(r => r.status === \"open\" ? r : undefined);\n}",
      prompt: "The ticket asked for only the open rows. This returns an array the same length as the input, full of holes. Why?",
      principle: "filter changes the length. map changes the contents. The ticket told you which one.",
      opts: [
        { t: "map keeps every slot. Failed rows become undefined instead of disappearing, so the list is the right length and the wrong contents.", correct: true,
          whyOk: "A reviewer who only checks .length will bless this. Priya will see blank cards." },
        { t: "map is deprecated.", why: "It is current. It is the wrong method for this ticket." },
        { t: "undefined is automatically removed from arrays.", why: "It is not. The holes stay." },
        { t: "This is how you write a filter in modern JavaScript.", why: "No. filter is how you write a filter." },
      ],
    },
    jsNoReturn: {
      title: "The function that forgot to hand anything back",
      code: "function countFor(rows, clinician) {\n  let n = 0;\n  rows.forEach(r => {\n    if (r.clinician === clinician) n += 1;\n  });\n}",
      prompt: "The agent counted. The tests say expected 3, got undefined. What did it forget?",
      principle: "A function that does not return gives you undefined. The work happened and then vanished.",
      opts: [
        { t: "There is no return. n is computed and then thrown away, so the caller gets undefined.", correct: true,
          whyOk: "forEach does not return a count. You have to hand n back." },
        { t: "forEach cannot see n because of scope.", why: "n is in the outer function. Scope is fine. The return is missing." },
        { t: "clinician must be compared with ==.", why: "=== is correct. The value never leaves the function." },
        { t: "You cannot count with a loop at all.", why: "You can. You just have to return the number." },
      ],
    },
  };

  /* Progressive interview used by Module 2. Slot answers become the
     specification draft the student then types into the graded exercise. */
  const BREAKDOWN_BOOKING = {
    who: "Dan, via Slack",
    request: "Client says booking is confusing. Can you just make it better?",
    steps: [
      { slot: "What's missing?",
        q: "Dan's message is one sentence. What information is actually missing before anyone should write code?",
        answer: "Who gets stuck, what they do next, what done looks like, and what you are deliberately not doing.",
        opts: [
          { t: "Who gets stuck, what they do next, what done looks like, and what you are not doing.", correct: true,
            whyOk: "Those four questions turn a verdict into a job." },
          { t: "Which CSS framework Priya prefers.", why: "She is not choosing a framework. That question delays the real ones." },
          { t: "The file list and function names.", why: "Implementation comes after you know the behaviour. Asking for files now is guessing." },
          { t: "Nothing \u2014 \u201cconfusing\u201d is enough to start a redesign.", why: "A redesign is one possible guess. You do not yet know if that is the problem." },
        ] },
      { slot: "Who?",
        q: "Who is the user of this change?",
        answer: "Patients booking on a phone, and the receptionist who fields the calls when they cannot tell if it worked.",
        opts: [
          { t: "Patients trying to book, and the receptionist who answers when they cannot tell if it worked.", correct: true,
            whyOk: "Two roles, one symptom. The confirmation is for both of them." },
          { t: "Dan, because he filed the ticket.", why: "Dan forwarded a sentence. He is not the user." },
          { t: "Whoever writes the CSS.", why: "That is you. You are not the user." },
          { t: "All clinic staff, so we should rebuild the whole intranet.", why: "That is how a confirmation message becomes a six-week project." },
        ] },
      { slot: "What?",
        q: "After you talk to Priya, eight people a week call because they cannot tell whether the form submitted. What is the actual feature?",
        answer: "A visible confirmation after a successful request, and a guard against a second click creating a second booking.",
        opts: [
          { t: "A confirmation they can see, and a way to stop a second click creating a second booking.", correct: true,
            whyOk: "The phone calls are the requirement in disguise." },
          { t: "A full visual redesign of the booking page.", why: "Looks nicer. Does not answer \u201cdid it go through?\u201d" },
          { t: "An accounts system so they can log in and see history.", why: "Useful someday. Not this ticket. That is a product, not a confirmation." },
          { t: "Better placeholder text on the email field.", why: "Placeholders do not tell you a request arrived." },
        ] },
      { slot: "When?",
        q: "When should the confirmation appear?",
        answer: "After a successful submit \u2014 not on page load, and not while the request is still in flight.",
        opts: [
          { t: "After a successful submit \u2014 not on load, not while the request is still going.", correct: true,
            whyOk: "Timing is a requirement. Wrong timing is a bug that looks like a feature." },
          { t: "As soon as they open the page, so they feel welcomed.", why: "That is a greeting, not a confirmation. It would make the problem worse." },
          { t: "Whenever any button on the page is clicked.", why: "The hours link is not a booking." },
          { t: "Only after a staff member approves it by email.", why: "That is a different product. Patients would still phone." },
        ] },
      { slot: "What should happen?",
        q: "What does the patient actually see, and what happens to the button?",
        answer: "A specific written message appears, and submit cannot fire again until the request finishes.",
        opts: [
          { t: "A specific written message appears, and the submit button cannot fire again until the request finishes.", correct: true,
            whyOk: "Named text plus a disabled button. A stranger can check both." },
          { t: "A tasteful animation plays.", why: "Animations are not evidence. Patients phone because they saw nothing they trusted." },
          { t: "The page reloads to a blank home page.", why: "That looks like a crash. They will book again." },
          { t: "An email is sent, and the page stays exactly as it was.", why: "Email can fail silently. The page is what they are looking at." },
        ] },
      { slot: "What should not happen?",
        q: "What is explicitly out of scope for this ticket?",
        answer: "No redesign, no accounts, no SMS, no payment \u2014 confirmation and double-submit only.",
        opts: [
          { t: "No redesign, no accounts, no SMS, no payment \u2014 confirmation and double-submit only.", correct: true,
            whyOk: "Written down, this is how you say no once." },
          { t: "Nothing is out of scope if it improves UX.", why: "That sentence is how tickets never end." },
          { t: "You must not talk to Priya.", why: "Talking to her is how you found the eight phone calls." },
          { t: "You must not write any checks later.", why: "A Given/When/Then is how you prove the double-submit case. That is not \u2018the feature\u2019, but it is not banned either." },
        ] },
      { slot: "Edge case?",
        q: "Which edge case will an agent almost certainly miss unless you write it down?",
        answer: "A Sunday date (clinic closed) and a second click while the first request is still in flight.",
        opts: [
          { t: "A Sunday date (clinic closed) and a second click while the first request is still in flight.", correct: true,
            whyOk: "Empty-string validation is famous. Domain rules and double-submit are yours." },
          { t: "A null pointer in the CSS.", why: "CSS does not have null pointers. That is a made-up defect." },
          { t: "The form using the wrong shade of green.", why: "Colour is not an edge case. It is also out of scope." },
          { t: "Users who have never used a computer.", why: "Worth designing for, but it is not a checkable edge case until you name a behaviour." },
        ] },
      { slot: "Success criteria?",
        q: "Which Given / When / Then can a stranger run without calling you?",
        answer: "Given a filled form, when I click Request twice quickly, then exactly one booking is recorded and one confirmation shows.",
        opts: [
          { t: "Given a filled form, when I click Request twice quickly, then exactly one booking is recorded and one confirmation shows.", correct: true,
            whyOk: "A stranger can do that. That is the bar." },
          { t: "The form should feel more trustworthy.", why: "Feel is not checkable." },
          { t: "Given best practices, when we ship, then UX is improved.", why: "Three vague words in a trenchcoat." },
          { t: "The code should be clean and well commented.", why: "That is a review preference, not an acceptance criterion for the patient." },
        ] },
    ],
  };

  /* ---------------------------------------------------------------- *
   * Agent plan supervision (labelled simulation).
   * ---------------------------------------------------------------- */
  const AGENT_SIM = {
    requests: [
      { id: "vague", t: "Make booking better.",
        why: "This is the Slack message, not a request. The agent has to guess the feature, the files, and what \u201cbetter\u201d means. Whatever comes back, you cannot call it wrong \u2014 you never said what right was." },
      { id: "broad", t: "Refactor the whole booking system and add a confirmation. Use whatever libraries you think are best.",
        why: "You just authorised an unbounded diff plus dependency decisions you will never review. The one thing you actually wanted is a single clause inside a request that could rewrite the app." },
      { id: "good", correct: true,
        t: "In booking.js and index.html only: after a successful submit, render a confirmation in <main> and disable submit until the request settles. Given a filled form, when I click Request twice quickly, then exactly one appointment is recorded and one confirmation shows. Do not change styles.css, do not remove the existing required-field validation, do not add dependencies. Show me the plan before editing.",
        whyOk: "Named files, named behaviour, a Given/When/Then anyone can run, explicit do-nots, and a plan gate before a single line is edited." },
    ],
    plan: {
      interpretation: "You want duplicate booking submissions prevented and a confirmation shown. I will also modernise the booking flow while I am in there.",
      steps: [
        "Add a submitting flag in booking.js and disable the button while it is set.",
        "Render a confirmation paragraph into <main> after a successful submit.",
        "Replace the hand-rolled required-field checks with a validation library for consistency.",
        "Refresh the form styling in styles.css so the confirmation matches.",
        "Update auth.js so the booking session helper is shared.",
      ],
      files: [
        { p: "booking.js", ok: true, note: "In scope. You named it." },
        { p: "index.html", ok: true, note: "In scope. You named it." },
        { p: "styles.css", ok: false, note: "You explicitly excluded this file." },
        { p: "auth.js", ok: false, note: "Never mentioned in the ticket." },
        { p: "package.json", ok: false, note: "A new dependency you did not approve." },
      ],
      risk: "Low risk. Existing tests should still pass.",
      questions: ["Should the confirmation disappear after a few seconds?"],
    },
    flags: {
      label: "Flag every problem in that plan",
      intro: "Pick the real problems and leave the rest alone. Flagging everything is not review \u2014 two of these are not problems.",
      items: [
        { t: "It edits styles.css, which the request explicitly excluded.", bad: true,
          why: "A do-not in the request is a constraint. Ignoring it fails review before any code exists." },
        { t: "It edits auth.js, which the ticket never mentioned.", bad: true,
          why: "Unrequested blast radius. A booking ticket should not reach into authentication." },
        { t: "It replaces the existing required-field validation.", bad: true,
          why: "You said do not remove it. Swapping it for a library is removing it, with extra steps." },
        { t: "It adds a dependency you did not approve.", bad: true,
          why: "Dependencies are supply chain, licence, and bundle size. That is a decision, not an implementation detail." },
        { t: "It self-assesses the risk as \u201clow\u201d while touching auth and adding a library.", bad: true,
          why: "The agent's confidence is not evidence. A risk rating from the thing doing the work carries no weight." },
        { t: "It asked a clarifying question instead of just building.", bad: false,
          why: "Asking is good behaviour and that question is genuinely open. Do not punish it." },
        { t: "It uses a flag to disable the button while submitting.", bad: false,
          why: "That is a reasonable approach to the actual ticket. Not every step is a problem." },
      ],
    },
    revised: {
      interpretation: "Scope: booking.js and index.html. Prevent duplicate submits, show a confirmation in <main>. No style changes, no new dependencies, existing validation untouched.",
      steps: [
        "booking.js: add an isSubmitting guard; ignore submit while it is true.",
        "booking.js: on success clear the guard and call showConfirmation().",
        "booking.js: on failure clear the guard, show an error, show no confirmation.",
        "index.html: add an empty <p id=\"booking-confirmation\" role=\"status\"> inside <main>.",
        "Keep the existing required-field checks as the first thing submit does.",
      ],
      files: ["booking.js", "index.html"],
      risk: "If the request fails and the guard never resets, the button stays dead and nobody can book. I have handled the failure path \u2014 test it by blocking the network and submitting.",
      questions: ["Should the confirmation persist until the next submit, or clear after five seconds?"],
    },
  };

  function shuffle(arr) {
    const x = arr.slice();
    for (let i = x.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = x[i];
      x[i] = x[j];
      x[j] = t;
    }
    return x;
  }

  function esc(s) {
    return (global.CourseProgress && CourseProgress.escapeHtml)
      ? CourseProgress.escapeHtml(s)
      : String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
      });
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function inferLang(code) {
    const s = String(code || "");
    if (/^\s*</.test(s)) return "html";
    if (/\b(def |except:|import |None|True|False)\b/.test(s) || /#\s/.test(s) && /:\s*$/m.test(s)) return "python";
    if (/^\s*[.#@]/.test(s) || (/{\s*$/m.test(s) && /:\s*[^;\n]+;/m.test(s) && !/\b(function|const|let|return)\b/.test(s))) return "css";
    return "js";
  }

  function highlight(code, lang) {
    let out = esc(code);
    if (lang === "js" || lang === "python") {
      out = out.replace(/(&#39;[^&\n]*?&#39;|&quot;[^&\n]*?&quot;|`[^`\n]*?`)/g, '<span class="tk-str">$1</span>');
      out = out.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="tk-com">$1</span>');
      out = out.replace(/\b(function|return|const|let|var|if|else|for|while|new|try|catch|throw|async|await|class|def|import|from|True|False|None|null|undefined|true|false|except|pass)\b/g,
        '<span class="tk-kw">$1</span>');
      out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tk-num">$1</span>');
    } else if (lang === "html") {
      out = out.replace(/(&lt;\/?[a-zA-Z][\w-]*)/g, '<span class="tk-kw">$1</span>');
      out = out.replace(/([\w-]+)=(&quot;[^&]*?&quot;)/g, '<span class="tk-num">$1</span>=<span class="tk-str">$2</span>');
    } else if (lang === "css") {
      out = out.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tk-com">$1</span>');
      out = out.replace(/^(\s*)([-a-z]+)(\s*:)/gm, '$1<span class="tk-kw">$2</span>$3');
    }
    return out;
  }

  function codeBlockHtml(code, lang) {
    const lines = String(code || "").replace(/\s+$/, "").split("\n");
    const gutter = lines.map(function (_, i) { return i + 1; }).join("\n");
    const L = lang || inferLang(code);
    return '<div class="detcode"><pre class="detgutter" aria-hidden="true">' + gutter + "</pre>" +
      '<pre class="detsrc"><code>' + highlight(lines.join("\n"), L) + "</code></pre></div>";
  }

  function feedbackNode(cls) {
    const fb = el("div", cls ? "feedback " + cls : "feedback");
    fb.setAttribute("role", "status");
    fb.setAttribute("aria-live", "polite");
    return fb;
  }

  function showLearned(host, title, detail) {
    let node = host.querySelector(":scope > .learned");
    if (!node) {
      node = document.createElement("div");
      node.className = "learned";
      node.setAttribute("role", "status");
      host.appendChild(node);
    }
    node.innerHTML = '<b><span class="i i-check"></span> ' + esc(title) + "</b><p>" + esc(detail) + "</p>";
  }

  /* The cast, as a reusable card grid. Uses the existing whycare/whybox
     grid so this needs no new CSS. */
  function renderPeople(rootId) {
    const root = document.getElementById(rootId);
    if (!root) return;
    root.className = "whycare";
    root.innerHTML = PEOPLE.map(function (p) {
      return '<div class="whybox"><h4>' + esc(p.name) + "</h4><p><b>" + esc(p.role) +
        "</b><br>" + esc(p.note) + "</p></div>";
    }).join("");
  }

  /* Why-care grid. Accepts `without` (what you do unaided) or the older
     `after` key, so both generations of module page render correctly. */
  function renderWhy(rootId, spec) {
    const root = document.getElementById(rootId);
    if (!root || !spec) return;
    root.className = "whycare";
    const last = spec.without
      ? ["Without AI", spec.without]
      : ["After this", spec.after || ""];
    const cells = [
      ["You'll build", spec.build],
      ["Why it matters", spec.why],
      ["Where AI helps", spec.aiHelps],
      ["Where AI fails", spec.aiFails],
      last,
    ];
    root.innerHTML = cells.filter(function (c) { return c[1]; }).map(function (c) {
      return '<div class="whybox"><h4>' + esc(c[0]) + "</h4><p>" + esc(c[1]) + "</p></div>";
    }).join("");
  }

  /* Two-option request comparison. Order is shuffled, so the better
     request is not always first. */
  function renderRequestCompare(rootId, spec) {
    const root = document.getElementById(rootId);
    if (!root || !spec) return;
    const opts = spec.opts || [
      Object.assign({}, spec.bad, { correct: false }),
      Object.assign({}, spec.good, { correct: true, whyOk: spec.good && spec.good.why }),
    ];
    const existingLabel = root.querySelector(".ilbl");
    root.innerHTML = "";
    root.appendChild(existingLabel || el("div", "ilbl",
      spec.label || "Choose the better request \u00b7 labelled simulation"));
    const intro = spec.situation || spec.intro;
    if (intro) root.appendChild(el("p", null, intro));
    const row = el("div", "wf-row");
    const fb = feedbackNode();
    let solved = false;
    shuffle(opts).forEach(function (o) {
      const b = el("button", "wf-chip", o.t);
      b.type = "button";
      b.onclick = function () {
        if (solved) return;
        if (o.correct) {
          solved = true;
          b.classList.add("correct");
          row.querySelectorAll(".wf-chip").forEach(function (x) { if (x !== b) x.disabled = true; });
          fb.className = "feedback ok";
          fb.textContent = o.whyOk || o.why || "That is the reviewable request.";
          showLearned(root, spec.learnedTitle || "You just chose scope over speed.",
            spec.learnedNote || "The agent is equally willing to do either. The difference was your request.");
        } else {
          b.classList.add("incorrect");
          b.disabled = true;
          fb.className = "feedback bad";
          fb.textContent = (o.why || "Too wide to review.") + "  Try the other one.";
        }
      };
      row.appendChild(b);
    });
    root.appendChild(row);
    root.appendChild(fb);
  }

  /* Kept as the name the module pages call. */
  function renderWorkflowCompare(rootId, spec) {
    renderRequestCompare(rootId, spec || {
      situation: "A Northline Slack says: make the site. Which request should you send an agent?",
      opts: [
        { t: "Build me a website.",
          why: "You get 800 lines you cannot review. That is not pair programming." },
        { t: "Add a Book button in the header linking to #contact. Do not change CSS or hours. Show the diff.", correct: true,
          whyOk: "Small, constrained, reviewable. You still inspect, run, and test." },
      ],
    });
  }

  /* One detective case. A wrong pick is explained and can be retried. */
  function renderDetective(key, rootId) {
    const case_ = DETECTIVES[key];
    const root = document.getElementById(rootId);
    if (!case_ || !root) return;
    root.innerHTML = "";
    root.classList.add("detcase");
    root.appendChild(el("div", "ilbl", "AI Code Detective \u00b7 labelled simulation"));
    root.appendChild(el("div", "detbanner", "Potential issue detected"));
    root.appendChild(el("h3", "dtitle", case_.title));
    const codeHost = document.createElement("div");
    codeHost.innerHTML = codeBlockHtml(case_.code, case_.lang);
    if (codeHost.firstChild) root.appendChild(codeHost.firstChild);
    root.appendChild(el("p", "detask", case_.prompt || "What would you investigate first?"));
    const row = el("div", "detfindings");
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Investigation options");
    const fb = feedbackNode();
    let solved = false;
    shuffle(case_.opts).forEach(function (o) {
      const b = el("button", "qopt detopt", o.t);
      b.type = "button";
      b.onclick = function () {
        if (solved) return;
        row.querySelectorAll(".detopt").forEach(function (x) {
          x.classList.remove("chosen");
        });
        b.classList.add("chosen");
        if (o.correct) {
          solved = true;
          b.classList.add("correct");
          row.querySelectorAll(".detopt").forEach(function (x) { if (x !== b) x.disabled = true; });
          fb.className = "feedback ok detexplain";
          fb.textContent = (o.whyOk || "That is the defect.") +
            (case_.principle ? "  Principle: " + case_.principle : "");
          showLearned(root, "You reviewed agent output instead of trusting it.",
            case_.principle || "Do not merge because it renders.");
        } else {
          b.classList.add("incorrect");
          b.disabled = true;
          fb.className = "feedback bad detexplain";
          fb.textContent = (o.why || "Not the defect.") + "  Try again.";
        }
      };
      row.appendChild(b);
    });
    root.appendChild(row);
    root.appendChild(fb);
  }

  function renderDetectiveSet(keys, rootId) {
    const root = document.getElementById(rootId);
    if (!root) return;
    root.innerHTML = "";
    keys.forEach(function (key, i) {
      const box = el("div", "interactive detwrap");
      box.id = rootId + "_case" + i;
      box.style.padding = "0";
      box.style.background = "transparent";
      box.style.border = "0";
      box.style.boxShadow = "none";
      root.appendChild(box);
      renderDetective(key, box.id);
    });
  }

  /* Multi-select review drill. Flagging everything fails, which is the
     point: an indiscriminate reviewer is as useless as a credulous one. */
  function renderMultiFlag(rootId, spec) {
    const root = document.getElementById(rootId);
    if (!root || !spec) return;
    root.innerHTML = "";
    root.appendChild(el("div", "ilbl", spec.label || "Review drill"));
    if (spec.intro) root.appendChild(el("p", null, spec.intro));
    const list = el("div", "checklist");
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", spec.label || "Review drill");
    const items = shuffle(spec.items);
    items.forEach(function (item, i) {
      const id = rootId + "_f" + i;
      const label = el("label", "check");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = id;
      label.htmlFor = id;
      label.appendChild(cb);
      label.appendChild(el("span", null, item.t));
      list.appendChild(label);
    });
    root.appendChild(list);
    const btn = el("button", "primary", spec.cta || "Submit review");
    btn.type = "button";
    btn.style.marginTop = "14px";
    const fb = feedbackNode();
    btn.onclick = function () {
      const boxes = Array.prototype.slice.call(list.querySelectorAll("input[type=checkbox]"));
      const missed = [];
      const falseAlarm = [];
      boxes.forEach(function (cb, i) {
        if (items[i].bad && !cb.checked) missed.push(items[i]);
        if (!items[i].bad && cb.checked) falseAlarm.push(items[i]);
      });
      if (!missed.length && !falseAlarm.length) {
        fb.className = "feedback ok";
        fb.innerHTML = items.filter(function (x) { return x.bad; }).map(function (x) {
          return '<span class="i i-check"></span> ' + esc(x.t) + '<br><span class="fbhint">' + esc(x.why) + "</span>";
        }).join("<br><br>");
        if (spec.learned) showLearned(root, spec.learned[0], spec.learned[1]);
      } else {
        fb.className = "feedback bad";
        const parts = [];
        if (missed.length) parts.push(missed.length + " real problem" + (missed.length > 1 ? "s" : "") + " missed. Re-read the request's constraints and the file list.");
        if (falseAlarm.length) parts.push("Not a problem: " + falseAlarm[0].t + " \u2014 " + falseAlarm[0].why);
        fb.textContent = parts.join("  ");
      }
    };
    root.appendChild(btn);
    root.appendChild(fb);
  }

  /* Predict-before-you-run questions, answered without AI. */
  function renderPrediction(rootId, spec) {
    const root = document.getElementById(rootId);
    if (!root || !spec) return;
    root.innerHTML = "";
    root.appendChild(el("div", "ilbl", spec.label || "Predict first \u00b7 no AI, no running it"));
    if (spec.intro) root.appendChild(el("p", null, spec.intro));
    if (spec.code) root.appendChild(el("pre", null, spec.code));
    const counter = el("p", "mut trailcount", "0 of " + spec.questions.length + " answered");
    counter.setAttribute("role", "status");
    root.appendChild(counter);
    let solved = 0;
    spec.questions.forEach(function (q) {
      const card = el("div", "qcard");
      card.appendChild(el("div", "qtext", q.q));
      const row = el("div", "wf-row");
      const fb = feedbackNode();
      let done = false;
      shuffle(q.opts).forEach(function (o) {
        const b = el("button", "wf-chip", o.t);
        b.type = "button";
        b.onclick = function () {
          if (done) return;
          if (o.correct) {
            done = true;
            solved += 1;
            counter.textContent = solved + " of " + spec.questions.length + " answered";
            b.classList.add("correct");
            row.querySelectorAll(".wf-chip").forEach(function (x) { if (x !== b) x.disabled = true; });
            fb.className = "feedback ok";
            fb.textContent = o.whyOk || "Correct.";
            if (solved === spec.questions.length && spec.learned) {
              showLearned(root, spec.learned[0], spec.learned[1]);
            }
          } else {
            b.classList.add("incorrect");
            b.disabled = true;
            fb.className = "feedback bad";
            fb.textContent = (o.why || "Not that one.") + "  Try again.";
          }
        };
        row.appendChild(b);
      });
      card.appendChild(row);
      card.appendChild(fb);
      root.appendChild(card);
    });
  }

  /* Progressive requirement interview: one slot at a time, building a
     visible specification draft. */
  function renderBreakdown(rootId, spec) {
    const root = document.getElementById(rootId);
    if (!root || !spec) return;
    root.innerHTML = "";
    root.appendChild(el("div", "ilbl", "Ticket breakdown \u00b7 you interview the stakeholder"));
    const req = el("div", "def");
    req.appendChild(el("div", "k", spec.who || "Stakeholder request"));
    req.appendChild(el("p", null, "\u201c" + spec.request + "\u201d"));
    root.appendChild(req);
    const stage = el("div", "bd-stage");
    root.appendChild(stage);
    const draft = el("div", "specdraft");
    const draftHead = el("div", "k", "Specification draft \u00b7 0 of " + spec.steps.length);
    draft.appendChild(draftHead);
    const draftList = el("dl", "draftlist");
    draft.setAttribute("aria-live", "polite");
    draft.appendChild(draftList);
    root.appendChild(draft);
    let i = 0;
    function step() {
      stage.innerHTML = "";
      if (i >= spec.steps.length) {
        stage.appendChild(el("p", "mut", "Every slot is filled. That is a specification, not a wish."));
        showLearned(root, "You turned one vague sentence into a testable specification.",
          "Seven questions, no code. This is the step people skip before blaming the agent for guessing.");
        return;
      }
      const s = spec.steps[i];
      const card = el("div", "qcard");
      card.appendChild(el("div", "qn", "Slot " + (i + 1) + " of " + spec.steps.length + " \u00b7 " + s.slot));
      card.appendChild(el("div", "qtext", s.q));
      const row = el("div", "wf-row");
      const fb = feedbackNode();
      let done = false;
      shuffle(s.opts).forEach(function (o) {
        const b = el("button", "wf-chip", o.t);
        b.type = "button";
        b.onclick = function () {
          if (done) return;
          if (o.correct) {
            done = true;
            b.classList.add("correct");
            row.querySelectorAll(".wf-chip").forEach(function (x) { if (x !== b) x.disabled = true; });
            fb.className = "feedback ok";
            fb.textContent = (o.whyOk || "Good question.") + "  \u2192 " + s.answer;
            draftList.appendChild(el("dt", null, s.slot));
            draftList.appendChild(el("dd", null, s.answer));
            i += 1;
            draftHead.textContent = "Specification draft \u00b7 " + i + " of " + spec.steps.length;
            const nextBtn = el("button", "primary", i >= spec.steps.length ? "Finish the spec" : "Next slot");
            nextBtn.type = "button";
            nextBtn.style.marginTop = "14px";
            nextBtn.onclick = function () {
              step();
              const focusable = stage.querySelector(".wf-chip");
              if (focusable) focusable.focus();
            };
            card.appendChild(nextBtn);
            nextBtn.focus();
          } else {
            b.classList.add("incorrect");
            b.disabled = true;
            fb.className = "feedback bad";
            fb.textContent = (o.why || "Not the most useful question.") + "  Try again.";
          }
        };
        row.appendChild(b);
      });
      card.appendChild(row);
      card.appendChild(fb);
      stage.appendChild(card);
    }
    step();
  }

  /* Agent plan supervision: request -> plan -> approve/reject -> name the
     problems -> narrowed plan. Canned responses, labelled as such. */
  function renderAgentSim(rootId, sim) {
    const root = document.getElementById(rootId);
    if (!root || !sim) return;
    root.innerHTML = "";
    root.appendChild(el("div", "ilbl",
      "AI coding agent simulation \u00b7 canned responses \u00b7 no agent runs in this tab"));
    root.appendChild(el("p", null, "Step 1. You have the spec. Which request do you actually send?"));
    const stage1 = el("div");
    const stage2 = el("div");
    const stage3 = el("div");
    const stage4 = el("div");
    [stage1, stage2, stage3, stage4].forEach(function (s) { root.appendChild(s); });

    function planCard(p, title) {
      const card = el("div", "plancard");
      card.appendChild(el("div", "k", title || "Agent response \u00b7 plan only, nothing edited yet"));
      const dl = el("dl", "draftlist");
      function add(label, node) {
        dl.appendChild(el("dt", null, label));
        const dd = el("dd");
        dd.appendChild(node);
        dl.appendChild(dd);
      }
      add("Interpretation", el("span", null, p.interpretation));
      const ol = el("ol");
      p.steps.forEach(function (s) { ol.appendChild(el("li", null, s)); });
      add("Implementation plan", ol);
      const ul = el("ul", "filelist");
      p.files.forEach(function (f) {
        if (typeof f === "string") { ul.appendChild(el("li", "mono fok", f)); return; }
        const li = el("li", "mono " + (f.ok ? "fok" : "fbad"));
        li.textContent = f.p + " \u2014 " + f.note;
        ul.appendChild(li);
      });
      add("Files it intends to change", ul);
      add("Risk it reports", el("span", null, p.risk));
      const qs = el("ul");
      (p.questions || []).forEach(function (q) { qs.appendChild(el("li", null, q)); });
      add("Questions it asked", qs);
      card.appendChild(dl);
      return card;
    }

    const row = el("div", "wf-row");
    const fb1 = feedbackNode();
    let sent = false;
    shuffle(sim.requests).forEach(function (o) {
      const b = el("button", "wf-chip", o.t);
      b.type = "button";
      b.onclick = function () {
        if (sent) return;
        if (o.correct) {
          sent = true;
          b.classList.add("correct");
          row.querySelectorAll(".wf-chip").forEach(function (x) { if (x !== b) x.disabled = true; });
          fb1.className = "feedback ok";
          fb1.textContent = o.whyOk;
          showPlan();
        } else {
          b.classList.add("incorrect");
          b.disabled = true;
          fb1.className = "feedback bad";
          fb1.textContent = o.why + "  Try again.";
        }
      };
      row.appendChild(b);
    });
    stage1.appendChild(row);
    stage1.appendChild(fb1);

    function showPlan() {
      stage2.innerHTML = "";
      stage2.appendChild(el("p", null,
        "Step 2. It replies with a plan before editing anything. Read it as a reviewer."));
      stage2.appendChild(planCard(sim.plan));
      const decide = el("div", "wf-row");
      const fb2 = feedbackNode();
      let decided = false;
      shuffle([
        { t: "Approve the plan. It does address the ticket.",
          why: "It also edits a file you excluded, reaches into auth, swaps out your validation, and adds a dependency. Approving this is how a two-file ticket becomes an incident." },
        { t: "Reject the plan and ask for a narrower one.", correct: true,
          whyOk: "Rejecting a plan costs a minute. Rejecting a 400-line diff costs an afternoon \u2014 and by then you are invested enough to talk yourself into it." },
        { t: "Approve it now and review the diff carefully afterwards.",
          why: "The diff is the expensive place to find scope creep. The plan is free to change. Review at the cheapest point." },
      ]).forEach(function (o) {
        const b = el("button", "wf-chip", o.t);
        b.type = "button";
        b.onclick = function () {
          if (decided) return;
          if (o.correct) {
            decided = true;
            b.classList.add("correct");
            decide.querySelectorAll(".wf-chip").forEach(function (x) { if (x !== b) x.disabled = true; });
            fb2.className = "feedback ok";
            fb2.textContent = o.whyOk;
            showFlags();
          } else {
            b.classList.add("incorrect");
            b.disabled = true;
            fb2.className = "feedback bad";
            fb2.textContent = o.why + "  Try again.";
          }
        };
        decide.appendChild(b);
      });
      stage2.appendChild(decide);
      stage2.appendChild(fb2);
    }

    function showFlags() {
      stage3.innerHTML = "";
      stage3.appendChild(el("p", null,
        "Step 3. \u201cIt felt wrong\u201d is not a review comment. Name the problems."));
      const host = el("div", "interactive");
      host.id = rootId + "_flags";
      stage3.appendChild(host);
      renderMultiFlag(host.id, Object.assign({}, sim.flags, {
        learned: ["You supervised an agent at the cheapest possible moment.",
          "You reviewed intent, not output. No code existed yet, so nothing had to be un-merged."],
      }));
      const btn = el("button", "primary", "Send the narrowed request");
      btn.type = "button";
      btn.style.marginTop = "16px";
      btn.onclick = function () { btn.disabled = true; showRevised(); };
      stage3.appendChild(btn);
    }

    function showRevised() {
      stage4.innerHTML = "";
      stage4.appendChild(el("p", null,
        "Step 4. Same agent, same model, narrower request. This is what supervision buys."));
      stage4.appendChild(planCard(sim.revised, "Revised agent plan \u00b7 simulation"));
      showLearned(stage4, "You practised scope control.",
        "The agent did not get smarter. Your request got specific \u2014 and notice its risk note stopped being a reassurance and became a thing you can test.");
    }
  }

  /* Short written justification. Keyword and length checks, saved in extra. */
  function renderExplain(rootId, spec) {
    const root = document.getElementById(rootId);
    if (!root || !spec) return;
    root.innerHTML = "";
    root.appendChild(el("div", "ilbl", spec.label || "Explain your fix \u00b7 tracked, not gated"));
    if (spec.intro) root.appendChild(el("p", null, spec.intro));
    const ta = document.createElement("textarea");
    ta.id = rootId + "_ta";
    ta.spellcheck = false;
    ta.style.marginTop = "12px";
    ta.setAttribute("aria-label", spec.aria || "Explain why your fix works");
    const saved = global.CourseProgress && CourseProgress.getExtra(spec.storeKey);
    if (saved && saved.text) ta.value = saved.text;
    root.appendChild(ta);
    const btn = el("button", "primary", spec.cta || "Save my explanation");
    btn.type = "button";
    btn.style.marginTop = "10px";
    const fb = feedbackNode();
    btn.onclick = function () {
      const t = ta.value.trim();
      const min = spec.minLength || 100;
      const checks = [{ name: "at least " + min + " characters", pass: t.length >= min }];
      (spec.mustMention || []).forEach(function (m) {
        checks.push({
          name: m.name,
          pass: m.any.some(function (w) { return new RegExp(w, "i").test(t); }),
        });
      });
      const ok = checks.every(function (c) { return c.pass; });
      fb.className = "feedback " + (ok ? "ok" : "bad");
      fb.innerHTML = checks.map(function (c) {
        return '<span class="i ' + (c.pass ? "i-check" : "i-x") + '"></span> ' + esc(c.name);
      }).join("<br>");
      if (ok) {
        if (global.CourseProgress) {
          CourseProgress.setExtra(spec.storeKey, { text: t, savedAt: new Date().toISOString() });
        }
        if (spec.learned) showLearned(root, spec.learned[0], spec.learned[1]);
      }
    };
    root.appendChild(btn);
    root.appendChild(fb);
  }

  /* Merge / request changes / reject. */
  function renderReviewDecision(rootId, spec) {
    const root = document.getElementById(rootId);
    if (!root || !spec) return;
    root.innerHTML = "";
    root.appendChild(el("div", "ilbl", spec.label || "Would you merge this? \u00b7 labelled simulation"));
    if (spec.intro) root.appendChild(el("p", null, spec.intro));
    if (spec.code) root.appendChild(el("pre", null, spec.code));
    const row = el("div", "wf-row");
    const fb = feedbackNode();
    let done = false;
    shuffle(spec.opts).forEach(function (o) {
      const b = el("button", "wf-chip", o.t);
      b.type = "button";
      b.onclick = function () {
        if (done) return;
        if (o.correct) {
          done = true;
          b.classList.add("correct");
          row.querySelectorAll(".wf-chip").forEach(function (x) { if (x !== b) x.disabled = true; });
          fb.className = "feedback ok";
          fb.textContent = o.whyOk;
          if (spec.learned) showLearned(root, spec.learned[0], spec.learned[1]);
        } else {
          b.classList.add("incorrect");
          b.disabled = true;
          fb.className = "feedback bad";
          fb.textContent = (o.why || "Not that.") + "  Try again.";
        }
      };
      row.appendChild(b);
    });
    root.appendChild(row);
    root.appendChild(fb);
  }

  /* Ticket board, driven by CourseProgress so there is one source of truth
     for the ticket list, the module files, and the gates. */
  function renderBoard(rootId) {
    const host = document.getElementById(rootId);
    if (!host || !global.CourseProgress) return;
    host.innerHTML = "";
    CourseProgress.MODULES.forEach(function (m) {
      const t = CourseProgress.ticketFor(m.id);
      if (!t) return;
      const unlocked = CourseProgress.isUnlocked(m.id);
      const done = CourseProgress.isModuleComplete(m.id);
      const card = document.createElement(unlocked ? "a" : "div");
      if (unlocked) card.href = m.file;
      card.className = "ticketcard pri-" + (t.priority || "medium").toLowerCase() +
        (done ? " done" : "") + (unlocked ? "" : " locked");
      const status = done ? "done" : unlocked ? "open" : "locked";
      const statusLabel = done ? "Done" : unlocked ? "Open" : "Locked";
      const pri = (t.priority || "Medium").toLowerCase();
      const prev = !unlocked ? CourseProgress.MODULES.find(function (x) { return x.id === m.id - 1; }) : null;
      const prevT = prev ? CourseProgress.ticketFor(prev.id) : null;
      card.innerHTML =
        '<div class="tkhead">' +
          '<span class="tkorg"><span class="tkdot" aria-hidden="true"></span>' + esc(t.org || "Northline Digital") + "</span>" +
          '<span class="tkstatus ' + status + '">' + statusLabel + "</span>" +
        "</div>" +
        '<div class="ticketid">' + esc(t.id) + "</div>" +
        "<h3>" + esc(t.title) + "</h3>" +
        '<div class="tkmeta">' +
          '<div><span>Priority</span><b class="pri-' + esc(pri) + '">' + esc(t.priority || "Medium") + "</b></div>" +
          "<div><span>Type</span><b>" + esc(t.kind || "Engineering") + "</b></div>" +
          "<div><span>Estimate</span><b>~" + m.minutes + " min</b></div>" +
        "</div>" +
        '<p class="tkquote">\u201c' + esc(t.quote) + '\u201d</p>' +
        '<p class="tkfrom">\u2014 ' + esc(t.from) + "</p>" +
        '<span class="fmt">Module ' + m.id + " \u00b7 " + esc(m.title) + "</span>" +
        (unlocked
          ? '<div class="tkcta"><span class="primary" style="pointer-events:none">' +
            (done ? "Review ticket" : "Start ticket") + "</span></div>"
          : '<div class="tkcta lockedcta">' +
              '<div class="modlock-lbl">Ticket locked</div>' +
              "<p>Complete " + esc(prevT ? prevT.id : "the previous ticket") + " first.</p>" +
              (prev ? '<a href="' + prev.file + '">View previous ticket</a>' : "") +
            "</div>");
      host.appendChild(card);
    });
  }

  global.Northline = {
    COMPANY, PEOPLE, DETECTIVES, AGENT_SIM, BREAKDOWN_BOOKING, shuffle,
    renderPeople, renderWhy,
    renderWorkflowCompare, renderRequestCompare,
    renderDetective, renderDetectiveSet,
    renderMultiFlag, renderPrediction, renderBreakdown,
    renderAgentSim, renderExplain, renderReviewDecision,
    renderBoard, showLearned,
  };
})(window);
