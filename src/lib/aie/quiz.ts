import { QUIZ_DRAW_SIZE, type QuizContent, type QuizQuestion } from "./types";

/** A picked option index, or the number typed for a numeric question. */
export type QuizAnswer = number | string;

export const isCorrect = (q: QuizQuestion, answer: QuizAnswer): boolean => {
  if (q.numeric) {
    const n = Number(String(answer).trim().replace(/,/g, ""));
    return String(answer).trim() !== "" && Number.isFinite(n) && Math.abs(n - q.numeric.answer) <= q.numeric.tolerance;
  }
  return typeof answer === "number" && q.options?.[answer]?.correct === true;
};

/** Grades a finished attempt on the server. Only questions that were answered count, and at most one draw (`max`) of them.
    `passMark` is how many must be right; an attempt that answered fewer questions than a full draw can never pass. */
export function gradeQuiz(bank: QuizQuestion[], passMark: number, answers: Record<string, QuizAnswer>, max = QUIZ_DRAW_SIZE) {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const ids = Object.keys(answers);
  if (ids.length === 0 || ids.length > max || ids.some((id) => !byId.has(id))) throw new Error("Invalid quiz answers");
  const score = ids.filter((id) => isCorrect(byId.get(id)!, answers[id]!)).length;
  return { score, total: ids.length, passed: ids.length >= Math.min(max, bank.length) && score >= passMark };
}

const rng = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
};
function shuffled<T>(items: T[], seed: number): T[] {
  const rand = rng(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** The questions one attempt draws: a seeded shuffle of the bank, first `size`. The seed comes from the server so the page hydrates identically. */
export function drawQuestions(bank: QuizQuestion[], seed: number, size = QUIZ_DRAW_SIZE): QuizQuestion[] {
  return shuffled(bank, seed).slice(0, size);
}

/** A mixed quiz: `perModule` questions from each module's bank, then shuffled together. */
export function drawMixed(banks: QuizQuestion[][], perModule: number, seed: number): QuizQuestion[] {
  return shuffled(banks.flatMap((b, i) => drawQuestions(b, seed + i * 31, perModule)), seed + 7);
}

/** The order an attempt shows a question's options in (indexes into the original options, so answers stay comparable). */
export function optionOrder(q: QuizQuestion, seed: number): number[] {
  return shuffled((q.options ?? []).map((_, i) => i), seed);
}

/** Old Quiz Center bands. */
export function masteryBand(pct: number): { label: string; tone: "mint" | "cyan" | "amber" | "ember" } {
  if (pct >= 90) return { label: "Mastered", tone: "mint" };
  if (pct >= 80) return { label: "Strong", tone: "cyan" };
  if (pct >= 70) return { label: "Needs review", tone: "amber" };
  return { label: "Revisit module", tone: "ember" };
}
