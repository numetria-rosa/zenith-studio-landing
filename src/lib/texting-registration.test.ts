import { describe, expect, it } from "vitest";
import { campaignRequest, readDetails } from "./texting-registration";

const form = (v: Record<string, string>) => (k: string) => v[k];
const good = { legalName: "Harlow Insurance Group LLC", ein: "12-3456789", entityType: "PRIVATE_PROFIT", address: "123 Main St, Nashville, TN 37203", website: "harlowins.com", contactEmail: "Dana@Harlow.com", contactPhone: "(615) 555-0142" };

describe("texting registration", () => {
  it("normalizes valid details", () => {
    const r = readDetails(form(good));
    expect(r.ok && r.details).toEqual({ ...good, ein: "123456789", website: "https://harlowins.com", contactEmail: "dana@harlow.com", contactPhone: "+16155550142" });
  });

  it("rejects a bad EIN and an unknown business type", () => {
    expect(readDetails(form({ ...good, ein: "1234" })).ok).toBe(false);
    expect(readDetails(form({ ...good, entityType: "SOMETHING" })).ok).toBe(false);
  });

  it("builds a campaign that meets SignalWire's minimums and carries opt-out wording", () => {
    const r = readDetails(form(good));
    if (!r.ok) throw new Error("fixture invalid");
    const c = campaignRequest("Harlow Insurance", r.details, "https://x/cb");
    expect(c.description.length).toBeGreaterThanOrEqual(40);
    expect(c.sample1.length).toBeGreaterThanOrEqual(20);
    expect(c.sample1).toContain("Reply STOP to opt out.");
    expect(c.sample2).toContain("Harlow Insurance");
    expect(c.message_flow).toContain("https://harlowins.com");
    expect(c.help_message).toContain("+16155550142");
  });
});
