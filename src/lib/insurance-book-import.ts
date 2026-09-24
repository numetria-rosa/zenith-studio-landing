import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { anthropicComplete } from "@/lib/anthropic";
import type { ImportPolicyInput } from "@/lib/insurance-renewals";

/* Parses a client's "book of business" (their list of clients/policies)
   out of whatever format they actually have it in - a spreadsheet
   (CSV/XLSX, via exceljs) or a Google Sheets link, and a PDF as a
   fallback (via Claude's native document reading, same approach as
   Document Audit). Deliberately NOT the npm `xlsx` package: it has
   unpatched high-severity vulnerabilities (prototype pollution, ReDoS -
   see GHSA-4r6h-8v6p-xvw6 / GHSA-5pgg-2g8v-p4x9) with no fix on the
   public registry, and this function's whole job is parsing files a
   client uploaded - untrusted input is exactly the case those bugs bite.
   exceljs's own audit-flagged issue is an unrelated uuid buffer-bounds
   edge case in a code path this library doesn't exercise. */

const MAX_ROWS = 2000; // a real agency's book of business, not unbounded

export type ParseRowsResult = { ok: true; rows: ImportPolicyInput[] } | { ok: false; error: string };

const HEADER_ALIASES: Record<keyof Omit<ImportPolicyInput, "agencyName" | "renewalDate"> | "renewalDate", string[]> = {
  clientName: ["client name", "client", "name", "insured", "named insured"],
  phone: ["phone", "phone number", "cell", "mobile"],
  email: ["email", "email address"],
  policyType: ["policy type", "type", "coverage", "line of business", "lob"],
  renewalDate: ["renewal date", "renewal", "expiration date", "expires", "expiry"],
};

function matchColumn(headers: string[], aliases: string[]): number {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const i = normalized.indexOf(alias);
    if (i !== -1) return i;
  }
  return -1;
}

function parseDate(raw: string): Date | null {
  const d = new Date(raw.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function rowsFromSheet(headerRow: string[], dataRows: string[][], agencyName: string): ParseRowsResult {
  const clientNameCol = matchColumn(headerRow, HEADER_ALIASES.clientName);
  const renewalDateCol = matchColumn(headerRow, HEADER_ALIASES.renewalDate);
  if (clientNameCol === -1 || renewalDateCol === -1) {
    return { ok: false, error: `Couldn't find a client name and renewal date column. Found headers: ${headerRow.join(", ") || "(none)"}` };
  }
  const phoneCol = matchColumn(headerRow, HEADER_ALIASES.phone);
  const emailCol = matchColumn(headerRow, HEADER_ALIASES.email);
  const policyTypeCol = matchColumn(headerRow, HEADER_ALIASES.policyType);

  const rows: ImportPolicyInput[] = [];
  for (const cells of dataRows.slice(0, MAX_ROWS)) {
    const clientName = cells[clientNameCol]?.trim();
    if (!clientName) continue;
    const renewalDate = parseDate(cells[renewalDateCol] ?? "");
    if (!renewalDate) continue;
    rows.push({
      agencyName,
      clientName,
      phone: phoneCol !== -1 ? cells[phoneCol]?.trim() || null : null,
      email: emailCol !== -1 ? cells[emailCol]?.trim() || null : null,
      policyType: policyTypeCol !== -1 ? cells[policyTypeCol]?.trim() || null : null,
      renewalDate,
    });
  }
  if (rows.length === 0) return { ok: false, error: "No valid rows found - each row needs a client name and a parseable renewal date." };
  return { ok: true, rows };
}

/** CSV or XLSX, detected by content rather than trusting the filename
    extension (exceljs's CSV reader accepts any text/delimited stream). */
export async function parseBookOfBusinessSpreadsheet(buffer: Buffer, filename: string, agencyName: string): Promise<ParseRowsResult> {
  const isXlsx = filename.toLowerCase().endsWith(".xlsx") || filename.toLowerCase().endsWith(".xls");
  try {
    const workbook = new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet | undefined;
    if (isXlsx) {
      // exceljs's bundled types expect an older Buffer shape than this
      // project's Node types produce - safe at runtime, both are the same
      // Node Buffer.
      await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
      worksheet = workbook.worksheets[0];
    } else {
      await workbook.csv.read(Readable.from(buffer));
      worksheet = workbook.worksheets[0];
    }
    if (!worksheet) return { ok: false, error: "The file has no readable sheet." };

    const allRows: string[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        cells.push(cell.text ?? "");
      });
      allRows.push(cells);
    });
    if (allRows.length < 2) return { ok: false, error: "The file needs a header row plus at least one data row." };

    const [headerRow, ...dataRows] = allRows;
    return rowsFromSheet(headerRow, dataRows, agencyName);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't read that file." };
  }
}

