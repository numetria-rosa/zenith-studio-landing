import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
import { formatOccasionDates, occasionsPrompt, parseOccasionForm, SUGGESTED_OCCASIONS } from "./occasions";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const day = (s: string) => new Date(`${s}T00:00:00Z`);

describe("parseOccasionForm", () => {
  it("reads a date range", () => {
    expect(parseOccasionForm(form({ name: " Ramadan  2027 ", startDate: "2027-02-08", endDate: "2027-03-09" }))).toEqual({ ok: true, value: { name: "Ramadan 2027", startDate: day("2027-02-08"), endDate: day("2027-03-09") } });
  });
  it("treats a blank end, or the same day as the start, as one day", () => {
    expect(parseOccasionForm(form({ name: "Eid", startDate: "2027-05-16", endDate: "" }))).toMatchObject({ ok: true, value: { endDate: null } });
    expect(parseOccasionForm(form({ name: "Eid", startDate: "2027-05-16", endDate: "2027-05-16" }))).toMatchObject({ ok: true, value: { endDate: null } });
  });
  it("asks for a name and a real start date", () => {
    expect(parseOccasionForm(form({ name: "  ", startDate: "2027-05-16" }))).toMatchObject({ ok: false, error: "Give the occasion a name." });
    expect(parseOccasionForm(form({ name: "Eid", startDate: "" }))).toMatchObject({ ok: false });
    expect(parseOccasionForm(form({ name: "Eid", startDate: "2027-02-31" }))).toMatchObject({ ok: false });
  });
  it("rejects a range that ends before it starts", () => {
    expect(parseOccasionForm(form({ name: "Eid", startDate: "2027-05-16", endDate: "2027-05-10" }))).toMatchObject({ ok: false, error: "The last day can't be before the first day." });
  });
});

describe("formatOccasionDates", () => {
  it("writes one day, a range in one year, and a range across years", () => {
    expect(formatOccasionDates(day("2027-05-16"), null)).toBe("16 May 2027");
    expect(formatOccasionDates(day("2027-02-08"), day("2027-03-09"))).toBe("8 February to 9 March 2027");
    expect(formatOccasionDates(day("2026-12-20"), day("2027-01-03"))).toBe("20 December 2026 to 3 January 2027");
  });
});

describe("occasionsPrompt", () => {
  it("is empty with no occasions, so the prompt gains nothing", () => {
    expect(occasionsPrompt([])).toBe("");
  });
  it("lists each occasion with its dates, and tells the agent to say 'around' for religious dates", () => {
    const text = occasionsPrompt([{ name: "Ramadan 2027", startDate: day("2027-02-08"), endDate: day("2027-03-09") }]);
    expect(text).toContain("- Ramadan 2027: 8 February to 9 March 2027.");
    expect(text).toContain("around");
  });
  it("its dates pass the grounding check, so the agent can quote them", async () => {
    const { groundingCheck } = await import("./agent/guards");
    const kb = occasionsPrompt(SUGGESTED_OCCASIONS.slice(0, 1));
    const draft = { reply: "Ramadan 2027 is around 8 February to 9 March 2027.", language: "en" as const, intent: "package_info" as const, leadFields: null, handoffReason: null, confidence: 0.9, kbIdsUsed: [] };
    expect(groundingCheck(draft, kb)).toBeNull();
  });
});
