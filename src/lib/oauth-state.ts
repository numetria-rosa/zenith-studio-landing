import { createHmac, timingSafeEqual } from "node:crypto";

/* Signs the OAuth `state` param so a callback can't be forged to attach an
   attacker's Google/Microsoft account to someone else's project (state is
   otherwise just an opaque string the provider echoes back unmodified).
   ponytail: reuses OAUTH_ENCRYPTION_KEY as the HMAC key rather than a
   dedicated one — fine since AES-GCM and HMAC-SHA256 are different
   algorithms, but split them if this key is ever rotated for one purpose
   and not the other. */

function stateKey(): Buffer {
  const b64 = process.env.OAUTH_ENCRYPTION_KEY;
  if (!b64) throw new Error("OAUTH_ENCRYPTION_KEY is not set");
  return Buffer.from(b64, "base64");
}

export function signOAuthState(projectId: string): string {
  const payload = `${projectId}.${Date.now()}`;
  const signature = createHmac("sha256", stateKey()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function verifyOAuthState(state: string): { ok: true; projectId: string } | { ok: false } {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const [projectId, timestamp, signature] = decoded.split(".");
    if (!projectId || !timestamp || !signature) return { ok: false };

    const payload = `${projectId}.${timestamp}`;
    const expected = createHmac("sha256", stateKey()).update(payload).digest("hex");
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };

    // 10-minute window — long enough for a real consent screen, short
    // enough that a leaked/logged callback URL isn't useful for long.
    if (Date.now() - Number(timestamp) > 10 * 60 * 1000) return { ok: false };

    return { ok: true, projectId };
  } catch {
    return { ok: false };
  }
}
