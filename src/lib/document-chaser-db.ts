import { randomBytes } from "node:crypto";
import { runnableProject } from "@/lib/project-pause";
import { del, head, list } from "@vercel/blob";
import { db } from "@/lib/db";
import { sendAsBusiness } from "@/lib/client-mail";
import { businessNameOf } from "@/lib/services";
import { getSiteUrl } from "@/lib/site";
import { CANCELLED_GRACE_DAYS, chaseEmail, cleanItems, FILE_RETENTION_DAYS, filesToPurge, isDueForChase, MAX_CHASES, MAX_EMAILS_PER_RUN, MAX_ITEMS, MAX_UPLOAD_BYTES, REJECT_REASONS } from "@/lib/document-chaser";

/* AI Document Chaser: database side. Every accountant-facing function checks the project belongs to the
   signed-in user and is this service; the client-facing ones are keyed by the secret upload token only. */

export const DOC_CHASER_SERVICE_ID = "accounting-document-chaser";

/** Clients' documents live in their own Blob store created with private access (the site's main store is
    public, and a store's access mode is fixed at creation). No fallback to the main store, on purpose. */
export function docBlobToken(): string {
  const t = process.env.DOC_CHASER_BLOB_READ_WRITE_TOKEN;
  if (!t) throw new Error("DOC_CHASER_BLOB_READ_WRITE_TOKEN is not set");
  return t;
}

type Result = { ok: true } | { ok: false; error: string };

async function ownedProject(projectId: string, userId: string) {
  return db.serviceProject.findFirst({ where: { id: projectId, userId, sourceServiceId: DOC_CHASER_SERVICE_ID }, select: { id: true } });
}

export const uploadUrlFor = (token: string) => `${getSiteUrl()}/upload/${token}`;

/** One client to add: their own document list (from a checklist, maybe edited) and that list's name. */
export type NewChaseClient = { name: string; email: string; checklist: string; items: string[] };

const VALID_EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

/** Adds clients, each with their own document list. Existing clients (same email) are left as they are. */
export async function addDocChaseClients(
  projectId: string,
  userId: string,
  input: NewChaseClient[],
  /** First email on this day instead of now (from the daily run that day). */
  startAt: Date | null = null,
): Promise<{ ok: true; added: number; existing: number; emailed: number } | { ok: false; error: string }> {
  if (!(await ownedProject(projectId, userId))) return { ok: false, error: "not_found" };
  const seen = new Set<string>();
  const clients = input
    .map((c) => ({ name: String(c.name ?? "").trim().slice(0, 120), email: String(c.email ?? "").trim().toLowerCase(), checklist: String(c.checklist ?? "").trim().slice(0, 120) || "Custom", items: cleanItems((c.items ?? []).map(String)) }))
    .filter((c) => VALID_EMAIL.test(c.email) && c.items.length > 0 && !seen.has(c.email) && seen.add(c.email));
  if (clients.length === 0) return { ok: false, error: "Add at least one client with a valid email and at least one document." };
  if (clients.length > 500) return { ok: false, error: "Import up to 500 clients at a time." };
  const existing = new Set(
    (await db.docChaseClient.findMany({ where: { projectId, email: { in: clients.map((c) => c.email) } }, select: { email: true } })).map((c) => c.email),
  );
  const ids: string[] = [];
  for (const c of clients) {
    if (existing.has(c.email)) continue;
    const created = await db.docChaseClient.create({
      data: {
        projectId,
        name: c.name || c.email.split("@")[0]!,
        email: c.email,
        checklist: c.checklist,
        startAt,
        uploadToken: randomBytes(24).toString("base64url"),
        items: { create: c.items.map((label, order) => ({ label, order })) },
      },
      select: { id: true },
    });
    ids.push(created.id);
  }
  // Day 0: the first email goes out now (unless scheduled for later), not at the next daily run. The rest (over
  // the per-run cap) go at that run.
  const emailed = ids.length ? (await chaseClients({ id: { in: ids } })).chased : 0;
  return { ok: true, added: ids.length, existing: existing.size, emailed };
}

