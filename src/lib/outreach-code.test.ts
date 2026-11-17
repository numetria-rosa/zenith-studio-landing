import { describe, expect, it } from "vitest";
import { contactCode, withContactCode } from "./outreach-code";

describe("contactCode", () => {
  it("is 8 characters, stable, and ignores case and spaces", () => {
    const c = contactCode("info@example.co.uk");
    expect(c).toMatch(/^[0-9a-z]{8}$/);
    expect(contactCode("  INFO@Example.co.uk ")).toBe(c);
    expect(contactCode("other@example.co.uk")).not.toBe(c);
  });
  it("matches the value the sender scripts compute (pinned vector)", () => {
    expect(contactCode("info@example.co.uk")).toBe("0uxipfc5");
    expect(contactCode("a@b.co")).toHaveLength(8);
  });
});

describe("withContactCode", () => {
  it("tags every demo link once", () => {
    const text = "see https://www.zenith-studio.site/demo/uk/whatsapp-umrah-agent?utm_source=email&utm_medium=cold&utm_campaign=umrah-uk now";
    const out = withContactCode(text, "info@example.co.uk");
    expect(out).toContain(`utm_campaign=umrah-uk&utm_content=${contactCode("info@example.co.uk")} now`);
    expect(withContactCode(out, "info@example.co.uk")).toBe(out);
  });
});
