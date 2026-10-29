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

/* Standard starting lists, by country. Each document is phrased so the client can tell whether it applies to
   them; anything that doesn't, they mark "I don't have this" on the upload page. `match` is how a value in an
   imported spreadsheet (a "Return type" or "Entity" column, say) picks this list: whole words, any case.
   `label` is the name stored on each client, so it never changes; `title` and `sub` are how the picker shows it. */
export const CHECKLISTS = [
  {
    id: "us-1040",
    region: "US",
    label: "Individual tax return (1040)",
    title: "Individual tax return",
    sub: "Form 1040",
    match: ["1040", "individual", "personal", "joint", "mfj", "single"],
    items: [
      "Last year's tax return",
      "Photo ID (driver's license or passport)",
      "W-2 from each employer",
      "1099-INT and 1099-DIV (bank interest and dividends)",
      "1099-B or consolidated brokerage statement",
      "1099-NEC, 1099-MISC or 1099-K (other income)",
      "1099-R and SSA-1099 (retirement and Social Security)",
      "1098 mortgage interest statement",
      "1098-T or 1098-E (tuition, student loan interest)",
      "1095-A (Marketplace health insurance)",
      "Charitable donation receipts",
      "Estimated tax payments made this year",
    ],
  },
  {
    id: "us-schedule-c",
    region: "US",
    label: "Self-employed (Schedule C)",
    title: "Self-employed",
    sub: "Schedule C",
    match: ["schedule c", "sch c", "sole proprietor", "sole prop", "self employed", "self-employed", "freelance", "contractor"],
    items: [
      "Profit and loss for the year",
      "Business bank and credit card statements",
      "1099-NEC and 1099-K you received",
      "Business expense receipts",
      "Mileage log",
      "Home office size and costs",
      "Estimated tax payments made this year",
    ],
  },
  {
    id: "us-rental",
    region: "US",
    label: "Rental property (Schedule E)",
    title: "Rental property",
    sub: "Schedule E",
    match: ["schedule e", "sch e", "rental", "landlord", "real estate"],
    items: [
      "Rent received, for each property",
      "Property expenses (repairs, insurance, management fees)",
      "1098 mortgage interest, for each property",
      "Property tax bills",
      "Closing statement for any property bought or sold this year",
    ],
  },
  {
    id: "us-business",
    region: "US",
    label: "Business return (1120-S, 1065, 1120)",
    title: "Business return",
    sub: "1120-S · 1065 · 1120",
    match: ["1120", "1120s", "1120-s", "1065", "s corp", "s-corp", "c corp", "corporation", "partnership", "llc", "business", "company", "entity"],
    items: [
      "Profit and loss and balance sheet",
      "Bank and credit card statements (all accounts, full year)",
      "Payroll reports (941s and W-3)",
      "1099s you issued to contractors",
      "Loan statements",
      "Fixed asset purchases and sales",
      "Last year's business return",
      "Changes in owners or ownership percentages",
    ],
  },
  {
    id: "uk-self-assessment",
    region: "UK",
    label: "Self Assessment (UK)",
    title: "Self Assessment",
    sub: "SA100",
    match: ["self assessment", "sa100", "sole trader"],
    items: [
      "Last year's tax return",
      "P60 from each employer",
      "P11D (benefits in kind)",
      "Bank and savings interest statements",
      "Dividend vouchers",
      "Pension contributions",
      "Rental income and expenses",
      "Self-employment income and expenses",
      "Gift Aid donations",
    ],
  },
  {
    id: "uk-company",
    region: "UK",
    label: "Limited company year end (UK)",
    title: "Limited company year end",
    sub: "Accounts · CT600",
    match: ["ltd", "limited", "ct600", "year end", "corporation tax"],
    items: [
      "Business bank statements (all accounts, full year)",
      "Sales invoices",
      "Purchase invoices and receipts",
      "Payroll summary",
      "VAT returns",
      "Loan agreements",
      "Asset purchases and sales",
      "Director's loan account details",
    ],
  },
  {
    id: "monthly-bookkeeping",
    region: "Any",
    label: "Monthly bookkeeping",
    title: "Monthly bookkeeping",
    sub: "Recurring",
    match: ["bookkeeping", "monthly", "books"],
    items: ["Bank statements for the month", "Sales invoices issued", "Purchase receipts and bills", "Credit card statements", "Cash expenses"],
  },
  {
    id: "new-client",
    region: "Any",
    label: "New client onboarding",
    title: "New client onboarding",
    sub: "One-off",
    match: ["onboarding", "new client"],
    items: ["Photo ID", "Proof of address", "Signed engagement letter", "Last year's accounts or tax return"],
  },
] as const;

/* Lists clients were given before the US/UK split; their stored ids still need a readable name. */
const OLD_CHECKLIST_NAMES: Record<string, string> = { "personal-tax": "Personal tax return", "business-tax": "Business tax return" };

