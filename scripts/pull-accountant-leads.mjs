// Pulls accountant prospects for AI Document Chaser outreach: firms listed in OpenStreetMap (free, ODbL,
// "© OpenStreetMap contributors") that publish a website, then runs the website check
// (src/lib/accountant-site-check.ts) on each and keeps only the ones that look like they chase
// documents by hand, publish an email whose domain accepts mail, and aren't large firms. Writes
// leads/<name>.json and .csv for review. Does not touch the database and sends nothing.
//
// Usage:
//   node --experimental-strip-types scripts/pull-accountant-leads.mjs UK uk-firms 100
//   node --experimental-strip-types scripts/pull-accountant-leads.mjs US us-states 50,20 OH,PA,MI
//     (US: per state, top 50 firms + top 20 solo practitioners)
//   node --experimental-strip-types scripts/pull-accountant-leads.mjs recheck us-states us-states-clean
//     (re-checks an existing list's websites with the current rules, no OpenStreetMap query)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { promises as dns } from "node:dns";
import { analyzeAccountantSite, followUpLinks } from "../src/lib/accountant-site-check.ts";

const UA = "Mozilla/5.0 (compatible; ZenithStudioLeadCheck/1.0; +https://zenith-studio.site)";
const MIN_SCORE = 50;
const CHECK_VERSION = 2; // bump when the website check changes, so cached results from older rules aren't reused

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

// A domain accepts mail if it has MX records, or (per RFC 5321's implicit MX rule) at least an address record.
const mailDomains = new Map();
function acceptsMail(email) {
  const domain = email.split("@")[1];
  if (!mailDomains.has(domain))
    mailDomains.set(
      domain,
      dns
        .resolveMx(domain)
        .then((mx) => mx.length > 0)
        .catch(() => dns.resolve4(domain).then((a) => a.length > 0, () => false)),
    );
  return mailDomains.get(domain);
}

async function checkSite({ site, name, city, phone, region, country }) {
  if (!/^https?:\/\//i.test(site)) site = "https://" + site;
  const home = await getPage(site);
  if (!home) return null;
  const pages = [home];
  for (const link of followUpLinks(home.html, home.url)) {
    const p = await getPage(link);
    if (p) pages.push(p);
  }
  const businessName = name || new URL(home.url).hostname;
  const c = analyzeAccountantSite(pages, { country, businessName });
  let score = c.score;
  const reasons = [...c.reasons];
  const email = c.emails[0] ?? "";
  if (email && !(await acceptsMail(email))) (score = 0), reasons.push("email domain does not accept mail");
  return {
    name: businessName,
    contact: c.contactFirstName ?? "",
    type: c.solo ? "individual" : "firm",
    email,
    website: new URL(home.url).origin,
    city: city || "",
    region,
    phone: phone || "",
    score,
    portal: c.portalVendor ?? (c.genericPortal ? "generic portal" : ""),
    reasons: reasons.join("; "),
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

function pick(results, country, quota, seen) {
  const good = results
    .filter((r) => r.score >= MIN_SCORE && r.email)
    .filter((r) => {
      const key = new URL(r.website).hostname.replace(/^www\./, "") + "|" + r.email;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score);
  if (country === "UK") return { good, picked: good.slice(0, Number(quota)) };
  const [firms, individuals] = quota.split(",").map(Number);
  return { good, picked: [...good.filter((r) => r.type === "firm").slice(0, firms), ...good.filter((r) => r.type === "individual").slice(0, individuals)] };
}

function write(outName, summary, kept) {
  mkdirSync("leads", { recursive: true });
  writeFileSync(`leads/${outName}.json`, JSON.stringify({ generatedAt: new Date().toISOString(), checkVersion: CHECK_VERSION, summary, leads: kept }, null, 2));
  const cols = ["name", "contact", "type", "email", "website", "city", "region", "phone", "score", "portal", "reasons", "source"];
  const csv = [cols.join(","), ...kept.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  writeFileSync(`leads/${outName}.csv`, csv);
  console.table(summary);
  console.log(`Wrote leads/${outName}.json and .csv (${kept.length} leads)`);
}

const args = process.argv.slice(2);

if (args[0] === "recheck") {
  const [, inName, outName] = args;
  if (!inName || !outName) throw new Error("Usage: pull-accountant-leads.mjs recheck <inName> <outName>");
  const leads = JSON.parse(readFileSync(`leads/${inName}.json`, "utf8")).leads;
  const results = (await pool(leads, 6, (l) => checkSite({ site: l.website, name: l.name, city: l.city, phone: l.phone, region: l.region, country: l.region === "UK" ? "UK" : "US" })))
    .filter(Boolean);
  const kept = results.filter((r) => r.score >= MIN_SCORE && r.email).sort((a, b) => a.region.localeCompare(b.region) || b.score - a.score);
  const regions = [...new Set(leads.map((l) => l.region))];
  write(
    outName,
    regions.map((region) => ({
      region,
      before: leads.filter((l) => l.region === region).length,
      reached: results.filter((r) => r.region === region).length,
      kept: kept.filter((r) => r.region === region).length,
      withContactName: kept.filter((r) => r.region === region && r.contact).length,
    })),
    kept,
  );
} else {
  const [country, outName, quota, statesArg] = args;
  if (!["UK", "US"].includes(country) || !outName || !quota) {
    console.error("Usage: pull-accountant-leads.mjs UK|US <outName> <total | firms,individuals> [US state codes]  |  recheck <inName> <outName>");
    process.exit(1);
  }
  const regions = country === "UK" ? ["UK"] : statesArg.split(",");
  const seen = new Set();
  const kept = [];
  const summary = [];
  // Each region's checked sites are cached, so a re-run after a network failure resumes instead of starting over.
  mkdirSync("leads/.cache", { recursive: true });
  for (const region of regions) {
    const cacheFile = `leads/.cache/v${CHECK_VERSION}-${country}-${region}.json`;
    let listings, results;
    if (existsSync(cacheFile)) {
      ({ listings, results } = JSON.parse(readFileSync(cacheFile, "utf8")));
      console.log(`${region}: ${listings} listings with a website (cached)`);
    } else {
      const els = (await overpass(areaQuery(region))).filter((e) => e.tags.website || e.tags["contact:website"]);
      listings = els.length;
      console.log(`${region}: ${listings} listings with a website`);
      results = (
        await pool(els, 6, (e) =>
          checkSite({ site: e.tags.website || e.tags["contact:website"], name: e.tags.name || e.tags.operator, city: e.tags["addr:city"], phone: e.tags.phone || e.tags["contact:phone"], region, country }),
        )
      ).filter(Boolean);
      writeFileSync(cacheFile, JSON.stringify({ listings, results }));
    }
    const { good, picked } = pick(results, country, quota, seen);
    summary.push({ region, listingsWithWebsite: listings, sitesReached: results.length, passed: good.length, picked: picked.length, firms: picked.filter((r) => r.type === "firm").length, individuals: picked.filter((r) => r.type === "individual").length, withContactName: picked.filter((r) => r.contact).length });
    kept.push(...picked);
  }
  write(outName, summary, kept);
}
