import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
import { effectiveCap } from "./entitlements";

describe("effectiveCap", () => {
  it("uses the plan cap when the agency set no limit", () => {
    expect(effectiveCap(1000, null)).toBe(1000);
    expect(effectiveCap(1000, undefined)).toBe(1000);
  });
  it("lowers the cap to the agency's own limit", () => {
    expect(effectiveCap(1000, 300)).toBe(300);
  });
  it("never raises it above the plan cap", () => {
    expect(effectiveCap(1000, 5000)).toBe(1000);
  });
  it("ignores a zero or negative limit", () => {
    expect(effectiveCap(1000, 0)).toBe(1000);
    expect(effectiveCap(1000, -5)).toBe(1000);
  });
});
