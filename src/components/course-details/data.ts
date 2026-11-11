import course from "@content/ai-engineering/course.json";
import path from "node:path";
import { courses, type CourseCard } from "@/app/lab/courses-data";
import { COURSE_RAIL_DATA, type CourseRailData } from "@/lib/course-rail-data";
import { getCourse } from "@/lib/courses";

export type Module = { number: number; title: string; minutes: number | null; summary: string };
export type Stage = { label: string; name: string | null; color: string; modules: Module[] };
export type AppSection = {
  name: string;
  color: string;
  description: string;
  pages: { icon: string; name: string; description: string }[];
};

/** Everything the course details page shows for one course. The page and its sections only ever read this. */
export type CourseDetails = {
  id: string;
  title: string;
  kicker: string;
  tagline: string;
  stats: { value: string; label: string }[];
  stages: Stage[];
  /** The last module is a graded capstone: shown in green, with the rubric chips when there are any. */
  capstone: boolean;
  capstoneRubric: string[];
  appSections: AppSection[];
  outcomes: string[];
  topics: string[];
  whyItMatters: string[];
  careerPath: { eyebrow: string; title: string; body: string };
  /** The "sell what you built" final module, which only AI Engineering has. */
  finalModule: boolean;
  copy: { curriculumIntro: string; outcomesIntro: string; whyTitle: string };
};

export const allModules = (d: CourseDetails) => d.stages.flatMap((s) => s.modules.map((m) => ({ ...m, stage: s })));
/** Numbered modules only (Orientation is module 0 and not counted in "8 modules"). */
export const numberedModules = (d: CourseDetails) => allModules(d).filter((m) => m.number > 0);
export const totalPages = (d: CourseDetails) => d.appSections.reduce((n, s) => n + s.pages.length, 0);
export const totalHours = (d: CourseDetails) => hoursLabel(numberedModules(d).reduce((n, m) => n + (m.minutes ?? 0), 0));

const hoursLabel = (minutes: number) => `${Math.round((minutes / 60) * 10) / 10}h`;

/** AI Engineering: its own hand-written content file. */
const ai = course as unknown as typeof course & { stages: Stage[]; appSections: AppSection[] };
const aiEngineering: CourseDetails = {
  id: ai.slug,
  title: ai.title,
  kicker: ai.kicker,
  tagline: ai.tagline,
  stats: [],
  stages: ai.stages,
  capstone: true,
  capstoneRubric: ai.capstoneRubric,
  appSections: ai.appSections,
  outcomes: ai.outcomes,
  topics: ai.topics,
  whyItMatters: ai.whyItMatters,
  careerPath: ai.careerPath,
  finalModule: true,
  copy: {
    curriculumIntro: "Orientation first, then four stages that each build on the last, ending in a capstone graded against a rubric, not vibes.",
    outcomesIntro: `${numberWord(ai.outcomes.length)} things you can do by the end, each one practised on a real product rather than a toy example.`,
    whyTitle: "The gap between a demo and a product.",
  },
};
aiEngineering.stats = [
  { value: String(numberedModules(aiEngineering).length), label: "modules" },
  { value: String(totalPages(aiEngineering)), label: "in-app pages" },
  { value: totalHours(aiEngineering), label: "of module content" },
];

const STAGE_COLORS = ["#5CC8FF", "#7B9BFF", "#A48BFF", "#E58BFF", "#FFB86B", "#FF8FA3"];
const MINT = "#3DDC97";

// The same five groups every course's sidebar uses (course-rail-data.ts), described generically so it holds for all of them.
const GROUPS: Record<string, { color: string; description: string }> = {
  learn: { color: "#9BDDFF", description: "Course structure, reference material, and where you left off" },
  practice: { color: "#C7B0FF", description: "Extra reps, quizzes, and skill tracking" },
  decide: { color: "#FFB86B", description: "Judgment-call scenarios, labeled simulations" },
  build: { color: "#7B9BFF", description: "The real projects and labs you'll actually ship" },
  evidence: { color: MINT, description: "Portfolio, career path, and proof you can show" },
};

