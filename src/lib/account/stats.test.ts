import { describe, expect, it } from "vitest";
import { cleanUrl, learningStreak, recentActivity, timeAgo } from "./stats";

const at = (iso: string) => new Date(iso);

describe("learningStreak", () => {
  const now = at("2026-09-30T12:00:00Z");
  it("counts consecutive days ending today", () => {
    const c = [at("2026-09-30T08:00:00Z"), at("2026-09-29T20:00:00Z"), at("2026-09-28T09:00:00Z")];
    expect(learningStreak(c, "UTC", now)).toBe(3);
  });
  it("keeps the streak alive when today has no completion yet", () => {
    expect(learningStreak([at("2026-09-29T10:00:00Z"), at("2026-09-28T10:00:00Z")], "UTC", now)).toBe(2);
  });
  it("breaks after a missed day", () => {
    expect(learningStreak([at("2026-09-27T10:00:00Z")], "UTC", now)).toBe(0);
  });
  it("uses the student's timezone for the day boundary", () => {
    // 23:30 UTC on the 29th is already the 30th in Tokyo.
    expect(learningStreak([at("2026-09-29T23:30:00Z")], "Asia/Tokyo", at("2026-09-30T01:00:00Z"))).toBe(1);
    expect(learningStreak([at("2026-09-29T23:30:00Z"), at("2026-09-29T02:00:00Z")], "UTC", at("2026-09-30T01:00:00Z"))).toBe(1);
  });
  it("is zero with no completions", () => {
    expect(learningStreak([], "UTC", now)).toBe(0);
  });
});

describe("timeAgo", () => {
  const now = at("2026-09-30T12:00:00Z");
  it("formats recent times", () => {
    expect(timeAgo(at("2026-09-30T11:59:40Z"), now)).toBe("just now");
    expect(timeAgo(at("2026-09-30T11:15:00Z"), now)).toBe("45 min ago");
    expect(timeAgo(at("2026-09-30T10:00:00Z"), now)).toBe("2 hours ago");
    expect(timeAgo(at("2026-09-29T09:00:00Z"), now)).toBe("yesterday");
    expect(timeAgo(at("2026-09-27T09:00:00Z"), now)).toBe("3 days ago");
  });
});

describe("recentActivity", () => {
  it("returns the newest events first, limited", () => {
    const ev = ["01", "05", "03", "04", "02"].map((d) => ({ kind: "lesson" as const, title: d, detail: "", at: at(`2026-09-${d}T00:00:00Z`) }));
    expect(recentActivity(ev, 3).map((e) => e.title)).toEqual(["05", "04", "03"]);
  });
});

describe("cleanUrl", () => {
  it("accepts http(s), adds a scheme, allows empty, rejects junk", () => {
    expect(cleanUrl("github.com/ada")).toBe("https://github.com/ada");
    expect(cleanUrl("")).toBe("");
    expect(cleanUrl("javascript:alert(1)")).toBeNull();
    expect(cleanUrl("not a url")).toBeNull();
  });
});
