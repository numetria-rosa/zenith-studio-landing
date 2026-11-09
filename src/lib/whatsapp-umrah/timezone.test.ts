import { describe, expect, it } from "vitest";
import { isWithinBusinessHours } from "./hours";
import { isKnownTimezone, resolveTimezone, TIMEZONE_OPTIONS, timezoneChoices } from "./timezone";

describe("resolveTimezone", () => {
  it("uses the saved zone, else the market's main zone, else London", () => {
    expect(resolveTimezone("America/Chicago", "US")).toBe("America/Chicago");
    expect(resolveTimezone(null, "AU")).toBe("Australia/Sydney");
    expect(resolveTimezone(null, "ZA")).toBe("Africa/Johannesburg");
    expect(resolveTimezone(null, null)).toBe("Europe/London");
  });

  it("ignores a saved zone that is not on the list", () => {
    expect(resolveTimezone("Mars/Olympus", "CA")).toBe("America/Toronto");
    expect(isKnownTimezone("Mars/Olympus")).toBe(false);
  });

  it("accepts any real zone, such as one the browser detects outside the suggested list", () => {
    expect(isKnownTimezone("Asia/Dubai")).toBe(true);
    expect(resolveTimezone("Europe/Paris", "UK")).toBe("Europe/Paris");
    expect(isKnownTimezone("")).toBe(false);
  });

  it("the dropdown lists suggested zones first, then the rest, with no duplicates", () => {
    const ids = timezoneChoices("Europe/London").map((o) => o.id);
    expect(ids[0]).toBe("Europe/London");
    expect(ids).toContain("Asia/Dubai");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every option is a real IANA zone", () => {
    for (const o of TIMEZONE_OPTIONS) expect(() => new Intl.DateTimeFormat("en-GB", { timeZone: o.id })).not.toThrow();
  });
});

describe("hours follow the zone", () => {
  const hours = { mon: { open: "09:00", close: "17:00" } };
  const mondayNoonUtc = new Date("2026-11-09T12:00:00Z");

  it("noon UTC is open in London but 7am in New York, so closed there", () => {
    expect(isWithinBusinessHours(hours, "Europe/London", mondayNoonUtc)).toBe(true);
    expect(isWithinBusinessHours(hours, "America/New_York", mondayNoonUtc)).toBe(false);
  });
});