// ---------- the firm's own saved checklists ----------

export async function listDocChecklists(projectId: string) {
  return db.docChecklist.findMany({ where: { projectId }, orderBy: { name: "asc" }, select: { id: true, name: true, items: true } });
}

/** Saves a named list (same name = replaced), so the firm sets it up once and picks it for any client. */
export async function saveDocChecklist(projectId: string, userId: string, rawName: string, rawItems: string[]): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!(await ownedProject(projectId, userId))) return { ok: false, error: "not_found" };
  const name = rawName.replace(/\s+/g, " ").trim().slice(0, 80);
  const items = cleanItems(rawItems);
  if (!name) return { ok: false, error: "Give the checklist a name." };
  if (items.length === 0) return { ok: false, error: "A checklist needs at least one document." };
  if ((await db.docChecklist.count({ where: { projectId } })) >= 50 && !(await db.docChecklist.findUnique({ where: { projectId_name: { projectId, name } } })))
    return { ok: false, error: "You can save up to 50 checklists. Delete one you no longer use first." };
  const saved = await db.docChecklist.upsert({ where: { projectId_name: { projectId, name } }, create: { projectId, name, items }, update: { items }, select: { id: true } });
  return { ok: true, id: saved.id };
}

export async function deleteDocChecklist(projectId: string, userId: string, id: string): Promise<Result> {
  if (!(await ownedProject(projectId, userId))) return { ok: false, error: "not_found" };
  await db.docChecklist.deleteMany({ where: { id, projectId } });
  return { ok: true };
}

/** Moves a client to another list. What they already sent (or said they don't have) is kept; documents still
    waiting that aren't on the new list are dropped; new ones are added and chased from the next run. */
export async function changeDocChaseChecklist(projectId: string, userId: string, clientId: string, rawName: string, rawItems: string[]): Promise<Result> {
  const c = await db.docChaseClient.findFirst({ where: { id: clientId, projectId, project: { userId } }, include: { items: true } });
  if (!c) return { ok: false, error: "not_found" };
  const items = cleanItems(rawItems);
  if (items.length === 0) return { ok: false, error: "Pick a checklist with at least one document." };
  const wanted = new Set(items.map((i) => i.toLowerCase()));
  const drop = c.items.filter((i) => i.status === "REQUESTED" && !i.filePathname && !wanted.has(i.label.toLowerCase()));
  const have = new Set(c.items.filter((i) => !drop.includes(i)).map((i) => i.label.toLowerCase()));
  const add = items.filter((i) => !have.has(i.toLowerCase()));
  const start = Math.max(-1, ...c.items.map((i) => i.order)) + 1;
  await db.$transaction([
    db.docChaseItem.deleteMany({ where: { id: { in: drop.map((i) => i.id) } } }),
    db.docChaseItem.createMany({ data: add.map((label, n) => ({ clientId, label, order: start + n })) }),
    db.docChaseClient.update({
      where: { id: clientId },
      data: { checklist: rawName.trim().slice(0, 120) || "Custom", ...(add.length ? { lastChasedAt: null, completedAt: null, status: c.status === "PAUSED" ? "PAUSED" : "ACTIVE" } : {}) },
    }),
  ]);
  return { ok: true };
}

/** "Remind now": emails this client their outstanding list straight away (not more than once an hour). */
export async function remindDocChaseClientNow(projectId: string, userId: string, clientId: string): Promise<Result> {
  const c = await db.docChaseClient.findFirst({ where: { id: clientId, projectId, project: { userId } }, select: { status: true, chaseCount: true, lastChasedAt: true } });
  if (!c) return { ok: false, error: "not_found" };
  if (c.status !== "ACTIVE") return { ok: false, error: c.status === "PAUSED" ? "Resume this client first." : "This client has sent everything." };
  if (c.chaseCount >= MAX_CHASES) return { ok: false, error: `This client has had all ${MAX_CHASES} reminders. Contact them directly.` };
  if (c.lastChasedAt && Date.now() - c.lastChasedAt.getTime() < 3600000) return { ok: false, error: "They were emailed less than an hour ago." };
  // "Remind now" also starts a client who was scheduled for later.
  await db.docChaseClient.update({ where: { id: clientId }, data: { lastChasedAt: null, startAt: null } });
  const r = await chaseClients({ id: { in: [clientId] } });
  return r.chased ? { ok: true } : { ok: false, error: "The reminder couldn't be sent. Try again in a few minutes." };
}

