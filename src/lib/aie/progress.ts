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
