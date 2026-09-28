import { describe, expect, it } from "vitest";
import { MockWhatsAppProvider } from "./mock";

describe("MockWhatsAppProvider", () => {
  it("records sends instead of sending anything real", async () => {
    const provider = new MockWhatsAppProvider();
    const text = await provider.sendText({ phoneNumberId: "p1", to: "+447700900000", body: "Hi" });
    const template = await provider.sendTemplate({ phoneNumberId: "p1", to: "+447700900000", templateName: "missed_call", languageCode: "en" });
    expect(text.ok).toBe(true);
    expect(template.ok).toBe(true);
    expect(provider.sent).toEqual([
      { kind: "text", to: "+447700900000", body: "Hi" },
      { kind: "template", to: "+447700900000", templateName: "missed_call" },
    ]);
  });
});
