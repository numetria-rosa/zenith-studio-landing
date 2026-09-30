import { describe, expect, it } from "vitest";
import { modulesComplete, portfolioSummary, readiness } from "./career";
import type { ModuleContent } from "./types";

const mod = (number: number, lessons: string[], quiz = true) =>
  ({ number, lessons: lessons.map((n) => ({ number: n, title: "", minutes: 1 })), quiz: quiz ? { passMark: 4, questions: [] } : undefined }) as unknown as ModuleContent;

describe("modulesComplete", () => {
  const mods = [mod(0, ["0.1"], false), mod(1, ["1.1", "1.2"]), mod(2, ["2.1"])];
  it("needs every lesson done and the quiz passed; ignores module 0", () => {
    expect(modulesComplete(mods, new Set(["0.1", "1.1", "1.2", "2.1"]), new Set([1]))).toBe(1);
    expect(modulesComplete(mods, new Set(["1.1", "1.2", "2.1"]), new Set([1, 2]))).toBe(2);
    expect(modulesComplete(mods, new Set(["1.1"]), new Set([1]))).toBe(0);
  });
});

describe("readiness", () => {
  it("weights modules 40%, practical 35%, portfolio 25%", () => {
    const full = { completed: true, score: 100, description: "d", githubUrl: "u", testsPassed: "t" };
    const r = readiness(8, 8, Array(8).fill(full), 8);
    expect(r).toMatchObject({ technical: 100, practical: 100, portfolio: 100, overall: 100, projectsComplete: 8 });
    expect(readiness(8, 4, [], 8).overall).toBe(20);
  });
  it("counts an unfinished project as 0 and a partial submission partially", () => {
    const p = [{ completed: true, score: 80, description: "d", githubUrl: "", testsPassed: "" }];
    const r = readiness(8, 0, p, 8);
    expect(r.practical).toBe(10);
    expect(r.portfolio).toBe(4);
  });
});

describe("portfolioSummary", () => {
  it("is empty with no projects and names skills otherwise", () => {
    expect(portfolioSummary([])).toBe("");
    const s = portfolioSummary([{ id: 1, title: "A", score: 80 }, { id: 3, title: "B", score: 100 }]);
    expect(s).toContain("2 of 8");
    expect(s).toContain("90%");
    expect(s).toContain("; and cosine-similarity");
  });
});
