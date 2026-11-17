// Loads the Umrah cold-email agencies into the OutreachContact table and keeps them current, so the admin page
// /admin/outreach-funnel can show the funnel and tie website visits to a named agency.
//
//   node --env-file=.env scripts/umrah-sync.mjs --dry       shows what it would write, writes nothing
//   node --env-file=.env scripts/umrah-sync.mjs             upserts every agency, then refreshes delivery status
//   node --env-file=.env scripts/umrah-sync.mjs --dir <folder with queue.json, sent-log.json ...>
//
// Reads (from --dir, default the campaign scratchpad): queue.json, queue-fr.json, sent-log.json, followup-log.json,
// suppress.json, replies-seen.json. Writes only the OutreachContact table. Sends nothing. Delivery status comes from
// Resend (emails.get, one call per agency that is not yet final, 600 ms apart).
import fs from "node:fs";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const dirArg = args.indexOf("--dir");
const DIR = (dirArg >= 0 ? args[dirArg + 1] : "D:/claude-tmp/claude/d1642bcfe405282b/405c237e-2a3d-4c1c-be20-11af98a9515a/scratchpad").replace(/\\/g, "/").replace(/\/?$/, "/");

const read = (name, fallback = []) => (fs.existsSync(DIR + name) ? JSON.parse(fs.readFileSync(DIR + name, "utf8")) : fallback);

// Same algorithm as contactCode in src/lib/outreach-code.ts (pinned by a test there).
export const contactCode = (email) => createHash("sha256").update(`umrah:${email.trim().toLowerCase()}`).digest().subarray(0, 5).readUIntBE(0, 5).toString(36).padStart(8, "0");
const domainOf = (email) => email.split("@")[1] ?? "";

const queue = [...read("queue.json"), ...read("queue-fr.json")];
const sentLog = read("sent-log.json").filter((r) => !r.error && r.id && !r.test);
const followLog = read("followup-log.json").filter((r) => !r.error);
const suppress = new Set(read("suppress.json").map((s) => String(s).toLowerCase()));
const replies = read("replies-seen.json");

const firstSend = new Map();
for (const r of sentLog) if (!firstSend.has(r.email.toLowerCase())) firstSend.set(r.email.toLowerCase(), r);
const followUps = new Map();
for (const r of followLog) followUps.set(r.email.toLowerCase(), (followUps.get(r.email.toLowerCase()) ?? 0) + 1);

const fromAddress = (s) => (String(s).match(/[^\s<>"']+@[^\s<>"']+/)?.[0] ?? "").toLowerCase();
const repliedAt = (email) => {
  const e = email.toLowerCase();
  const hit = replies.find((r) => fromAddress(r.from) === e || domainOf(fromAddress(r.from)) === domainOf(e));
  if (!hit) return null;
  const d = new Date(hit.date);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

const rows = [];
const seen = new Set();
for (const q of queue) {
  const email = q.email.trim().toLowerCase();
  if (seen.has(email)) continue;
  seen.add(email);
  const sent = firstSend.get(email);
  rows.push({
    code: contactCode(email),
    email,
    name: q.name,
    market: q.market,
    hasWhatsapp: !!(q.wa ?? q.whatsapp),
    emailedAt: sent ? new Date(sent.at) : null,
    resendId: sent?.id ?? null,
    followUps: followUps.get(email) ?? 0,
    repliedAt: repliedAt(email),
    suppressed: suppress.has(email) || suppress.has(domainOf(email)),
  });
}
const codes = new Set(rows.map((r) => r.code));
if (codes.size !== rows.length) {
  console.error("two agencies got the same code, aborting");
  process.exit(1);
}
const byMarket = rows.reduce((m, r) => ((m[r.market] = (m[r.market] ?? 0) + 1), m), {});
console.log(`agencies ${rows.length}`, JSON.stringify(byMarket), `| emailed ${rows.filter((r) => r.emailedAt).length} | replied ${rows.filter((r) => r.repliedAt).length} | suppressed ${rows.filter((r) => r.suppressed).length}`);
if (dry) process.exit(0);

const db = new PrismaClient();
try {
  for (const r of rows) {
    const data = { name: r.name, market: r.market, hasWhatsapp: r.hasWhatsapp, emailedAt: r.emailedAt, resendId: r.resendId, followUps: r.followUps, suppressed: r.suppressed, ...(r.repliedAt ? { repliedAt: r.repliedAt } : {}) };
    await db.outreachContact.upsert({
      where: { email: r.email },
      create: { code: r.code, email: r.email, status: r.emailedAt ? "sent" : "queued", ...data },
      update: data,
    });
  }
  console.log("contacts written");

  // Delivery status for anyone emailed whose result is not final yet.
  const resend = new Resend(process.env.RESEND_API_KEY);
  const pending = await db.outreachContact.findMany({ where: { resendId: { not: null }, status: { in: ["queued", "sent"] } }, select: { id: true, resendId: true, email: true } });
  const tally = {};
  for (const p of pending) {
    const { data, error } = await resend.emails.get(p.resendId);
    if (error) {
      tally.lookupFailed = (tally.lookupFailed ?? 0) + 1;
    } else {
      const status = ["delivered", "bounced", "complained"].includes(data.last_event) ? data.last_event : "sent";
      tally[status] = (tally[status] ?? 0) + 1;
      if (status !== "sent") await db.outreachContact.update({ where: { id: p.id }, data: { status } });
    }
    await new Promise((res) => setTimeout(res, 600));
  }
  console.log("delivery status refreshed", JSON.stringify(tally));
} finally {
  await db.$disconnect();
}
