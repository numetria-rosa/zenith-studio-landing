import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { encryptPassword, tryDecryptPassword } from "./password";

describe("tryDecryptPassword", () => {
  it("reads a password encrypted with the current key", () => {
    process.env.PASSWORD_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(tryDecryptPassword(encryptPassword("correct horse"))).toBe("correct horse");
  });
  it("returns null instead of throwing for a value encrypted under another key, or nothing at all", () => {
    process.env.PASSWORD_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    const other = encryptPassword("set elsewhere");
    process.env.PASSWORD_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(tryDecryptPassword(other)).toBeNull();
    expect(tryDecryptPassword(null)).toBeNull();
    expect(tryDecryptPassword("garbage")).toBeNull();
  });
});
