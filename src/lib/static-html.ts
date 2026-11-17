import { readFile } from "fs/promises";
import path from "path";
import { after } from "next/server";
import { db } from "@/lib/db";

/* Serves a hand-made HTML file from public/ (the demo pages and the services catalog) and makes its visits countable.
   These files skip the site layout, so the Vercel Analytics script that lives there never ran on them: nobody who
   opened a link from a cold email was counted. Two fixes: add Vercel's plain-HTML snippet
   (vercel.com/docs/analytics/quickstart, script served at /_vercel/insights/script.js), and keep our own DemoHit row per
   visit, because Vercel's UTM breakdown is a paid add-on. No IP address and no user agent are stored. */

// Second script: reports clicks on Get started buttons and Whop checkout links, and how a visitor engages (played the
// chat demo, opened a sim, a dashboard tab or the FAQ, scrolled 25/50/75/90 percent, stayed 30/60/120 seconds). One beacon
// per thing per page load, tagged with a random visit id. See demo-events.ts for what the server accepts.
const CLICK_TRACKER = String.raw`<script>(function(){var v=Math.random().toString(36).slice(2,10),done={};function send(o){o.visit=v;o.path=location.pathname;o.search=location.search;try{navigator.sendBeacon('/api/demo-event',new Blob([JSON.stringify(o)],{type:'application/json'}));}catch(x){}}function once(t){if(done[t])return;done[t]=1;send({kind:'engage',target:t});}document.addEventListener('click',function(e){var el=e.target&&e.target.closest?e.target:null;if(!el)return;var a=el.closest('a');if(a){var h=a.href||'';var k=/whop\.com\/checkout/.test(h)?'checkout':(a.classList&&a.classList.contains('js-start')?'start':'');if(k){send({kind:k,href:h});return;}}var s;if(el.closest('#playBtn'))return once('play');s=el.closest('[data-sim]');if(s)return once('sim:'+s.getAttribute('data-sim'));s=el.closest('[data-view]');if(s)return once('view:'+s.getAttribute('data-view'));if(el.closest('details.faq'))return once('faq');},true);window.addEventListener('scroll',function(){var d=document.documentElement,max=d.scrollHeight-window.innerHeight;if(max<=0)return;var p=100*window.scrollY/max;[25,50,75,90].forEach(function(m){if(p>=m)once('scroll:'+m);});},{passive:true});var t=0;setInterval(function(){if(document.visibilityState==='visible'){t++;if(t===30||t===60||t===120)once('time:'+t);}},1000);})();</script>`;
const ANALYTICS_SNIPPET = `<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script><script defer src="/_vercel/insights/script.js"></script>` + CLICK_TRACKER;

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

export type DemoHitData = { path: string; country: string | null; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; contact: string | null; referrer: string | null };

const clip = (v: string | null | undefined): string | null => (v ? v.slice(0, 120) : null);

/** utm_content is the outreach contact code (src/lib/outreach-code.ts): 8 lowercase letters or digits, anything else is dropped. */
export const contactFromSearch = (v: string | null): string | null => (v && /^[0-9a-z]{8}$/.test(v) ? v : null);

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
    contact: contactFromSearch(u.searchParams.get("utm_content")),
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
