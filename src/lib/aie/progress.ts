import { db } from "@/lib/db";
import type { ModuleContent } from "./types";

/** Lesson ids ("1.4") the student has completed. */
export async function getCompletedLessons(userId: string): Promise<Set<string>> {
  const rows = await db.aieLessonProgress.findMany({ where: { userId }, select: { lessonId: true } });
  return new Set(rows.map((r) => r.lessonId));
}

export async function markLessonComplete(userId: string, lessonId: string): Promise<void> {
  await db.aieLessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId },
    update: {},
  });
}

/** The lesson to resume: first incomplete in the module, else the first one. */
export function nextLesson(mod: ModuleContent, done: Set<string>) {
  return mod.lessons.find((l) => !done.has(l.number)) ?? mod.lessons[0];
}

export function courseProgress(modules: ModuleContent[], done: Set<string>) {
  const total = modules.reduce((n, m) => n + m.lessons.length, 0);
  const complete = modules.reduce((n, m) => n + m.lessons.filter((l) => done.has(l.number)).length, 0);
  return { total, complete, percent: total === 0 ? 0 : Math.round((complete / total) * 100) };
}

/** Module the sidebar "Syllabus" link opens: the one holding the next incomplete lesson. */
export function currentModuleNumber(modules: ModuleContent[], done: Set<string>) {
  return (modules.find((m) => m.lessons.some((l) => !done.has(l.number))) ?? modules[0])?.number ?? 1;
}

export type ExerciseProgress = { code: string; attempted: boolean; passed: number; total: number };

export async function getExerciseProgress(userId: string, module: number): Promise<ExerciseProgress | null> {
  return db.aieExerciseProgress.findUnique({
    where: { userId_module: { userId, module } },
    select: { code: true, attempted: true, passed: true, total: true },
  });
}

/** Saves a run. `passed` keeps the best score so a later worse attempt never un-completes the exercise. */
export async function saveExerciseRun(userId: string, module: number, code: string, passed: number, total: number): Promise<void> {
  const prev = await db.aieExerciseProgress.findUnique({ where: { userId_module: { userId, module } }, select: { passed: true } });
  const best = Math.max(prev?.passed ?? 0, passed);
  await db.aieExerciseProgress.upsert({
    where: { userId_module: { userId, module } },
    create: { userId, module, code, attempted: true, passed: best, total },
    update: { code, attempted: true, passed: best, total },
  });
}

export async function saveQuizAttempt(userId: string, module: number, score: number, total: number, passed: boolean, mixedId?: string): Promise<void> {
  await db.aieQuizAttempt.create({ data: { userId, module, score, total, passed, mixedId: mixedId ?? null } });
}

/** Modules whose quiz the student has passed at least once. */
export async function getPassedQuizzes(userId: string): Promise<Set<number>> {
  const rows = await db.aieQuizAttempt.findMany({ where: { userId, passed: true, mixedId: null }, select: { module: true }, distinct: ["module"] });
  return new Set(rows.map((r) => r.module));
}

export type QuizStat = { attempts: number; best: { score: number; total: number } | null; last: { score: number; total: number } | null };

/** Attempts, best and latest score per quiz, keyed "m3" for a module quiz or "mix_1_3" for a mixed one. */
export async function getQuizStats(userId: string): Promise<Map<string, QuizStat>> {
  const rows = await db.aieQuizAttempt.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { module: true, mixedId: true, score: true, total: true } });
  const out = new Map<string, QuizStat>();
  for (const r of rows) {
    const key = r.mixedId ?? `m${r.module}`;
    const cur = out.get(key) ?? { attempts: 0, best: null, last: null };
    const one = { score: r.score, total: r.total };
    out.set(key, { attempts: cur.attempts + 1, best: !cur.best || one.score / one.total > cur.best.score / cur.best.total ? one : cur.best, last: one });
  }
  return out;
}

export type ProjectProgress = {
  checklist: boolean[];
  rubric: Record<string, number>;
  githubUrl: string;
  description: string;
  technologies: string;
  testsPassed: string;
  score: number;
  completed: boolean;
};

const projectSelect = { checklist: true, rubric: true, githubUrl: true, description: true, technologies: true, testsPassed: true, score: true, completedAt: true } as const;

function toProjectProgress(row: { checklist: unknown; rubric: unknown; githubUrl: string; description: string; technologies: string; testsPassed: string; score: number; completedAt: Date | null }): ProjectProgress {
  const { completedAt, ...rest } = row;
  return { ...rest, checklist: Array.isArray(row.checklist) ? row.checklist.map(Boolean) : [], rubric: (row.rubric ?? {}) as Record<string, number>, completed: completedAt !== null };
}

export async function getProjectProgress(userId: string, projectId: number): Promise<ProjectProgress | null> {
  const row = await db.aieProjectProgress.findUnique({ where: { userId_projectId: { userId, projectId } }, select: projectSelect });
  return row && toProjectProgress(row);
}

export async function getAllProjectProgress(userId: string): Promise<Map<number, ProjectProgress>> {
  const rows = await db.aieProjectProgress.findMany({ where: { userId }, select: { projectId: true, ...projectSelect } });
  return new Map(rows.map((r) => [r.projectId, toProjectProgress(r)]));
}

type ProjectSave = { checklist: boolean[]; rubric: Record<string, number>; score: number };

/** Autosave of the checklist and rubric (does not complete the project). */
export async function saveProjectDraft(userId: string, projectId: number, data: ProjectSave): Promise<void> {
  await db.aieProjectProgress.upsert({ where: { userId_projectId: { userId, projectId } }, create: { userId, projectId, ...data }, update: data });
}

/** "Save project": stores the submission fields and marks it completed (into My Portfolio). */
export async function submitProject(
  userId: string,
  projectId: number,
  data: ProjectSave & { githubUrl: string; description: string; technologies: string; testsPassed: string },
): Promise<void> {
  await db.aieProjectProgress.upsert({
    where: { userId_projectId: { userId, projectId } },
    create: { userId, projectId, ...data, completedAt: new Date() },
    update: { ...data, completedAt: new Date() },
  });
}

export type Orientation = { pathTop: string[]; selfCheckScore: number | null; selfCheckTotal: number | null };

export async function getOrientation(userId: string): Promise<Orientation | null> {
  return db.aieOrientation.findUnique({ where: { userId }, select: { pathTop: true, selfCheckScore: true, selfCheckTotal: true } });
}

export async function saveOrientation(userId: string, data: Partial<Orientation>): Promise<void> {
  await db.aieOrientation.upsert({ where: { userId }, create: { userId, ...data }, update: data });
}
