import { describe, expect, it } from "vitest";
import { parseClientInput } from "./clients";
import { complianceChecks, fillTemplate, missingVariables } from "./outreach";

describe("outreach templates", () => {
  const body = "Hi {first_name}, I'm {your_name}.\n{address}\nReply \"stop\" and I won't email again.";

  it("fills known variables and leaves unknown ones visible", () => {
    expect(fillTemplate(body, { first_name: "Sam", your_name: "Zoe" })).toContain("Hi Sam, I'm Zoe.\n{address}");
    expect(missingVariables(fillTemplate(body, { first_name: "Sam" }))).toEqual(["your_name", "address"]);
  });

  it("flags a missing postal address or opt-out", () => {
    const filled = fillTemplate(body, { first_name: "Sam", your_name: "Zoe", address: "1 Main St, Columbus, OH" });
    expect(complianceChecks(filled, { address: "1 Main St, Columbus, OH" })).toEqual({ hasAddress: true, hasOptOut: true, complete: true });
    expect(complianceChecks("Hi there", {}).hasOptOut).toBe(false);
    expect(complianceChecks(fillTemplate(body, {}), {}).hasAddress).toBe(false);
  });
});

describe("parseClientInput", () => {
  const agents = ["support-agent", "booking-agent"];
  const good = { name: "Sunrise Dental", agentId: "booking-agent", niche: "Dental", city: "Columbus, OH", status: "live", setupFee: "400", monthlyFee: "175.50" };

  it("converts dollars to cents and accepts a valid client", () => {
    const r = parseClientInput(good, agents);
    expect(r).toEqual({ ok: true, value: expect.objectContaining({ setupFeeCents: 40000, monthlyFeeCents: 17550, status: "live" }) });
  });

  it("uses the typed value when Other is chosen", () => {
    const r = parseClientInput({ ...good, niche: "__other", nicheOther: "Vets" }, agents);
    expect(r.ok && r.value.niche).toBe("Vets");
    expect(parseClientInput({ ...good, city: "__other", cityOther: "" }, agents).ok).toBe(false);
  });

  it("rejects an unknown agent, a bad status and silly fees", () => {
    expect(parseClientInput({ ...good, agentId: "nope" }, agents).ok).toBe(false);
    expect(parseClientInput({ ...good, status: "won" }, agents).ok).toBe(false);
    expect(parseClientInput({ ...good, monthlyFee: "-5" }, agents).ok).toBe(false);
    expect(parseClientInput({ ...good, setupFee: "abc" }, agents).ok).toBe(false);
    expect(parseClientInput({ ...good, name: " " }, agents).ok).toBe(false);
  });
});
