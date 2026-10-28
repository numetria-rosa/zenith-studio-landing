import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { encryptPassword } from "@/lib/password";

/* "Forgot password" links. Reuses the (otherwise unused) Auth.js VerificationToken table: identifier is
   "password-reset:<userId>", token is the SHA-256 of the random value in the emailed link, so a database read
   alone can't be turned into a working link. One live link per account; using it deletes it. */

export const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESEND_COOLDOWN_MS = 2 * 60 * 1000; // one email per 2 minutes per account, so the form can't be used to spam

const identifierFor = (userId: string) => `password-reset:${userId}`;
export const hashResetToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

/** A link sent less than the cooldown ago means "don't send another yet". */
export function recentlySent(expires: Date, now = Date.now()): boolean {
  return expires.getTime() - RESET_TTL_MS > now - RESEND_COOLDOWN_MS;
}

/** Returns the raw token to email, or null when there's no such account or a link went out moments ago. */
export async function createPasswordResetToken(email: string): Promise<{ userId: string; token: string } | null> {
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return null;
  const identifier = identifierFor(user.id);
  const existing = await db.verificationToken.findFirst({ where: { identifier }, orderBy: { expires: "desc" } });
  if (existing && recentlySent(existing.expires)) return null;

  const token = randomBytes(32).toString("base64url");
  await db.$transaction([
    db.verificationToken.deleteMany({ where: { identifier } }),
    db.verificationToken.create({ data: { identifier, token: hashResetToken(token), expires: new Date(Date.now() + RESET_TTL_MS) } }),
  ]);
  return { userId: user.id, token };
}

/** The account a link belongs to, if it's still valid. */
export async function userIdForResetToken(raw: string): Promise<string | null> {
  if (!raw) return null;
  const row = await db.verificationToken.findUnique({ where: { token: hashResetToken(raw) } });
  if (!row || !row.identifier.startsWith("password-reset:") || row.expires.getTime() < Date.now()) return null;
  return row.identifier.slice("password-reset:".length);
}

/** Sets the new password, burns the link and signs the account out everywhere else. */
export async function resetPassword(raw: string, password: string): Promise<string | null> {
  const userId = await userIdForResetToken(raw);
  if (!userId) return null;
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { passwordEnc: encryptPassword(password) } }),
    db.verificationToken.deleteMany({ where: { identifier: identifierFor(userId) } }),
    db.session.deleteMany({ where: { userId } }),
  ]);
  return userId;
}
