import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
const { checkPrompt, parseVerdict } = await import("./doc-check");

describe("AI document check", () => {
  it("asks about the requested document with today's date", () => {
    expect(checkPrompt("W-2 from each employer", new Date("2026-02-20T10:00:00Z"))).toBe('Requested document: "W-2 from each employer"\nToday\'s date: 2026-02-20');
  });

  it("reads a verdict even with text around the JSON", () => {
    expect(parseVerdict('Here you go: {"verdict": "check", "note": "This is a 2024 W-2,   not 2025."}')).toEqual({ verdict: "check", note: "This is a 2024 W-2, not 2025." });
    expect(parseVerdict('{"verdict":"ok","note":"Readable W-2 for 2025."}')?.verdict).toBe("ok");
  });

  it("stores nothing for an answer it can't trust", () => {
    expect(parseVerdict("I think it's fine")).toBeNull();
    expect(parseVerdict('{"verdict": "maybe"}')).toBeNull();
    expect(parseVerdict("{not json}")).toBeNull();
  });
});
