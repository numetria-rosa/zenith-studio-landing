import { afterEach, describe, expect, it, vi } from "vitest";
import { cronAuthorized } from "./cron-auth";

const req = (headers: Record<string, string> = {}) => new Request("https://example.com/api/cron/x", { headers });

afterEach(() => vi.unstubAllEnvs());

describe("cronAuthorized", () => {
  it("accepts only the exact bearer secret", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(cronAuthorized(req({ authorization: "Bearer s3cret" }))).toBe(true);
    expect(cronAuthorized(req({ authorization: "Bearer other" }))).toBe(false);
    expect(cronAuthorized(req())).toBe(false);
  });

  it("does not trust the x-vercel-cron header, with or without a secret, in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(cronAuthorized(req({ "x-vercel-cron": "1" }))).toBe(false);
    vi.stubEnv("CRON_SECRET", "");
    expect(cronAuthorized(req({ "x-vercel-cron": "1" }))).toBe(false);
  });

  it("allows a call with no secret only outside production", () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(cronAuthorized(req())).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(cronAuthorized(req())).toBe(false);
  });
});
