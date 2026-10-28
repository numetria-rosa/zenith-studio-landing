import { describe, expect, it } from "vitest";
import { hashResetToken, recentlySent, RESET_TTL_MS } from "./password-reset";

describe("password reset tokens", () => {
  it("stores a hash, never the raw token", () => {
    const h = hashResetToken("abc");
    expect(h).not.toBe("abc");
    expect(h).toBe(hashResetToken("abc"));
    expect(h).toHaveLength(64);
  });

  it("blocks a second email within the cooldown only", () => {
    const now = Date.now();
    expect(recentlySent(new Date(now + RESET_TTL_MS - 30_000), now)).toBe(true); // sent 30s ago
    expect(recentlySent(new Date(now + RESET_TTL_MS - 5 * 60_000), now)).toBe(false); // sent 5 min ago
  });
});
