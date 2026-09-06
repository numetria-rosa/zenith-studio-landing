import { NextRequest, NextResponse } from "next/server";
import { getCourse, getCheckoutUrl } from "@/lib/courses";
import { getWhopClient } from "@/lib/whop";
import { db } from "@/lib/db";

/* Tracked checkout redirect. /lab's "Get access" buttons link here instead
   of straight to the static Whop checkout URL, carrying whatever UTM params
   brought the visitor to /lab in the first place (see CourseCatalog.tsx).

   Why go through Whop's API instead of just appending ?utm_... to the
   static checkout link: Whop's hosted checkout page doesn't read or store
   arbitrary query params. checkoutConfigurations.create() with a metadata
   object, though, produces a real (single-use-style) checkout URL whose
   metadata Whop copies onto the resulting payment AND membership — so it
   shows up on the payment.succeeded webhook automatically. That webhook
   already logs its full raw payload to WebhookEvent unconditionally (see
   src/app/api/webhooks/whop/route.ts), so no schema change was needed to
   capture this — see scripts/check-utm-sales.mjs to query it back out.

   If creating the tracked checkout fails for any reason (Whop API error,
   missing plan, etc.), this falls back to the plain static checkout URL —
   a tracking failure must never block an actual purchase. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course || !course.published) {
    return new NextResponse("Not found", { status: 404 });
  }

  const sp = request.nextUrl.searchParams;
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const value = sp.get(key);
    if (value) utm[key] = value;
  }

  // Recorded here, not just in the payment.succeeded webhook, because Whop
  // only ever hears about a *submitted* checkout — someone who clicks
  // "Get access" and abandons before entering payment info leaves no trace
  // on Whop's side. This is the only record of that step. Awaited (not
  // fire-and-forget) since a serverless function can be frozen the moment
  // its response is sent; failure is swallowed, same as the checkout
  // tracking below — a DB hiccup must never block a real redirect.
  try {
    await db.checkoutAttempt.create({
      data: {
        courseId: course.id,
        utmSource: utm.utm_source ?? null,
        utmMedium: utm.utm_medium ?? null,
        utmCampaign: utm.utm_campaign ?? null,
        utmContent: utm.utm_content ?? null,
      },
    });
  } catch (err) {
    console.error(`[/api/go/${courseId}] Failed to record checkout attempt:`, err);
  }

  const { url: fallbackUrl, isRealCheckout } = getCheckoutUrl(course);
  if (!isRealCheckout || !course.whopPlanId) {
    return NextResponse.redirect(fallbackUrl);
  }

  if (Object.keys(utm).length === 0) {
    // Nothing to attribute — skip the extra API round trip and go straight
    // to checkout, same as before this route existed.
    return NextResponse.redirect(fallbackUrl);
  }

  try {
    const client = getWhopClient();
    const config = await client.checkoutConfigurations.create({
      plan_id: course.whopPlanId,
      metadata: { ...utm, courseId: course.id },
    });
    if (config.purchase_url) {
      return NextResponse.redirect(config.purchase_url);
    }
  } catch (err) {
    console.error(`[/api/go/${courseId}] Failed to create tracked checkout, falling back to static URL:`, err);
  }

  return NextResponse.redirect(fallbackUrl);
}