/** The accountant asks again for a document the client said they don't have. */
export async function reaskDocChaseItem(projectId: string, userId: string, itemId: string): Promise<Result> {
  const item = await ownedItem(projectId, userId, itemId);
  if (!item || item.status !== "NOT_APPLICABLE") return { ok: false, error: "not_found" };
  await db.$transaction([
    db.docChaseItem.update({ where: { id: itemId }, data: { status: "REQUESTED", clientNote: null } }),
    db.docChaseClient.update({ where: { id: item.clientId }, data: { lastChasedAt: null, completedAt: null, status: item.client.status === "PAUSED" ? "PAUSED" : "ACTIVE" } }),
  ]);
  return { ok: true };
}

async function ownedItem(projectId: string, userId: string, itemId: string) {
  return db.docChaseItem.findFirst({ where: { id: itemId, client: { projectId, project: { userId, sourceServiceId: DOC_CHASER_SERVICE_ID } } }, include: { client: true } });
}

/** Accept an upload, or send it back with one of the fixed reasons (the client is reminded at the next run). */
export async function reviewDocChaseItem(projectId: string, userId: string, itemId: string, decision: "accept" | "reject", reason?: string): Promise<Result> {
  const item = await ownedItem(projectId, userId, itemId);
  if (!item) return { ok: false, error: "not_found" };
  if (decision === "accept") {
    await db.docChaseItem.update({ where: { id: itemId }, data: { status: "ACCEPTED", rejectReason: null } });
    const open = await db.docChaseItem.count({ where: { clientId: item.clientId, status: { notIn: ["ACCEPTED", "NOT_APPLICABLE"] } } });
    if (open === 0) await db.docChaseClient.update({ where: { id: item.clientId }, data: { status: "DONE", completedAt: new Date() } });
    return { ok: true };
  }
  if (!reason || !REJECT_REASONS.includes(reason)) return { ok: false, error: "Pick a reason to send it back." };
  await db.docChaseItem.update({ where: { id: itemId }, data: { status: "REQUESTED", rejectReason: reason } });
  // A sent-back document gets a reminder at the next run, and a client marked done is reopened.
  await db.docChaseClient.update({ where: { id: item.clientId }, data: { lastChasedAt: null, status: item.client.status === "PAUSED" ? "PAUSED" : "ACTIVE", completedAt: null } });
  return { ok: true };
}

export async function setDocChaseClientStatus(projectId: string, userId: string, clientId: string, status: "ACTIVE" | "PAUSED"): Promise<Result> {
  const c = await db.docChaseClient.findFirst({ where: { id: clientId, projectId, project: { userId } }, select: { id: true } });
  if (!c) return { ok: false, error: "not_found" };
  await db.docChaseClient.update({ where: { id: clientId }, data: { status } });
  return { ok: true };
}

/** Asks one client for one more document. A client who had sent everything is reopened, and the new document
    goes out with the next daily run. */
export async function addDocChaseItem(projectId: string, userId: string, clientId: string, rawLabel: string): Promise<Result> {
  const c = await db.docChaseClient.findFirst({ where: { id: clientId, projectId, project: { userId } }, include: { items: { select: { label: true, order: true } } } });
  if (!c) return { ok: false, error: "not_found" };
  const [label] = cleanItems([rawLabel]);
  if (!label) return { ok: false, error: "Type the name of the document." };
  if (c.items.some((i) => i.label.toLowerCase() === label.toLowerCase())) return { ok: false, error: `${c.name} is already asked for "${label}".` };
  if (c.items.length >= MAX_ITEMS) return { ok: false, error: `A client can be asked for up to ${MAX_ITEMS} documents.` };
  await db.$transaction([
    db.docChaseItem.create({ data: { clientId, label, order: Math.max(-1, ...c.items.map((i) => i.order)) + 1 } }),
    db.docChaseClient.update({ where: { id: clientId }, data: { lastChasedAt: null, completedAt: null, status: c.status === "PAUSED" ? "PAUSED" : "ACTIVE" } }),
  ]);
  return { ok: true };
}

