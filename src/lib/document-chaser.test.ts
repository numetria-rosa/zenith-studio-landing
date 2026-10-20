import { describe, expect, it } from "vitest";
import { CHECKLISTS, chaseEmail, checklistItems, isDueForChase, parseClientCsv, REJECT_REASONS, uploadPathname } from "./document-chaser";

const DAY = 86400000;

describe("checklists", () => {
  it("every template has items and a unique id", () => {
    expect(new Set(CHECKLISTS.map((c) => c.id)).size).toBe(CHECKLISTS.length);
    for (const c of CHECKLISTS) expect(c.items.length).toBeGreaterThan(2);
  });
  it("builds the item list from a template plus picked extras, without duplicates", () => {
    const items = checklistItems("personal-tax", ["Photo ID", checklistItems("personal-tax", [])[0]!]);
    expect(items).toContain("Photo ID");
    expect(new Set(items).size).toBe(items.length);
  });
  it("rejects an unknown template", () => {
    expect(() => checklistItems("nope", [])).toThrow();
  });
});

describe("parseClientCsv", () => {
  it("reads name,email rows with or without a header, skipping blanks", () => {
    const r = parseClientCsv("name,email\nJane Doe, jane@example.com\n\nBob,bob@example.co.uk\n");
    expect(r.clients).toEqual([
      { name: "Jane Doe", email: "jane@example.com" },
      { name: "Bob", email: "bob@example.co.uk" },
    ]);
    expect(r.skipped).toBe(0);
  });
  it("accepts email-first columns and quoted names with commas", () => {
    expect(parseClientCsv('email,name\n"x@y.com","Smith, Ann"').clients).toEqual([{ name: "Smith, Ann", email: "x@y.com" }]);
  });
  it("counts rows without a valid email as skipped and dedupes by email", () => {
    const r = parseClientCsv("Ann,not-an-email\nBo,bo@x.com\nBo again,BO@x.com");
    expect(r.clients).toEqual([{ name: "Bo", email: "bo@x.com" }]);
    expect(r.skipped).toBe(2);
  });
});

describe("isDueForChase", () => {
  const now = new Date("2026-10-20T10:00:00Z");
  it("chases a new client straight away", () => {
    expect(isDueForChase({ status: "ACTIVE", chaseCount: 0, lastChasedAt: null }, 3, now)).toBe(true);
  });
  it("waits the gap between reminders, then chases again", () => {
    expect(isDueForChase({ status: "ACTIVE", chaseCount: 1, lastChasedAt: new Date(now.getTime() - 2 * DAY) }, 3, now)).toBe(false);
    expect(isDueForChase({ status: "ACTIVE", chaseCount: 1, lastChasedAt: new Date(now.getTime() - 4 * DAY) }, 3, now)).toBe(true);
  });
  it("never chases when nothing is outstanding, when paused, or after the reminder limit", () => {
    expect(isDueForChase({ status: "ACTIVE", chaseCount: 0, lastChasedAt: null }, 0, now)).toBe(false);
    expect(isDueForChase({ status: "PAUSED", chaseCount: 0, lastChasedAt: null }, 3, now)).toBe(false);
    expect(isDueForChase({ status: "ACTIVE", chaseCount: 6, lastChasedAt: new Date(now.getTime() - 30 * DAY) }, 3, now)).toBe(false);
  });
});

describe("chaseEmail", () => {
  const items = [{ label: "Bank statements", rejectReason: null }, { label: "P60", rejectReason: "Hard to read, please send a clearer copy" }];
  it("names the business, lists what is missing with any reason, and links the upload page", () => {
    const m = chaseEmail({ businessName: "Smith & Co Accountants", clientName: "Jane Doe", items, uploadUrl: "https://x/upload/abc", reminder: 0 });
    expect(m.subject).toMatch(/Smith & Co Accountants/);
    expect(m.text).toContain("Hi Jane,");
    expect(m.text).toContain("- Bank statements");
    expect(m.text).toContain("- P60 (Hard to read, please send a clearer copy)");
    expect(m.text).toContain("https://x/upload/abc");
  });
  it("sounds like a reminder after the first email", () => {
    expect(chaseEmail({ businessName: "B", clientName: "Jo", items, uploadUrl: "u", reminder: 2 }).subject).toMatch(/reminder/i);
  });
  it("uses no em dashes", () => {
    const m = chaseEmail({ businessName: "B", clientName: "Jo", items, uploadUrl: "u", reminder: 1 });
    expect(m.subject + m.text).not.toMatch(/—/);
  });
});

describe("uploads", () => {
  it("keeps files under one private folder per client, with a safe file name", () => {
    expect(uploadPathname("cl1", "it1", "../My Bank Statement (1).PDF")).toMatch(/^doc-chaser\/cl1\/it1-[a-z0-9]+-My-Bank-Statement-1\.pdf$/);
  });
  it("has reject reasons to pick from", () => {
    expect(REJECT_REASONS.length).toBeGreaterThan(2);
  });
});
