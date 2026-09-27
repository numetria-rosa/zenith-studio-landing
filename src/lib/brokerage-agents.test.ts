import { describe, expect, it } from "vitest";
import { defaultDeadlines, defaultDocuments, parseDay } from "./transaction-coordinator";
import { isDormant } from "./database-manager";
import { dbEmail, DEFAULT_SETTINGS, tcDocumentChaseEmail } from "./agent-settings";

const day = (d: Date) => d.toISOString().slice(0, 10);

describe("Transaction Coordinator timeline", () => {
  it("builds 6 deadlines from contract and closing, ending at closing", () => {
    const d = defaultDeadlines(parseDay("2026-10-01")!, parseDay("2026-11-15")!);
    expect(d.map((x) => [x.label, day(x.dueDate)])).toEqual([
      ["Earnest money deposit", "2026-10-04"],
      ["Inspection period ends", "2026-10-11"],
      ["Appraisal completed", "2026-10-22"],
      ["Loan approval", "2026-11-05"],
      ["Final walkthrough", "2026-11-14"],
      ["Closing", "2026-11-15"],
    ]);
  });

  it("never schedules anything outside the contract-to-closing window on a short deal", () => {
    const contract = parseDay("2026-10-01")!;
    const closing = parseDay("2026-10-08")!;
    for (const d of defaultDeadlines(contract, closing)) {
      expect(d.dueDate.getTime()).toBeGreaterThanOrEqual(contract.getTime());
      expect(d.dueDate.getTime()).toBeLessThanOrEqual(closing.getTime());
    }
  });

  it("uses the right checklist per side and rejects bad dates", () => {
    expect(defaultDocuments("BUYER")).toContain("Pre-approval letter");
    expect(defaultDocuments("SELLER")).toContain("Signed seller disclosures");
    expect(parseDay("10/01/2026")).toBeNull();
  });
});

describe("Database Manager", () => {
  const now = new Date("2026-09-27T12:00:00Z");
  it("treats contacts with no date, or quiet past the window, as dormant", () => {
    expect(isDormant(null, 180, now)).toBe(true);
    expect(isDormant(new Date("2026-01-01T00:00:00Z"), 180, now)).toBe(true);
    expect(isDormant(new Date("2026-08-01T00:00:00Z"), 180, now)).toBe(false);
  });

  it("every email carries the unsubscribe link and the business name", () => {
    for (let step = 0; step < 3; step++) {
      const e = dbEmail(DEFAULT_SETTINGS, { name: "Jane Doe", business: "Austin Homes", step, unsubscribeUrl: "https://x/u?t=1" });
      expect(e.body).toContain("https://x/u?t=1");
      expect(e.body).toContain("Austin Homes");
    }
  });

  it("document chase lists every missing document", () => {
    const e = tcDocumentChaseEmail(DEFAULT_SETTINGS, { clientName: "Jane Doe", business: "Austin Homes", address: "1 Main St", documents: ["A", "B"] });
    expect(e.body).toContain("- A\n- B");
  });
});
