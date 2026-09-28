import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { extractInboundTextMessages, verifyMetaSignature } from "./webhook";

const REAL_EXAMPLE_PAYLOAD = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "102290129340398",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "15550783881", phone_number_id: "106540352242922" },
            contacts: [{ profile: { name: "Sheena Nelson" }, wa_id: "16505551234" }],
            messages: [{ from: "16505551234", id: "wamid.abc123", timestamp: "1749416383", type: "text", text: { body: "Does it come in another color?" } }],
          },
          field: "messages",
        },
      ],
    },
  ],
};

describe("verifyMetaSignature", () => {
  const secret = "test-app-secret";
  const body = JSON.stringify(REAL_EXAMPLE_PAYLOAD);

  it("accepts a correctly signed body", () => {
    const digest = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    expect(verifyMetaSignature(body, `sha256=${digest}`, secret)).toBe(true);
  });

  it("rejects a wrong signature", () => {
    expect(verifyMetaSignature(body, "sha256=" + "0".repeat(64), secret)).toBe(false);
  });

  it("rejects a missing or malformed header", () => {
    expect(verifyMetaSignature(body, null, secret)).toBe(false);
    expect(verifyMetaSignature(body, "not-even-close", secret)).toBe(false);
  });

  it("rejects when the body has been altered after signing (integrity check, not just format check)", () => {
    const digest = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    const tamperedBody = JSON.stringify({ ...REAL_EXAMPLE_PAYLOAD, object: "tampered" });
    expect(verifyMetaSignature(tamperedBody, `sha256=${digest}`, secret)).toBe(false);
  });
});

describe("extractInboundTextMessages", () => {
  it("parses a real example payload (Meta's own documented shape) correctly", () => {
    const messages = extractInboundTextMessages(REAL_EXAMPLE_PAYLOAD);
    expect(messages).toEqual([
      { phoneNumberId: "106540352242922", from: "16505551234", waMessageId: "wamid.abc123", timestamp: "1749416383", body: "Does it come in another color?", contactName: "Sheena Nelson" },
    ]);
  });

  it("skips non-text message types without throwing", () => {
    const payload = { entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "1" }, messages: [{ from: "1", id: "1", timestamp: "1", type: "image" }] } }] }] };
    expect(extractInboundTextMessages(payload)).toEqual([]);
  });

  it("skips status-update changes (field !== messages)", () => {
    const payload = { entry: [{ changes: [{ field: "statuses", value: { statuses: [{ id: "wamid.x", status: "delivered" }] } }] }] };
    expect(extractInboundTextMessages(payload)).toEqual([]);
  });

  it("never throws on malformed/unexpected shapes", () => {
    expect(extractInboundTextMessages(null)).toEqual([]);
    expect(extractInboundTextMessages({})).toEqual([]);
    expect(extractInboundTextMessages({ entry: "not an array" })).toEqual([]);
    expect(extractInboundTextMessages({ entry: [{ changes: [{ field: "messages", value: {} }] }] })).toEqual([]);
  });

  it("handles a contact with no matching profile gracefully", () => {
    const payload = { entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "1" }, contacts: [], messages: [{ from: "1", id: "1", timestamp: "1", type: "text", text: { body: "hi" } }] } }] }] };
    expect(extractInboundTextMessages(payload)[0].contactName).toBeNull();
  });
});
