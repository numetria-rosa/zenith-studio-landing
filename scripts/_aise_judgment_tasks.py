# -*- coding: utf-8 -*-
"""Judgment practice libraries: specs, git commands, AI PR review, detective.

These four were multiple choice. Recognising the good acceptance criterion
out of three options is not the skill the job needs -- writing one from
nothing is. So each of these now makes the student produce the real artefact
and grades the artefact.

`checks` values are raw JavaScript source strings emitted verbatim into
practice-tasks.js, matching how the html/css libraries already work.
"""
import json


def _checks(items):
    """items: list of (name, hint, js_predicate_source)."""
    parts = []
    for name, hint, test in items:
        parts.append("{ name: %s, hint: %s, test: %s }" % (json.dumps(name), json.dumps(hint), test))
    return "[" + ", ".join(parts) + "]"


# --------------------------------------------------------------- specs (spec-)
# The student writes acceptance criteria, user stories, constraints and scope
# lines. Graders refuse the shapes that are definitely not requirements.

GWT = "s => /given[\\s\\S]{5,}?when[\\s\\S]{5,}?then/i.test(s)"
CONCRETE = ("s => /(\\d|empty|blank|disabled|error|message|required|invalid|\"|'"
            "|Saturday|email|null|undefined)/i.test(s)")
NO_VIBES = ("s => !/\\b(polished|beautiful|intuitive|modern|clean|nice|better|"
            "seamless|delightful|pop|slick|user-friendly)\\b/i.test(s)")


def _spec(tid, level, title, prompt, starter, items, skill="specs-criteria"):
    return {
        "id": tid, "skill": skill, "tool": "specs", "level": level, "kind": "spec",
        "title": title, "prompt": prompt, "starter": starter,
        "checks": _checks(items), "prerequisite": "[]",
    }


SPEC_TASKS = [
    _spec("spec-01", "guided", "One testable criterion",
          "Dan says \u201cthe email field should validate properly\u201d. Write ONE acceptance criterion for it "
          "in Given / When / Then form. It must name the exact message the user sees.",
          "Given ...\nWhen ...\nThen ...",
          [("uses Given / When / Then", "All three words, in that order, with something between them.", GWT),
           ("names a concrete value or message", "Quote the exact text the user sees, or name the exact input.", CONCRETE),
           ("no vibe words", "Strike words like polished, intuitive, clean. None of them are checkable.", NO_VIBES),
           ("long enough to be a criterion", "Under 60 characters is a fragment, not a criterion.", "s => s.trim().length >= 60")]),

    _spec("spec-02", "guided", "A user story with a reason",
          "Write one user story for the appointment filter in \u201cAs a \u2026 I want \u2026 so that \u2026\u201d form. "
          "The \u201cso that\u201d is the part that stops you building the wrong thing, so make it real.",
          "As a ...\nI want ...\nso that ...",
          [("has a role, a want and a reason", "All three clauses: As a / I want / so that.",
            "s => /as an?\\b[\\s\\S]{3,}?i want\\b[\\s\\S]{3,}?so that\\b/i.test(s)"),
           ("the role is a person, not \u201cuser\u201d", "Name who: a receptionist, a patient, a clinician. \u201cAs a user\u201d tells you nothing.",
            "s => !/as a (user|person|someone)\\b/i.test(s)"),
           ("the reason is not a restatement of the want",
            "\u201cso that I can filter\u201d just repeats the want. Say what it lets them achieve.",
            "s => !/so that (i can )?(filter|see the filter|use the filter)\\s*\\.?\\s*$/i.test(s.trim())")]),

    _spec("spec-03", "guided", "Three edge cases", 
          "Ticket: a search box over the clinic list. List THREE edge cases, one per line. "
          "The happy path is the easy half; these are the other half.",
          "1.\n2.\n3.",
          [("three or more lines of real substance", "One per line, at least 12 characters each.",
            "s => s.split('\\n').map(l => l.trim()).filter(l => l.length >= 12).length >= 3"),
           ("covers an empty or no-result state", "What does the user see when nothing matches?",
            "s => /(empty|no result|nothing|blank|none|zero|no match)/i.test(s)"),
           ("covers a failure or an unusual input", "Slow network, weird characters, very long input, duplicate names.",
            "s => /(slow|offline|fail|error|long|special|duplicate|case|space|apostrophe|unicode|paste)/i.test(s)")]),

    _spec("spec-04", "guided", "What you are NOT doing",
          "Dan asks you to \u201cmake the booking system better\u201d. Before writing any code, write the "
          "out-of-scope list: at least three things you are deliberately not doing in this ticket.",
          "Out of scope for this ticket:\n- \n- \n- ",
          [("three or more out-of-scope items", "One per line, at least 12 characters each.",
            "s => s.split('\\n').map(l => l.trim().replace(/^[-*\\d.\\s]+/, '')).filter(l => l.length >= 12).length >= 3"),
           ("phrased as exclusions", "Use \u201cnot\u201d, \u201cno\u201d, \u201clater\u201d, \u201cout of scope\u201d \u2014 make the exclusion explicit.",
            "s => /(not |no |won't|will not|out of scope|later|separate ticket|future|defer)/i.test(s)")]),

    _spec("spec-05", "semiguided", "Turn a bug report into a criterion",
          "Priya reports: \u201ctwo patients pressed Request and nothing happened\u201d. Write the acceptance "
          "criterion that, if it had existed, would have caught this. Name the input that breaks it.",
          "Given ...\nWhen ...\nThen ...",
          [("uses Given / When / Then", "All three words in order.", GWT),
           ("names the missing or blank field", "The bug is a field the patient never touched. Say which state that is.",
            "s => /(empty|blank|missing|untouched|undefined|not filled|left out|omitted)/i.test(s)"),
           ("states what the user should see instead", "A criterion needs the correct behaviour, not just the failure.",
            "s => /(message|error|shows|displays|tells|warn|prompt|highlight|required)/i.test(s)")]),

    _spec("spec-06", "semiguided", "Constraints, not preferences",
          "You are about to ask an agent to add appointment filtering. Write the CONSTRAINTS section of "
          "your request: at least three limits on what it may do. A constraint is checkable; a preference is not.",
          "Constraints:\n- \n- \n- ",
          [("three or more constraints", "One per line, at least 12 characters each.",
            "s => s.split('\\n').map(l => l.trim().replace(/^[-*\\d.\\s]+/, '')).filter(l => l.length >= 12).length >= 3"),
           ("limits the files or scope", "Say which file may change, or that others may not.",
            "s => /(only|do not|don't|no new|without|must not|leave|unchanged|same file|\\.js|\\.css|\\.html)/i.test(s)"),
           ("no vibe words", "\u201cKeep it clean\u201d is not a constraint. Name a rule the diff either breaks or does not.", NO_VIBES)]),

    _spec("spec-07", "semiguided", "Decompose it",
          "Ticket NL-004: add a dashboard showing today's appointments, open slots and recent no-shows. "
          "Break it into tasks you could each finish in one sitting. At least four.",
          "1.\n2.\n3.\n4.",
          [("four or more tasks", "One per line, at least 12 characters each.",
            "s => s.split('\\n').map(l => l.trim().replace(/^[-*\\d.\\s]+/, '')).filter(l => l.length >= 12).length >= 4"),
           ("at least one task is about verifying, not building",
            "Tests, checking, or reviewing belongs in the plan. If it is not a task it will not happen.",
            "s => /(test|verif|check|review|prove|assert)/i.test(s)"),
           ("tasks start with a verb", "\u201cDashboard stuff\u201d is not a task. \u201cAdd a count of open slots\u201d is.",
            "s => s.split('\\n').map(l => l.trim().replace(/^[-*\\d.\\s]+/, '')).filter(l => l.length >= 12)"
            ".filter(l => /^(add|write|build|create|render|wire|fetch|test|check|verify|review|refactor|remove|update|fix|style|deploy|document)/i.test(l)).length >= 3")]),

    _spec("spec-08", "challenge", "A request an agent cannot misread",
          "Write the full request you would paste into Cursor for: a function that returns the number of "
          "appointments in the last seven days including today. Include the file, the exact contract, the "
          "boundary rule, the constraints, and ask for a diff.",
          "",
          [("names a file", "@-mention or name the file that should change.",
            "s => /(@|\\bin\\b)\\s*[\\w./-]+\\.(js|ts|html|css|py)/i.test(s)"),
           ("names the function and its arguments", "Give the exact signature you want.",
            "s => /\\w+\\s*\\([^)]*\\)/.test(s)"),
           ("states the boundary rule explicitly", "Seven days including today is ambiguous. Say which day is in and which is out.",
            "s => /(inclusive|exclusive|including today|6 days|six days|not the 7th|boundary|>=|<=)/i.test(s)"),
           ("sets at least one constraint", "Tell it what not to touch.",
            "s => /(do not|don't|no new|only|without|must not|leave)/i.test(s)"),
           ("asks to see the change", "Ask for the diff. You review changes, not vibes.",
            "s => /(diff|show me the change|what you changed|hunk)/i.test(s)"),
           ("long enough to be a real request", "Under 200 characters is not a spec.", "s => s.trim().length >= 200")]),

    _spec("spec-09", "challenge", "Criteria for a form that can fail",
          "Write THREE acceptance criteria for the appointment request form. At least one must be about a "
          "failure, and at least one must name an exact user-visible string.",
          "Given ...\nWhen ...\nThen ...\n\nGiven ...\nWhen ...\nThen ...\n\nGiven ...\nWhen ...\nThen ...",
          [("three Given / When / Then criteria", "Three blocks, each with all three words.",
            "s => (s.match(/given/gi) || []).length >= 3 && (s.match(/when/gi) || []).length >= 3 && (s.match(/then/gi) || []).length >= 3"),
           ("one criterion covers a failure or invalid input", "Empty field, bad email, a date in the past.",
            "s => /(empty|blank|invalid|error|missing|past|fail|reject|refuse)/i.test(s)"),
           ("quotes an exact string the user sees", "Put it in quotes so nobody has to guess the wording.",
            "s => /[\"'\u201c\u2018][^\"'\u201d\u2019]{6,}[\"'\u201d\u2019]/.test(s)"),
           ("no vibe words", "Every clause has to be something a stranger can run.", NO_VIBES)]),

    _spec("spec-10", "mastery", "The spec you would defend in review",
          "Full spec for the clinic search feature: user story, three acceptance criteria, three edge cases, "
          "constraints, and out of scope. This is the artefact Module 2 grades, written unaided.",
          "USER STORY\n\nACCEPTANCE CRITERIA\n\nEDGE CASES\n\nCONSTRAINTS\n\nOUT OF SCOPE\n",
          [("has a user story with a reason", "As a / I want / so that.",
            "s => /as an?\\b[\\s\\S]{3,}?i want\\b[\\s\\S]{3,}?so that\\b/i.test(s)"),
           ("three or more Given / When / Then criteria", "Three complete criteria.",
            "s => (s.match(/given/gi) || []).length >= 3 && (s.match(/then/gi) || []).length >= 3"),
           ("three or more edge cases", "Three distinct lines under edge cases.",
            "s => s.split('\\n').map(l => l.trim()).filter(l => l.length >= 15).length >= 8"),
           ("covers an empty state", "What does the page show when nothing matches?",
            "s => /(empty|no result|nothing|none|no match)/i.test(s)"),
           ("has explicit constraints", "Name what may not change.",
            "s => /(do not|don't|no new|only|must not|without)/i.test(s)"),
           ("has an out-of-scope section", "Write down what you are not doing.",
            "s => /(out of scope|not doing|later|separate ticket|deferred)/i.test(s)"),
           ("no vibe words anywhere", "One vibe word undermines the whole document.", NO_VIBES),
           ("substantial", "A real spec for this is not under 500 characters.", "s => s.trim().length >= 500")]),
]


