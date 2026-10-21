/* AI Document Chaser for accountants: the pure parts (checklists, CSV import, chase timing, the reminder
   email, upload paths). Database work lives in document-chaser-db.ts so these stay testable without Prisma.

   How it works: the accountant adds clients with a checklist; each client gets a private upload link; a
   daily cron emails every client who still owes documents, in the accountant's name, every few days until
   everything is in or the reminder limit is hit. The accountant accepts or rejects each upload; a rejection
   goes back on the client's list with the reason and they're reminded at the next run. */

const DAY = 86400000;

/** Days between reminders, and the most reminders one client ever gets. */
export const CHASE_GAP_DAYS = 3; // ponytail: fixed; make it a per-accountant setting if clients ask
export const MAX_CHASES = 6;
/* Retention (UK GDPR storage limitation; we are the processor, the accountant the controller). Accountants keep
   their own records in their own systems; we are only the collection point, so files don't stay here. */
export const FILE_RETENTION_DAYS = 180; // an uploaded file is deleted this long after upload
export const CANCELLED_GRACE_DAYS = 30; // after a cancellation, the accountant has this long to download, then all client data goes
export const ORPHAN_GRACE_HOURS = 24; // a stored file no document points to (unfinished upload, deleted client) is removed after this

/** Which stored files the daily purge deletes. Pure, so the rules are testable without storage. */
export function filesToPurge(
  stored: { pathname: string; uploadedAt: Date }[],
  referenced: Set<string>,
  now: Date,
): string[] {
  const cutoff = now.getTime() - ORPHAN_GRACE_HOURS * 3600000;
  return stored.filter((b) => !referenced.has(b.pathname) && b.uploadedAt.getTime() < cutoff).map((b) => b.pathname);
}

/** Most reminder emails one accountant's account sends per daily run; anyone over it is simply due tomorrow. */
export const MAX_EMAILS_PER_RUN = 150;

export const CHECKLISTS = [
  {
    id: "personal-tax",
    label: "Personal tax return",
    items: [
      "Last year's tax return",
      "Year-end pay summary from each employer (W-2 or P60)",
      "Bank and savings interest statements",
      "Dividend and investment statements",
      "Pension or retirement contributions",
      "Rental income and expenses (if any)",
      "Receipts for deductible expenses and donations",
    ],
  },
  {
    id: "business-tax",
    label: "Business tax return",
    items: [
      "Profit and loss for the year",
      "Business bank statements (all accounts, full year)",
      "Sales invoices or income records",
      "Expense receipts",
      "Payroll summary",
      "Loan and finance agreements",
      "Asset purchases and sales",
    ],
  },
  {
    id: "monthly-bookkeeping",
    label: "Monthly bookkeeping",
    items: ["Bank statements for the month", "Sales invoices issued", "Purchase receipts and bills", "Credit card statements", "Cash expenses"],
  },
  {
    id: "new-client",
    label: "New client onboarding",
    items: ["Photo ID", "Proof of address", "Signed engagement letter", "Last year's accounts or tax return", "Tax reference or ID number"],
  },
] as const;

/** Common one-off documents the accountant can tick on top of a template. */
export const EXTRA_ITEMS = ["Photo ID", "Proof of address", "Signed engagement letter", "Mortgage interest statement", "Childcare costs", "Student loan statement", "Foreign income records", "Crypto transaction history"];

export const REJECT_REASONS = [
  "Hard to read, please send a clearer copy",
  "Wrong year or period",
  "Pages are missing",
  "This isn't the document we asked for",
  "Please send it as a PDF",
];

export function checklistItems(checklistId: string, extras: string[]): string[] {
  const list = CHECKLISTS.find((c) => c.id === checklistId);
  if (!list) throw new Error("Unknown checklist");
  return [...new Set([...list.items, ...extras.map((e) => e.trim()).filter(Boolean)])].map((s) => s.slice(0, 160));
}

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/** Very small CSV reader: double-quoted fields, commas inside quotes. */
function splitRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Client list from a CSV with a name column and an email column, in either order, header optional. */
export function parseClientCsv(text: string): { clients: { name: string; email: string }[]; skipped: number } {
  const rows = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim()).map(splitRow);
  if (rows.length === 0) return { clients: [], skipped: 0 };
  let emailCol = 1;
  let nameCol = 0;
  const header = rows[0]!.map((h) => h.toLowerCase());
  const isEmailHeader = (h: string) => /^e-?mail/.test(h);
  if (header.some(isEmailHeader) && !header.some((h) => EMAIL.test(h))) {
    emailCol = header.findIndex(isEmailHeader);
    nameCol = header.findIndex((h) => /name/.test(h));
    if (nameCol < 0) nameCol = emailCol === 0 ? 1 : 0;
    rows.shift();
  } else if (EMAIL.test(rows[0]![0] ?? "")) {
    emailCol = 0;
    nameCol = 1;
  }
  const seen = new Set<string>();
  const clients: { name: string; email: string }[] = [];
  let skipped = 0;
  for (const r of rows) {
    const email = (r[emailCol] ?? "").toLowerCase();
    const name = (r[nameCol] ?? "").slice(0, 120);
    if (!EMAIL.test(email) || seen.has(email)) {
      skipped++;
      continue;
    }
    seen.add(email);
    clients.push({ name: name || email.split("@")[0]!, email });
  }
  return { clients, skipped };
}

export function isDueForChase(client: { status: string; chaseCount: number; lastChasedAt: Date | null }, outstanding: number, now: Date): boolean {
  if (client.status !== "ACTIVE" || outstanding === 0 || client.chaseCount >= MAX_CHASES) return false;
  return !client.lastChasedAt || now.getTime() - client.lastChasedAt.getTime() >= CHASE_GAP_DAYS * DAY;
}

export function chaseEmail(input: {
  businessName: string;
  clientName: string;
  items: { label: string; rejectReason: string | null }[];
  uploadUrl: string;
  reminder: number;
}): { subject: string; text: string } {
  const first = input.clientName.trim().split(/\s+/)[0] || "there";
  const subject = input.reminder === 0 ? `Documents needed by ${input.businessName}` : `Reminder: documents still needed by ${input.businessName}`;
  const list = input.items.map((i) => `- ${i.label}${i.rejectReason ? ` (${i.rejectReason})` : ""}`).join("\n");
  const opener =
    input.reminder === 0
      ? `We need a few documents from you to get your work done.`
      : `A quick reminder: we're still waiting for ${input.items.length === 1 ? "one document" : `${input.items.length} documents`} from you.`;
  const text = `Hi ${first},

${opener}

${list}

Upload them securely here, no account needed (photos from your phone are fine):
${input.uploadUrl}

If you have any questions, just reply to this email.

Thanks,
${input.businessName}`;
  return { subject, text };
}

/** Private Blob path for one uploaded file: doc-chaser/<client>/<item>-<random>-<safe name>. */
export function uploadPathname(clientId: string, itemId: string, filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? "file";
  const dot = base.lastIndexOf(".");
  const ext = dot > 0 ? base.slice(dot).toLowerCase().replace(/[^.a-z0-9]/g, "") : "";
  const stem = (dot > 0 ? base.slice(0, dot) : base).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "file";
  const rand = Math.random().toString(36).slice(2, 10);
  return `doc-chaser/${clientId}/${itemId}-${rand}-${stem}-${ext}`.replace(/-\./, ".").replace(/-$/, "");
}

/** What clients may upload: documents, photos and spreadsheets, up to 20 MB each. */
export const UPLOAD_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
