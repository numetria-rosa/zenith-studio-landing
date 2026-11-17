/* The Umrah outreach funnel from the two tables that hold it: OutreachContact (who was emailed, delivery, replies) and
   DemoHit (page views, engagement, checkout clicks). Pure, so the numbers are tested. */

export type FunnelContact = { code: string; name: string; market: string; status: string; emailedAt: Date | null; repliedAt: Date | null; suppressed: boolean };
export type FunnelHit = { kind: string; target: string | null; contact: string | null; utmCampaign: string | null; createdAt: Date };

export const MARKETS = ["uk", "us", "ca", "au", "za", "fr"];
const marketOrder = (m: string) => (MARKETS.includes(m) ? MARKETS.indexOf(m) : MARKETS.length);

export type MarketRow = {
  market: string;
  agencies: number;
  emailed: number;
  delivered: number;
  bounced: number;
  replied: number;
  /** All counted page views from that market's email and WhatsApp links, named or not. */
  views: number;
  /** Agencies whose own link was opened (can include a security scanner that looks like a browser). */
  openedAgencies: number;
  /** Agencies that did something on the page: the real human signal. */
  engagedAgencies: number;
  startClicks: number;
  checkoutClicks: number;
};

/** Which market a hit belongs to: the campaign tag (umrah-uk), else the agency's own market. */
export function hitMarket(h: FunnelHit, byCode: Map<string, FunnelContact>): string | null {
  const m = h.utmCampaign?.match(/^umrah-([a-z]{2})$/)?.[1];
  if (m) return m;
  return h.contact ? (byCode.get(h.contact)?.market ?? null) : null;
}

export function funnelByMarket(contacts: FunnelContact[], hits: FunnelHit[]): MarketRow[] {
  const byCode = new Map(contacts.map((c) => [c.code, c]));
  const rows = new Map<string, MarketRow>();
  const get = (market: string): MarketRow => {
    let r = rows.get(market);
    if (!r) {
      r = { market, agencies: 0, emailed: 0, delivered: 0, bounced: 0, replied: 0, views: 0, openedAgencies: 0, engagedAgencies: 0, startClicks: 0, checkoutClicks: 0 };
      rows.set(market, r);
    }
    return r;
  };
  for (const c of contacts) {
    const r = get(c.market);
    r.agencies++;
    if (c.emailedAt) r.emailed++;
    if (c.status === "delivered") r.delivered++;
    if (c.status === "bounced" || c.status === "complained") r.bounced++;
    if (c.repliedAt) r.replied++;
  }
  const opened = new Map<string, Set<string>>();
  const engaged = new Map<string, Set<string>>();
  const add = (m: Map<string, Set<string>>, market: string, code: string) => {
    const set = m.get(market) ?? new Set<string>();
    set.add(code);
    m.set(market, set);
  };
  for (const h of hits) {
    const market = hitMarket(h, byCode);
    if (!market) continue;
    const r = get(market);
    if (h.kind === "view") {
      r.views++;
      if (h.contact) add(opened, market, h.contact);
    } else if (h.kind === "engage") {
      if (h.contact) add(engaged, market, h.contact);
    } else if (h.kind === "start") r.startClicks++;
    else if (h.kind === "checkout") r.checkoutClicks++;
  }
  for (const [m, set] of opened) get(m).openedAgencies = set.size;
  for (const [m, set] of engaged) get(m).engagedAgencies = set.size;
  return [...rows.values()].sort((a, b) => marketOrder(a.market) - marketOrder(b.market) || a.market.localeCompare(b.market));
}

export type AgencyRow = { code: string; name: string; market: string; replied: boolean; suppressed: boolean; score: number; did: string[]; lastAt: Date };

const POINTS: Record<string, [number, string]> = {
  checkout: [100, "Clicked checkout"],
  start: [30, "Clicked Get started"],
  play: [20, "Played the chat demo"],
  "scroll:90": [15, "Scrolled to the end"],
  "time:120": [15, "Stayed 2+ minutes"],
  "scroll:50": [8, "Scrolled halfway"],
  "time:60": [8, "Stayed 1+ minute"],
  faq: [5, "Opened the FAQ"],
};

function pointsFor(key: string): [number, string] | null {
  if (POINTS[key]) return POINTS[key]!;
  if (key.startsWith("sim:")) return [10, "Ran a simulator scenario"];
  if (key.startsWith("view:")) return [10, "Looked at the dashboard tour"];
  return null;
}

/** Named agencies that opened their link, most interested first: a checkout click outranks everything, then the signs of reading. */
export function agenciesToFollowUp(contacts: FunnelContact[], hits: FunnelHit[]): AgencyRow[] {
  const byCode = new Map(contacts.map((c) => [c.code, c]));
  const acc = new Map<string, { score: number; did: Set<string>; lastAt: Date; views: number }>();
  for (const h of hits) {
    if (!h.contact || !byCode.has(h.contact)) continue;
    const a = acc.get(h.contact) ?? { score: 0, did: new Set<string>(), lastAt: h.createdAt, views: 0 };
    if (h.createdAt > a.lastAt) a.lastAt = h.createdAt;
    if (h.kind === "view") a.views++;
    const p = h.kind === "view" ? null : pointsFor(h.kind === "engage" ? (h.target ?? "") : h.kind);
    if (p && !a.did.has(p[1])) {
      a.did.add(p[1]);
      a.score += p[0];
    }
    acc.set(h.contact, a);
  }
  return [...acc.entries()]
    .map(([code, a]) => {
      const c = byCode.get(code)!;
      const did = [...a.did];
      if (a.views > 0 && did.length === 0) did.push("Opened the page only");
      return { code, name: c.name, market: c.market, replied: !!c.repliedAt, suppressed: c.suppressed, score: a.score + (a.views > 0 ? 2 : 0), did, lastAt: a.lastAt };
    })
    .sort((a, b) => b.score - a.score || b.lastAt.getTime() - a.lastAt.getTime());
}
