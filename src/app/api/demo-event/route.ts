import { db } from "@/lib/db";
import { agencyActiveAlertText, checkoutAlertText, demoEventFrom, MAX_ALERTS_PER_HOUR } from "@/lib/demo-events";

/* Receives the click and engagement beacons from the public demo pages (see src/lib/static-html.ts), stores one DemoHit
   row per event and emails the owner when it matters: a checkout click, or the first activity of a named outreach
   agency in a day. Always answers 204: the page should never notice, and a caller gets no hint why an event was ignored. */
export async function POST(request: Request): Promise<Response> {
  try {
    const raw = await request.text();
    if (raw.length > 2000) return new Response(null, { status: 204 });
    const event = demoEventFrom(JSON.parse(raw), request.headers);
    if (!event) return new Response(null, { status: 204 });
    const now = Date.now();
    // Whether this agency already did something today, before this row is added.
    const activeToday = event.contact && event.kind === "engage" ? await db.demoHit.count({ where: { contact: event.contact, kind: { in: ["engage", "checkout", "start"] }, createdAt: { gte: new Date(now - 86400000) } } }) : 1;
    await db.demoHit.create({ data: { path: event.path, kind: event.kind, target: event.target, country: event.country, utmSource: event.utmSource, utmMedium: event.utmMedium, utmCampaign: event.utmCampaign, contact: event.contact, visit: event.visit } });

    const agency = event.contact ? (await db.outreachContact.findUnique({ where: { code: event.contact }, select: { name: true } }))?.name ?? null : null;
    const alert = event.kind === "checkout" ? checkoutAlertText(event, agency) : agency && activeToday === 0 ? agencyActiveAlertText(event, agency) : null;
    if (alert) {
      const sentLastHour = await db.demoHit.count({ where: { kind: { in: ["checkout", "engage"] }, createdAt: { gte: new Date(now - 3600000) }, OR: [{ kind: "checkout" }, { contact: { not: null } }] } });
      if (sentLastHour <= MAX_ALERTS_PER_HOUR) {
        const { sendAdminAlert } = await import("@/lib/outreach-mail");
        await sendAdminAlert(alert.subject, alert.body).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[demo-event] ignored:", err instanceof Error ? err.message : err);
  }
  return new Response(null, { status: 204 });
}
