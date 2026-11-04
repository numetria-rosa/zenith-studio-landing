import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/outreach-mail", () => ({ sendAdminAlert: vi.fn(), sendPlainEmail: vi.fn() }));
import { describeSendError } from "./send-failure";

describe("describeSendError", () => {
  it("turns Meta's payment error into the thing the owner has to do", () => {
    expect(describeSendError("131042 Business eligibility payment issue")).toMatch(/no valid payment method/);
    expect(describeSendError('400 {"error":{"code":131042}}')).toMatch(/payment method/);
  });
  it("explains the 24 hour window and a revoked token", () => {
    expect(describeSendError("131047 Re-engagement message")).toMatch(/24 hours/);
    expect(describeSendError('401 {"error":{"type":"OAuthException","code":190}}')).toMatch(/reconnecting/);
  });
  it("does not mistake an unrelated number containing 190 for a token error", () => {
    expect(describeSendError("500 internal error 1190234")).toMatch(/^Meta rejected a reply: /);
  });
  it("keeps unknown errors short and readable", () => {
    const out = describeSendError("500   something   went wrong " + "x".repeat(500));
    expect(out.startsWith("Meta rejected a reply: 500 something went wrong")).toBe(true);
    expect(out.length).toBeLessThan(300);
  });
});
