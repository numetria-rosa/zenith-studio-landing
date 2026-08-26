import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/* Manually creating an Auth.js database session (bypassing signIn()) for two
   flows that don't fit its built-in providers: the post-checkout auto-claim
   redirect (no credentials at all — proof is the Whop payment id), and
   password sign-in (Credentials provider requires JWT sessions; this app is
   database-session throughout for the Resend magic-link provider). Cookie
   name/flags mirror @auth/core/lib/utils/cookie.js defaultCookies() exactly,
   so auth() reads these sessions identically to ones NextAuth creates itself. */
const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, Auth.js's default

export async function createSessionForUser(userId: string) {
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await db.session.create({ data: { sessionToken, userId, expires } });

  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}
