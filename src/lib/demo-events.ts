import { contactFromSearch, isBotAgent } from "@/lib/static-html";

/* What the small script static-html.ts adds to each public page may tell us: "start" = a Get started button,
   "checkout" = a link that opens the Whop checkout, "engage" = the visitor did something on the page (target says what).
   Pure helpers, tested. */

export type DemoEventKind = "start" | "checkout" | "engage";
export type DemoEventData = {
  kind: DemoEventKind;
  path: string;
  /** checkout: the Whop checkout id; engage: what the visitor did (see ENGAGE_TARGET). */
  target: string | null;
  country: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  contact: string | null;
  visit: string | null;
};

const OWN_HOST = /(^|\.)zenith-studio\.site$/;
const CHECKOUT_ID = /whop\.com\/checkout\/(ch_[A-Za-z0-9]+)/;
/** play = chat demo, sim:N = a simulator scenario, view:X = a dashboard tab, faq, scroll:N percent, time:N seconds on the page. */
export const ENGAGE_TARGET = /^(play|faq|sim:\d{1,2}|view:[a-z-]{1,20}|scroll:(25|50|75|90)|time:(30|60|120))$/;
const clip = (v: unknown, n = 120): string | null => (typeof v === "string" && v ? v.slice(0, n) : null);

/** The stored event for one beacon, or null when it should be ignored (bots, other sites, nonsense). */
export function demoEventFrom(body: unknown, headers: Pick<Headers, "get">): DemoEventData | null {
  if (isBotAgent(headers.get("user-agent"))) return null;
  const from = headers.get("origin") ?? headers.get("referer") ?? "";
  try {
    const host = new URL(from).hostname;
    if (!OWN_HOST.test(host) && host !== "localhost") return null;
  } catch {
    return null;
  }
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (b.kind !== "start" && b.kind !== "checkout" && b.kind !== "engage") return null;
  const path = clip(b.path);
  if (!path || !/^\/(demo|services)(\/|$)/.test(path)) return null;
  let target: string | null = null;
  if (b.kind === "engage") {
    if (typeof b.target !== "string" || !ENGAGE_TARGET.test(b.target)) return null;
    target = b.target;
  } else if (typeof b.href === "string") {
    target = b.href.match(CHECKOUT_ID)?.[1] ?? null;
  }
  const q = new URLSearchParams(typeof b.search === "string" ? b.search.slice(0, 400) : "");
  return {
    kind: b.kind,
    path,
    target,
    country: clip(headers.get("x-vercel-ip-country")),
    utmSource: clip(q.get("utm_source")),
    utmMedium: clip(q.get("utm_medium")),
    utmCampaign: clip(q.get("utm_campaign")),
    contact: contactFromSearch(q.get("utm_content")),
    visit: typeof b.visit === "string" && /^[a-z0-9]{4,16}$/.test(b.visit) ? b.visit : null,
  };
}

const WHAT: Record<string, string> = { play: "played the chat demo", faq: "opened the FAQ" };
/** "scroll:50" -> "scrolled 50 percent of the page", "view:leads" -> "opened the leads tab of the dashboard tour". */
export function engageLabel(target: string): string {
  if (WHAT[target]) return WHAT[target];
  const [k, v] = target.split(":");
  if (k === "scroll") return `scrolled ${v} percent of the page`;
  if (k === "time") return `stayed ${v} seconds`;
  if (k === "sim") return `ran simulator scenario ${v}`;
  if (k === "view") return `opened the ${v} tab of the dashboard tour`;
  return target;
}

type Alert = { subject: string; body: string };
const campaignLine = (e: DemoEventData) => `Campaign: ${e.utmCampaign ?? "none"}${e.utmSource ? ` (${e.utmSource}${e.utmMedium ? ` / ${e.utmMedium}` : ""})` : ""}`;

/** The email to the owner for a checkout click. `agency` is the named agency when the link carried a contact code. */
export function checkoutAlertText(e: DemoEventData, agency?: string | null): Alert {
  return {
    subject: agency ? `${agency} clicked checkout on ${e.path}` : `Checkout clicked on ${e.path}`,
    body: [
      agency ? `${agency} clicked a checkout button.` : `Someone clicked a checkout button.`,
      `Page: ${e.path}`,
      `Checkout link: ${e.target ?? "not recognised"}`,
      `Country: ${e.country ?? "unknown"}`,
      campaignLine(e),
      ``,
      `A click is intent, not a purchase. Whether they paid shows in Whop. All activity: /admin/outreach-funnel`,
    ].join("\n"),
  };
}

/** The email to the owner the first time a named agency does something on the demo page in a day. */
export function agencyActiveAlertText(e: DemoEventData, agency: string): Alert {
  return {
    subject: `${agency} is looking at the demo`,
    body: [
      `${agency} ${engageLabel(e.target ?? "")} on ${e.path}.`,
      `Country: ${e.country ?? "unknown"}`,
      campaignLine(e),
      ``,
      `Good moment for a short, personal follow-up. Their full activity: /admin/outreach-funnel`,
    ].join("\n"),
  };
}

/** Alert-worthy events (checkout clicks, and engagement from named agencies) allowed per hour before alert emails stop, so a loop or
    a scanner cannot flood the inbox. One agency visit is about 5 events. */
export const MAX_ALERTS_PER_HOUR = 60;
