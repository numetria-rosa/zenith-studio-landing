import { readFile } from "fs/promises";
import path from "path";
import { after } from "next/server";
import { db } from "@/lib/db";

/* Serves a hand-made HTML file from public/ (the demo pages and the services catalog) and makes its visits countable.
   These files skip the site layout, so the Vercel Analytics script that lives there never ran on them: nobody who
   opened a link from a cold email was counted. Two fixes: add Vercel's plain-HTML snippet
   (vercel.com/docs/analytics/quickstart, script served at /_vercel/insights/script.js), and keep our own DemoHit row per
   visit, because Vercel's UTM breakdown is a paid add-on. No IP address and no user agent are stored. */

const ANALYTICS_SNIPPET = `<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script><script defer src="/_vercel/insights/script.js"></script>`;

/** Puts the analytics snippet at the end of <head> (or the top of the document when there is no head). */
export function injectAnalytics(html: string): string {
  if (html.includes("/_vercel/insights/script.js")) return html;
  const i = html.search(/<\/head>/i);
  return i === -1 ? ANALYTICS_SNIPPET + html : html.slice(0, i) + ANALYTICS_SNIPPET + html.slice(i);
}

/** Link scanners, crawlers and previews fetch pages without anyone reading them; they are not visits. */
export function isBotAgent(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return /bot|crawl|spider|slurp|preview|scan|monitor|fetch|curl|wget|python|headless|lighthouse|facebookexternalhit|embedly|safelinks|proofpoint|mimecast/i.test(userAgent);
}

export type DemoHitData = { path: string; country: string | null; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; referrer: string | null };

const clip = (v: string | null | undefined): string | null => (v ? v.slice(0, 120) : null);

/** What to store for one request, or null when it should not be counted. Pure, so it is testable. */
export function demoHitFrom(url: string, headers: Pick<Headers, "get">): DemoHitData | null {
  if (isBotAgent(headers.get("user-agent"))) return null;
  const u = new URL(url);
  let referrer: string | null = null;
  try {
    const host = new URL(headers.get("referer") ?? "").hostname;
    if (host && !/(^|\.)zenith-studio\.site$/.test(host)) referrer = host;
  } catch {
    /* no or invalid referer */
  }
  return {
    path: u.pathname.slice(0, 120),
    country: clip(headers.get("x-vercel-ip-country")),
    utmSource: clip(u.searchParams.get("utm_source")),
    utmMedium: clip(u.searchParams.get("utm_medium")),
    utmCampaign: clip(u.searchParams.get("utm_campaign")),
    referrer: clip(referrer),
  };
}

/** Reads public/<file>, adds the analytics snippet, and records the visit after the response is sent. */
export async function serveStaticHtml(request: Request, file: string): Promise<Response> {
  const html = injectAnalytics(await readFile(path.join(process.cwd(), "public", file), "utf-8"));
  const hit = demoHitFrom(request.url, request.headers);
  if (hit) {
    after(async () => {
      try {
        await db.demoHit.create({ data: hit });
      } catch (err) {
        console.error("[demo-hit] not recorded:", err instanceof Error ? err.message : err);
      }
    });
  }
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
