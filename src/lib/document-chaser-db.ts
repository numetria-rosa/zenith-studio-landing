import { randomBytes } from "node:crypto";
import { runnableProject } from "@/lib/project-pause";
import { del, head, list } from "@vercel/blob";
import { db } from "@/lib/db";
import { sendAsBusiness } from "@/lib/client-mail";
import { businessNameOf } from "@/lib/services";
import { getSiteUrl } from "@/lib/site";
import { CANCELLED_GRACE_DAYS, chaseEmail, checklistItems, FILE_RETENTION_DAYS, filesToPurge, isDueForChase, MAX_EMAILS_PER_RUN, MAX_UPLOAD_BYTES, REJECT_REASONS } from "@/lib/document-chaser";

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

/** Adds clients with a checklist. Existing clients (same email) are left as they are. */
export async function addDocChaseClients(
  projectId: string,
  userId: string,
  input: { clients: { name: string; email: string }[]; checklistId: string; extras: string[] },
): Promise<{ ok: true; added: number; existing: number; emailed: number } | { ok: false; error: string }> {
  if (!(await ownedProject(projectId, userId))) return { ok: false, error: "not_found" };
  if (input.clients.length === 0) return { ok: false, error: "Add at least one client with a valid email." };
  if (input.clients.length > 500) return { ok: false, error: "Import up to 500 clients at a time." };
  let items: string[];
  try {
    items = checklistItems(input.checklistId, input.extras);
  } catch {
    return { ok: false, error: "Pick a checklist." };
  }
  const existing = new Set(
    (await db.docChaseClient.findMany({ where: { projectId, email: { in: input.clients.map((c) => c.email) } }, select: { email: true } })).map((c) => c.email),
  );
  const ids: string[] = [];
  for (const c of input.clients) {
    if (existing.has(c.email)) continue;
    const created = await db.docChaseClient.create({
      data: {
        projectId,
        name: c.name.slice(0, 120),
        email: c.email,
        checklist: input.checklistId,
        uploadToken: randomBytes(24).toString("base64url"),
        items: { create: items.map((label, order) => ({ label, order })) },
      },
      select: { id: true },
    });
    ids.push(created.id);
  }
  // Day 0: the first email goes out now, not at the next daily run. The rest (over the per-run cap) go at that run.
  const emailed = ids.length ? (await chaseClients({ id: { in: ids } })).chased : 0;
  return { ok: true, added: ids.length, existing: existing.size, emailed };
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
    const open = await db.docChaseItem.count({ where: { clientId: item.clientId, status: { not: "ACCEPTED" } } });
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
    data: { status: "RECEIVED", filePathname: pathname, fileName: fileName.slice(0, 160), uploadedAt: new Date(), rejectReason: null },
  });
  if (previous?.filePathname && previous.filePathname !== pathname) await del(previous.filePathname, { token: docBlobToken() }).catch(() => {});
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
    where: { ...where, status: "ACTIVE", project: { sourceServiceId: DOC_CHASER_SERVICE_ID, ...runnableProject() } },
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
          text: `${c.name} (${c.email}) has uploaded every document on their list. Review them in your dashboard.`,
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
export async function sendDocChaserTestEmail(projectId: string, userId: string, checklistId: string, extras: string[]): Promise<Result> {
  const project = await db.serviceProject.findFirst({
    where: { id: projectId, userId, sourceServiceId: DOC_CHASER_SERVICE_ID },
    select: { title: true, sourceServiceId: true, user: { select: { email: true } } },
  });
  if (!project?.user.email) return { ok: false, error: "not_found" };
  let items: string[];
  try {
    items = checklistItems(checklistId, extras);
  } catch {
    return { ok: false, error: "Pick a checklist." };
  }
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
