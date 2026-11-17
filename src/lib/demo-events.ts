import { isBotAgent } from "@/lib/static-html";

/* Clicks on the public pages that show buying intent, sent by the small script static-html.ts adds to each page:
   "start" = a Get started button, "checkout" = a link that opens the Whop checkout. Pure helpers, tested. */

export type DemoEventKind = "start" | "checkout";
export type DemoEventData = { kind: DemoEventKind; path: string; target: string | null; country: string | null; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; referrer: string | null };

const OWN_HOST = /(^|\.)zenith-studio\.site$/;
const CHECKOUT_ID = /whop\.com\/checkout\/(ch_[A-Za-z0-9]+)/;
const clip = (v: unknown, n = 120): string | null => (typeof v === "string" && v ? v.slice(0, n) : null);

/** The stored event for one beacon, or null when it should be ignored (bots, other sites, nonsense). */
export function demoEventFrom(body: unknown, headers: Pick<Headers, "get">): DemoEventData | null {
  if (isBotAgent(headers.get("user-agent"))) return null;
  const from = headers.get("origin") ?? headers.get("referer") ?? "";
  try {
    if (!OWN_HOST.test(new URL(from).hostname) && !/^localhost$/.test(new URL(from).hostname)) return null;
  } catch {
    return null;
  }
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (b.kind !== "start" && b.kind !== "checkout") return null;
  const path = clip(b.path);
  if (!path || !/^\/(demo|services)(\/|$)/.test(path)) return null;
  const q = new URLSearchParams(typeof b.search === "string" ? b.search.slice(0, 400) : "");
  return {
    kind: b.kind,
    path,
    target: typeof b.href === "string" ? (b.href.match(CHECKOUT_ID)?.[1] ?? null) : null,
    country: clip(headers.get("x-vercel-ip-country")),
    utmSource: clip(q.get("utm_source")),
    utmMedium: clip(q.get("utm_medium")),
    utmCampaign: clip(q.get("utm_campaign")),
    referrer: null,
  };
}

/** The email to the owner for a checkout click. */
export function checkoutAlertText(e: DemoEventData): { subject: string; body: string } {
  return {
    subject: `Checkout clicked on ${e.path}`,
    body: [
      `Someone clicked a checkout button.`,
      `Page: ${e.path}`,
      `Checkout link: ${e.target ?? "not recognised"}`,
      `Country: ${e.country ?? "unknown"}`,
      `Campaign: ${e.utmCampaign ?? "none"}${e.utmSource ? ` (${e.utmSource}${e.utmMedium ? ` / ${e.utmMedium}` : ""})` : ""}`,
      ``,
      `A click is intent, not a purchase. Whether they paid shows in Whop. All clicks: /admin/demo-visits`,
    ].join("\n"),
  };
}

/** At most this many checkout alert emails an hour, so a loop or a scanner cannot flood the inbox. */
export const MAX_CHECKOUT_ALERTS_PER_HOUR = 10;
