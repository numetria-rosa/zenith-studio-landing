import { describe, expect, it } from "vitest";
import { isHotLead } from "./leads";
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
