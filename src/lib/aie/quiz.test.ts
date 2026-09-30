import { describe, expect, it } from "vitest";
import { drawMixed, drawQuestions, gradeQuiz, masteryBand, optionOrder } from "./quiz";
import type { QuizQuestion } from "./types";

const mc = (id: string, right: number): QuizQuestion => ({
  id,
  question: id,
  source: "checkpoint",
  options: [0, 1, 2].map((i) => ({ text: String(i), correct: i === right, why: "" })),
});
const numeric: QuizQuestion = { id: "n", question: "n", source: "checkpoint", numeric: { answer: 100, tolerance: 0.5, correct: "", incorrect: "" } };
const bank = [mc("a", 0), mc("b", 1), mc("c", 2), mc("d", 0), numeric];

describe("gradeQuiz", () => {
  it("passes at the pass mark and fails below it", () => {
    expect(gradeQuiz(bank, 4, { a: 0, b: 1, c: 2, d: 0, n: "100" })).toMatchObject({ score: 5, passed: true });
    expect(gradeQuiz(bank, 4, { a: 0, b: 1, c: 2, d: 1, n: "100" })).toMatchObject({ score: 4, passed: true });
    expect(gradeQuiz(bank, 4, { a: 0, b: 1, c: 0, d: 1, n: "100" })).toMatchObject({ score: 3, passed: false });
  });
  it("accepts numeric answers within tolerance, rejects blank and junk", () => {
    expect(gradeQuiz(bank, 4, { n: "100.4" }).score).toBe(1);
    expect(gradeQuiz(bank, 4, { n: "101" }).score).toBe(0);
    expect(gradeQuiz(bank, 4, { n: " " }).score).toBe(0);
    expect(gradeQuiz(bank, 4, { n: "abc" }).score).toBe(0);
  });
  it("cannot pass by answering only some questions, or unknown ones, or more than a draw", () => {
    expect(gradeQuiz(bank, 1, { a: 0 }).passed).toBe(false);
    expect(() => gradeQuiz(bank, 4, { zzz: 0 })).toThrow();
    expect(() => gradeQuiz(bank, 4, {})).toThrow();
    expect(() => gradeQuiz(bank, 4, { a: 0, b: 1, c: 2, d: 0, n: "100" }, 3)).toThrow();
  });
  it("a bank smaller than a draw only needs answering in full", () => {
    expect(gradeQuiz([mc("a", 0)], 1, { a: 0 }).passed).toBe(true);
  });
});

describe("drawing", () => {
  it("is deterministic per seed and draws five of the bank", () => {
    expect(drawQuestions(bank, 7).map((q) => q.id)).toEqual(drawQuestions(bank, 7).map((q) => q.id));
    expect(drawQuestions(bank, 7)).toHaveLength(5);
    expect(new Set(drawQuestions(bank, 3).map((q) => q.id)).size).toBe(5);
  });
  it("a mixed quiz takes perModule from each module and no duplicates", () => {
    const many = (p: string) => Array.from({ length: 8 }, (_, i) => mc(`${p}${i}`, 0));
    const drawn = drawMixed([many("x"), many("y"), many("z")], 3, 11);
    expect(drawn).toHaveLength(9);
    expect(new Set(drawn.map((q) => q.id)).size).toBe(9);
    for (const p of ["x", "y", "z"]) expect(drawn.filter((q) => q.id.startsWith(p))).toHaveLength(3);
  });
  it("option order is a permutation, stable per seed", () => {
    const order = optionOrder(mc("a", 0), 5);
    expect([...order].sort()).toEqual([0, 1, 2]);
    expect(optionOrder(mc("a", 0), 5)).toEqual(order);
  });
});

describe("masteryBand", () => {
  it("uses the old bands", () => {
    expect([100, 90, 89, 80, 79, 70, 69, 0].map((p) => masteryBand(p).label)).toEqual(["Mastered", "Mastered", "Strong", "Strong", "Needs review", "Needs review", "Revisit module", "Revisit module"]);
  });
});
