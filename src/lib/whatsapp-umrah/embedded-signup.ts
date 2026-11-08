import { db } from "@/lib/db";

/* Embedded Signup, per CLAUDE.md's onboarding path: behind a feature flag,
   behind WHATSAPP_UMRAH_EMBEDDED_SIGNUP_ENABLED. Zenith is an approved Meta Tech Provider
   (developers.facebook.com/documentation/business-messaging/whatsapp/
   solution-providers/get-started-for-tech-providers) and the "Connect with
   Meta" widget (EmbeddedSignupButton.tsx) is live. This file only owns the
   decision of which UI an agency owner sees: the widget, or the
   manual-connect fallback form, and the weekly cap that governs it. */

export const EMBEDDED_SIGNUP_ENABLED = process.env.WHATSAPP_UMRAH_EMBEDDED_SIGNUP_ENABLED === "true";

// Meta's limit on new business customers a Tech Provider can onboard in a rolling 7-day window (not a calendar week):
// 10 by default, raised automatically to 200 once Business Verification, App Review and Access Verification are all
// complete (Meta's Embedded Signup overview, read 2026-11-08, via developers.facebook.com/documentation/business-
// messaging/whatsapp/embedded-signup/overview). All three are complete for Zenith Studio as of 2026-11-08 (business
// verified, app approved for whatsapp_business_messaging and whatsapp_business_management, Access Verification granted),
// so the default is 200. WHATSAPP_UMRAH_EMBEDDED_SIGNUP_WEEKLY_CAP overrides it. Past 200 a week, Meta says to apply
// to become a Meta Business Partner.
const DEFAULT_WEEKLY_CAP = 200;
export function weeklyCap(): number {
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
