import { describe, expect, it } from "vitest";
import { isWithinBusinessHours } from "./hours";

describe("isWithinBusinessHours", () => {
  it("is always open when no hours are configured", () => {
    expect(isWithinBusinessHours(null, "Europe/London", new Date("2026-01-05T03:00:00Z"))).toBe(true); // 3am
  });

  it("is open inside a configured window", () => {
    const hours = { mon: { open: "09:00", close: "17:00" } };
    // 2026-01-05 is a Monday, 12:00 UTC = noon London in January (GMT)
    expect(isWithinBusinessHours(hours, "Europe/London", new Date("2026-01-05T12:00:00Z"))).toBe(true);
  });

  it("is closed outside a configured window on the same day", () => {
    const hours = { mon: { open: "09:00", close: "17:00" } };
    expect(isWithinBusinessHours(hours, "Europe/London", new Date("2026-01-05T20:00:00Z"))).toBe(false); // 8pm
  });

  it("is closed on a day with no entry", () => {
    const hours = { mon: { open: "09:00", close: "17:00" } };
    // 2026-01-04 is a Sunday, not listed
    expect(isWithinBusinessHours(hours, "Europe/London", new Date("2026-01-04T12:00:00Z"))).toBe(false);
  });

  it("is closed on a day explicitly set to null", () => {
    const hours = { mon: { open: "09:00", close: "17:00" }, tue: null };
    expect(isWithinBusinessHours(hours, "Europe/London", new Date("2026-01-06T12:00:00Z"))).toBe(false); // Tuesday
  });
});
