import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  SETTINGS,
  readSettings,
  adjustableSettings,
  instantReplySms,
  followUpGaps,
  followUpMessage,
  missedCallSms,
  missedCallSpoken,
  receptionistFirstMessage,
  receptionistPromptLines,
  inboxReplyStyle,
  inboxSignOff,
  renewalEmail,
  type SettingKey,
} from "./agent-settings";

const d = DEFAULT_SETTINGS;
const B = "Acme Law";

describe("defaults reproduce the wording agents used before settings existed", () => {
  it("lead replies, follow-ups and missed calls", () => {
    expect(instantReplySms(d, B)).toBe("Thanks for reaching out to Acme Law! We received your message and will be in touch shortly.");
    expect(followUpGaps(d)).toEqual([1, 3, 7]);
    expect(followUpMessage(d, B, 0, 3)).toBe("Hi, this is Acme Law again. Just checking in after your call, would you like us to schedule a consult?");
    expect(followUpMessage(d, B, 1, 3)).toBe("Following up from Acme Law. We'd still love to help, reply here or call us back when you get a chance.");
    expect(followUpMessage(d, B, 2, 3)).toBe("This is Acme Law's last check-in. If you still need help, reply and we'll get you booked. Otherwise we won't reach out again.");
    expect(missedCallSms(d, B)).toBe("Hi, this is Acme Law. Sorry we missed your call. Reply and let us know what you need, we'll book a call for tomorrow so there's no delay.");
    expect(missedCallSpoken(d, B)).toBe(
      "Thank you for calling Acme Law. We're unable to take your call right now, but we'll text you shortly to find out how we can help, and get a call scheduled for tomorrow."
    );
  });

  it("receptionist, inbox and renewals", () => {
    expect(receptionistFirstMessage(d, B)).toBe("Thanks for calling Acme Law, how can I help?");
    expect(receptionistPromptLines(d)).toEqual([]);
    expect(inboxReplyStyle(d)).toBe("short, professional");
    expect(inboxSignOff(d, B)).toBe("");
    expect(renewalEmail(d, { clientName: "Jo", agencyName: "A1", policyType: "auto policy", date: "Mon Sep 15 2027" })).toBe(
      "Hi Jo,\n\nThis is a reminder from A1: your auto policy is due for renewal on Mon Sep 15 2027. Reply to this email or give us a call to review your coverage before it renews.\n\nA1"
    );
  });
});

describe("every option produces output and bad input is rejected", () => {
  it("each option of each setting renders non-empty text", () => {
    for (const key of Object.keys(SETTINGS) as SettingKey[]) {
      for (const o of SETTINGS[key].options) {
        const s = { ...d, [key]: o.value };
        const all = [instantReplySms(s, B), missedCallSms(s, B), missedCallSpoken(s, B), receptionistFirstMessage(s, B), inboxReplyStyle(s), renewalEmail(s, { clientName: "J", agencyName: "A", policyType: "p", date: "x" })];
        for (const text of all) expect(text && !text.includes("undefined")).toBeTruthy();
        const gaps = followUpGaps(s);
        gaps.forEach((_, i) => expect(followUpMessage(s, B, i, gaps.length)).toBeTruthy());
      }
    }
  });

  it("readSettings drops unknown keys and invalid values", () => {
    const s = readSettings({ messageTone: "angry", followUpSchedule: "gentle", evil: "x" });
    expect(s.messageTone).toBe("friendly");
    expect(s.followUpSchedule).toBe("gentle");
    expect("evil" in s).toBe(false);
  });

  it("only real agents expose settings", () => {
    expect(adjustableSettings("crm")).toEqual([]);
    expect(adjustableSettings("renewals")).toContain("renewalLeadDays");
  });
});
