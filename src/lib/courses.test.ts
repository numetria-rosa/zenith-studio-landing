import { describe, expect, it } from "vitest";
import { courseHomeUrl, getCourse } from "./courses";

describe("courseHomeUrl", () => {
  it("sends AI Engineering owners to the redesigned course app", () => {
    expect(courseHomeUrl(getCourse("ai-engineering")!)).toBe("/lab/ai-engineering/learn");
  });
  it("keeps the static route for courses without their own app", () => {
    const ds = getCourse("data-science")!;
    expect(courseHomeUrl(ds)).toBe(`/courses/data-science/${ds.firstLessonPath}`);
  });
});

describe("course launch lock", () => {
  it("keeps AI Engineering open and locks the other courses until 2 October", async () => {
    const { COURSES, isLaunched, launchLabel } = await import("./courses");
    const before = new Date("2026-10-01T23:59:00Z");
    const after = new Date("2026-10-02T00:00:00Z");
    for (const c of COURSES) {
      if (c.id === "ai-engineering") expect(isLaunched(c, before)).toBe(true);
      else {
        expect(isLaunched(c, before)).toBe(false);
        expect(isLaunched(c, after)).toBe(true);
        expect(launchLabel(c)).toBe("2 October");
      }
    }
  });
});
