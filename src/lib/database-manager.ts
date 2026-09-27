import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { sendAsBusiness } from "@/lib/client-mail";
import { getSiteUrl } from "@/lib/site";
import { readSheetRows, fetchGoogleSheetCsv, matchColumn, parseDate } from "@/lib/insurance-book-import";
import { readSettings, dbDormantDays, dbEmail, DB_SEQUENCE_GAPS } from "@/lib/agent-settings";

/* Brokerage AI Database Manager. The agent imports past clients and old
   leads; once they press Start, every contact quiet for longer than their
   chosen window gets a 3-email re-engagement sequence sent in their business
   name, replies going to them. Every email carries an unsubscribe link, and
   a daily per-client cap protects the sending domain. Deterministic
   templates, no AI. */

const DAY = 86400000;
const DAILY_CAP_PER_PROJECT = 40;
const MAX_IMPORT_ROWS = 2000;

const ALIASES = {
  name: ["name", "full name", "client name", "contact", "contact name", "first name"],
  email: ["email", "email address", "e-mail"],
  phone: ["phone", "phone number", "mobile", "cell"],
  lastContact: ["last contact", "last contacted", "last contact date", "last activity", "closed date", "close date", "last touch"],
};

type Result = { ok: true; imported?: number; started?: number } | { ok: false; error: string };

async function ownedBrokerage(projectId: string, userId: string) {
  return db.serviceProject.findFirst({
    where: { id: projectId, userId, sourceServiceId: "brokerages" },
    select: { id: true, agentSettings: true },
  });
}

export async function importContacts(
  projectId: string,
  userId: string,
  input: { fileBuffer?: Buffer; filename?: string; googleSheetUrl?: string }
): Promise<Result> {
  if (!(await ownedBrokerage(projectId, userId))) return { ok: false, error: "not_found" };

  let buffer = input.fileBuffer;
  let filename = input.filename ?? "contacts.csv";
  if (!buffer && input.googleSheetUrl?.trim()) {
    const csv = await fetchGoogleSheetCsv(input.googleSheetUrl.trim());
    if (!csv.ok) return csv;
    buffer = csv.buffer;
    filename = "sheet.csv";
  }
  if (!buffer) return { ok: false, error: "Upload a CSV or Excel file, or paste a Google Sheets link." };

  const sheet = await readSheetRows(buffer, filename);
  if (!sheet.ok) return sheet;
  const [header, ...rows] = sheet.rows;
  const nameCol = matchColumn(header, ALIASES.name);
  const emailCol = matchColumn(header, ALIASES.email);
  if (nameCol === -1 || emailCol === -1) {
    return { ok: false, error: `Couldn't find a name and an email column. Found: ${header.join(", ") || "(none)"}` };
  }
  const phoneCol = matchColumn(header, ALIASES.phone);
  const lastCol = matchColumn(header, ALIASES.lastContact);

  const existing = new Set(
    (await db.dormantContact.findMany({ where: { projectId }, select: { email: true } })).map((c) => c.email)
  );
  const data = [];
  for (const cells of rows.slice(0, MAX_IMPORT_ROWS)) {
    const name = cells[nameCol]?.trim();
    const email = cells[emailCol]?.trim().toLowerCase();
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || existing.has(email)) continue;
    existing.add(email);
    data.push({
      projectId,
      name: name.slice(0, 120),
      email,
      phone: phoneCol !== -1 ? cells[phoneCol]?.trim() || null : null,
      lastContactAt: lastCol !== -1 ? parseDate(cells[lastCol] ?? "") : null,
      unsubscribeToken: randomBytes(18).toString("hex"),
    });
  }
  if (data.length === 0) return { ok: false, error: "No new contacts found. Each row needs a name and a valid email, and duplicates are skipped." };
  await db.dormantContact.createMany({ data });
  return { ok: true, imported: data.length };
}

/** Contacts quiet for longer than the client's window (or with no date at all). */
export function isDormant(lastContactAt: Date | null, dormantDays: number, now = new Date()): boolean {
  return !lastContactAt || now.getTime() - lastContactAt.getTime() >= dormantDays * DAY;
}