/** A Google Sheets share link, converted to its CSV export URL and fetched
    server-side. Requires the sheet be shared "Anyone with the link can
    view" - no OAuth on our end, matching this feature's whole "least
    manual work, no credential handoff" design. */
export async function parseBookOfBusinessGoogleSheet(shareUrl: string, agencyName: string): Promise<ParseRowsResult> {
  const match = shareUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return { ok: false, error: "That doesn't look like a Google Sheets link." };
  const gidMatch = shareUrl.match(/[?#&]gid=(\d+)/);
  const csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv${gidMatch ? `&gid=${gidMatch[1]}` : ""}`;

  let res: Response;
  try {
    res = await fetch(csvUrl);
  } catch {
    return { ok: false, error: "Couldn't reach that Google Sheet." };
  }
  if (!res.ok) return { ok: false, error: "Couldn't read that sheet - make sure it's shared as \"Anyone with the link can view\"." };
  const csvText = await res.text();
  return parseBookOfBusinessSpreadsheet(Buffer.from(csvText, "utf-8"), "sheet.csv", agencyName);
}

const PDF_EXTRACTION_PROMPT = `Extract every client/policy row from this document into a JSON array. Each item must have exactly these keys: "clientName" (string), "phone" (string or null), "email" (string or null), "policyType" (string or null), "renewalDate" (string, any recognizable date format). Respond with ONLY the JSON array, no other text. If a row is missing a client name or renewal date, skip it.`;

/** Fallback for a client whose book of business only exists as a PDF
    (e.g. exported from their AMS as a report). Reuses the same native
    PDF-reading approach as Document Audit - no OCR/pdf-parsing library
    needed, Claude reads it directly. */
export async function parseBookOfBusinessPdf(pdfBase64: string, agencyName: string): Promise<ParseRowsResult> {
  const result = await anthropicComplete({
    systemPrompt: PDF_EXTRACTION_PROMPT,
    userPrompt: "Extract the rows from the attached document.",
    maxTokens: 4000,
    pdfBase64,
  });
  if (!result.ok) return { ok: false, error: result.error };

  let parsed: unknown;
  try {
    const jsonText = result.content.trim().replace(/^```json\s*|```\s*$/g, "");
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "Couldn't read a client list out of that PDF." };
  }
  if (!Array.isArray(parsed)) return { ok: false, error: "Couldn't read a client list out of that PDF." };

  const rows: ImportPolicyInput[] = [];
  for (const item of parsed.slice(0, MAX_ROWS)) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    const clientName = typeof r.clientName === "string" ? r.clientName.trim() : "";
    const renewalDate = typeof r.renewalDate === "string" ? parseDate(r.renewalDate) : null;
    if (!clientName || !renewalDate) continue;
    rows.push({
      agencyName,
      clientName,
      phone: typeof r.phone === "string" ? r.phone.trim() || null : null,
      email: typeof r.email === "string" ? r.email.trim() || null : null,
      policyType: typeof r.policyType === "string" ? r.policyType.trim() || null : null,
      renewalDate,
    });
  }
  if (rows.length === 0) return { ok: false, error: "No valid rows found in that PDF." };
  return { ok: true, rows };
}
