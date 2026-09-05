import { createHash } from "node:crypto";

const SITE_URL = "https://zenith-studio.site";
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/* Server-side Purchase event via Meta's Conversions API — the only way to
   report a real sale to Meta here, since checkout happens on Whop's domain
   (whop.com), not this site, so the browser-side Pixel never sees the
   actual purchase. Called from the Whop webhook's payment.succeeded
   handler, which has the real amount/currency/course the moment it happens.

   Match quality is email-only (no client IP/user agent/fbp/fbc — those
   belong to the buyer's browser at click time, not this server-to-server
   webhook call), which is real but weaker than a full browser-side
   integration would give. Good enough for attribution; a future
   enhancement could thread _fbp/_fbc through the same UTM-metadata
   mechanism /api/go/[courseId] already uses.

   Never throws — a tracking failure must never break real payment
   processing (same principle as /api/go/[courseId]'s own comment). */
export async function sendMetaPurchaseEvent(params: {
  email: string;
  name?: string | null;
  value: number;
  currency: string;
  contentIds: string[];
  eventId: string; // dedup key — the Whop payment id, stable across retries
}): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) return; // Pixel/CAPI not configured — silently skip, not an error

  const [firstName, ...rest] = (params.name ?? "").trim().split(/\s+/).filter(Boolean);
  const lastName = rest.join(" ");

  const userData: Record<string, string[]> = { em: [sha256(params.email)] };
  if (firstName) userData.fn = [sha256(firstName)];
  if (lastName) userData.ln = [sha256(lastName)];

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        action_source: "website",
        event_source_url: `${SITE_URL}/lab`,
        user_data: userData,
        custom_data: {
          value: params.value,
          currency: params.currency,
          content_ids: params.contentIds,
          content_type: "product",
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      console.error("[meta-capi] Purchase event rejected:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[meta-capi] Purchase event failed to send:", err);
  }
}
