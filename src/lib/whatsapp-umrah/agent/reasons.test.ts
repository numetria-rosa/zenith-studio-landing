import { describe, expect, it } from "vitest";
import { plainHandoffReason } from "./reasons";
import type { AgentDraft, GuardFailure } from "./types";

const draft = (intent: AgentDraft["intent"]): AgentDraft => ({ reply: "x", language: "en", intent, leadFields: null, handoffReason: "model said something odd", confidence: 0.9, kbIdsUsed: [] });
const fail = (guard: string): GuardFailure => ({ guard, detail: `internal detail for ${guard} with numbers 1234` });

describe("plainHandoffReason", () => {
  it("names what the customer did when that triggered it", () => {
    expect(plainHandoffReason(draft("complaint"), [fail("scope")])).toBe("the customer is making a complaint");
    expect(plainHandoffReason(draft("visa_question"), [fail("scope")])).toMatch(/visas or immigration/);
    expect(plainHandoffReason(draft("emergency"), [fail("scope")])).toMatch(/emergency/);
  });
  it("otherwise says what was wrong with the answer, without internal wording", () => {
    expect(plainHandoffReason(draft("pricing"), [fail("grounding")])).toMatch(/isn't in your knowledge base/);
    expect(plainHandoffReason(draft("package_info"), [fail("no_kb_source")])).toMatch(/isn't in your knowledge base/);
    expect(plainHandoffReason(draft("other"), [fail("length")])).toMatch(/usable answer/);
    expect(plainHandoffReason(null, [])).toMatch(/wasn't sure/);
  });
  it("never leaks a guard's detail text", () => {
    expect(plainHandoffReason(draft("pricing"), [fail("grounding"), fail("hedge")])).not.toMatch(/internal detail|1234/);
  });
});
