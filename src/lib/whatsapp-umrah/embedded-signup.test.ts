import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
import { weeklyCap } from "./embedded-signup";

describe("weeklyCap", () => {
  afterEach(() => {
    delete process.env.WHATSAPP_UMRAH_EMBEDDED_SIGNUP_WEEKLY_CAP;
  });

  it("defaults to Meta's 200 a week for a fully verified Tech Provider", () => {
    expect(weeklyCap()).toBe(200);
  });

  it("can be lowered with the environment variable, and ignores nonsense", () => {
    process.env.WHATSAPP_UMRAH_EMBEDDED_SIGNUP_WEEKLY_CAP = "25";
    expect(weeklyCap()).toBe(25);
    process.env.WHATSAPP_UMRAH_EMBEDDED_SIGNUP_WEEKLY_CAP = "abc";
    expect(weeklyCap()).toBe(200);
    process.env.WHATSAPP_UMRAH_EMBEDDED_SIGNUP_WEEKLY_CAP = "0";
    expect(weeklyCap()).toBe(200);
  });
});