/** Stops asking a client for a document. Only one they haven't sent yet: an uploaded file stays until reviewed. */
export async function removeDocChaseItem(projectId: string, userId: string, itemId: string): Promise<Result> {
  const item = await ownedItem(projectId, userId, itemId);
  if (!item) return { ok: false, error: "not_found" };
  if (item.status !== "REQUESTED" || item.filePathname) return { ok: false, error: "That document has already been sent. Accept it or send it back instead." };
  const others = await db.docChaseItem.count({ where: { clientId: item.clientId, id: { not: itemId } } });
  if (others === 0) return { ok: false, error: "A client needs at least one document. Delete the client instead." };
  await db.docChaseItem.delete({ where: { id: itemId } });
  return { ok: true };
}

/** Removes a client, their requests and every file they uploaded. */
export async function deleteDocChaseClient(projectId: string, userId: string, clientId: string): Promise<Result> {
  const c = await db.docChaseClient.findFirst({ where: { id: clientId, projectId, project: { userId } }, include: { items: { select: { filePathname: true } } } });
  if (!c) return { ok: false, error: "not_found" };
  const files = c.items.map((i) => i.filePathname).filter((p): p is string => !!p);
  if (files.length) await del(files, { token: docBlobToken() }).catch(() => {});
  await db.docChaseClient.delete({ where: { id: clientId } });
  return { ok: true };
}

// ---------- client side (upload page) ----------

export async function getUploadPortal(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const client = await db.docChaseClient.findUnique({
    where: { uploadToken: token },
    include: { items: { orderBy: { order: "asc" } }, project: { select: { title: true, sourceServiceId: true, stage: true } } },
  });
  // A cancelled or finished service's links stop working straight away.
  if (!client || client.project.sourceServiceId !== DOC_CHASER_SERVICE_ID || ["CANCELLED", "COMPLETED"].includes(client.project.stage)) return null;
  return { client, businessName: businessNameOf(client.project) || "Your accountant" };
}

/** Can this token upload to this item? Used before issuing a Blob upload token. */
export async function canUpload(token: string, itemId: string): Promise<{ clientId: string } | null> {
  const portal = await getUploadPortal(token);
  const item = portal?.client.items.find((i) => i.id === itemId);
  if (!portal || !item || item.status === "ACCEPTED" || portal.client.project.stage === "PAUSED") return null;
  return { clientId: portal.client.id };
}

/** After the browser finished uploading straight to Blob: check the file is really there, then record it. */
export async function confirmUpload(token: string, itemId: string, pathname: string, fileName: string): Promise<Result> {
  const allowed = await canUpload(token, itemId);
  if (!allowed) return { ok: false, error: "This link has expired or the document is already accepted." };
  if (!pathname.startsWith(`doc-chaser/${allowed.clientId}/${itemId}-`)) return { ok: false, error: "Upload not recognised." };
  const blob = await head(pathname, { token: docBlobToken() }).catch(() => null);
  if (!blob || blob.size > MAX_UPLOAD_BYTES) return { ok: false, error: "We couldn't find that upload. Please try again." };

  const previous = await db.docChaseItem.findUnique({ where: { id: itemId }, select: { filePathname: true } });
  await db.docChaseItem.update({
    where: { id: itemId },
    data: { status: "RECEIVED", filePathname: pathname, fileName: fileName.slice(0, 160), uploadedAt: new Date(), rejectReason: null, aiVerdict: null, aiNote: null },
  });
  if (previous?.filePathname && previous.filePathname !== pathname) await del(previous.filePathname, { token: docBlobToken() }).catch(() => {});
  return { ok: true };
}

/** The client says they don't have this document (this year it doesn't apply, say). It stops being chased; the
    accountant sees the note and can ask again. */
