import { describe, expect, it } from "vitest";
import { decideCourseAccess } from "./course-access";

describe("decideCourseAccess", () => {
  const base = { coursePublished: true, userId: "u", entitled: true };
  it("serves an owner of an open course", () => {
    expect(decideCourseAccess(base)).toEqual({ action: "serve" });
  });
  it("sends an owner of a not-yet-launched course to the landing page", () => {
    expect(decideCourseAccess({ ...base, launched: false })).toEqual({ action: "redirect-landing" });
  });
  it("still asks anonymous visitors to sign in and non-owners to the landing page", () => {
    expect(decideCourseAccess({ ...base, userId: null })).toEqual({ action: "redirect-sign-in" });
    expect(decideCourseAccess({ ...base, entitled: false })).toEqual({ action: "redirect-landing" });
  });
});
