# AI Engineering course · design spec

Two surfaces, one design system (Obsidian: dark glass).

| Surface | Who sees it | Reference screens | Accent |
|---|---|---|---|
| **Course details page** (marketing) | Visitors, before buying | `CourseAIEHero`, `CourseAIECurriculum`, `CourseAIEInside`, `CourseAIEOutcomes` | Violet `#8B5CF6` / `#C7B0FF` |
| **Course app** (what students get) | Enrolled students | `ChapterOverview`, `ChapterLesson`, `ChapterExercise`, `ChapterQuiz`, `ChapterProject`, `ChapterCheatSheet` | Cyan `#5CC8FF` / `#9BDDFF` |

`Foundations` and `Components` are the Obsidian system boards, for anything the screens don't cover.

**The source of truth is the markup in `reference/source/*.dc.html`.**
- Every size, colour, radius, gap and shadow is written inline there.
- This file summarises it; where they disagree, the source wins.
- Screenshots in `reference/screenshots/` show the rendered result at 1440px.
- `reference/html/*.html` open in a browser and work, including the exercise and quiz.

---

## 1. Foundations

**Colour.** All tokens are in `tokens.css` (Tailwind v4 `@theme`). Rules:

- The background is always Void `#05060A`, never `#000`.
- **One glow colour per screen.** Violet on the details page, cyan in the course app.
  - Mint means success or completion.
  - Amber means projects and hints.
  - Ember means errors.
- The primary action is a solid Frost pill (`#F5F6F8` fill, `#05060A` text). Everything else is glass.
- Colour is never the only signal. Status always carries an icon too (check, x, dot).

**Type.** Geist for everything you read, Geist Mono for labels, eyebrows, numbers-as-labels and code.

| Role | Size / line-height / weight / tracking |
|---|---|
| Details hero display | 112px / 0.95 / 500 / -0.055em |
| Section H2 (details) | 60px / 1.02 / 500 / -0.045em |
| Why-it-matters H2 | 52px / 1.04 / 500 / -0.045em |
| App page H1 (module) | 58px / 1.0 / 500 / -0.045em |
| Lesson H1 | 52px / 1.02 / 500 / -0.045em |
| Quiz H1 | 44px / 1.05 / 500 / -0.04em |
| Exercise H1 | 36px / 1.05 / 500 / -0.035em |
| Card title | 23px / 1.2 / 500 / -0.02em (curriculum) |
| Lesson body | 17.5px / 1.75, colour Soft `#C9CCD4` |
| Body / descriptions | 15–18px / 1.55–1.65, colour Mist `#A9AEBA` |
| Eyebrow (mono, uppercase) | 12–13px, tracking 0.12–0.16em |
| Code | Geist Mono 14px / 24px (editor), 13–13.5px / 22–23px (cards, terminal) |

**Surfaces.** The glass recipe is `rgba(255,255,255,0.035)` background, `1px rgba(255,255,255,0.10)` border and `inset 0 1px 0 rgba(255,255,255,0.08)`.
- Nested rows use `rgba(255,255,255,0.03)` with a `0.07` border.
- Radii: pills 999px, rows 14–16px, cards 20–26px, hero panels 30px.

**Glows.** These are large radial gradients (900–1000px circles, 0.16–0.34 alpha) placed behind the content with `position:absolute`, partly off-canvas.
- Details hero: violet at the top right, cyan at the bottom left.
- App: cyan at the top right.

**Icons.** Inline stroke SVGs on a 24 grid, 1.8 stroke, round caps and joins. The path data is in the source files. Use `lucide-react` equivalents only if they match visually; otherwise copy the paths into an `<Icon>` component.

---

## 2. Course details page (1440 design width)

Page gutter 80px, max content width 1280. The sections run top to bottom:

1. **Hero** (`CourseAIEHero`, 900 tall)
   - **Top bar.** Logo and "Zenith Studio" on the left, a glass pill nav in the middle (Overview · Curriculum · Inside · Outcomes · Career path, active item `rgba(255,255,255,0.07)`), and a Frost "Start the course" button on the right.
   - **Left column (640px):**
     - Kicker pill with a violet glowing dot: "Self-paced course · Career Path Edition".
     - H1 "AI" / "Engineering". The second line is gradient text: `linear-gradient(100deg,#F5F6F8,#C7B0FF 45%,#9BDDFF)`.
     - Lede, then two buttons.
     - A 3-cell stats strip (8 modules · 11 in-app pages · 6.5h) in one glass bar with hairline dividers.
   - **Right column: "stack card" (540px).**
     - Header "The stack you'll build, bottom up · 6.5h total".
     - Modules 8→1 as rows: number in the stage colour, title, a bar whose width is minutes / 90, and minutes. The Capstone row is highlighted mint.
     - Footer "Starts with Module 0 · Orientation".
   - Grid background masked toward the right.