# ------------------------------------------------------------- git (git-)
# The student writes the actual command. Recognising `git switch -c` in a list
# is not the same as producing it when you need it.

def _git(tid, level, title, prompt, starter, items):
    return {
        "id": tid, "skill": "git-workflow", "tool": "git", "level": level, "kind": "command",
        "title": title, "prompt": prompt, "starter": starter,
        "checks": _checks(items), "prerequisite": "[]",
    }


ONE_LINE = "s => s.trim().split('\\n').filter(l => l.trim()).length === 1"

GIT_TASKS = [
    _git("git-01", "guided", "See what changed",
         "You have been editing and you do not remember what. Write the command that shows which files are "
         "staged, unstaged and untracked right now.", "",
         [("uses git status", "This is the one command to over-use. It tells you where you are.",
           "s => /^\\s*git\\s+status\\s*$/m.test(s)"),
          ("just the one command", "One command, nothing else.", ONE_LINE)]),

    _git("git-02", "guided", "Read the actual change",
         "Before committing, you want to see the changed lines themselves, not just the filenames. "
         "Write that command.", "",
         [("uses git diff", "git diff shows line-level changes.", "s => /\\bgit\\s+diff\\b/.test(s)"),
          ("just the one command", "One command.", ONE_LINE)]),

    _git("git-03", "guided", "Start a branch and move onto it",
         "You are about to let an agent make a risky change. Write the single command that creates a branch "
         "called notes-feature and switches you onto it.", "",
         [("creates and switches in one command", "git switch -c <name>, or the older git checkout -b <name>.",
           "s => /\\bgit\\s+(switch\\s+-c|checkout\\s+-b)\\s+notes-feature\\b/.test(s)"),
          ("just the one command", "One command does both.", ONE_LINE)]),

    _git("git-04", "guided", "Commit one reason",
         "You fixed the Saturday opening hours in hours.html. Write the two commands that stage just that "
         "file and commit it with a message a stranger could search for.", "",
         [("stages that file specifically", "git add hours.html \u2014 not git add . , which sweeps in everything.",
           "s => /\\bgit\\s+add\\s+[^\\n]*hours\\.html/.test(s)"),
          ("does not stage everything", "git add . or -A commits whatever else you happened to leave lying around.",
           "s => !/\\bgit\\s+add\\s+(\\.|-A|--all)\\s*$/m.test(s)"),
          ("commits with a message", "git commit -m \"...\"",
           "s => /\\bgit\\s+commit\\b[\\s\\S]*-m\\s*[\"'][^\"']{15,}[\"']/.test(s)"),
          ("the message says what and where", "Mention the hours or Saturday. \u201cupdates\u201d is not a message.",
           "s => /(hour|saturday|opening|time)/i.test(s)")]),

    _git("git-05", "semiguided", "Publish the branch",
         "Your notes-feature branch is local only. Write the command that pushes it to GitHub and sets it to "
         "track the remote branch, so later pushes need no arguments.", "",
         [("pushes with upstream tracking", "git push -u origin notes-feature (or --set-upstream).",
           "s => /\\bgit\\s+push\\s+(-u|--set-upstream)\\s+origin\\s+notes-feature\\b/.test(s)"),
          ("just the one command", "One command.", ONE_LINE)]),

    _git("git-06", "semiguided", "Look at the history",
         "You want a compact one-line-per-commit view of the history, to find when something changed.", "",
         [("uses git log", "git log is the history.", "s => /\\bgit\\s+log\\b/.test(s)"),
          ("asks for the compact form", "--oneline, or a --pretty format. A full log is unreadable at length.",
           "s => /(--oneline|--pretty|--format)/.test(s)")]),

    _git("git-07", "semiguided", "Abandon a bad agent session",
         "The agent's changes on notes-feature are wrong and not worth saving. You are on that branch and "
         "have committed. Write the commands that get you back to a working main and delete the branch.", "",
         [("switches back to main", "git switch main (or git checkout main).",
           "s => /\\bgit\\s+(switch|checkout)\\s+main\\b/.test(s)"),
          ("deletes the branch", "git branch -D notes-feature. Capital D because it has unmerged commits.",
           "s => /\\bgit\\s+branch\\s+-[dD]\\s+notes-feature\\b/.test(s)"),
          ("does not reset main", "Nothing here needs a reset --hard on main. main was never touched.",
           "s => !/\\breset\\s+--hard\\b/.test(s)")]),

    _git("git-08", "challenge", "Undo a released change",
         "You shipped a commit called 9f2c1ab and the booking form broke. Write the commands that put the "
         "previous behaviour back on main and publish it, without rewriting published history.", "",
         [("reverts rather than resets", "git revert 9f2c1ab creates a new commit that undoes it. reset --hard rewrites history others already have.",
           "s => /\\bgit\\s+revert\\s+9f2c1ab\\b/.test(s)"),
          ("does not force-push", "Force-pushing main is how you destroy a teammate's work.",
           "s => !/(--force|-f\\b|\\+main)/.test(s)"),
          ("pushes the revert", "The fix is not live until it is pushed.", "s => /\\bgit\\s+push\\b/.test(s)")]),

    _git("git-09", "challenge", "Unstage without losing work",
         "You ran git add on a file you did not mean to include. Write the command that takes it out of the "
         "staging area while keeping your edits on disk.", "",
         [("unstages without discarding", "git restore --staged <file>, or the older git reset <file>.",
           "s => /\\bgit\\s+(restore\\s+--staged|reset(\\s+HEAD)?)\\s+[\\w./-]+/.test(s)"),
          ("does not throw the edits away", "checkout -- <file> and reset --hard both delete your work.",
           "s => !/(--hard|checkout\\s+--\\s)/.test(s)")]),

    _git("git-10", "mastery", "The whole loop, once",
         "From a clean main, write the full sequence for shipping one reviewed change: branch, stage, commit, "
         "push with tracking, then how you would get it reviewed. One command per line.", "",
         [("creates a branch", "Start on a branch, not on main.",
           "s => /\\bgit\\s+(switch\\s+-c|checkout\\s+-b)\\s+\\S+/.test(s)"),
          ("stages named files, not everything", "Name the files. git add . is how unrelated work sneaks into a commit.",
           "s => /\\bgit\\s+add\\s+[\\w./-]+/.test(s) && !/\\bgit\\s+add\\s+(\\.|-A|--all)\\s*$/m.test(s)"),
          ("commits with a real message", "At least 15 characters, describing the reason.",
           "s => /\\bgit\\s+commit\\b[\\s\\S]*-m\\s*[\"'][^\"']{15,}[\"']/.test(s)"),
          ("pushes with upstream tracking", "-u origin <branch> the first time.",
           "s => /\\bgit\\s+push\\s+(-u|--set-upstream)\\s+origin\\s+\\S+/.test(s)"),
          ("mentions the pull request", "The review step is a PR, and it is part of shipping.",
           "s => /(pull request|\\bPR\\b|gh pr create)/i.test(s)"),
          ("no force-push anywhere", "Nothing in a normal loop needs --force.", "s => !/(--force|\\s-f\\b)/.test(s)")]),
]