export async function markNotApplicable(token: string, itemId: string, note: string): Promise<Result> {
  const portal = await getUploadPortal(token);
  const item = portal?.client.items.find((i) => i.id === itemId);
  if (!portal || !item || item.status !== "REQUESTED" || item.filePathname) return { ok: false, error: "This document can't be changed now." };
  await db.docChaseItem.update({ where: { id: itemId }, data: { status: "NOT_APPLICABLE", clientNote: note.trim().slice(0, 300) || null } });
  return { ok: true };
}

/** The client changed their mind: the document goes back on their list. */
export async function undoNotApplicable(token: string, itemId: string): Promise<Result> {
  const portal = await getUploadPortal(token);
  const item = portal?.client.items.find((i) => i.id === itemId);
  if (!portal || !item || item.status !== "NOT_APPLICABLE") return { ok: false, error: "This document can't be changed now." };
  await db.docChaseItem.update({ where: { id: itemId }, data: { status: "REQUESTED", clientNote: null } });
  return { ok: true };
}

/** "I have more than one" (two employers, two brokerages): adds "W-2 from each employer (2)" so each file has
    its own place and its own review. */
export async function addAnotherOf(token: string, itemId: string): Promise<Result> {
  const portal = await getUploadPortal(token);
  const items = portal?.client.items ?? [];
  const item = items.find((i) => i.id === itemId);
  if (!portal || !item) return { ok: false, error: "This link has expired." };
  if (items.length >= MAX_ITEMS) return { ok: false, error: "That's the most documents this list can hold. Reply to the email and we'll help." };
  const base = item.label.replace(/ \(\d+\)$/, "");
  const n = items.filter((i) => i.label === base || i.label.startsWith(`${base} (`)).length + 1;
  await db.docChaseItem.create({ data: { clientId: portal.client.id, label: `${base} (${n})`.slice(0, 160), order: item.order } });
  return { ok: true };
}

// ---------- daily run ----------

/** Emails every client who still owes documents (on the reminder schedule), and tells the accountant
    once a client has sent everything. */
export async function runDocumentChaser(now = new Date()): Promise<{ chased: number; completed: number; failed: number }> {
  return chaseClients({}, now);
}

async function chaseClients(where: { id?: { in: string[] } }, now = new Date()): Promise<{ chased: number; completed: number; failed: number }> {
  const clients = await db.docChaseClient.findMany({
    where: { ...where, status: "ACTIVE", OR: [{ startAt: null }, { startAt: { lte: now } }], project: { sourceServiceId: DOC_CHASER_SERVICE_ID, ...runnableProject() } },
    include: {
      items: { orderBy: { order: "asc" } },
      project: { select: { title: true, sourceServiceId: true, user: { select: { email: true } } } },
    },
  });
  let chased = 0;
  let completed = 0;
  let failed = 0;
  const sentPerProject = new Map<string, number>();
  for (const c of clients) {
    const businessName = businessNameOf(c.project) || "Your accountant";
    const accountantEmail = c.project.user.email;
    const outstanding = c.items.filter((i) => i.status === "REQUESTED");

    // Everything uploaded (some may still need review): tell the accountant once, stop chasing.
    if (outstanding.length === 0) {
      if (accountantEmail) {
        await sendAsBusiness({
          businessName: "Zenith Document Chaser",
          to: accountantEmail,
          replyTo: null,
          subject: `${c.name} has sent everything`,
          text: `${c.name} (${c.email}) has answered every document on their list: uploaded, or told you they don't have it. Review them in your dashboard.`,
        });
      }
      await db.docChaseClient.update({ where: { id: c.id }, data: { status: "DONE", completedAt: now } });
      completed++;
      continue;
    }

    if (!isDueForChase(c, outstanding.length, now)) continue;
    const sentSoFar = sentPerProject.get(c.projectId) ?? 0;
    if (sentSoFar >= MAX_EMAILS_PER_RUN) continue;
    const mail = chaseEmail({ businessName, clientName: c.name, items: outstanding, uploadUrl: uploadUrlFor(c.uploadToken), reminder: c.chaseCount });
    const sent = await sendAsBusiness({ businessName, to: c.email, replyTo: accountantEmail, subject: mail.subject, text: mail.text });
    if (sent.ok) {
      await db.docChaseClient.update({ where: { id: c.id }, data: { chaseCount: { increment: 1 }, lastChasedAt: now } });
      sentPerProject.set(c.projectId, sentSoFar + 1);
      chased++;
    } else failed++;
  }
  return { chased, completed, failed };
}

