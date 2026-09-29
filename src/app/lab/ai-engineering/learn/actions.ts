"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LEARN_BASE } from "@/components/learn/nav";
import { getModule } from "@/lib/aie/content";
import { markLessonComplete, saveExerciseRun } from "@/lib/aie/progress";
import { requireEnrollment } from "@/lib/require-enrollment";

/** Marks a lesson done and moves on. `next` must stay inside the course app. */
export async function completeLessonAction(form: FormData): Promise<void> {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const lessonId = String(form.get("lessonId") ?? "");
  const next = String(form.get("next") ?? "");
  const mod = /^(\d+)\.\d+$/.test(lessonId) ? await getModule(Number(lessonId.split(".")[0])) : null;
  if (!mod?.lessons.some((l) => l.number === lessonId)) throw new Error("Unknown lesson");
  await markLessonComplete(userId, lessonId);
  revalidatePath(LEARN_BASE, "layout");
  redirect(next.startsWith(`${LEARN_BASE}/`) ? next : LEARN_BASE);
}

/** Stores the student's last run so "Watch solution" stays unlocked and the code survives a reload. */
export async function saveExerciseRunAction(module: number, code: string, passed: number): Promise<void> {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const mod = await getModule(module);
  if (!mod?.exercise || code.length > 20000 || !Number.isInteger(passed) || passed < 0 || passed > mod.exercise.tests.length) throw new Error("Invalid run");
  await saveExerciseRun(userId, module, code, passed, mod.exercise.tests.length);
  revalidatePath(`${LEARN_BASE}/modules/${module}`, "layout");
}
