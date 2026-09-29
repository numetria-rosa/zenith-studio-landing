/** Shape of content/ai-engineering/modules/<n>.json (mirrors design-handoff content-sample/module-1.sample.json). */

export type LessonMeta = { number: string; title: string; minutes: number };

export type ExerciseContent = {
  id: string;
  title: string;
  language: string;
  file: string;
  prompt: string;
  header: string;
  starter: string;
  solution: string;
  hint?: string;
  tests: { name: string; failureMessage: string }[];
  /** Overview card title, when it differs from the exercise title. */
  cardTitle?: string;
};

export type QuizContent = {
  passMark: number;
  questions: { question: string; options: string[]; answerIndex: number; explanation: string }[];
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
