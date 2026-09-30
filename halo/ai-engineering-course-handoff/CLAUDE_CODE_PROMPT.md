# Prompt for Claude Code

Copy everything below the line into Claude Code, run from the root of the course repo, with this folder copied in as `./design-handoff/`.

---

We're rebuilding the **AI Engineering** course (Zenith Studio) on our stack, using a finished design. The current course is static HTML with a design we're replacing. **Keep all of its content, and replace all of its design.** The target design must be matched pixel-accurately.

## What's in `./design-handoff/`
- `reference/source/*.dc.html`: **the source of truth.**
  - Every screen is one file.
  - Every size, colour, radius, gap, shadow and gradient is written as inline styles. Read them; don't guess.
- `reference/html/*.html`: the same screens as runnable pages. Open them in a browser; the exercise and quiz are interactive.
- `reference/screenshots/*.png`: the rendered result at 1440px wide. The exercise and quiz have one screenshot per interaction state.
- `design/DESIGN.md`: the spec. It covers foundations, page anatomy, route map, **exact interaction timings**, responsive rules and placeholders.
- `design/tokens.css`: design tokens as a Tailwind v4 `@theme` block, plus the `.glass`, `.glass-row`, `.eyebrow` and `.grid-bg` utilities.
- `data/schema.prisma`: a suggested content and student-data schema.
- `content-sample/course.json`: the details-page content.
- `content-sample/module-1.sample.json`: Module 1 as structured data. **Module 1's lesson, exercise, quiz and project copy is sample content written for the design. Use the real content from the existing course, in this shape.**
- `assets/zenith-logo.png`: the logo.

There are two surfaces:
1. **Course details page** (public, marketing) = `CourseAIEHero` + `CourseAIECurriculum` + `CourseAIEInside` + `CourseAIEOutcomes`, stacked in that order on one page. Violet accent.
2. **Course app** (enrolled students) = `ChapterOverview`, `ChapterLesson`, `ChapterExercise`, `ChapterQuiz`, `ChapterProject`, `ChapterCheatSheet`, all inside the shared app shell (sidebar + module top bar + tabs). Cyan accent.

## Stack
- Next.js (App Router) + TypeScript (strict) + Tailwind CSS v4. Import `design/tokens.css` into the global stylesheet.
- Fonts: `geist` (Geist + Geist Mono) via `next/font`.
- Neon Postgres + Prisma. Start from `data/schema.prisma`; adapt it if the repo already has models. Use a pooled `DATABASE_URL` and a direct `DIRECT_URL` for migrations.
- Access and payments: use what the repo already has. If there's nothing, plan for Whop membership checks (we sell through Whop) behind one `requireEnrollment()` helper, so it can be swapped.
- Code exercises run for real in the browser: Pyodide in a Web Worker (it includes `pydantic`), running each exercise's pytest file, streaming stdout to the terminal panel, with a timeout and a stop button.
- Where a component lib helps (dialog, drawer), use Radix primitives, styled to the design. No other UI kit.

## How to work (in this order)
1. **Read before building.**
   - Open every `reference/source/*.dc.html` and screenshot, and read `DESIGN.md` fully.
   - Then read the existing course repo and list every page and content type it has: modules, lessons, exercises, quizzes, projects, cheat sheets, Python foundations and anything else.
   - Show me that inventory and the route map from DESIGN.md §3 before writing code.
2. **Content pipeline.**
   - The repo's `/content` is the source of truth for course content. Use MDX for lesson bodies and typed JSON/TS for modules, exercises, quizzes, projects and cheat sheets, in the shape of `content-sample/`.
   - Write a one-off importer that pulls the real content out of the old static HTML into `/content`, then a `prisma db seed` that loads it.
   - Student data (enrollment, lesson progress, quiz attempts, exercise and project submissions) lives only in Postgres.
   - Never hand-copy content into components.
3. **Primitives first**, each matching the source markup exactly:
   - `Glass`, `Button` (primary Frost pill, glass pill), `Eyebrow`, `Pill`/`Chip`, `Icon` (copy the SVG paths from the source files)
   - `SectionHead`, `CodeBlock` (with the Python highlighter colours from tokens.css), `Callout`, `ProgressBar`, `ProgressRing`
   - `LessonRow` (done / current / next), `StatStrip`, `StageBadge`
4. **Course details page** at `/courses/ai-engineering`, a server component reading from the DB.
5. **App shell and screens** under `/learn`: sidebar, module top bar and tabs, then Overview, Lesson (MDX components mapped to the design's H2, paragraph, code card, key-idea callout, failure cards and flow diagram), Exercise, Quiz, Project and Cheat sheet (with print CSS and a PDF download).
6. **Interactions** exactly as in DESIGN.md §4. Match the timings, colours, states and copy. The exercise and quiz behaviour in `reference/html/ChapterExercise.html` and `ChapterQuiz.html` is the reference implementation. Port the logic to React; don't reinvent it.
   - The design's fake test results become real Pyodide runs.
   - Autoplay is **off** in the product.
7. **Pages that aren't designed:** Dashboard, Roadmap, Python Foundations, Challenges, Final Assessment, Portfolio, Career Path. Build these from the same primitives and shell, so they look like they came from the same designer. Tell me which ones you derived.

## Accuracy bar (non-negotiable)
- At 1440px wide, every designed screen must match its screenshot:
  - Same spacing, font sizes, weights, letter-spacing, colours, radii, borders, shadows, glows and gradients.
  - Don't substitute Tailwind defaults for the design's values. Use arbitrary values (`text-[17.5px]`, `tracking-[-0.045em]`, `bg-white/[0.035]`) or tokens.
- Set up Playwright visual checks:
  - Seed Module 1 with the sample content from `content-sample/`.
  - Screenshot each route at 1440 wide and compare to `reference/screenshots/`.
  - Iterate until the diffs are only anti-aliasing. Include the exercise and quiz states.
- Below 1440, follow DESIGN.md §5. The look stays the same; only the layout adapts.
- Accessibility:
  - Real `<button>`/`<a>` elements, visible cyan focus rings, touch targets ≥44px.
  - Text contrast ≥4.5:1.
  - `prefers-reduced-motion` respected.
  - Status never shown by colour alone.

## Rules
- Keep ALL the existing course content. Don't drop, shorten or rewrite lessons. If something in the old course has no place in the design, ask me where it goes.
- Placeholders in the design (`[N]%`, `[Student name]`, sample progress numbers) must be wired to real data.
- Brand is "Zenith Studio" (site: zenith-studio.site). Offers are "only through Zenith Studio".
- Don't add features, copy or sections that aren't in the design or the existing course without asking.
- Commit in small steps: primitives, details page, shell, each screen, interactions, visual tests. Give me a short summary after each step, including anything you couldn't match exactly and why.