/** "Send me a test email first": the exact first email a client gets, sent to the accountant's own address. */
export async function sendDocChaserTestEmail(projectId: string, userId: string, rawItems: string[]): Promise<Result> {
  const project = await db.serviceProject.findFirst({
    where: { id: projectId, userId, sourceServiceId: DOC_CHASER_SERVICE_ID },
    select: { title: true, sourceServiceId: true, user: { select: { email: true } } },
  });
  if (!project?.user.email) return { ok: false, error: "not_found" };
  const items = cleanItems(rawItems);
  if (items.length === 0) return { ok: false, error: "Add at least one document to ask for." };
  const businessName = businessNameOf(project) || "Your accountant";
  const mail = chaseEmail({
    businessName,
    clientName: "Jane Doe",
    items: items.map((label) => ({ label, rejectReason: null })),
    uploadUrl: "[Your client's private upload link goes here]",
    reminder: 0,
  });
  const sent = await sendAsBusiness({
    businessName,
    to: project.user.email,
    replyTo: project.user.email,
    subject: `[Test] ${mail.subject}`,
    text: `This is a test. Your clients get exactly this email, with their own name and a working private upload link.

---

${mail.text}`,
  });
  return sent.ok ? { ok: true } : { ok: false, error: "The test email couldn't be sent. Try again in a minute." };
}

// ---------- retention ----------

const DAY_MS = 86400000;

/** Daily: deletes files past retention, all client data of services cancelled more than the grace period ago,
    and any stored file no document points to (unfinished uploads, rows deleted outside the app). */
export async function purgeDocChaserData(now = new Date()): Promise<{ expiredFiles: number; cancelledClients: number; orphanFiles: number }> {
  const token = docBlobToken();

  const expired = await db.docChaseItem.findMany({
    where: { filePathname: { not: null }, uploadedAt: { lt: new Date(now.getTime() - FILE_RETENTION_DAYS * DAY_MS) } },
    select: { id: true, filePathname: true },
  });
  if (expired.length) {
    await del(expired.map((i) => i.filePathname!), { token });
    await db.docChaseItem.updateMany({ where: { id: { in: expired.map((i) => i.id) } }, data: { filePathname: null, fileDeletedAt: now } });
  }

  const cancelled = await db.docChaseClient.findMany({
    where: { project: { sourceServiceId: DOC_CHASER_SERVICE_ID, stage: "CANCELLED", cancelledAt: { lt: new Date(now.getTime() - CANCELLED_GRACE_DAYS * DAY_MS) } } },
    select: { id: true, items: { select: { filePathname: true } } },
  });
  const cancelledFiles = cancelled.flatMap((c) => c.items.map((i) => i.filePathname).filter((p): p is string => !!p));
  if (cancelledFiles.length) await del(cancelledFiles, { token });
  if (cancelled.length) await db.docChaseClient.deleteMany({ where: { id: { in: cancelled.map((c) => c.id) } } });

  const stored: { pathname: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "doc-chaser/", cursor, limit: 1000, token });
    stored.push(...page.blobs.map((b) => ({ pathname: b.pathname, uploadedAt: b.uploadedAt })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const referenced = new Set(
    (await db.docChaseItem.findMany({ where: { filePathname: { in: stored.map((b) => b.pathname) } }, select: { filePathname: true } })).map((i) => i.filePathname!),
  );
  const orphans = filesToPurge(stored, referenced, now);
  if (orphans.length) await del(orphans, { token });

  return { expiredFiles: expired.length, cancelledClients: cancelled.length, orphanFiles: orphans.length };
}
