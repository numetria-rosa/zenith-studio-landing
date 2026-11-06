import { describe, expect, it } from "vitest";
import { isHotLead, leadSummaryLine } from "./leads";
import type { LeadFields } from "./agent/types";

const noFields: LeadFields = {};

describe("isHotLead", () => {
  it("is hot once dates, travellers, and budget are all captured", () => {
    const fields: LeadFields = { travelDates: "March 2027", travelers: 2, budgetGbp: 2000 };
    expect(isHotLead(fields, "package_info")).toBe(true);
  });

  it("is not hot with only some of the core fields", () => {
    expect(isHotLead({ travelDates: "March 2027", travelers: 2 }, "package_info")).toBe(false);
  });

  it("is hot when the customer directly asks to book or speak to someone, even with no fields yet", () => {
    expect(isHotLead(noFields, "booking_interest")).toBe(true);
    expect(isHotLead(noFields, "person_request")).toBe(true);
  });

  it("is not hot for an ordinary info question with no fields", () => {
    expect(isHotLead(noFields, "package_info")).toBe(false);
  });
});

describe("leadSummaryLine", () => {
  it("gives staff one line of what the customer has said", () => {
    expect(leadSummaryLine({ travelers: 2, travelDates: "Ramadan 2027", departureCity: "Manchester", budgetGbp: 3000 })).toBe("2 travellers, Ramadan 2027, from Manchester, budget £3,000");
  });
  it("is empty when nothing is known", () => {
    expect(leadSummaryLine(null)).toBe("");
    expect(leadSummaryLine({})).toBe("");
  });
});
