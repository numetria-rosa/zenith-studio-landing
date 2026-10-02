import { describe, expect, it } from "vitest";
import { claimDestination } from "./claim-destination";

const old = new Date("2026-09-01T00:00:00Z");
const recent = new Date("2026-10-02T00:00:00Z");

describe("claimDestination", () => {
  it("sends a WhatsApp buyer to their agency dashboard", () => {
    expect(claimDestination({ project: null, waMembership: { agencyId: "a1", createdAt: recent } })).toBe("/whatsapp-umrah/a1");
  });
  it("sends a service buyer to their project dashboard", () => {
    expect(claimDestination({ project: { id: "p1", createdAt: recent }, waMembership: null })).toBe("/services/dashboard/p1");
  });
  it("prefers whichever purchase is newest when the buyer has both", () => {
    expect(claimDestination({ project: { id: "p1", createdAt: old }, waMembership: { agencyId: "a1", createdAt: recent } })).toBe("/whatsapp-umrah/a1");
    expect(claimDestination({ project: { id: "p1", createdAt: recent }, waMembership: { agencyId: "a1", createdAt: old } })).toBe("/services/dashboard/p1");
  });
  it("falls back to the welcome page for course buyers", () => {
    expect(claimDestination({ project: null, waMembership: null })).toBe("/welcome");
  });
});
