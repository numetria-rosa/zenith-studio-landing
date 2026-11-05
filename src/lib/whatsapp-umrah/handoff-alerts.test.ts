import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/outreach-mail", () => ({ sendPlainEmail: vi.fn() }));
import { describeCustomerMessage, handoffEmail, isWaitingOnPerson, REPEAT_ALERT_MINUTES, shouldAlertAgain } from "./handoff-alerts";

const t = (iso: string) => new Date(iso);

describe("shouldAlertAgain", () => {
  const alertedAt = t("2026-11-04T10:00:00Z");
  it("alerts the first time", () => {
    expect(shouldAlertAgain({ alertedAt: null, lastHumanReplyAt: null })).toBe(true);
  });
  it("stays quiet inside the repeat window", () => {
    expect(shouldAlertAgain({ alertedAt, lastHumanReplyAt: null, now: t("2026-11-04T10:10:00Z") })).toBe(false);
  });
  it("alerts again once the window has passed and nobody has replied", () => {
    const now = new Date(alertedAt.getTime() + REPEAT_ALERT_MINUTES * 60_000);
    expect(shouldAlertAgain({ alertedAt, lastHumanReplyAt: null, now })).toBe(true);
  });
  it("never alerts while the team is replying", () => {
    expect(shouldAlertAgain({ alertedAt, lastHumanReplyAt: t("2026-11-04T10:05:00Z"), now: t("2026-11-04T12:00:00Z") })).toBe(false);
  });
  it("alerts again if the last reply came before the last alert", () => {
    expect(shouldAlertAgain({ alertedAt, lastHumanReplyAt: t("2026-11-04T09:00:00Z"), now: t("2026-11-04T12:00:00Z") })).toBe(true);
  });
});

describe("describeCustomerMessage", () => {
  it("shows ordinary text, trimmed and shortened", () => {
    expect(describeCustomerMessage("  how much   for\n2 people? ")).toBe("how much for 2 people?");
    expect(describeCustomerMessage("x".repeat(500))).toHaveLength(300);
  });
  it("never puts a passport or card number into an email", () => {
    expect(describeCustomerMessage("my passport is AB1234567")).toMatch(/not shown here/);
    expect(describeCustomerMessage("4111 1111 1111 1111")).toMatch(/not shown here/);
  });
  it("says so when the message wasn't text", () => {
    expect(describeCustomerMessage(null)).toMatch(/photo, document, voice note/);
  });
});

describe("handoffEmail", () => {
  const base = { agencyName: "Al Noor Travel", agencyId: "a1", conversationId: "v1", customer: "Sam", reason: "customer asked to speak to a person", message: "Can I speak to someone?" };
  it("says who, why, what they wrote, and links straight to the chat", () => {
    const { subject, text } = handoffEmail({ ...base, repeat: false });
    expect(subject).toBe("Al Noor Travel: Sam needs a person");
    expect(text).toContain("Why: customer asked to speak to a person");
    expect(text).toContain("Their message: Can I speak to someone?");
    expect(text).toContain("/whatsapp-umrah/a1/inbox?c=v1");
  });
  it("a repeat says the customer is still waiting", () => {
    const { subject, text } = handoffEmail({ ...base, reason: null, repeat: true });
    expect(subject).toBe("Al Noor Travel: Sam is still waiting for a reply");
    expect(text).not.toContain("Why:");
  });
});

describe("isWaitingOnPerson", () => {
  const customerAt = t("2026-11-05T10:00:00Z");
  it("is waiting once a chat is handed over, even though the agent's own holding message came last", () => {
    expect(isWaitingOnPerson({ status: "HUMAN", lastCustomerMessageAt: customerAt, lastHumanReplyAt: null })).toBe(true);
  });
  it("stops waiting once someone on the team replies after the customer's last message", () => {
    expect(isWaitingOnPerson({ status: "HUMAN", lastCustomerMessageAt: customerAt, lastHumanReplyAt: t("2026-11-05T10:05:00Z") })).toBe(false);
  });
  it("waits again when the customer writes after the team's reply", () => {
    expect(isWaitingOnPerson({ status: "HUMAN", lastCustomerMessageAt: t("2026-11-05T10:30:00Z"), lastHumanReplyAt: t("2026-11-05T10:05:00Z") })).toBe(true);
  });
  it("is never waiting while the agent is handling the chat", () => {
    expect(isWaitingOnPerson({ status: "AI", lastCustomerMessageAt: customerAt, lastHumanReplyAt: null })).toBe(false);
  });
});
