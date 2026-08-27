import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/* Admin identification via env var allowlist — the original, smallest
   correct thing for a single operator. ADMIN_EMAILS="you@zenith-studio.site,other@x.com"
   Kept as a fallback alongside the real User.role column (added in the
   2026-08-27 service-platform migration) during the transition, so a
   misconfigured/stale role never locks out the operator. Once every real
   admin account has role=ADMIN in the database, ADMIN_EMAILS can be retired. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}

/** Returns the session if the signed-in user is an admin, else null.
    Callers should treat null the same as "not found" (404), not "forbidden"
    — an admin route's existence shouldn't be discoverable to non-admins. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;

  if (isAdminEmail(session.user.email)) return session;

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role === "ADMIN") return session;

  return null;
}