# ------------------------------------------------------- review (rv-)
# Hunk-by-hunk verdicts on AI-authored diffs, with written reasons.

def _review(tid, level, title, prompt, hunks):
    return {
        "id": tid, "skill": "review-judgment", "tool": "review", "level": level, "kind": "review",
        "title": title, "prompt": prompt, "hunks": hunks, "prerequisite": "[]",
    }


REVIEW_TASKS = [
    _review("rv-01", "guided", "The first pull request", 
            "Three hunks from an agent asked to add a visitor counter. Accept or reject each.",
            [
                {"file": "counter.js", "lang": "js", "verdict": "accept",
                 "code": "+function formatCount(n) {\n+  return n === 1 ? \"1 visitor\" : n + \" visitors\";\n+}",
                 "why": "Small, single purpose, and it handles the singular case that everyone forgets. Nothing to object to."},
                {"file": "counter.js", "lang": "js", "verdict": "reject", "keys": "innerHTML|textContent|inject|xss|markup|script",
                 "code": "+function show(el, label) {\n+  el.innerHTML = label;\n+}",
                 "why": "innerHTML for a value that will eventually come from somewhere untrusted. textContent does the same job with no injection surface."},
                {"file": "counter.js", "lang": "js", "verdict": "reject", "keys": "log|console|debug|noise|leftover",
                 "code": "+console.log(\"DEBUG counter\", window.location.href);",
                 "why": "Leftover debug logging. Not asked for, and it ships to every visitor's console."},
            ]),

    _review("rv-02", "guided", "The helpful extra",
            "You asked for one thing. The agent did three. Which of these belong in this pull request?",
            [
                {"file": "hours.html", "lang": "html", "verdict": "accept",
                 "code": "-    <li>Saturday: closed</li>\n+    <li>Saturday: 9am to 1pm</li>",
                 "why": "Exactly the requested change, and nothing else. One line, one reason."},
                {"file": "styles.css", "lang": "css", "verdict": "reject", "keys": "not asked|unrequested|scope|css|unrelated|review|separate",
                 "code": "+* {\n+  transition: all 0.3s ease;\n+}",
                 "why": "Nobody asked for this, it applies to every element on the page, and a universal transition is a well-known way to make an interface feel sluggish. Unrequested changes belong in their own ticket."},
                {"file": "hours.html", "lang": "html", "verdict": "reject", "keys": "alt|accessib|screen reader|image|empty",
                 "code": "+  <img src=\"clock.png\">",
                 "why": "No alt attribute, so a screen reader announces the filename or nothing. Also not part of the ticket."},
            ]),

    _review("rv-03", "semiguided", "The quiet deletion",
            "Four hunks. The agent was asked to add a phone field to the request form. Read the deletions carefully.",
            [
                {"file": "form.html", "lang": "html", "verdict": "accept",
                 "code": "+      <label for=\"phone\">Phone</label>\n+      <input id=\"phone\" name=\"phone\" type=\"tel\">",
                 "why": "A labelled input with a sensible type. This is the feature, done properly."},
                {"file": "form.js", "lang": "js", "verdict": "reject", "keys": "delet|remov|guard|check|valid|regress|required",
                 "code": "-  if (!form.email) return showError(\"Email is required\");\n   submit(form);",
                 "why": "It removed the email guard while adding an unrelated field. Nothing replaced it, and now the form submits with no email at all. This is the regression."},
                {"file": "form.js", "lang": "js", "verdict": "accept",
                 "code": "+function normalisePhone(v) {\n+  return String(v || \"\").replace(/[^0-9+]/g, \"\");\n+}",
                 "why": "Defensive about a missing value and does one clear thing. Reasonable supporting code for the feature."},
                {"file": "form.js", "lang": "js", "verdict": "reject", "keys": "log|console|phone|personal|data|privacy|pii",
                 "code": "+  console.log(\"submitting\", form.email, form.phone);",
                 "why": "An email address and a phone number written to the log. That is personal data leaving the boundary you control."},
            ]),

    _review("rv-04", "semiguided", "The confident comment",
            "The agent refactored date handling. It also left explanations. A comment is a claim, not evidence.",
            [
                {"file": "dates.js", "lang": "js", "verdict": "accept",
                 "code": "+// Windows are inclusive of today: a 7-day window covers today and the\n+// six days before it, which is what the clinic means by \"this week\".\n+const MS_PER_DAY = 24 * 60 * 60 * 1000;",
                 "why": "A comment explaining a non-obvious domain decision, plus a named constant replacing a magic number. This is what good looks like."},
                {"file": "dates.js", "lang": "js", "verdict": "reject", "keys": "comment|claim|not moved|did not|untrue|misleading|verif|check|guard",
                 "code": "-  if (isNaN(Date.parse(d))) return false;\n+  // date validation is handled upstream now",
                 "why": "The check is gone and a comment asserts the validation moved upstream. Nothing in this diff moves it. A comment describing a refactor that did not happen is worse than no comment, because it stops the next reader checking."},
                {"file": "dates.js", "lang": "js", "verdict": "reject", "keys": "magic|number|604800000|constant|MS_PER_DAY|named",
                 "code": "+function isThisWeek(d) {\n+  return Date.now() - Date.parse(d) < 604800000;\n+}",
                 "why": "It introduced a fresh magic number in the same diff that added MS_PER_DAY three lines above. Inconsistent, and 604800000 tells the next reader nothing."},
            ]),

    _review("rv-05", "challenge", "The plausible security hole",
            "Five hunks on a page that handles patient data. Two are fine. Be precise: padding the list costs you.",
            [
                {"file": "notes.js", "lang": "js", "verdict": "reject", "keys": "innerHTML|textContent|inject|xss|markup|script|clinician",
                 "code": "+function renderNote(note) {\n+  container.innerHTML += \"<p>\" + note.text + \"</p>\";\n+}",
                 "why": "Clinician-typed text concatenated into innerHTML. Anything that looks like markup executes. It also re-parses the whole container on every note, which is slow, but the injection is the reason to reject."},
                {"file": "notes.js", "lang": "js", "verdict": "accept",
                 "code": "+const notes = new Map();",
                 "why": "A Map for keyed lookups. Ordinary, correct, nothing to say about it."},
                {"file": "api.js", "lang": "js", "verdict": "reject", "keys": "key|secret|commit|token|api|env|hardcod|rotate",
                 "code": "+const API_KEY = \"sk_live_EXAMPLE_NOT_A_REAL_KEY_000\";",
                 "why": "A live secret committed to the repository. Deleting it later does not remove it from history \u2014 it has to be rotated. Treat it as compromised the moment it lands."},
                {"file": "notes.js", "lang": "js", "verdict": "accept",
                 "code": "+function noteId(appointmentId, index) {\n+  return appointmentId + \":\" + index;\n+}",
                 "why": "A tiny, honest helper with a name that says what it returns. Fine."},
                {"file": "notes.js", "lang": "js", "verdict": "reject", "keys": "except|catch|silent|swallow|empty|error|hide|fail",
                 "code": "+try {\n+  saveNotes(notes);\n+} catch (e) {}",
                 "why": "An empty catch. If saving fails the clinician sees a successful-looking save and the note is gone. Silent data loss is the worst failure mode available, because nothing tells you it happened."},
            ]),

    _review("rv-06", "mastery", "The pull request you would be asked about",
            "Six hunks, a mix you have to separate on your own. Assume you will be asked what you checked.",
            [
                {"file": "search.js", "lang": "js", "verdict": "reject", "keys": "case|lower|upper|sensitiv|normalis|normaliz",
                 "code": "+function matches(clinic, query) {\n+  return clinic.name.includes(query);\n+}",
                 "why": "Case-sensitive matching. Typing \u201cnor\u201d finds nothing when the record says \u201cNorthline\u201d, which is the first thing any user will try."},
                {"file": "search.js", "lang": "js", "verdict": "accept",
                 "code": "+function clearSearch(input, onChange) {\n+  input.value = \"\";\n+  onChange(\"\");\n+}",
                 "why": "Clears the box and notifies the caller, so the list resets. Handles the empty state deliberately."},
                {"file": "search.js", "lang": "js", "verdict": "reject", "keys": "empty|no result|nothing|state|blank|message|feedback",
                 "code": "+results.forEach(function (r) {\n+  list.appendChild(row(r));\n+});",
                 "why": "No empty state. When nothing matches the user gets a blank area with no explanation, which is indistinguishable from the page being broken."},
                {"file": "index.html", "lang": "html", "verdict": "reject", "keys": "label|accessib|screen reader|aria|placeholder",
                 "code": "+    <input id=\"q\" placeholder=\"Search clinics\">",
                 "why": "A placeholder is not a label. It disappears when you type and screen readers do not reliably announce it. This input has no accessible name."},
                {"file": "search.js", "lang": "js", "verdict": "accept",
                 "code": "+// Debounced by 150ms: typing \"northline\" fired nine renders and the\n+// list visibly flickered on a mid-range phone.\n+const DEBOUNCE_MS = 150;",
                 "why": "A named constant and a comment recording the measurement behind the number. That is exactly the comment worth keeping."},
                {"file": "search.js", "lang": "js", "verdict": "reject", "keys": "sleep|setTimeout|wait|race|flake|timing|arbitrar",
                 "code": "+// wait for the DOM to settle\n+setTimeout(wireSearch, 2000);",
                 "why": "A two-second sleep standing in for a real readiness condition. It hides a race rather than fixing it, and on a slow device two seconds will not be enough either."},
            ]),
]


