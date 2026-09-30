# AI Engineering course · design handoff

Handoff for rebuilding the course on Next.js + TypeScript + Tailwind + Neon + Prisma, matching the Obsidian designs exactly.

1. Copy this whole folder into the course repo as `design-handoff/`.
2. Open Claude Code in the repo and paste the prompt from `CLAUDE_CODE_PROMPT.md`.

```
design-handoff/
├─ CLAUDE_CODE_PROMPT.md      the prompt to paste
├─ design/
│  ├─ DESIGN.md               spec: foundations, screens, routes, interaction timings, responsive rules
│  └─ tokens.css              Tailwind v4 @theme tokens + glass/eyebrow utilities
├─ reference/
│  ├─ source/                 original design files (.dc.html), the source of truth for every value
│  ├─ html/                   the same screens as runnable pages (open in a browser)
│  ├─ runtime/dc-lite.js      tiny renderer the preview pages use (not part of the app)
│  └─ screenshots/            1440px renders, plus every exercise/quiz state
├─ data/schema.prisma         suggested Neon/Prisma schema (content + student progress)
├─ content-sample/            details-page content + Module 1 in the target data shape
└─ assets/zenith-logo.png
```

Screens:
- **Course details page:** CourseAIEHero, CourseAIECurriculum, CourseAIEInside, CourseAIEOutcomes.
- **Course app:** ChapterOverview, ChapterLesson, ChapterExercise, ChapterQuiz, ChapterProject, ChapterCheatSheet.
- **Design-system boards:** Foundations, Components.