2. **Curriculum** (`CourseAIECurriculum`)
   - Section head: eyebrow, H2 on the left, intro on the right, aligned to the bottom.
   - Each stage row is a 240px left label (a coloured square plus "STAGE n" in mono, and the stage name) and the module cards on the right.
   - A vertical 1px line runs through the stage labels, fading to mint.
   - Each card has a number badge (border in the stage colour), a duration pill (clock + minutes) or a "Start here" pill for Orientation, a title and a summary.
   - Stage 2 has 3 cards in a row. The Capstone card has a mint gradient border and glow, plus 5 rubric chips.
3. **Inside the course** (`CourseAIEInside`): 4 equal columns (Learn, Practice, Build, Evidence).
   - Each column is a glass card with an H3 and a coloured mono "n pages" label.
   - Page rows each have an icon tile, a name and a description.
   - Section colours: Learn `#9BDDFF`, Practice `#C7B0FF`, Build `#FFD27A`, Evidence `#7FF0BD`.
4. **Outcomes and career path** (`CourseAIEOutcomes`)
   - 3×2 outcome cards with violet check tiles.
   - A "Tools and topics covered" chip row.
   - A hairline divider.
   - "Why it matters": a 420px heading column plus a numbered list with hairlines between rows.
   - A Career Path CTA banner with a violet-to-cobalt gradient, violet border, Frost primary button and glass secondary button.

The details page has no in-page animation in the design. Keep it static apart from hover states.

---

## 3. Course app (the student product)

**Shell** (identical on every app screen):
- **Sidebar (260px):**
  - Brand block: logo plus "AI Engineering / Career Path Edition".
  - Groups Learn, Practice, Build and Evidence, each with a mono group label.
  - 40px nav items with an icon and label. The active item gets a `rgba(92,200,255,0.10)` fill, an inset cyan ring at 0.30, and a cyan icon.
  - Footer card showing course progress (label, %, 6px bar) and the student avatar and name.
- **Main (padding 32px 56px 56px):**
  - **Top bar.** On the left, a mono stage line "Stage 0 · Prompting foundations" and "Module 1 ·" in cyan followed by the module title. On the right, a glass pill tab bar: Overview · Lessons · Exercise · Quiz · Project · Cheat sheet, with the active tab at `rgba(255,255,255,0.08)`.
  - A cyan glow in the top-right corner.

Nav item → route:

| Sidebar item | Route | Designed? |
|---|---|---|
| Dashboard | `/learn` | derive from the system |
| Syllabus | `/learn/modules/[module]` (module overview) | ✅ ChapterOverview |
| Learning Roadmap | `/learn/roadmap` | derive |
| Cheat Sheets | `/learn/cheat-sheets` → `/learn/modules/[m]/cheat-sheet` | ✅ ChapterCheatSheet |
| Python Foundations | `/learn/python` | derive |
| Quiz Center | `/learn/quizzes` → `/learn/modules/[m]/quiz` | ✅ ChapterQuiz |
| Challenges | `/learn/challenges` | derive |
| Projects | `/learn/projects` → `/learn/modules/[m]/project` | ✅ ChapterProject |
| Final Assessment · My Portfolio · Career Path | `/learn/...` | derive |

**Module tabs:**
- `/learn/modules/[m]` shows the overview.
- `/lessons/[lesson]` shows a lesson.
- The exercise, quiz, project and cheat sheet tabs each have their own sub-route.

### Screens
- **Overview**
  - Hero panel with a cyan gradient border: eyebrow "Module 1 · 45 minutes", H1, summary, a 5-stat row, a 168px progress ring (conic-gradient) showing "3/6 lessons done", and a "Continue lesson" button.
  - Lesson list with three states: done (mint check), current (cyan ring, glow, highlighted row) and next (empty ring).
  - "By the end you can" grid (2 columns).
  - Right column (400px): "Practice and build" link cards.