/** What to show for the checklist a client was set up with (stored as a name, or an older list's id). */
export function checklistName(stored: string): string {
  return CHECKLISTS.find((l) => l.id === stored)?.label ?? OLD_CHECKLIST_NAMES[stored] ?? stored;
}

/** Picks a checklist from a spreadsheet value like "1040", "S Corp" or "Rental": a saved list whose name matches
    exactly wins, then a standard list with a matching keyword (whole words, longest first). Null = no match. */
export function detectChecklist(raw: string, saved: { id: string; name: string }[]): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  const own = saved.find((s) => s.name.trim().toLowerCase() === v);
  if (own) return own.id;
  const words = ` ${v.replace(/[^a-z0-9-]+/g, " ")} `;
  let best: { id: string; len: number } | null = null;
  for (const l of CHECKLISTS) {
    if (l.label.toLowerCase() === v) return l.id;
    for (const m of l.match) if (words.includes(` ${m} `) && (!best || m.length > best.len)) best = { id: l.id, len: m.length };
  }
  return best?.id ?? null;
}

/** Common one-off documents the accountant can tick on top of a template. */
export const EXTRA_ITEMS = ["Photo ID", "Proof of address", "Signed engagement letter", "Mortgage interest statement", "Childcare costs", "Student loan statement", "Foreign income records", "Crypto transaction history"];

export const REJECT_REASONS = [
  "Hard to read, please send a clearer copy",
  "Wrong year or period",
  "Pages are missing",
  "This isn't the document we asked for",
  "Please send it as a PDF",
];

export const MAX_ITEMS = 30;

/** The accountant's own document list (edited from a template, or per client): trimmed, no blanks, no repeats
    (ignoring case), each label capped, at most MAX_ITEMS. */
export function cleanItems(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const label = raw.replace(/\s+/g, " ").trim().slice(0, 160);
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push(label);
  }
  return out.slice(0, MAX_ITEMS);
}

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/** Very small CSV reader: double-quoted fields, separators inside quotes. */
function splitRow(line: string, sep: string): string[] {
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
    } else if (ch === sep && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Client list from a CSV with a name column and an email column, in either order, header optional. The
    separator is whichever of comma, semicolon or tab the first line uses most: Excel in French, German and
    other European locales saves "CSV" with semicolons. */
export function parseClientCsv(text: string): { clients: { name: string; email: string }[]; skipped: number } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  const first = lines[0] ?? "";
  const sep = [",", ";", "\t"].reduce((best, d) => (first.split(d).length > first.split(best).length ? d : best), ",");
  const rows = lines.map((l) => splitRow(l, sep));
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

/** Where a client is, for the accountant's list: something to review first, then who hasn't started. */
export type ClientStage = "review" | "waiting" | "started" | "complete" | "paused";
export function clientStage(c: { status: string; items: { status: string }[] }): ClientStage {
  if (c.items.some((i) => i.status === "RECEIVED")) return "review";
  if (c.status === "PAUSED") return "paused";
  if (c.status === "DONE" || !c.items.some((i) => i.status === "REQUESTED")) return "complete";
  return c.items.some((i) => i.status !== "REQUESTED") ? "started" : "waiting";
}
export const STAGE_LABELS: Record<ClientStage, string> = { review: "Needs review", waiting: "Not started", started: "In progress", complete: "Complete", paused: "Paused" };

/** File name inside a client's zip: "Jane Doe - W-2 from each employer.pdf", safe on Windows and macOS,
    numbered when two documents would clash. */
export function zipEntryName(clientName: string, label: string, fileName: string, taken: Set<string>): string {
  const clean = (s: string) => s.replace(/[\\/:*?"<>|\x00-\x1f]+/g, " ").replace(/\s+/g, " ").trim();
  const ext = (fileName.match(/\.[A-Za-z0-9]{1,6}$/)?.[0] ?? "").toLowerCase();
  const base = clean(`${clientName} - ${label}`).slice(0, 120) || "document";
  let name = `${base}${ext}`;
  for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${base} (${n})${ext}`;
  taken.add(name.toLowerCase());
  return name;
}

/** The optional text-reminder add-on's price, shown to the firm before they ask for it. */
export const SMS_ADDON_MONTHLY_USD = 15;

/** "Start on a date" from the setup form: a YYYY-MM-DD between tomorrow and a year out, as midnight UTC (the
    daily run that day sends the first email). "" = start now; "invalid" = anything else. */
export function parseStartDay(day: string, now = new Date()): Date | null | "invalid" {
  if (!day) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "invalid";
  const d = new Date(`${day}T00:00:00Z`);
  const t = d.getTime();
  return Number.isNaN(t) || t <= now.getTime() || t > now.getTime() + 366 * DAY ? "invalid" : d;
}

/** A client whose first email is still in the future. */
export const startsLater = (startAt: Date | null, now = new Date()) => !!startAt && startAt.getTime() > now.getTime();
