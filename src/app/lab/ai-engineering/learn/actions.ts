"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LEARN_BASE } from "@/components/learn/nav";
import { getModule, getProject } from "@/lib/aie/content";
import { markLessonComplete, saveExerciseRun, saveProjectDraft, saveQuizAttempt, submitProject } from "@/lib/aie/progress";
import { cleanProjectInput, type ProjectInput } from "@/lib/aie/project";
import { gradeQuiz, type QuizAnswer } from "@/lib/aie/quiz";
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

/** Grades a finished quiz on the server and stores the attempt. Returns the score so the client shows the server's number. */
export async function submitQuizAction(module: number, answers: Record<string, QuizAnswer>): Promise<{ score: number; total: number; passed: boolean }> {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const mod = await getModule(module);
  if (!mod?.quiz) throw new Error("No quiz");
  const result = gradeQuiz(mod.quiz, answers);
  await saveQuizAttempt(userId, module, result.score, result.total, result.passed);
  revalidatePath(`${LEARN_BASE}/modules/${module}`, "layout");
  return result;
}

/** Saves a project's checklist and rubric (submit=false, autosave) or the whole submission (submit=true, completes it). */
export async function saveProjectAction(projectId: number, input: ProjectInput, submit: boolean): Promise<{ score: number }> {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const project = await getProject(projectId);
  if (!project) throw new Error("Unknown project");
  const clean = cleanProjectInput(project, input);
  if (submit) await submitProject(userId, projectId, clean);
  else await saveProjectDraft(userId, projectId, { checklist: clean.checklist, rubric: clean.rubric, score: clean.score });
  revalidatePath(LEARN_BASE, "layout");
  return { score: clean.score };
}
