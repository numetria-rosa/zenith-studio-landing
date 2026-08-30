/* Checkpoint and Quiz Center banks for AI-Assisted Software Engineering. */
(function (global) {
  function q(id, text, opts) { return { id, text, opts }; }
  function o(t, correct, why) { return { t, correct: !!correct, why: why || "" }; }

  const MODULE_QUIZZES = {
    1: [
      q("m1q1", "A browser shows a page because it received which of these?", [
        o("An HTML document it can parse into a tree of elements.", true, "The browser builds a document from markup."),
        o("A screenshot the server drew.", false, "The browser draws from markup, not a picture."),
        o("A Cursor chat transcript.", false, "Chat is not a page."),
      ]),
      q("m1q2", "Which tag is the right landmark for the unique content of a page?", [
        o("<main>", true, "One main per page."),
        o("<div class='content'> only", false, "A class is not a landmark."),
        o("<blink>", false, "Not a landmark."),
      ]),
      q("m1q3", "A 404 means:", [
        o("The server could not find that URL.", true, "The path did not match a file or route."),
        o("Your CSS is ugly.", false, "404 is routing, not taste."),
        o("JavaScript refused to run.", false, "That is a console error, not 404."),
      ]),
      q("m1q4", "Why write HTML by hand before using a coding agent?", [
        o("So you can tell when the agent omitted a heading, a form label, or a landmark.", true, "You cannot review what you cannot read."),
        o("Because agents cannot output HTML.", false, "They can. That is the problem."),
        o("HTML is only for print.", false, "It is for the browser."),
      ]),
      q("m1q5", "A link that says 'click here' is weak because:", [
        o("The purpose is not in the link text, so a skim or a screen reader loses the destination.", true, "Name the destination."),
        o("Browsers forbid those words.", false, "They allow them. People should not."),
        o("Agents cannot follow them.", false, "They can. Humans still suffer."),
      ]),
    ],
    2: [
      q("m2q1", "CSS is for:", [
        o("Layout, spacing, and hierarchy on markup that already exists.", true, "It does not invent missing HTML."),
        o("Replacing HTML so you never write tags.", false, "No."),
        o("Deploying to GitHub.", false, "Wrong layer."),
      ]),
      q("m2q2", "margin vs padding:", [
        o("Padding is inside the box; margin is the gap outside it.", true, "Box model."),
        o("They are the same property.", false, "They are not."),
        o("Margin is only for images.", false, "No."),
      ]),
      q("m2q3", "A media query is for:", [
        o("Changing rules when the viewport crosses a breakpoint.", true, "Responsive layout."),
        o("Calling an API.", false, "That is JavaScript."),
        o("Hiding Git history.", false, "No."),
      ]),
      q("m2q4", "display: flex on a parent:", [
        o("Lays out its children on one axis you control.", true, "Flex is a parent behavior."),
        o("Makes the page a Git repo.", false, "No."),
        o("Deletes margins.", false, "It does not."),
      ]),
      q("m2q5", "If the agent 'makes it pretty' but the spec said 24px gap and you see 8px:", [
        o("Reject or restyle. Pretty is not the spec.", true, "You are paid for the spec."),
        o("Ship it. Taste wins.", false, "The brief wins."),
        o("Delete CSS entirely.", false, "Fix the rule."),
      ]),
    ],
    3: [
      q("m3q1", "A function is:", [
        o("A named piece of code you can call with arguments and get a return value.", true, "That is the unit you will read in agent output."),
        o("A Git commit.", false, "Different tool."),
        o("A CSS class.", false, "No."),
      ]),
      q("m3q2", "document.querySelector('#save') looks for:", [
        o("The first element whose id is save.", true, "CSS selector syntax in the DOM."),
        o("A file named save on disk.", false, "That is the filesystem."),
        o("A GitHub user.", false, "No."),
      ]),
      q("m3q3", "An event listener is for:", [
        o("Running your function when the user (or the page) does something.", true, "click, submit, input."),
        o("Deploying CSS.", false, "No."),
        o("Skipping tests.", false, "No."),
      ]),
      q("m3q4", "Why write JavaScript by hand in this module?", [
        o("If you cannot write a 10-line function, you cannot tell when the agent invented an API.", true, "Literacy gate."),
        o("Because Cursor is banned forever after this.", false, "You use it later, after you can read."),
        o("JavaScript cannot be generated.", false, "It can."),
      ]),
      q("m3q5", "const vs a missing declaration:", [
        o("An undeclared assignment becomes a global leak or a ReferenceError in strict mode.", true, "Name your bindings."),
        o("They are identical.", false, "They are not."),
        o("const is only for CSS.", false, "No."),
      ]),
    ],
    4: [
      q("m4q1", "A good acceptance criterion is:", [
        o("Observable: a stranger can check pass/fail without asking you.", true, "Given / when / then, or a concrete check."),
        o("'Make it nice.'", false, "Not testable."),
        o("'Use AI.'", false, "A tool is not a criterion."),
      ]),
      q("m4q2", "The in-browser spec tasks on this course are:", [
        o("Labeled simulations. They do not run Cursor.", true, "Desktop Lab A is the real evidence."),
        o("A real coding agent in the page.", false, "There is no in-page agent."),
        o("Enough to skip Desktop Labs.", false, "Labs are required."),
      ]),
      q("m4q3", "You should @-mention a file when:", [
        o("The change must stay inside that file or you need the agent to read it first.", true, "Scope the edit."),
        o("You want a longer essay.", false, "Mentioning is for context, not length."),
        o("Git is broken.", false, "Wrong tool."),
      ]),
      q("m4q4", "The correct first response to a confident, wrong agent diff is:", [
        o("Say no, name the failing check, and ask for a smaller patch.", true, "You own the ship."),
        o("Merge because it compiled.", false, "Compile is not review."),
        o("Delete the repo.", false, "Disproportionate."),
      ]),
      q("m4q5", "Who is accountable when agent-written code breaks production?", [
        o("You. You opened the PR.", true, "The agent is not the employee."),
        o("The model vendor, automatically.", false, "They did not ship your app."),
        o("Nobody, if tests are green theater.", false, "Still you."),
      ]),
    ],
    5: [
      q("m5q1", "A commit should be:", [
        o("One idea you could revert without taking down unrelated work.", true, "Atomic-ish history."),
        o("The entire weekend in one blob named 'updates'.", false, "Unreviewable."),
        o("Only README edits, never code.", false, "No."),
      ]),
      q("m5q2", "A pull request is:", [
        o("A proposal to merge a branch, with a diff someone can review.", true, "GitHub's unit of review."),
        o("A Cursor chat export.", false, "Chat is not a PR."),
        o("A live URL.", false, "That is deploy."),
      ]),
      q("m5q3", "A red line starting with - in a diff means:", [
        o("That line is removed in the new version.", true, "Minus is deletion."),
        o("The test passed.", false, "No."),
        o("Git created a new repo.", false, "No."),
      ]),
      q("m5q4", "This course's Git practice library is:", [
        o("A labeled simulation. Lab B needs a real repo you own.", true, "Honesty bar."),
        o("A hidden GitHub account we create for you.", false, "We do not."),
        o("Optional if you used Cursor.", false, "Both labs are required."),
      ]),
      q("m5q5", "main vs a feature branch:", [
        o("You do the work on a branch so main stays shippable.", true, "Isolation."),
        o("They are the same pointer always.", false, "Not if you branch."),
        o("Branches replace commits.", false, "Branches point at commits."),
      ]),
    ],
    6: [
      q("m6q1", "A useful test:", [
        o("Fails when the behavior you care about is wrong.", true, "Otherwise it is theater."),
        o("Always asserts true === true.", false, "That never fails."),
        o("Only exists in the README.", false, "Not a test."),
      ]),
      q("m6q2", "The agent says 'it works' but the console shows TypeError. You:", [
        o("Believe the console. Fix or reject until the error is gone.", true, "Runtime beats vibes."),
        o("Close the console. The model is nicer.", false, "No."),
        o("Delete tests that mention the error.", false, "Worse."),
      ]),
      q("m6q3", "A mutation test mindset means:", [
        o("You check that a planted bug makes the test fail.", true, "Otherwise the test is weak."),
        o("You randomly edit production at 2am.", false, "That is an incident."),
        o("You skip assertions.", false, "Opposite."),
      ]),
      q("m6q4", "console.log is for:", [
        o("Inspecting values while you hunt a bug. It is not a test suite.", true, "Temporary eyes."),
        o("Proving the feature to a reviewer instead of a test.", false, "Logs are not evidence of correctness."),
        o("Deploying CSS.", false, "No."),
      ]),
      q("m6q5", "Why write the failing test yourself in this module?", [
        o("If you cannot name the bug, you will accept an agent test that asserts nothing.", true, "Literacy for QA."),
        o("Tests cannot be generated.", false, "They can, badly."),
        o("Git forbids agent tests.", false, "Git does not care."),
      ]),
    ],
    7: [
      q("m7q1", "A multi-file feature should start with:", [
        o("A spec that names the files, the user-visible change, and a test.", true, "Then implement."),
        o("Asking the agent to 'do the website'.", false, "Unbounded."),
        o("Pushing straight to main with no branch.", false, "Skip the process and you skip the evidence."),
      ]),
      q("m7q2", "This module grades:", [
        o("Your spec and your test, not a fake in-browser IDE.", true, "Desktop is where Cursor runs."),
        o("Whether we secretly ran Cursor for you.", false, "We did not."),
        o("Font choice.", false, "No."),
      ]),
      q("m7q3", "If the agent edits a third file you did not mention:", [
        o("Treat it as scope creep. Revert or demand a reason.", true, "Review the whole diff."),
        o("Always keep bonus files.", false, "Unrequested risk."),
        o("Delete Git.", false, "No."),
      ]),
      q("m7q4", "localStorage in a small web app is:", [
        o("Browser storage on that origin. It is not a database and it is not a backup.", true, "Know the limit."),
        o("A GitHub repo.", false, "No."),
        o("A Python virtualenv.", false, "No."),
      ]),
      q("m7q5", "The review note you keep should include:", [
        o("What you rejected and what you ran to verify.", true, "Future you, and a hiring manager, can read it."),
        o("Only 'lgtm'.", false, "Not a review."),
        o("The model's hidden chain of thought.", false, "You do not have that, and it is not evidence."),
      ]),
    ],
    8: [
      q("m8q1", "This module's Python is for:", [
        o("Small scripts: files, functions, JSON, a CLI. Not RAG or agents.", true, "That is AI Engineering."),
        o("Training a model from scratch.", false, "Out of scope."),
        o("Replacing HTML.", false, "No."),
      ]),
      q("m8q2", "json.loads is for:", [
        o("Turning a JSON string into Python lists and dicts.", true, "The inverse is dumps."),
        o("Starting Cursor.", false, "No."),
        o("Opening a PR.", false, "No."),
      ]),
      q("m8q3", "A CLI script should:", [
        o("Read arguments or stdin, write a clear result or a nonzero exit on bad input.", true, "Scripts are tools."),
        o("Launch a website automatically.", false, "Not required here."),
        o("Skip functions and live in one 400-line blob only.", false, "Functions still help."),
      ]),
      q("m8q4", "Why practice Python in the browser here?", [
        o("Pyodide runs your function against hidden cases, like the JS library.", true, "Real grader."),
        o("It trains an LLM in your tab.", false, "It does not."),
        o("It pushes to GitHub for you.", false, "It does not."),
      ]),
      q("m8q5", "After this course, AI Engineering is:", [
        o("An optional follow-on if you want to build LLM products (RAG, tools, eval).", true, "Different job."),
        o("The same course with a new title.", false, "It is not."),
        o("Required to pass Module 9.", false, "Capstone is a web app you ship."),
      ]),
    ],
  };

  const CENTER_EXTRA = [
    q("x1", "Pick-one Desktop Lab (Cursor or Git only) is enough for this course.", [
      o("False. You need both Lab A and Lab B.", true, "Unlike Data Science's Tableau-or-Power-BI."),
      o("True. One tool is plenty.", false, "Both are required."),
    ]),
    q("x2", "A live https URL in the capstone proves:", [
      o("Someone can open the app without cloning, plus you still need the repo and tests.", true, "Deploy is one rubric line."),
      o("You are a staff engineer.", false, "No."),
      o("Git is optional.", false, "Git is required."),
    ]),
    q("x3", "In-browser Cursor practice in this course:", [
      o("Does not exist as a real agent. Anything labeled simulation is judgment only.", true, "Integrity rule."),
      o("Runs a hidden copy of Cursor in the tab.", false, "It does not."),
    ]),
    q("x4", "An 80-character lab write-up exists to:", [
      o("Force a specific memory of what you changed and how you checked it.", true, "A URL alone is cheap."),
      o("Satisfy a word-count fetish.", false, "It is an honesty check."),
    ]),
    q("x5", "semantic HTML helps because:", [
      o("Landmarks and labels survive CSS restyles and help assistive tech.", true, "Structure first."),
      o("It makes Git faster.", false, "No."),
    ]),
    q("x6", "A branch named 'ai-did-this' with one 4,000-line commit is a smell because:", [
      o("No one can review or revert a slice of it.", true, "Split the work."),
      o("GitHub forbids long commits.", false, "It allows them. Reviewers suffer."),
    ]),
    q("x7", "You paste a GitHub commit URL that is actually a gist. The lab:", [
      o("Should reject it. Host and path must be github.com/.../commit/...", true, "Allowlist."),
      o("Should accept any https link.", false, "Too loose."),
    ]),
    q("x8", "JavaScript undefined vs null in a return value:", [
      o("Tests that use JSON.stringify treat them differently from a missing key. Be explicit.", true, "Match the contract."),
      o("They are the same in every test harness.", false, "Not reliably."),
    ]),
    q("x9", "The capstone unlocks when:", [
      o("Module 8 is complete, you passed 3+ tasks in two of HTML/CSS/JS, and both Desktop Labs are done.", true, "Hard gate."),
      o("You finish Module 1.", false, "Far too early."),
    ]),
    q("x10", "Career page honesty includes:", [
      o("Gaps: algorithms at CS-degree depth, systems design, incident ownership, team process.", true, "We list them."),
      o("A guaranteed junior offer.", false, "We do not promise jobs."),
    ]),
  ];

  global.AISEQuizData = { MODULE_QUIZZES, CENTER_EXTRA };
})(window);
