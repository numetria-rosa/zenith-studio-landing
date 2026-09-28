import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { extractEchoedStaffMessages, extractInboundTextMessages, verifyMetaSignature } from "./webhook";

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

describe("extractEchoedStaffMessages", () => {
  // Real example payload from developers.facebook.com's smb_message_echoes reference.
  const REAL_ECHO_PAYLOAD = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "102290129340398",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "15550783881", phone_number_id: "106540352242922" },
              message_echoes: [{ from: "15550783881", to: "16505551234", id: "wamid.echo123", timestamp: "1739321024", type: "text", text: { body: "Here's the info you requested!" } }],
            },
            field: "smb_message_echoes",
          },
        ],
      },
    ],
  };

  it("parses a real staff-app echo payload", () => {
    expect(extractEchoedStaffMessages(REAL_ECHO_PAYLOAD)).toEqual([
      { phoneNumberId: "106540352242922", to: "16505551234", waMessageId: "wamid.echo123", timestamp: "1739321024", body: "Here's the info you requested!" },
    ]);
  });

  it("does not pick up a staff echo from a regular inbound-message payload, or vice versa", () => {
    const inboundOnly = { entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "1" }, messages: [{ from: "1", id: "1", timestamp: "1", type: "text", text: { body: "hi" } }] } }] }] };
    expect(extractEchoedStaffMessages(inboundOnly)).toEqual([]);
    expect(extractInboundTextMessages(REAL_ECHO_PAYLOAD)).toEqual([]);
  });

  it("skips revoke/edit echo types (v1 handles text only)", () => {
    const payload = { entry: [{ changes: [{ field: "smb_message_echoes", value: { metadata: { phone_number_id: "1" }, message_echoes: [{ from: "1", to: "2", id: "1", timestamp: "1", type: "revoke", revoke: { original_message_id: "x" } }] } }] }] };
    expect(extractEchoedStaffMessages(payload)).toEqual([]);
  });

  it("never throws on malformed shapes", () => {
    expect(extractEchoedStaffMessages(null)).toEqual([]);
    expect(extractEchoedStaffMessages({})).toEqual([]);
  });
});
