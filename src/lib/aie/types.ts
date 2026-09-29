/** Shape of content/ai-engineering/modules/<n>.json (mirrors design-handoff content-sample/module-1.sample.json). */

export type LessonMeta = { number: string; title: string; minutes: number };

export type ExerciseContent = {
  /** The lesson number the exercise belongs to ("1.7"). */
  id: string;
  label: string;
  /** Inline MDX (bold, code) for the brief. */
  instructions: string;
  functionName: string;
  fileName: string;
  starter: string;
  solution: string;
  hints: { title: string; mdx: string }[];
  /** One entry per test the harness runs, in order: its name and the failure hint shown when it fails. */
  tests: { name: string; hint: string }[];
  /** Path (under content/ai-engineering) of the unchanged Python harness. */
  harness: string;
  /** Overview card title, when it differs from the lesson title. */
  cardTitle?: string;
};

export type QuizOption = { text: string; correct: boolean; why: string };
export type QuizQuestion = {
  id: string;
  /** Inline MDX. */
  question: string;
  source: "checkpoint" | "pool";
  options?: QuizOption[];
  principle?: string;
  /** Typed-number question (a handful in modules 2, 3, 6 and 7). */
  numeric?: { answer: number; tolerance: number; correct: string; incorrect: string };
  objective?: string;
  difficulty?: string;
};

export type QuizContent = {
  passMark: number;
  questions: QuizQuestion[];
  /** Overview card copy. */
  cardTitle?: string;
  cardNote?: string;
};

export type ProjectContent = { title: string; brief: string; passMark: number };

export type CheatSheetContent = { title: string };

export type ModuleContent = {
  number: number;
  slug: string;
  title: string;
  stage: string;
  minutes: number | null;
  summary: string;
  objectives: string[];
  lessons: LessonMeta[];
  exercise?: ExerciseContent;
  quiz?: QuizContent;
  project?: ProjectContent;
  cheatSheet?: CheatSheetContent;
  glossary?: { term: string; definition: string }[];
  /** True when lessons/<n>/further-reading.mdx exists. */
  furtherReading?: boolean;
};

export type CourseStage = {
  label: string;
  name: string | null;
  color: string;
  modules: { number: number; title: string; minutes: number | null; summary: string }[];
};

export type CourseIndex = { stages: CourseStage[] };

/** Questions the Quiz tab draws (shuffled) from a module's question bank. */
export const QUIZ_DRAW_SIZE = 5;
