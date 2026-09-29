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

/** Grades a finished attempt on the server. Only questions that were answered count, and at most one draw of them. */
export function gradeQuiz(quiz: QuizContent, answers: Record<string, QuizAnswer>) {
  const byId = new Map(quiz.questions.map((q) => [q.id, q]));
  const ids = Object.keys(answers);
  if (ids.length === 0 || ids.length > QUIZ_DRAW_SIZE || ids.some((id) => !byId.has(id))) throw new Error("Invalid quiz answers");
  const score = ids.filter((id) => isCorrect(byId.get(id)!, answers[id]!)).length;
  return { score, total: ids.length, passed: ids.length >= Math.min(QUIZ_DRAW_SIZE, quiz.questions.length) && score >= quiz.passMark };
}

/** The questions one attempt draws: a seeded shuffle of the bank, first QUIZ_DRAW_SIZE. The seed comes from the server so the page hydrates identically. */
export function drawQuestions(bank: QuizQuestion[], seed: number): QuizQuestion[] {
  let s = seed >>> 0 || 1;
  const rand = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const out = [...bank];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out.slice(0, QUIZ_DRAW_SIZE);
}
