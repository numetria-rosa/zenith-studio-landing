import { describe, expect, it } from "vitest";
import { allAccepted, needsTerms, TERMS_ITEMS, TERMS_VERSION } from "./terms";

describe("terms acceptance", () => {
  it("is needed until accepted, and again when the version changes", () => {
    expect(needsTerms({ termsAcceptedAt: null, termsVersion: null })).toBe(true);
    expect(needsTerms({ termsAcceptedAt: new Date(), termsVersion: "2020-01" })).toBe(true);
    expect(needsTerms({ termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION })).toBe(false);
  });
  it("needs every box ticked", () => {
    const ids = TERMS_ITEMS.map((i) => i.id);
    expect(allAccepted(ids)).toBe(true);
    expect(allAccepted(ids.slice(1))).toBe(false);
    expect(allAccepted([])).toBe(false);
  });
});