const ICON_BY_FILE: [RegExp, string][] = [
  [/dashboard/, "home"], [/syllabus/, "list"], [/roadmap/, "map"], [/cheat/, "sheet"], [/quiz/, "quiz"],
  [/challenge|diagnostic|assessment/, "flag"], [/capstone/, "star"], [/portfolio/, "folder"], [/career/, "award"],
  [/project|lab|build|ticket/, "box"], [/python|sql|code|survival/, "code"], [/progress|skill/, "trend"],
];
const iconFor = (file: string) => ICON_BY_FILE.find(([re]) => re.test(file.toLowerCase()))?.[1] ?? "file";

function numberWord(n: number) {
  return ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"][n] ?? String(n);
}

/** Any published course, built from the same catalog and sidebar data the old details page read. */
function fromCatalog(card: CourseCard, rail: CourseRailData | undefined): CourseDetails | null {
  const curriculum = card.curriculum ?? [];
  if (!card.available || curriculum.length === 0) return null;

  const minutes = card.moduleMinutes ?? {};
  const summaryOf = new Map(curriculum.map((m) => [m.title, m.description]));
  const make = (title: string, number: number): Module => ({ number, title, minutes: minutes[title] ?? null, summary: summaryOf.get(title) ?? "" });

  const groups = card.stages ?? [{ label: "Modules", title: "", moduleTitles: curriculum.filter((m) => m.title !== "Orientation").map((m) => m.title) }];
  const staged = new Set(groups.flatMap((g) => g.moduleTitles));
  const ungrouped = curriculum.filter((m) => !staged.has(m.title));
  const stages: Stage[] = [];
  let n = ungrouped[0]?.title === "Orientation" ? 0 : 1;
  if (ungrouped.length > 0) {
    stages.push({ label: "Before you start", name: null, color: "#8C92A0", modules: ungrouped.map((m) => make(m.title, n++)) });
    n = Math.max(n, 1);
  }
  groups.forEach((g, i) => stages.push({ label: g.label, name: g.title || null, color: STAGE_COLORS[i % STAGE_COLORS.length], modules: g.moduleTitles.map((t) => make(t, n++)) }));
  const capstone = Boolean(card.hasCapstone) && Boolean(card.stages);
  if (capstone) stages[stages.length - 1].color = MINT;

  const appSections: AppSection[] = (rail?.navGroups ?? []).map((g) => ({
    name: g.label,
    color: GROUPS[g.id]?.color ?? "#9BDDFF",
    description: GROUPS[g.id]?.description ?? "",
    pages: g.items.map(([file, label]) => ({ icon: iconFor(file), name: label, description: "" })),
  }));

  const details: CourseDetails = {
    id: card.id,
    title: card.name,
    kicker: `${card.categoryLabel} · Self-paced course`,
    tagline: card.summary,
    stats: [],
    stages,
    capstone,
    capstoneRubric: [],
    appSections,
    outcomes: card.whatYoullDo,
    topics: card.topics,
    whyItMatters: card.facts,
    careerPath: { eyebrow: "Career path", title: "What you leave with.", body: card.careerPath },
    finalModule: false,
    copy: {
      curriculumIntro: "Every module, in order, with the time each one takes.",
      outcomesIntro: `${numberWord(card.whatYoullDo.length)} things you can do by the end.`,
      whyTitle: "Why it matters.",
    },
  };
  const modules = numberedModules(details).length;
  details.stats = [
    { value: String(modules), label: "modules" },
    ...(card.practiceTasks ? [{ value: String(card.practiceTasks), label: "practice tasks" }] : []),
    ...(card.portfolioProjects ? [{ value: String(card.portfolioProjects), label: "portfolio projects" }] : []),
    ...(totalHours(details) !== "0h" ? [{ value: totalHours(details), label: "of module content" }] : []),
  ].slice(0, 4);
  return details;
}

/** The details page content for a course, or null when it has none yet (coming-soon courses keep the old page). */
export function getCourseDetails(courseId: string): CourseDetails | null {
  if (courseId === aiEngineering.id) return aiEngineering;
  const card = courses.find((c) => c.id === courseId);
  if (!card) return null;
  const catalog = getCourse(card.id);
  return fromCatalog(card, COURSE_RAIL_DATA[catalog?.contentDir ? path.basename(catalog.contentDir) : card.id]);
}