# ------------------------------------------------- detective (det-)
# Two-phase: charge sheet with decoys, then prove the fix against hidden tests.
# The capstone bar counts passes with the det- prefix.

def _det(tid, level, title, case):
    return {
        "id": tid, "skill": "ai-failure-detection", "tool": "detective", "level": level,
        "kind": "detective", "title": title,
        "prompt": case.get("ask", ""), "case": case, "prerequisite": "[]",
    }


DETECTIVE_TASKS = [
    _det("det-01", "guided", "The total that ignores quantity", {
        "ticket": "NL-C01", "author": "Written by the coding agent",
        "ask": "Add a function that totals a basket of items. Each item is { price, quantity }.",
        "lang": "js",
        "code": "function calculateTotal(items) {\n  return items.reduce((total, item) => total + item.price, 0);\n}",
        "findings": [
            {"id": "f1", "cat": "logic", "real": True, "label": "quantity is never used",
             "why": "Two of a \u00a34 item totals \u00a34 instead of \u00a38. The ask named quantity and the code ignores it."},
            {"id": "f2", "cat": "edge", "real": False, "label": "reduce throws on an empty array",
             "why": "It does not, because an initial value of 0 is supplied. Without that initial value it would throw, which is exactly why the argument is there."},
            {"id": "f3", "cat": "naming", "real": False, "label": "total shadows an outer variable",
             "why": "Nothing outside this function is called total. The accumulator name is fine."},
            {"id": "f4", "cat": "complexity", "real": False, "label": "reduce should be a for loop",
             "why": "A style preference, not a defect. Padding a charge sheet with preferences is how the real finding gets discounted."},
        ],
        "fix": {"functionName": "calculateTotal",
                "note": "Return the total of <code>price \u00d7 quantity</code> across all items. An empty basket is <code>0</code>. A missing quantity counts as <b>1</b>, because a basket line with no quantity means one of that item.",
                "starter": "function calculateTotal(items) {\n\n}",
                "testCases": [
                    {"name": "one item, quantity 2", "args": [[{"price": 4, "quantity": 2}]], "expected": 8},
                    {"name": "two different items", "args": [[{"price": 4, "quantity": 2}, {"price": 1.5, "quantity": 3}]], "expected": 12.5},
                    {"name": "an empty basket is 0", "args": [[]], "expected": 0},
                    {"name": "a missing quantity counts as one", "args": [[{"price": 9}]], "expected": 9},
                    {"name": "quantity 0 contributes nothing", "args": [[{"price": 9, "quantity": 0}]], "expected": 0},
                ]},
    }),

    _det("det-02", "guided", "The validator that accepts a space", {
        "ticket": "NL-C02", "author": "Written by the coding agent",
        "ask": "Validate that a booking has a non-empty name and a date that is not in the past.",
        "lang": "js",
        "code": ("function validateBooking(b) {\n"
                 "  if (b.name.length > 0 && b.date >= today()) {\n"
                 "    return true;\n"
                 "  }\n"
                 "  return false;\n"
                 "}"),
        "findings": [
            {"id": "f1", "cat": "validation", "real": True, "label": "a name of only spaces passes",
             "why": "\" \".length is 1, so whitespace counts as a name. Trim before measuring."},
            {"id": "f2", "cat": "edge", "real": True, "label": "it throws when name is missing",
             "why": ".length on undefined throws. A form field the user never touched is undefined, not empty string."},
            {"id": "f3", "cat": "complexity", "real": False, "label": "the if/return could be one expression",
             "why": "True, and irrelevant. Returning the condition directly is tidier but the behaviour is identical."},
            {"id": "f4", "cat": "logic", "real": False, "label": "comparing dates as strings is always wrong",
             "why": "For ISO dates like 2026-08-30 string comparison orders correctly, which is why the format exists. Not a defect here."},
        ],
        "fix": {"functionName": "validateBooking",
                "note": "Return <code>true</code> only when the name has at least one non-whitespace character and <code>date</code> is greater than or equal to <code>todayStr</code>. It must never throw, whatever it is handed. Signature: <code>validateBooking(b, todayStr)</code>.",
                "starter": "function validateBooking(b, todayStr) {\n\n}",
                "testCases": [
                    {"name": "a valid booking passes", "args": [{"name": "Priya", "date": "2026-09-02"}, "2026-08-30"], "expected": True},
                    {"name": "today is not in the past", "args": [{"name": "Priya", "date": "2026-08-30"}, "2026-08-30"], "expected": True},
                    {"name": "yesterday is rejected", "args": [{"name": "Priya", "date": "2026-08-29"}, "2026-08-30"], "expected": False},
                    {"name": "a name of only spaces is rejected", "args": [{"name": "   ", "date": "2026-09-02"}, "2026-08-30"], "expected": False},
                    {"name": "a missing name does not throw", "args": [{"date": "2026-09-02"}, "2026-08-30"], "expected": False},
                    {"name": "a missing date does not throw", "args": [{"name": "Priya"}, "2026-08-30"], "expected": False},
                    {"name": "an empty object does not throw", "args": [{}, "2026-08-30"], "expected": False},
                ]},
    }),

    _det("det-03", "semiguided", "The average that reports zero", {
        "ticket": "NL-C03", "author": "Written by the coding agent",
        "ask": "Return the average wait time in minutes from a list of appointments, each { waitMinutes }.",
        "lang": "js",
        "code": ("function averageWait(appointments) {\n"
                 "  let sum = 0;\n"
                 "  for (let i = 0; i < appointments.length; i++) {\n"
                 "    sum += appointments[i].waitMinutes;\n"
                 "  }\n"
                 "  return sum / appointments.length;\n"
                 "}"),
        "findings": [
            {"id": "f1", "cat": "edge", "real": True, "label": "an empty list returns NaN",
             "why": "0 divided by 0 is NaN, which renders as \"NaN minutes\" on the dashboard. An empty list has no average, and the code has to decide what to show."},
            {"id": "f2", "cat": "assumption", "real": True, "label": "a missing waitMinutes poisons the whole result",
             "why": "Adding undefined makes sum NaN, so one incomplete record turns every average into NaN. Skip incomplete records or treat them explicitly."},
            {"id": "f3", "cat": "perf", "real": False, "label": "the loop should be reduce for speed",
             "why": "reduce is not faster, and on a list this size neither matters. A style opinion dressed as a performance finding."},
            {"id": "f4", "cat": "naming", "real": False, "label": "i is a poor variable name",
             "why": "i as a loop index is universally understood. Renaming it to index gains nothing."},
        ],
        "fix": {"functionName": "averageWait",
                "note": "Return the mean of <code>waitMinutes</code> across records that actually have a numeric one, rounded to <b>one decimal place</b>. Return <code>0</code> when there is nothing to average \u2014 the dashboard needs a number, not <code>NaN</code>.",
                "starter": "function averageWait(appointments) {\n\n}",
                "testCases": [
                    {"name": "two records", "args": [[{"waitMinutes": 10}, {"waitMinutes": 20}]], "expected": 15},
                    {"name": "rounds to one decimal place", "args": [[{"waitMinutes": 10}, {"waitMinutes": 11}, {"waitMinutes": 13}]], "expected": 11.3},
                    {"name": "an empty list returns 0, not NaN", "args": [[]], "expected": 0},
                    {"name": "a record with no waitMinutes is skipped", "args": [[{"waitMinutes": 10}, {}]], "expected": 10},
                    {"name": "all records incomplete returns 0", "args": [[{}, {}]], "expected": 0},
                    {"name": "a zero wait still counts", "args": [[{"waitMinutes": 0}, {"waitMinutes": 10}]], "expected": 5},
                ]},
    }),

    _det("det-04", "semiguided", "The search that hides results", {
        "ticket": "NL-C04", "author": "Written by the coding agent",
        "ask": "Filter the clinic list by what the user typed. Typing nothing should show everything.",
        "lang": "js",
        "code": ("function filterClinics(clinics, query) {\n"
                 "  return clinics.filter(function (c) {\n"
                 "    return c.name.includes(query);\n"
                 "  });\n"
                 "}"),
        "findings": [
            {"id": "f1", "cat": "logic", "real": True, "label": "matching is case-sensitive",
             "why": "Typing \"nor\" returns nothing when the record says \"Northline\". This is the first thing a real user does."},
            {"id": "f2", "cat": "edge", "real": True, "label": "a query with surrounding spaces matches nothing",
             "why": "Users paste values and leave trailing spaces constantly. \"Northline \" finds nothing, and the failure is invisible \u2014 it looks like no such clinic exists."},
            {"id": "f3", "cat": "complexity", "real": False, "label": "the callback should be an arrow function",
             "why": "Identical behaviour. Purely cosmetic."},
            {"id": "f4", "cat": "edge", "real": False, "label": "an empty query returns nothing",
             "why": "Actually the opposite: every string includes the empty string, so an empty query correctly returns everything. Worth checking rather than assuming."},
        ],
        "fix": {"functionName": "filterClinics",
                "note": "Match case-insensitively, ignore whitespace around the query, and return <b>all</b> clinics when the query is empty, whitespace, <code>null</code> or <code>undefined</code>. A clinic with no name must not throw.",
                "starter": "function filterClinics(clinics, query) {\n\n}",
                "testCases": [
                    {"name": "matches regardless of case", "args": [[{"name": "Northline"}, {"name": "Southgate"}], "nor"], "expected": [{"name": "Northline"}]},
                    {"name": "matches an upper-case query", "args": [[{"name": "Northline"}], "NORTH"], "expected": [{"name": "Northline"}]},
                    {"name": "ignores surrounding whitespace", "args": [[{"name": "Northline"}], "  north "], "expected": [{"name": "Northline"}]},
                    {"name": "an empty query returns everything", "args": [[{"name": "Northline"}, {"name": "Southgate"}], ""], "expected": [{"name": "Northline"}, {"name": "Southgate"}]},
                    {"name": "a whitespace query returns everything", "args": [[{"name": "Northline"}], "   "], "expected": [{"name": "Northline"}]},
                    {"name": "a null query returns everything", "args": [[{"name": "Northline"}], None], "expected": [{"name": "Northline"}]},
                    {"name": "no match returns an empty list", "args": [[{"name": "Northline"}], "zzz"], "expected": []},
                    {"name": "a clinic with no name does not throw", "args": [[{}, {"name": "Northline"}], "north"], "expected": [{"name": "Northline"}]},
                ]},
    }),

    _det("det-05", "challenge", "The pagination that loses the last page", {
        "ticket": "NL-C05", "author": "Written by the coding agent",
        "ask": "Split appointments into pages of a given size, for the dashboard list.",
        "lang": "js",
        "code": ("function pageOf(rows, pageSize, pageNumber) {\n"
                 "  const start = pageNumber * pageSize;\n"
                 "  return rows.slice(start, start + pageSize);\n"
                 "}\n"
                 "\n"
                 "function pageCount(rows, pageSize) {\n"
                 "  return Math.floor(rows.length / pageSize);\n"
                 "}"),
        "findings": [
            {"id": "f1", "cat": "logic", "real": True, "label": "pageCount drops the final partial page",
             "why": "11 rows at 5 per page gives floor(2.2) = 2, so the last row is unreachable. It needs Math.ceil. This is the classic off-by-one and it silently hides data."},
            {"id": "f2", "cat": "edge", "real": True, "label": "pageCount divides by zero",
             "why": "A pageSize of 0 gives Infinity, and the UI renders an infinite pager. Guard the input."},
            {"id": "f3", "cat": "assumption", "real": False, "label": "pageOf uses 0-based page numbers",
             "why": "That is a convention, not a bug, and it is consistent between the two functions. It would only be a defect if the caller assumed 1-based, which nothing here does."},
            {"id": "f4", "cat": "perf", "real": False, "label": "slice copies the array and is wasteful",
             "why": "slice on a page-sized window is exactly the right tool. This is not a performance problem."},
            {"id": "f5", "cat": "naming", "real": False, "label": "pageOf is an unclear name",
             "why": "Mildly true and not worth a rejection on its own. Naming quibbles in a list with two real bugs dilute the real bugs."},
        ],
        "fix": {"functionName": "pageCount",
                "note": "Return the number of pages needed to show every row, <b>including a final partial page</b>. Return <code>0</code> for an empty list, and <code>0</code> rather than <code>Infinity</code> when <code>pageSize</code> is 0, negative or missing.",
                "starter": "function pageCount(rows, pageSize) {\n\n}",
                "testCases": [
                    {"name": "an exact fit", "args": [[1, 2, 3, 4], 2], "expected": 2},
                    {"name": "a partial final page still counts", "args": [[1, 2, 3, 4, 5], 2], "expected": 3},
                    {"name": "eleven rows at five per page is three pages", "args": [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 5], "expected": 3},
                    {"name": "one row is one page", "args": [[1], 5], "expected": 1},
                    {"name": "an empty list is zero pages", "args": [[], 5], "expected": 0},
                    {"name": "a page size of zero does not return Infinity", "args": [[1, 2, 3], 0], "expected": 0},
                    {"name": "a negative page size returns 0", "args": [[1, 2, 3], -1], "expected": 0},
                ]},
    }),

    _det("det-06", "challenge", "The retry that hammers the server", {
        "ticket": "NL-C06", "author": "Written by the coding agent",
        "ask": "If loading appointments fails, retry a few times before showing an error.",
        "lang": "js",
        "code": ("let attempts = 0;\n"
                 "\n"
                 "function loadWithRetry(load, onDone) {\n"
                 "  load(function (err, data) {\n"
                 "    if (err) {\n"
                 "      attempts++;\n"
                 "      loadWithRetry(load, onDone);\n"
                 "      return;\n"
                 "    }\n"
                 "    onDone(data);\n"
                 "  });\n"
                 "}"),
        "findings": [
            {"id": "f1", "cat": "logic", "real": True, "label": "there is no retry limit",
             "why": "attempts is incremented and never read. A server that is down turns this into an infinite request loop from every open browser tab."},
            {"id": "f2", "cat": "logic", "real": True, "label": "the error is never surfaced",
             "why": "onDone is only called on success, so a permanent failure leaves the UI on its loading state forever. The ask said show an error."},
            {"id": "f3", "cat": "assumption", "real": True, "label": "attempts is module-level, not per call",
             "why": "Two concurrent loads share one counter, so the count means nothing. State that belongs to one call must live inside the call."},
            {"id": "f4", "cat": "complexity", "real": False, "label": "recursion should be a while loop",
             "why": "With an asynchronous callback you cannot use a plain while loop. Recursion is the right shape here; the missing limit is the problem, not the recursion."},
            {"id": "f5", "cat": "naming", "real": False, "label": "load is too generic a parameter name",
             "why": "For a function whose only job is to load, load is a perfectly clear name."},
        ],
        "fix": {"functionName": "retryCount",
                "note": "Rather than rewrite the async flow, implement the decision it was missing. <code>retryCount(attemptsSoFar, maxAttempts)</code> returns <code>true</code> when another attempt is allowed. <code>attemptsSoFar</code> is how many have already been made. Missing or non-positive <code>maxAttempts</code> means no retries.",
                "starter": "function retryCount(attemptsSoFar, maxAttempts) {\n\n}",
                "testCases": [
                    {"name": "the first retry is allowed", "args": [1, 3], "expected": True},
                    {"name": "the last allowed attempt", "args": [2, 3], "expected": True},
                    {"name": "stops at the limit", "args": [3, 3], "expected": False},
                    {"name": "never exceeds the limit", "args": [9, 3], "expected": False},
                    {"name": "a max of zero means no retries", "args": [0, 0], "expected": False},
                    {"name": "a missing max means no retries", "args": [1, None], "expected": False},
                    {"name": "a negative max means no retries", "args": [1, -2], "expected": False},
                ]},
    }),

    _det("det-07", "mastery", "The de-duplication that keeps the wrong one", {
        "ticket": "NL-C07", "author": "Written by the coding agent",
        "ask": "Remove duplicate patients from the imported list. Match on email. Keep the original record.",
        "lang": "js",
        "code": ("function dedupe(rows) {\n"
                 "  const byEmail = {};\n"
                 "  rows.forEach(function (r) {\n"
                 "    byEmail[r.email] = r;\n"
                 "  });\n"
                 "  return Object.values(byEmail);\n"
                 "}"),
        "findings": [
            {"id": "f1", "cat": "logic", "real": True, "label": "the last duplicate wins, not the first",
             "why": "Each assignment overwrites the previous one, so the surviving record is whatever appeared last. The ask said keep the original."},
            {"id": "f2", "cat": "logic", "real": True, "label": "emails are compared exactly as typed",
             "why": "\"A@x.co\" and \"a@x.co \" are the same person and produce two entries. Normalise before comparing or de-duplication does nothing for the real data."},
            {"id": "f3", "cat": "edge", "real": True, "label": "rows with no email collapse into one",
             "why": "Every missing email becomes the key \"undefined\", so all incomplete records merge into a single bogus patient. Silently destroying records is worse than keeping duplicates."},
            {"id": "f4", "cat": "perf", "real": False, "label": "Object.values is slow on large inputs",
             "why": "It is a single linear pass. On a 4,000-row import this is not measurable."},
            {"id": "f5", "cat": "complexity", "real": False, "label": "a Map would be cleaner than an object",
             "why": "A Map avoids prototype-key surprises and is a fair preference, but it fixes none of the three real defects. Charging it alongside them makes the list look padded."},
            {"id": "f6", "cat": "comment", "real": False, "label": "the function has no comment",
             "why": "A five-line function whose name is dedupe does not need one. Comments explain why, and there is no surprising why here."},
        ],
        "fix": {"functionName": "dedupe",
                "note": "Keep the <b>first</b> occurrence of each email, comparing after trimming and lower-casing. Drop rows whose email is missing or blank. Preserve the original order, and do not modify the array or the objects you were handed.",
                "starter": "function dedupe(rows) {\n\n}",
                "testCases": [
                    {"name": "an exact duplicate is removed", "args": [[{"n": "a", "email": "a@x.co"}, {"n": "b", "email": "a@x.co"}]], "expected": [{"n": "a", "email": "a@x.co"}]},
                    {"name": "the first occurrence survives", "args": [[{"n": "first", "email": "a@x.co"}, {"n": "second", "email": "a@x.co"}]], "expected": [{"n": "first", "email": "a@x.co"}]},
                    {"name": "case and trailing space are the same person", "args": [[{"n": "a", "email": "a@x.co"}, {"n": "b", "email": "A@X.CO "}]], "expected": [{"n": "a", "email": "a@x.co"}]},
                    {"name": "a blank email is dropped", "args": [[{"n": "a", "email": ""}, {"n": "b", "email": "b@x.co"}]], "expected": [{"n": "b", "email": "b@x.co"}]},
                    {"name": "a missing email is dropped, not merged", "args": [[{"n": "a"}, {"n": "b"}, {"n": "c", "email": "c@x.co"}]], "expected": [{"n": "c", "email": "c@x.co"}]},
                    {"name": "order is preserved", "args": [[{"n": "1", "email": "c@x.co"}, {"n": "2", "email": "a@x.co"}]], "expected": [{"n": "1", "email": "c@x.co"}, {"n": "2", "email": "a@x.co"}]},
                    {"name": "an empty list returns an empty list", "args": [[]], "expected": []},
                ]},
    }),

    _det("det-08", "mastery", "The rounding that loses a penny", {
        "ticket": "NL-C08", "author": "Written by the coding agent",
        "ask": "Split a bill evenly between people, in pence, so the parts add back up to the total.",
        "lang": "js",
        "code": ("function splitBill(totalPence, people) {\n"
                 "  const each = Math.round(totalPence / people);\n"
                 "  const parts = [];\n"
                 "  for (let i = 0; i < people; i++) {\n"
                 "    parts.push(each);\n"
                 "  }\n"
                 "  return parts;\n"
                 "}"),
        "findings": [
            {"id": "f1", "cat": "logic", "real": True, "label": "the parts do not add up to the total",
             "why": "1000 pence between 3 rounds to 333 each, totalling 999. A penny vanishes. On money, a total that does not reconcile is the whole bug."},
            {"id": "f2", "cat": "edge", "real": True, "label": "zero people returns an empty list instead of refusing",
             "why": "totalPence / 0 is Infinity, the loop never runs, and the caller gets a silent empty array rather than an error it can handle."},
            {"id": "f3", "cat": "comment", "real": False, "label": "the variable each is misleading once amounts differ",
             "why": "Fair once you fix the remainder, but on the current code every part genuinely is the same. This is a consequence of the fix, not an existing defect."},
            {"id": "f4", "cat": "complexity", "real": False, "label": "the loop should be Array.from",
             "why": "Identical result. A preference."},
            {"id": "f5", "cat": "perf", "real": False, "label": "push in a loop is slow",
             "why": "For a handful of people this is irrelevant, and push is not the bottleneck it is imagined to be."},
        ],
        "fix": {"functionName": "splitBill",
                "note": "Return an array of <code>people</code> integer pence amounts that <b>sums exactly to</b> <code>totalPence</code>. Distribute the remainder one penny at a time from the front, so the earlier parts are the larger ones. Return an empty array if <code>people</code> is not a positive number.",
                "starter": "function splitBill(totalPence, people) {\n\n}",
                "testCases": [
                    {"name": "an even split", "args": [1000, 4], "expected": [250, 250, 250, 250]},
                    {"name": "the remainder is distributed, and it reconciles", "args": [1000, 3], "expected": [334, 333, 333]},
                    {"name": "two pennies over", "args": [1001, 3], "expected": [334, 334, 333]},
                    {"name": "one person takes it all", "args": [999, 1], "expected": [999]},
                    {"name": "less money than people", "args": [2, 3], "expected": [1, 1, 0]},
                    {"name": "a zero bill", "args": [0, 3], "expected": [0, 0, 0]},
                    {"name": "zero people returns an empty list", "args": [1000, 0], "expected": []},
                ]},
    }),
]


