// Pulls UK Umrah/Hajj travel agency prospects for WhatsApp AI Agent outreach: travel agencies listed in OpenStreetMap
// (free, ODbL, "© OpenStreetMap contributors") that publish a website, then checks each site
// (src/lib/umrah-agency-site-check.ts) and keeps only agencies that sell Umrah or Hajj, mention ATOL (a licensed seller, which drops unlicensed shops), use WhatsApp, show no AI
// assistant or chatbot, and publish an email whose domain accepts mail. Writes leads/<name>.json and .csv for review.
// Does not touch the database and sends nothing. It cannot see whether a WhatsApp number auto-replies, so the final
// "has no AI agent" check is a manual look at their WhatsApp.
//
// Usage:
//   node --experimental-strip-types scripts/pull-umrah-agency-leads.mjs uk-umrah-agencies London,Birmingham,Manchester,Bradford

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { promises as dns } from "node:dns";
import { analyzeAgencySite } from "../src/lib/umrah-agency-site-check.ts";
import { followUpLinks } from "../src/lib/accountant-site-check.ts";

const UA = "Mozilla/5.0 (compatible; ZenithStudioLeadCheck/1.0; +https://zenith-studio.site)";
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];

// Overpass area selectors per city (ISO 3166-2 codes for the metropolitan districts, a name for Greater London).
const AREAS = {
  London: `area["name"="Greater London"]["boundary"="administrative"]`,
  Birmingham: `area["ISO3166-2"="GB-BIR"]`,
  Manchester: `area["ISO3166-2"="GB-MAN"]`,
  Bradford: `area["ISO3166-2"="GB-BFD"]`,
  Leicester: `area["ISO3166-2"="GB-LCE"]`,
  Blackburn: `area["ISO3166-2"="GB-BBD"]`,
  Luton: `area["ISO3166-2"="GB-LUT"]`,
  Glasgow: `area["ISO3166-2"="GB-GLG"]`,
  Dudley: `area["ISO3166-2"="GB-DUD"]`,
  Bolton: `area["ISO3166-2"="GB-BOL"]`,
  Oldham: `area["ISO3166-2"="GB-OLD"]`,
  Rochdale: `area["ISO3166-2"="GB-RCH"]`,
  Slough: `area["ISO3166-2"="GB-SLG"]`,
  Walsall: `area["ISO3166-2"="GB-WLL"]`,
  Wolverhampton: `area["ISO3166-2"="GB-WLV"]`,
  Sandwell: `area["ISO3166-2"="GB-SAW"]`,
  Sheffield: `area["ISO3166-2"="GB-SHF"]`,
  Leeds: `area["ISO3166-2"="GB-LDS"]`,
  Kirklees: `area["ISO3166-2"="GB-KIR"]`,
  Coventry: `area["ISO3166-2"="GB-COV"]`,
  Nottingham: `area["ISO3166-2"="GB-NGM"]`,
  Derby: `area["ISO3166-2"="GB-DER"]`,
  Peterborough: `area["ISO3166-2"="GB-PTE"]`,
  Bristol: `area["ISO3166-2"="GB-BST"]`,
  Cardiff: `area["ISO3166-2"="GB-CRF"]`,
  Newcastle: `area["ISO3166-2"="GB-NET"]`,
  Edinburgh: `area["ISO3166-2"="GB-EDH"]`,
  Reading: `area["ISO3166-2"="GB-RDG"]`,
  Preston: `area["name"="Preston"]["boundary"="administrative"]["admin_level"="8"]`,
  // Europe outside the UK: whole countries, searched by Muslim-travel business name only (a whole country's
  // travel agencies is thousands of sites). No ATOL there, so the ATOL filter below applies to the UK only.
  Belgium: `area["ISO3166-1"="BE"]`,
  Ireland: `area["ISO3166-1"="IE"]`,
  Netherlands: `area["ISO3166-1"="NL"]`,
  Germany: `area["ISO3166-1"="DE"]`,
};
const EUROPE = new Set(["Belgium", "Ireland", "Netherlands", "Germany"]);
const NAME_EU = "umrah|umra|omra|hajj|hadj|hadsj|hadsch|makkah|makka|mekka|mecca|madinah|medina|madina|islam|halal|muslim|ummah|kaaba|kaba|haramain|zamzam|safa|marwa|ihram|hijaz|ziyara|salam|iman|hidaya|hidayah";

const NAME = "umrah|umra|hajj|haj |makkah|makka|madinah|madina|islamic|hijaz|ziyara|tayyiba|zamzam|kaaba|haramain|sacred";

async function overpass(query) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = OVERPASS[attempt % OVERPASS.length];
    try {
      const r = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(query), headers: { "User-Agent": "zenith-studio-lead-research/1.0", "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(330000) });
      if (r.ok) return (await r.json()).elements;
      console.log(`  ${url} -> ${r.status}, retrying`);
    } catch (err) {
      console.log(`  ${url} -> ${err.cause?.code ?? err.message}, retrying`);
    }
    await new Promise((res) => setTimeout(res, 10000 * (attempt + 1)));
  }
  throw new Error("Overpass failed on every mirror");
}

