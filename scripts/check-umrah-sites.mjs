// Checks a hand-collected list of agency websites (one URL or domain per line) with the same site check the map pull
// uses (src/lib/umrah-agency-site-check.ts): sells Umrah/Hajj, WhatsApp, no chatbot, a published email whose domain
// accepts mail. Drops agencies already in queue.json, sent-log.json or suppress.json. Reads public pages only, sends
// nothing. ATOL is required with --uk (UK agencies) and not for other countries.
//
// Usage: node --experimental-strip-types scripts/check-umrah-sites.mjs <urls.txt> <outName> [--uk] [--general]
//   The scratchpad folder is read for queue.json, sent-log.json and suppress.json (override with SCRATCH=<dir>).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { promises as dns } from "node:dns";
import { analyzeAgencySite } from "../src/lib/umrah-agency-site-check.ts";
import { followUpLinks } from "../src/lib/accountant-site-check.ts";

const UA = "Mozilla/5.0 (compatible; ZenithStudioLeadCheck/1.0; +https://zenith-studio.site)";
const SCRATCH = (process.env.SCRATCH ?? "D:/claude-tmp/claude/d1642bcfe405282b/405c237e-2a3d-4c1c-be20-11af98a9515a/scratchpad").replace(/\\/g, "/").replace(/\/?$/, "/");
const [urlsFile, outName] = process.argv.slice(2);
const uk = process.argv.includes("--uk");
// --general: for general travel agencies, so no Umrah, WhatsApp or ATOL requirement. Only a chatbot, a missing or dead email,
// an agency already queued or sent, or the do-not-email list drops one. The WhatsApp state is kept on each row for sorting.
const general = process.argv.includes("--general");
if (!urlsFile || !outName) {
  console.error("Usage: check-umrah-sites.mjs <urls.txt> <outName> [--uk]");
  process.exit(1);
}

const read = (n) => (existsSync(SCRATCH + n) ? JSON.parse(readFileSync(SCRATCH + n, "utf8")) : []);
const known = new Set([...read("queue.json"), ...read("sent-log.json")].map((r) => r.email?.toLowerCase()).filter(Boolean));
const suppress = new Set(read("suppress.json").map((s) => String(s).toLowerCase()));
const domain = (e) => e.split("@")[1];

async function getPage(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(12000) });
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("html")) return null;
    return { url: r.url, html: (await r.text()).slice(0, 600000) };
  } catch {
    return null;
  }
}
const mx = new Map();
const acceptsMail = (email) => {
  const d = domain(email);
  if (!mx.has(d)) mx.set(d, dns.resolveMx(d).then((m) => m.length > 0).catch(() => dns.resolve4(d).then((a) => a.length > 0, () => false)));
  return mx.get(d);
};

const sites = [...new Set(readFileSync(urlsFile, "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => (/^https?:\/\//i.test(l) ? l : "https://" + l)))];
const out = [];
const dropped = [];
for (const site of sites) {
  const home = await getPage(site);
  if (!home) {
    dropped.push(`${site}: site not reachable`);
    continue;
  }
  const pages = [home];
  for (const link of followUpLinks(home.html, home.url)) {
    const p = await getPage(link);
    if (p) pages.push(p);
  }
  const c = analyzeAgencySite(pages);
  const email = c.emails[0] ?? "";
  const host = new URL(home.url).hostname.replace(/^www\./, "");
  const why = [];
  if (!general && !c.sellsUmrah) why.push("no Umrah/Hajj mention");
  if (!general && c.whatsapp === "none") why.push("no WhatsApp");
  if (c.aiSignals.length) why.push("has AI/chatbot: " + c.aiSignals.join(", "));
  if (uk && !general && !c.atol) why.push("no ATOL");
  if (!email) why.push("no email");
  else if (known.has(email.toLowerCase())) why.push("already in the queue or sent");
  else if (suppress.has(email.toLowerCase()) || suppress.has(domain(email).toLowerCase())) why.push("on the do-not-email list");
  else if (!(await acceptsMail(email))) why.push("email domain does not accept mail");
  if (why.length) dropped.push(`${host}: ${why.join("; ")}`);
  else out.push({ name: c.title || host, email, otherEmails: c.emails.slice(1).join("; "), website: new URL(home.url).origin, whatsappNumber: c.whatsappNumber, whatsapp: c.whatsapp, sellsUmrah: c.sellsUmrah, liveChat: c.liveChat.join("; "), atol: c.atol, score: c.score });
}
writeFileSync(`leads/${outName}.json`, JSON.stringify({ generatedAt: new Date().toISOString(), checked: sites.length, kept: out, dropped }, null, 2));
console.log(`checked ${sites.length}, kept ${out.length}`);
for (const o of out) console.log("KEEP", o.name, "|", o.email, "|", o.website, "| WA", o.whatsappNumber || o.whatsapp, "| ATOL", o.atol);
for (const d of dropped) console.log("drop", d);