# ------------------------------------------- integrated (ct-)
# Cross-cutting work that needs more than one skill at once.

INTEGRATED_TASKS = [
    {"id": "ct-01", "skill": "integrated-flow", "tool": "integrated", "level": "guided",
     "kind": "js", "title": "counts for the dashboard",
     "prompt": "One function, three numbers. Given appointments as { date, status } and today's date, return "
               "{ today, open, done }. today counts appointments dated today; open and done count today's "
               "appointments by status. This is Module 6's ticket in miniature.",
     "functionName": "dashboardCounts",
     "starter": "function dashboardCounts(appointments, today) {\n\n}",
     "testCases": json.dumps([
         {"name": "mixed day", "args": [[{"date": "2026-08-30", "status": "open"}, {"date": "2026-08-30", "status": "done"}, {"date": "2026-08-29", "status": "open"}], "2026-08-30"], "expected": {"today": 2, "open": 1, "done": 1}},
         {"name": "an empty list returns zeros, not nothing", "args": [[], "2026-08-30"], "expected": {"today": 0, "open": 0, "done": 0}},
         {"name": "no appointments today", "args": [[{"date": "2026-08-29", "status": "open"}], "2026-08-30"], "expected": {"today": 0, "open": 0, "done": 0}},
     ]), "prerequisite": "[]"},

    {"id": "ct-02", "skill": "integrated-flow", "tool": "integrated", "level": "semiguided",
     "kind": "testing", "title": "catch the off-by-one",
     "prompt": "Write test_window(impl) that returns true for a correct seven-day window and false for the "
               "common agent error. A seven-day window ending today includes today and the six days before "
               "it. impl(dateStr, todayStr) returns true when dateStr is inside that window.",
     "functionName": "test_window",
     "starter": "function test_window(impl){\n  return true;\n}",
     "goodImpl": "function(d,t){var days=Math.round((Date.parse(t)-Date.parse(d))/86400000);return days>=0&&days<=6;}",
     "badImpl": "function(d,t){var days=Math.round((Date.parse(t)-Date.parse(d))/86400000);return days>=0&&days<=7;}",
     "bugHint": "The broken version includes the day seven back. Your test has to check that exact boundary \u2014 anything vaguer passes both.",
     "prerequisite": "[]"},

    {"id": "ct-03", "skill": "integrated-flow", "tool": "integrated", "level": "semiguided",
     "kind": "html", "title": "a form a screen reader can use",
     "prompt": "Build the request form: a form containing a label whose for matches an input id=\"email\" "
               "type=\"email\" required, and a submit button reading Request.",
     "starter": "<form>\n\n</form>",
     "checks": ("[{ name: 'email input with the right type', hint: 'id=\"email\" and type=\"email\"', "
                "test: d => { const i = d.querySelector('#email'); return !!i && i.getAttribute('type') === 'email'; } }, "
                "{ name: 'it is required', hint: 'Add the required attribute.', "
                "test: d => { const i = d.querySelector('#email'); return !!i && i.hasAttribute('required'); } }, "
                "{ name: 'a label points at it', hint: 'A placeholder is not a label. Use label for=\"email\".', "
                "test: d => !!d.querySelector('label[for=\"email\"]') }, "
                "{ name: 'the label has text', hint: 'An empty label announces nothing.', "
                "test: d => ((d.querySelector('label[for=\"email\"]') || {}).textContent || '').trim().length > 0 }, "
                "{ name: 'a submit button reading Request', hint: 'button type=\"submit\" with the text Request.', "
                "test: d => { const b = d.querySelector('button[type=\"submit\"], input[type=\"submit\"]'); "
                "return !!b && (b.textContent || b.value || '').trim() === 'Request'; } }]"),
     "prerequisite": "[]"},

    {"id": "ct-04", "skill": "integrated-flow", "tool": "integrated", "level": "challenge",
     "kind": "js", "title": "the three states of loading",
     "prompt": "Every screen that fetches data has three states and agents usually write one. Given a state "
               "object { loading, error, rows }, return the exact string to show: \"Loading\u2026\" while "
               "loading, \"Could not load appointments\" on error, \"No appointments\" when rows is empty, "
               "and otherwise the count like \"3 appointments\" (or \"1 appointment\").",
     "functionName": "statusLine",
     "starter": "function statusLine(state) {\n\n}",
     "testCases": json.dumps([
         {"name": "loading wins over everything", "args": [{"loading": True, "error": True, "rows": []}], "expected": "Loading\u2026"},
         {"name": "error before empty", "args": [{"loading": False, "error": True, "rows": []}], "expected": "Could not load appointments"},
         {"name": "empty is its own state", "args": [{"loading": False, "error": False, "rows": []}], "expected": "No appointments"},
         {"name": "the singular case", "args": [{"loading": False, "error": False, "rows": [1]}], "expected": "1 appointment"},
         {"name": "the plural case", "args": [{"loading": False, "error": False, "rows": [1, 2, 3]}], "expected": "3 appointments"},
         {"name": "a missing rows array is empty, not a crash", "args": [{"loading": False, "error": False}], "expected": "No appointments"},
     ]), "prerequisite": "[]"},

    {"id": "ct-05", "skill": "integrated-flow", "tool": "integrated", "level": "challenge",
     "kind": "spec", "title": "the request you would actually send",
     "prompt": "You are about to ask an agent for the statusLine function from ct-04, and you want it right "
               "first time. Write the request: the file, the signature, all four states with their exact "
               "strings, the plural rule, a constraint, and a request for the diff.",
     "starter": "",
     "checks": _checks([
         ("names a file", "@-mention or name the file.", "s => /(@|\\bin\\b)\\s*[\\w./-]+\\.(js|ts|html)/i.test(s)"),
         ("names the function and argument", "Give the signature.", "s => /statusLine\\s*\\(/.test(s)"),
         ("covers all four states", "Loading, error, empty, and the count. Naming three is how you get a screen that shows nothing on failure.",
          "s => /loading/i.test(s) && /(error|fail|could not)/i.test(s) && /(empty|no appointments|none)/i.test(s) && /(count|plural|singular|appointments)/i.test(s)"),
         ("quotes the exact strings", "The exact wording, in quotes, so the agent cannot paraphrase it.",
          "s => (s.match(/[\"'\u201c\u2018][^\"'\u201d\u2019]{4,}[\"'\u201d\u2019]/g) || []).length >= 3"),
         ("states the singular rule", "1 appointment, not 1 appointments. Say so.",
          "s => /(singular|1 appointment\\b|plural)/i.test(s)"),
         ("sets a constraint", "Tell it what not to touch.", "s => /(do not|don't|no new|only|without|must not)/i.test(s)"),
         ("asks for the diff", "You review changes.", "s => /(diff|show me the change|hunk)/i.test(s)"),
     ]), "prerequisite": "[]"},

    {"id": "ct-06", "skill": "integrated-flow", "tool": "integrated", "level": "mastery",
     "kind": "js", "title": "safe by default",
     "prompt": "One function that has to get three separate things right at once. Given a raw patient note, "
               "return a summary object { text, length, safe } where text is trimmed and collapsed to single "
               "spaces, length is the trimmed length, and safe is false if the note contains a < character "
               "(which is why you use textContent, not innerHTML). Never throw.",
     "functionName": "summariseNote",
     "starter": "function summariseNote(raw) {\n\n}",
     "testCases": json.dumps([
         {"name": "trims and collapses whitespace", "args": ["  two   words  "], "expected": {"text": "two words", "length": 9, "safe": True}},
         {"name": "flags markup as unsafe", "args": ["<b>bold</b>"], "expected": {"text": "<b>bold</b>", "length": 11, "safe": False}},
         {"name": "an empty note", "args": [""], "expected": {"text": "", "length": 0, "safe": True}},
         {"name": "whitespace only", "args": ["   "], "expected": {"text": "", "length": 0, "safe": True}},
         {"name": "null does not throw", "args": [None], "expected": {"text": "", "length": 0, "safe": True}},
         {"name": "a number is coerced, not crashed on", "args": [42], "expected": {"text": "42", "length": 2, "safe": True}},
     ]), "prerequisite": "[]"},
]
