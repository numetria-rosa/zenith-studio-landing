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
