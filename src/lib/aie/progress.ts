import { db } from "@/lib/db";
import type { ModuleContent } from "./types";

/** Lesson ids ("1.4") the student has completed. */
export async function getCompletedLessons(userId: string): Promise<Set<string>> {
  // Visual tests only: fixed progress instead of the database. Never active in production.
  if (process.env.NODE_ENV !== "production" && process.env.AIE_FIXTURE_DONE !== undefined) {
    return new Set(process.env.AIE_FIXTURE_DONE.split(",").filter(Boolean));
  }
  const rows = await db.aieLessonProgress.findMany({ where: { userId }, select: { lessonId: true } });
  return new Set(rows.map((r) => r.lessonId));
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
