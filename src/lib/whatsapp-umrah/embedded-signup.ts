import { db } from "@/lib/db";

/* Embedded Signup, per CLAUDE.md's onboarding path: behind a feature flag,
   off until Zenith is an approved Meta Tech Provider (Business Verification
   + App Review, in progress as of 2026-09-30 - see docs.whop... no, see
   developers.facebook.com/documentation/business-messaging/whatsapp/
   solution-providers/get-started-for-tech-providers). The real "Connect
   with Meta" widget (Facebook Login for Business JS SDK + a Configuration
   ID from Meta's app dashboard) isn't wired in yet - there's nothing to
   test it against until that approval exists. This file only owns the
   decision of which UI an agency owner sees: the (future) widget, or the
   manual-connect fallback form, and the weekly cap that governs it. */

export const EMBEDDED_SIGNUP_ENABLED = process.env.WHATSAPP_UMRAH_EMBEDDED_SIGNUP_ENABLED === "true";

// Meta's own default limit for unapproved Tech Providers: 10 new business
// customers per rolling 7-day window (not calendar week), confirmed at the
// URL above 2026-09-30. Raises to 200/7 days automatically once Business
// Verification + App Review + Access Verification are all complete.
const DEFAULT_WEEKLY_CAP = 10;
function weeklyCap(): number {
  const raw = Number(process.env.WHATSAPP_UMRAH_EMBEDDED_SIGNUP_WEEKLY_CAP);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_WEEKLY_CAP;
}

/** Counts EMBEDDED_SIGNUP connections in the trailing 7 days from now,
    matching Meta's own rolling-window definition (not a calendar week) -
    see WaWhatsAppAccount.connectMethod's own comment. MANUAL connects
    (the admin page) never count against this cap. */
export async function isEmbeddedSignupCapReached(): Promise<boolean> {
  if (!EMBEDDED_SIGNUP_ENABLED) return true; // flag off - always show the fallback form
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const count = await db.waWhatsAppAccount.count({
    where: { connectMethod: "EMBEDDED_SIGNUP", connectedAt: { gte: sevenDaysAgo } },
  });
  return count >= weeklyCap();
}
