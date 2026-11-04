import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
import { isIdleLongEnough } from "./handoff";

describe("isIdleLongEnough", () => {
  const last = new Date("2026-11-04T10:00:00Z");
  it("is not idle before the set number of minutes has passed", () => {
    expect(isIdleLongEnough({ lastTeamActivityAt: last, idleMinutes: 30, now: new Date("2026-11-04T10:29:00Z") })).toBe(false);
  });
  it("is idle once it has", () => {
    expect(isIdleLongEnough({ lastTeamActivityAt: last, idleMinutes: 30, now: new Date("2026-11-04T10:30:00Z") })).toBe(true);
  });
  it("never resumes when the setting is zero", () => {
    expect(isIdleLongEnough({ lastTeamActivityAt: last, idleMinutes: 0, now: new Date("2027-01-01T00:00:00Z") })).toBe(false);
  });
});
