"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LEARN_BASE } from "@/components/learn/nav";
import { debugMessage, gradeDebugAnswer, gradeDesign, type DesignStatus, type Scores } from "@/lib/aie/capstone";
import { debugScoreFor, finalFor, getCapstoneState, patchCapstone } from "@/lib/aie/capstone-db";
import { getCapstone, getModule, getProject } from "@/lib/aie/content";
import { markLessonComplete, saveExerciseRun, saveOrientation, saveProjectDraft, saveQuizAttempt, submitProject } from "@/lib/aie/progress";
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

/** Module 0: stores the path finder's top directions or the self-check score (each saved on its own). */
export async function saveOrientationAction(input: { pathTop: string[] } | { score: number; total: number }): Promise<void> {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  if ("pathTop" in input) {
    if (!Array.isArray(input.pathTop) || input.pathTop.length > 5 || input.pathTop.some((k) => typeof k !== "string" || k.length > 40)) throw new Error("Invalid path");
    await saveOrientation(userId, { pathTop: input.pathTop });
  } else {
    if (!Number.isInteger(input.score) || !Number.isInteger(input.total) || input.total !== 5 || input.score < 0 || input.score > input.total) throw new Error("Invalid score");
    await saveOrientation(userId, { selfCheckScore: input.score, selfCheckTotal: input.total });
  }
  revalidatePath(`${LEARN_BASE}/modules/0`, "layout");
}

export type CapstoneInput =
  | { kind: "draft"; design?: Record<string, string>; debugAnswer?: string; review?: Record<string, string> }
  | { kind: "design"; values: Record<string, string> }
  | { kind: "impl"; code: string; passed: number }
  | { kind: "debugQ1"; index: number | null }
  | { kind: "debugText"; answer: string };

export type CapstoneResult = {
  scores: Scores;
  total: number;
  complete: boolean;
  statuses?: Record<string, DesignStatus>;
  message?: string;
  ok?: boolean;
};

/** Module 8: saves a part and grades it on the server. Returns every part's score and the final score. */
export async function capstoneAction(input: CapstoneInput): Promise<CapstoneResult> {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const { content, text } = await getCapstone();
  const before = await getCapstoneState(userId);
  const clip = (m: Record<string, string> | undefined) => Object.fromEntries(Object.entries(m ?? {}).slice(0, 20).map(([k, v]) => [k.slice(0, 40), String(v).slice(0, 4000)]));
  const scores = { ...before.scores };
  let out: Partial<CapstoneResult> = {};

  if (input.kind === "draft") {
    await patchCapstone(userId, {
      ...(input.design ? { design: { ...before.design, ...clip(input.design) } } : {}),
      ...(input.review ? { review: { ...before.review, ...clip(input.review) } } : {}),
      ...(typeof input.debugAnswer === "string" ? { debugAnswer: input.debugAnswer.slice(0, 4000) } : {}),
    });
  } else if (input.kind === "design") {
    const values = clip(input.values);
    const g = gradeDesign(content.design.fields, values, text.design);
    scores.design = g.score;
    await patchCapstone(userId, { design: values, designScore: g.score });
    out = { statuses: g.statuses };
  } else if (input.kind === "impl") {
    const total = content.implementation.tests.length;
    if (typeof input.code !== "string" || input.code.length > 20000 || !Number.isInteger(input.passed) || input.passed < 0 || input.passed > total) throw new Error("Invalid run");
    scores.impl = Math.round((input.passed / total) * 100);
    await patchCapstone(userId, { implCode: input.code, implScore: scores.impl });
  } else if (input.kind === "debugQ1") {
    const q1 = input.index;
    if (q1 !== null && !content.debugging.options[q1]) throw new Error("Invalid option");
    scores.debug = debugScoreFor(q1 === null ? null : content.debugging.options[q1]!.correct, q1, before.debugAnswerOk);
    await patchCapstone(userId, { debugQ1: q1, debugScore: scores.debug });
  } else {
    const grade = gradeDebugAnswer(String(input.answer).slice(0, 4000));
    const q1 = before.debugQ1;
    scores.debug = debugScoreFor(q1 === null ? null : content.debugging.options[q1]!.correct, q1, grade.pass);
    await patchCapstone(userId, { debugAnswer: String(input.answer).slice(0, 4000), debugAnswerOk: grade.pass, debugScore: scores.debug });
    out = { message: debugMessage(grade, text.debug), ok: grade.pass };
  }

  revalidatePath(`${LEARN_BASE}/modules/8`, "layout");
  return { scores, ...finalFor(scores, content.passMark), ...out };
}
