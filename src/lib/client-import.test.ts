import { describe, expect, it } from "vitest";
import { applyColumns, columnLetter, emailIn, guessColumns, readTable } from "./client-import";
import { checklistName, clientStage, detectChecklist } from "./document-chaser";

const run = (text: string) => {
  const t = readTable(text);
  return applyColumns(t, guessColumns(t));
};

describe("client import", () => {
  it("reads a plain name,email CSV", () => {
    expect(run("Name,Email\nJane Doe,jane@x.com\n").clients).toEqual([{ name: "Jane Doe", email: "jane@x.com", checklistHint: "" }]);
  });

  it("joins first and last name columns, picks the email column among several, reads a return type", () => {
    const csv = "Client ID,First Name,Last Name,Phone,Primary Email,Spouse Email,Return Type\n101,Jane,Doe,555,JANE@X.COM,sam@x.com,1040\n";
    const t = readTable(csv);
    const c = guessColumns(t);
    expect(c).toMatchObject({ hasHeader: true, first: 1, last: 2, email: 4, checklist: 6 });
    expect(applyColumns(t, c).clients).toEqual([{ name: "Jane Doe", email: "jane@x.com", checklistHint: "1040" }]);
  });

  it("never takes a 'Client type' column for the name", () => {
    const t = readTable("Client type,Client name,Email\nS Corp,Acme Inc,a@acme.com\n");
    expect(guessColumns(t)).toMatchObject({ name: 1, checklist: 0 });
  });

  it("works without a header: email column by content, name is the first text column", () => {
    const r = run("Acme Inc;ops@acme.com;1120-S\nBob Smith;bob@smith.org;1040\n");
    expect(r.clients.map((c) => c.name)).toEqual(["Acme Inc", "Bob Smith"]);
  });

  it("reads tab-separated rows pasted from Excel or Google Sheets", () => {
    expect(run("Name\tEmail\nJane Doe\tjane@x.com\n").clients).toHaveLength(1);
  });

  it("skips rows without a valid email and repeats, and pulls emails out of 'Name <email>' cells", () => {
    const r = run("Name,Email\nA,Jane Doe <jane@x.com>\nB,jane@x.com\nC,not an email\n");
    expect(r.clients).toHaveLength(1);
    expect(r.skipped).toBe(2);
    expect(emailIn("mailto:bob@x.co.uk")).toBe("bob@x.co.uk");
  });

  it("names columns like a spreadsheet", () => {
    expect([0, 25, 26, 27].map(columnLetter)).toEqual(["A", "Z", "AA", "AB"]);
  });
});

describe("picking a checklist from a spreadsheet value", () => {
  const saved = [{ id: "s1", name: "Landlord pack" }];
  it.each([
    ["1040", "us-1040"],
    ["Form 1040 MFJ", "us-1040"],
    ["S Corp", "us-business"],
    ["1120-S", "us-business"],
    ["Partnership (1065)", "us-business"],
    ["Schedule C", "us-schedule-c"],
    ["Rental", "us-rental"],
    ["Ltd", "uk-company"],
    ["Self Assessment", "uk-self-assessment"],
    ["landlord pack", "s1"],
    ["something else", null],
    ["", null],
  ])("%s -> %s", (raw, want) => {
    expect(detectChecklist(raw, saved)).toBe(want);
  });

  it("shows readable names for lists clients were given before the US/UK split", () => {
    expect(checklistName("personal-tax")).toBe("Personal tax return");
    expect(checklistName("us-1040")).toBe("Individual tax return (1040)");
    expect(checklistName("Landlord pack")).toBe("Landlord pack");
  });
});

describe("clientStage", () => {
  const it2 = (status: string, items: string[]) => clientStage({ status, items: items.map((s) => ({ status: s })) });
  it("puts uploads waiting for review first, then sorts the rest", () => {
    expect(it2("ACTIVE", ["RECEIVED", "REQUESTED"])).toBe("review");
    expect(it2("PAUSED", ["RECEIVED"])).toBe("review");
    expect(it2("PAUSED", ["REQUESTED"])).toBe("paused");
    expect(it2("ACTIVE", ["REQUESTED", "REQUESTED"])).toBe("waiting");
    expect(it2("ACTIVE", ["ACCEPTED", "REQUESTED"])).toBe("started");
    expect(it2("ACTIVE", ["ACCEPTED", "NOT_APPLICABLE"])).toBe("complete");
  });
});