- **Lesson**
  - Article column (max 780px): eyebrow and read time, H1, paragraphs, H2s, a "three ways it fails" card row, a code card (header strip with filename and PYTHON label), a cyan "Key idea" callout and a pipeline flow diagram.
  - Footer with previous and next buttons.
  - Right rail (300px): compact lesson list, "On this page" links, and a mint cheat-sheet link.
- **Exercise**: interactive, see §4. Instructions column (360px) plus an editor card (flex), with a 210px terminal inside the editor card.
- **Quiz**: interactive, see §4. Question card plus a 320px side rail ("About this quiz" and a review link).
- **Project**
  - Amber-tinted hero with a brief, "Start project" and "Download starter" buttons, and a facts card.
  - Three milestone cards, the first with an amber ring.
  - Requirements checklist.
  - Rubric with amber bars (width = points × 4%).
  - Starter file tree in mono, folders in cyan.
- **Cheat sheet**
  - Header with Print and Download PDF buttons.
  - 2-column grid of boxes: pipeline, prompt pattern, repair prompt, validate, error → action table, rules of thumb.
  - Must print cleanly. Add `@media print` with a light theme and one page per module.

---

## 4. Interaction specs (exact)

### Code exercise (`ChapterExercise`)
- **State:**
  - `mode` is one of starter, typing or solved.
  - `typed` is a character count.
  - `tests[]` holds idle, run, pass or fail for each test.
  - Also `log[]`, `running`, `hint` and `done`.
- **Editor:** the fixed header lines, then the body. The body is the starter body, or the solution when typing or solved. Changed lines get a background of `rgba(92,200,255,0.05)`.
- **Run tests:**
  - The log starts with `$ pytest -q test_parse_ticket.py`.
  - Each test i turns "run" (spinner) at 380 + i×620 ms and resolves 380 ms later.
  - A pass is logged `PASSED  name` in `#7FF0BD`. A fail is logged `FAILED  name` in `#FF9BB0`, followed by an indented dim failure message.
  - The summary line comes 200 ms after the last test.
  - The progress bar width is passed / total. It is cyan, and turns mint at 100%.
- **Watch solution:** types 3 characters every 24 ms, with a blinking cyan caret (2px, glow) at the end of the current line.
- **Autoplay:** the design autoplays run → type → run on first view. In the product, make autoplay off by default, and keep "Watch solution" as the demo.
- **Real execution:** the design fakes results. The product must run the student's code for real: Pyodide in a Web Worker (it ships `pydantic`), running the test file, streaming output to the terminal, with a timeout.
- **"Exercise complete" card** (mint, pulsing ring) appears when all tests pass. It links to the quiz.
- **Hint:** toggles an amber callout.

### Quiz (`ChapterQuiz`)
- **State:** `q`, `sel`, `checked`, `score`, `finished`.
- **Options:**
  - Idle: border `rgba(255,255,255,0.12)`.
  - Selected: cyan border, `rgba(92,200,255,0.10)` fill.
  - After checking, the correct answer is mint and a wrong pick is ember.
- **Progress dots:** the current one is 34px wide (pill); the rest are 10px. Answered dots show green or red.
- **Primary button:** "Check answer", then "Next question", then "See my score". It sits at 0.45 opacity until an option is picked.
- **Score screen:** big score, a bar, pass or fail copy (pass mark 4 of 5), "Retake quiz" and "Continue to lesson 1.5".

---

## 5. Responsive rules (not in the design; keep the look)

The designs are 1440 desktop.
- ≥1280: match the screenshots exactly.
- 1024–1279: shrink the gutters from 80 to 48, and let grids keep their columns.
- <1024:
  - The app sidebar becomes a drawer behind a menu button.
  - Module tabs become a horizontally scrollable pill row.
  - Two-column layouts stack, with the right rail going below the main content.
  - The editor and instructions stack, editor second.
- <640: details hero H1 at 64px, stats wrap to 3 compact cells, curriculum cards go to one column, and the stage label sits above its cards.

Touch targets ≥44px everywhere. Respect `prefers-reduced-motion` (no caret blink, no autoplay).

## 6. Placeholders in the design
`[N]%` course progress, `[Student name]`, `[N]` avatar initials, and the "3/6" and "3 of 6" progress figures are sample data. Wire them all to real progress. The Module 1 lesson, exercise, quiz and project copy is sample content, so use the real course content.
