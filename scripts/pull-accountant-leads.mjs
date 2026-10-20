// Pulls accountant prospects for AI Document Chaser outreach: firms listed in OpenStreetMap (free, ODbL,
// "© OpenStreetMap contributors") that publish a website, then runs the website check
// (src/lib/accountant-site-check.ts) on each and keeps only the ones that look like they chase
// documents by hand and publish an email. Writes leads/<name>.json and .csv for review. Does not touch
// the database and sends nothing.
//
// Usage:
//   node --experimental-strip-types scripts/pull-accountant-leads.mjs UK uk-firms 100
//   node --experimental-strip-types scripts/pull-accountant-leads.mjs US us-states 50,20 OH,PA,MI
//     (US: per state, top 50 firms + top 20 solo practitioners)

import { mkdirSync, writeFileSync } from "node:fs";
import { analyzeAccountantSite, followUpLinks } from "../src/lib/accountant-site-check.ts";

const [country, outName, quota, statesArg] = process.argv.slice(2);
if (!["UK", "US"].includes(country) || !outName || !quota) {
  console.error("Usage: pull-accountant-leads.mjs UK|US <outName> <total | firms,individuals> [US state codes]");
  process.exit(1);
}
const UA = "Mozilla/5.0 (compatible; ZenithStudioLeadCheck/1.0; +https://zenith-studio.site)";
const MIN_SCORE = 50;

// Public Overpass instances; the main one is often busy, so rotate through mirrors on failure.
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];

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

const TAGS = `["office"~"accountant|tax_advisor"]`;
function areaQuery(area) {
  // UK: England, Scotland and Wales minus Greater London (the most-pitched market).
  if (area === "UK")
    return `[out:json][timeout:300];area["ISO3166-2"~"^GB-(ENG|SCT|WLS)$"]->.uk;area["name"="Greater London"]["boundary"="administrative"]->.ldn;(nwr${TAGS}(area.uk); - nwr${TAGS}(area.ldn););out tags center;`;
  return `[out:json][timeout:300];area["ISO3166-2"="US-${area}"]->.a;nwr${TAGS}(area.a);out tags center;`;
}

async function getPage(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(12000) });
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("html")) return null;
    return { url: r.url, html: (await r.text()).slice(0, 600000) };
  } catch {
    return null;
  }
}

async function check(el, region) {
  const t = el.tags;
  let site = t.website || t["contact:website"];
  if (!/^https?:\/\//i.test(site)) site = "https://" + site;
  const home = await getPage(site);
  if (!home) return null;
  const pages = [home];
  for (const link of followUpLinks(home.html, home.url)) {
    const p = await getPage(link);
    if (p) pages.push(p);
  }
  const name = t.name || t["operator"] || new URL(home.url).hostname;
  const c = analyzeAccountantSite(pages, { country, businessName: name });
  return {
    name,
    type: c.solo ? "individual" : "firm",
    email: c.emails[0] ?? "",
    website: new URL(home.url).origin,
    city: t["addr:city"] || "",
    region,
    phone: t.phone || t["contact:phone"] || "",
    score: c.score,
    portal: c.portalVendor ?? (c.genericPortal ? "generic portal" : ""),
    reasons: c.reasons.join("; "),
    source: "OpenStreetMap",
  };
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const item = items[i++];
        out.push(await fn(item));
        if (out.length % 25 === 0) console.log(`  checked ${out.length}/${items.length}`);
      }
    }),
  );
  return out;
}

const regions = country === "UK" ? ["UK"] : statesArg.split(",");
const seen = new Set();
const kept = [];
const summary = [];
for (const region of regions) {
  const els = (await overpass(areaQuery(region))).filter((e) => e.tags.website || e.tags["contact:website"]);
  console.log(`${region}: ${els.length} listings with a website`);
  const results = (await pool(els, 6, (e) => check(e, region))).filter(Boolean);
  const good = results
    .filter((r) => r.score >= MIN_SCORE && r.email)
    .filter((r) => {
      const key = new URL(r.website).hostname.replace(/^www\./, "") + "|" + r.email;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score);
  let picked;
  if (country === "UK") picked = good.slice(0, Number(quota));
  else {
    const [firms, individuals] = quota.split(",").map(Number);
    picked = [...good.filter((r) => r.type === "firm").slice(0, firms), ...good.filter((r) => r.type === "individual").slice(0, individuals)];
  }
  summary.push({ region, listingsWithWebsite: els.length, sitesReached: results.length, passed: good.length, picked: picked.length, firms: picked.filter((r) => r.type === "firm").length, individuals: picked.filter((r) => r.type === "individual").length });
  kept.push(...picked);
}

mkdirSync("leads", { recursive: true });
writeFileSync(`leads/${outName}.json`, JSON.stringify({ generatedAt: new Date().toISOString(), summary, leads: kept }, null, 2));
const cols = ["name", "type", "email", "website", "city", "region", "phone", "score", "portal", "reasons", "source"];
const csv = [cols.join(","), ...kept.map((r) => cols.map((c) => `"${String(r[c]).replace(/"/g, '""')}"`).join(","))].join("\n");
writeFileSync(`leads/${outName}.csv`, csv);
console.table(summary);
console.log(`Wrote leads/${outName}.json and .csv (${kept.length} leads)`);
