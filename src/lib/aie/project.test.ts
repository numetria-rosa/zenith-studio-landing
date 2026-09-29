import { describe, expect, it } from "vitest";
import { cleanProjectInput, rubricScore, safeHttpUrl } from "./project";
import type { ProjectDetail } from "./types";

const project = {
  id: 1,
  title: "t",
  difficulty: "Beginner",
  modules: [1],
  summary: "",
  requirements: [],
  start: "",
  tests: [],
  mistakes: [],
  solution: [],
  acceptance: ["a", "b", "c"],
  rubric: [
    { key: "architecture", label: "Architecture", weight: 40 },
    { key: "testing", label: "Testing", weight: 60 },
  ],
} satisfies ProjectDetail;
const base = { checklist: [true, false, true], rubric: { architecture: 100, testing: 50 }, githubUrl: "", description: " hi ", technologies: "", testsPassed: "" };

describe("project rubric", () => {
  it("weights each level by its row share", () => {
    expect(rubricScore(project, { architecture: 100, testing: 50 })).toBe(70);
    expect(rubricScore(project, {})).toBe(0);
    expect(rubricScore(project, { architecture: 999, testing: -5 })).toBe(40);
  });
  it("only stores http(s) links", () => {
    expect(safeHttpUrl("https://github.com/a/b")).toBe("https://github.com/a/b");
    expect(safeHttpUrl("  ")).toBe("");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
  });
  it("rejects unknown levels and bad URLs, trims text, pads the checklist", () => {
    expect(cleanProjectInput(project, base)).toMatchObject({ score: 70, description: "hi", checklist: [true, false, true] });
    expect(() => cleanProjectInput(project, { ...base, rubric: { architecture: 73, testing: 0 } })).toThrow();
    expect(() => cleanProjectInput(project, { ...base, githubUrl: "javascript:1" })).toThrow();
    expect(cleanProjectInput(project, { ...base, checklist: [true] }).checklist).toEqual([true, false, false]);
  });
});
