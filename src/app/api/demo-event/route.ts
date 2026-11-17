import { db } from "@/lib/db";
import { checkoutAlertText, demoEventFrom, MAX_CHECKOUT_ALERTS_PER_HOUR } from "@/lib/demo-events";

/* Receives the click beacons from the public demo pages (see src/lib/static-html.ts), stores one DemoHit row per click
   and emails the owner on a checkout click. Always answers 204: the page should never notice, and a caller gets no hint
   why an event was ignored. */
export async function POST(request: Request): Promise<Response> {
  try {
    const raw = await request.text();
    if (raw.length > 2000) return new Response(null, { status: 204 });
    const event = demoEventFrom(JSON.parse(raw), request.headers);
    if (!event) return new Response(null, { status: 204 });
    await db.demoHit.create({ data: { path: event.path, kind: event.kind, target: event.target, country: event.country, utmSource: event.utmSource, utmMedium: event.utmMedium, utmCampaign: event.utmCampaign } });
    if (event.kind === "checkout") {
      const lastHour = await db.demoHit.count({ where: { kind: "checkout", createdAt: { gte: new Date(Date.now() - 3600000) } } });
      if (lastHour <= MAX_CHECKOUT_ALERTS_PER_HOUR) {
        const { sendAdminAlert } = await import("@/lib/outreach-mail");
        const { subject, body } = checkoutAlertText(event);
        await sendAdminAlert(subject, body).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[demo-event] ignored:", err instanceof Error ? err.message : err);
  }
  return new Response(null, { status: 204 });
}