export async function countEligible(projectId: string, agentSettings: unknown): Promise<number> {
  const days = dbDormantDays(readSettings(agentSettings));
  const contacts = await db.dormantContact.findMany({ where: { projectId, status: "DORMANT" }, select: { lastContactAt: true } });
  return contacts.filter((c) => isDormant(c.lastContactAt, days)).length;
}

/** The client's explicit go-ahead: moves every eligible dormant contact into the sequence. */
export async function startReengagement(projectId: string, userId: string): Promise<Result> {
  const project = await ownedBrokerage(projectId, userId);
  if (!project) return { ok: false, error: "not_found" };
  const days = dbDormantDays(readSettings(project.agentSettings));
  const contacts = await db.dormantContact.findMany({ where: { projectId, status: "DORMANT" }, select: { id: true, lastContactAt: true } });
  const ids = contacts.filter((c) => isDormant(c.lastContactAt, days)).map((c) => c.id);
  if (ids.length === 0) return { ok: false, error: "No contacts are quiet long enough yet to wake up." };
  await db.dormantContact.updateMany({ where: { id: { in: ids } }, data: { status: "IN_SEQUENCE", sequenceStep: 0 } });
  return { ok: true, started: ids.length };
}

export async function markContactReplied(projectId: string, userId: string, contactId: string): Promise<Result> {
  if (!(await ownedBrokerage(projectId, userId))) return { ok: false, error: "not_found" };
  await db.dormantContact.updateMany({ where: { id: contactId, projectId }, data: { status: "REPLIED" } });
  return { ok: true };
}

export async function unsubscribeContact(token: string): Promise<boolean> {
  const r = await db.dormantContact.updateMany({ where: { unsubscribeToken: token }, data: { status: "UNSUBSCRIBED" } });
  return r.count > 0;
}

/** Daily: sends the next email to every contact whose gap has passed, capped per client. */
export async function runDatabaseManager(now = new Date()): Promise<{ sent: number; finished: number }> {
  const contacts = await db.dormantContact.findMany({
    where: { status: "IN_SEQUENCE", project: { stage: { not: "PAUSED" } } },
    orderBy: { createdAt: "asc" },
    include: { project: { select: { title: true, agentSettings: true, user: { select: { email: true } } } } },
  });

  const sentPerProject = new Map<string, number>();
  let sent = 0;
  let finished = 0;
  for (const c of contacts) {
    if (c.sequenceStep >= DB_SEQUENCE_GAPS.length) {
      await db.dormantContact.update({ where: { id: c.id }, data: { status: "DONE" } });
      finished++;
      continue;
    }
    const gapDays = DB_SEQUENCE_GAPS[c.sequenceStep];
    if (c.lastSentAt && now.getTime() - c.lastSentAt.getTime() < gapDays * DAY) continue;
    if ((sentPerProject.get(c.projectId) ?? 0) >= DAILY_CAP_PER_PROJECT) continue;

    const settings = readSettings(c.project.agentSettings);
    const email = dbEmail(settings, {
      name: c.name,
      business: c.project.title,
      step: c.sequenceStep,
      unsubscribeUrl: `${getSiteUrl()}/api/db-unsubscribe?t=${c.unsubscribeToken}`,
    });
    const result = await sendAsBusiness({ businessName: c.project.title, to: c.email, replyTo: c.project.user.email, subject: email.subject, text: email.body });
    if (!result.ok) continue;

    const nextStep = c.sequenceStep + 1;
    await db.dormantContact.update({
      where: { id: c.id },
      data: { sequenceStep: nextStep, lastSentAt: now, ...(nextStep >= DB_SEQUENCE_GAPS.length ? { status: "DONE" } : {}) },
    });
    sentPerProject.set(c.projectId, (sentPerProject.get(c.projectId) ?? 0) + 1);
    sent++;
    if (nextStep >= DB_SEQUENCE_GAPS.length) finished++;
  }
  return { sent, finished };
}
