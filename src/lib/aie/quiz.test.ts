import { describe, expect, it } from "vitest";
import { drawQuestions, gradeQuiz } from "./quiz";
import type { QuizContent } from "./types";

const mc = (id: string, right: number) => ({
  id,
  question: id,
  source: "checkpoint" as const,
  options: [0, 1, 2].map((i) => ({ text: String(i), correct: i === right, why: "" })),
});
const quiz: QuizContent = {
  passMark: 4,
  questions: [mc("a", 0), mc("b", 1), mc("c", 2), mc("d", 0), { id: "n", question: "n", source: "checkpoint", numeric: { answer: 100, tolerance: 0.5, correct: "", incorrect: "" } }],
};

describe("gradeQuiz", () => {
  it("passes at the pass mark and fails below it", () => {
    expect(gradeQuiz(quiz, { a: 0, b: 1, c: 2, d: 0, n: "100" })).toMatchObject({ score: 5, passed: true });
    expect(gradeQuiz(quiz, { a: 0, b: 1, c: 2, d: 1, n: "100" })).toMatchObject({ score: 4, passed: true });
    expect(gradeQuiz(quiz, { a: 0, b: 1, c: 0, d: 1, n: "100" })).toMatchObject({ score: 3, passed: false });
  });
  it("accepts numeric answers within tolerance, rejects blank and junk", () => {
    expect(gradeQuiz(quiz, { n: "100.4" }).score).toBe(1);
    expect(gradeQuiz(quiz, { n: "101" }).score).toBe(0);
    expect(gradeQuiz(quiz, { n: " " }).score).toBe(0);
    expect(gradeQuiz(quiz, { n: "abc" }).score).toBe(0);
  });
  it("cannot pass by answering only some questions, or unknown ones", () => {
    expect(gradeQuiz(quiz, { a: 0 }).passed).toBe(false);
    expect(() => gradeQuiz(quiz, { zzz: 0 })).toThrow();
    expect(() => gradeQuiz(quiz, {})).toThrow();
  });
});

describe("drawQuestions", () => {
  it("is deterministic per seed and draws five of the bank", () => {
    expect(drawQuestions(quiz.questions, 7).map((q) => q.id)).toEqual(drawQuestions(quiz.questions, 7).map((q) => q.id));
    expect(drawQuestions(quiz.questions, 7)).toHaveLength(5);
    expect(new Set(drawQuestions(quiz.questions, 3).map((q) => q.id)).size).toBe(5);
  });
});