const queryEu = (area) => `[out:json][timeout:300];${area}->.a;(nwr["name"~"${NAME_EU}",i]["website"](area.a);nwr["name"~"${NAME_EU}",i]["contact:website"](area.a););out tags center;`;
const query = (area) => `[out:json][timeout:300];${area}->.a;(nwr["shop"="travel_agency"](area.a);nwr["office"="travel_agent"](area.a);nwr["name"~"${NAME}",i]["website"](area.a););out tags center;`;

async function getPage(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(12000) });
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("html")) return null;
    return { url: r.url, html: (await r.text()).slice(0, 600000) };
  } catch {
    return null;
  }
}

const mailDomains = new Map();
function acceptsMail(email) {
  const domain = email.split("@")[1];
  if (!mailDomains.has(domain))
    mailDomains.set(domain, dns.resolveMx(domain).then((mx) => mx.length > 0).catch(() => dns.resolve4(domain).then((a) => a.length > 0, () => false)));
  return mailDomains.get(domain);
}

async function checkSite({ site, name, city, phone, region }) {
  if (!/^https?:\/\//i.test(site)) site = "https://" + site;
  const home = await getPage(site);
  if (!home) return null;
  const pages = [home];
  for (const link of followUpLinks(home.html, home.url)) {
    const p = await getPage(link);
    if (p) pages.push(p);
  }
  const c = analyzeAgencySite(pages);
  const email = c.emails[0] ?? "";
  const reasons = [...c.reasons];
  let score = c.score;
  if (email && !(await acceptsMail(email))) (score = 0), reasons.push("email domain does not accept mail");
  return {
    name: name || new URL(home.url).hostname,
    email,
    website: new URL(home.url).origin,
    city: city || "",
    region,
    phone: phone || "",
    whatsapp: c.whatsapp,
    whatsappNumber: c.whatsappNumber,
    sellsUmrah: c.sellsUmrah,
    hasAi: c.aiSignals.length > 0,
    liveChat: c.liveChat.join("; "),
    atol: c.atol,
    score,
    reasons: reasons.join("; "),
    source: "OpenStreetMap",
  };
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) out.push(await fn(items[i++]));
    }),
  );
  return out;
}

const [outName, citiesArg] = process.argv.slice(2);
if (!outName || !citiesArg) {
  console.error("Usage: pull-umrah-agency-leads.mjs <outName> <City,City,...>");
  process.exit(1);
}
mkdirSync("leads/.cache", { recursive: true });
const seen = new Set();
const kept = [];
const summary = [];
for (const city of citiesArg.split(",")) {
  if (!AREAS[city]) throw new Error(`Unknown city ${city}; add it to AREAS`);
  const cacheFile = `leads/.cache/umrah-${city}.json`;
  let listings, noWebsite, results;
  if (existsSync(cacheFile)) ({ listings, noWebsite, results } = JSON.parse(readFileSync(cacheFile, "utf8")));
  else {
    const all = await overpass((EUROPE.has(city) ? queryEu : query)(AREAS[city]));
    const els = all.filter((e) => e.tags.website || e.tags["contact:website"]);
    listings = all.length;
    noWebsite = all.length - els.length;
    results = (await pool(els, 6, (e) => checkSite({ site: e.tags.website || e.tags["contact:website"], name: e.tags.name || e.tags.operator, city: e.tags["addr:city"] || city, phone: e.tags.phone || e.tags["contact:phone"], region: city }))).filter(Boolean);
    writeFileSync(cacheFile, JSON.stringify({ listings, noWebsite, results }));
  }
  const good = results
    .filter((r) => r.sellsUmrah && r.whatsapp !== "none" && (r.atol || EUROPE.has(city)) && !r.hasAi && r.email && r.score >= 50)
    .filter((r) => {
      const key = new URL(r.website).hostname.replace(/^www\./, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score);
  kept.push(...good);
  summary.push({ city, listings, noWebsite, sitesReached: results.length, sellUmrah: results.filter((r) => r.sellsUmrah).length, withWhatsapp: results.filter((r) => r.sellsUmrah && r.whatsapp !== "none").length, withAtol: results.filter((r) => r.sellsUmrah && r.whatsapp !== "none" && r.atol).length, alreadyHaveAi: results.filter((r) => r.sellsUmrah && r.hasAi).length, kept: good.length });
}

const cols = ["name", "email", "website", "city", "phone", "whatsapp", "whatsappNumber", "liveChat", "atol", "score", "reasons", "source"];
writeFileSync(`leads/${outName}.json`, JSON.stringify({ generatedAt: new Date().toISOString(), summary, leads: kept }, null, 2));
writeFileSync(`leads/${outName}.csv`, [cols.join(","), ...kept.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n"));
console.table(summary);
console.log(`Wrote leads/${outName}.json and .csv (${kept.length} leads)`);
