import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { matchAudit } from "./audit-matcher";
import { STEPS } from "@/app/[locale]/audit/fields";

const base = {
  industry: "Other",
  country: "United States",
  emailTools: "Gmail (personal account)",
  whatToAutomate: [] as string[],
  biggestBottleneck: "Paperwork and admin",
  responseTime: "Within an hour",
  afterHours: "Yes, always",
  followUpProblems: "Rarely",
  noShows: "Not an issue",
  adminWorkload: "Manageable",
};

const slugs = (a: Record<string, string | string[]>) => matchAudit({ ...base, ...a }).services.map((s) => s.slug);

describe("matchAudit", () => {
  it("routes a law firm with call pain to the law bundle, not individual services", () => {
    expect(slugs({ industry: "Law firm", afterHours: "No, they go to voicemail" })).toEqual(["law-firms"]);
  });

  it("adds the inbox manager on top of a bundle when email is supported", () => {
    expect(
      slugs({ industry: "Insurance agency", whatToAutomate: ["Texting back missed calls", "Sorting and drafting replies to email"] })
    ).toEqual(["insurance-ai-team", "ai-inbox-manager"]);
  });

  it("combines individual services for a non-niche business", () => {
    expect(
      slugs({
        industry: "Dental / medical clinic",
        whatToAutomate: ["Answering calls and booking appointments", "Replying to and following up with every lead"],
      })
    ).toEqual(["ai-receptionist", "ai-lead-capture"]);
  });

  it("never offers phone services outside the US and Canada, and says so", () => {
    const m = matchAudit({ ...base, country: "United Kingdom", whatToAutomate: ["Answering calls and booking appointments"] });
    expect(m.services).toEqual([]);
    expect(m.notIncluded[0]).toMatch(/US and Canadian/);
  });

  it("skips the inbox manager for Outlook and explains why", () => {
    const m = matchAudit({ ...base, emailTools: "Outlook / Microsoft 365", whatToAutomate: ["Sorting and drafting replies to email"] });
    expect(m.services).toEqual([]);
    expect(m.notIncluded[0]).toMatch(/Outlook/);
  });

  it("only references option strings that exist in the form", () => {
    const options = new Set(STEPS.flatMap((s) => s.fields.flatMap((f) => f.options ?? [])));
    const src = readFileSync(new URL("./audit-matcher.ts", import.meta.url), "utf8");
    const quoted = [
      ...[...src.matchAll(/(?:has\(|=== )"([^"]+)"/g)].map((m) => m[1]),
      ...[...src.matchAll(/new Set\(\[([^\]]+)\]\)/g)].flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])),
      ...[...src.matchAll(/^\s+"([^"]+)": "/gm)].map((m) => m[1]),
    ].filter((q) => q !== "string");
    expect(quoted.length).toBeGreaterThan(20);
    for (const q of quoted) expect(options, q).toContain(q);
  });
});
