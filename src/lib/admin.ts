import { auth } from "@/lib/auth";

/* Admin identification via env var allowlist — the smallest correct thing
   for a single operator. ADMIN_EMAILS="you@zenith-studio.site,other@x.com" */
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
  if (!isAdminEmail(session?.user?.email)) return null;
  return session;
}
