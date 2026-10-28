/* Client lists come from anywhere: a tax program's export (Drake, ProSeries, Lacerte, UltraTax), a practice
   tool (Karbon, TaxDome, QuickBooks), Excel, Google Sheets, a pasted range, a database dump. So the import is
   two pure steps the accountant can see and correct in between:
     1. readTable: text in any of the usual shapes -> rows of cells (Excel files are turned into rows server-side)
     2. guessColumns + applyColumns: which column is the name / first / last / email / checklist -> clients
   Nothing here touches the database, so it runs in the browser and is fully testable. */

export type Table = string[][];
export type Columns = {
  hasHeader: boolean;
  /** A full-name column, or -1 when the name is split into first and last. */
  name: number;
  first: number;
  last: number;
  email: number;
  /** The column that says which checklist (return type, entity, service...), or -1. */
  checklist: number;
};
export type ImportedClient = { name: string; email: string; checklistHint: string };

export const MAX_IMPORT_ROWS = 2000;
const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

/** Text from a CSV/TSV file or a paste: the separator is whichever of tab, semicolon or comma the first line
    uses most (pasted Excel/Google Sheets rows are tab-separated; European Excel saves CSV with semicolons). */
export function readTable(text: string): Table {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const first = lines[0] ?? "";
  const sep = ["\t", ";", ","].reduce((best, d) => (first.split(d).length > first.split(best).length ? d : best), ",");
  return lines.slice(0, MAX_IMPORT_ROWS + 1).map((l) => splitRow(l, sep));
}

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

/** An email inside a cell like "Jane Doe <jane@x.com>" or "mailto:jane@x.com". */
export function emailIn(cell: string): string | null {
  const m = cell.match(/[^\s@,;<>:"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+/);
  return m && EMAIL.test(m[0]) ? m[0].toLowerCase().replace(/\.$/, "") : null;
}

const HEAD = {
  email: /e-?mail|courriel/,
  first: /first|given|fore|pr[eé]nom/,
  last: /last|surname|family|nom de famille/,
  name: /name|client|contact|customer|taxpayer|account|nom/,
  checklist: /checklist|return|entity|form|service|type|engagement|category|kind/,
};

/** Best guess at the columns. Headers are read when present; otherwise the email column is the one whose
    cells are mostly emails and the name is the first text column. */
export function guessColumns(table: Table): Columns {
  const head = (table[0] ?? []).map((h) => h.toLowerCase());
  const hasHeader = head.length > 0 && !head.some((h) => emailIn(h)) && head.some((h) => Object.values(HEAD).some((r) => r.test(h)));
  const body = hasHeader ? table.slice(1) : table;
  const width = Math.max(0, ...table.map((r) => r.length));
  const cols = Array.from({ length: width }, (_, i) => i);
  const emailShare = (i: number) => body.filter((r) => emailIn(r[i] ?? "")).length / Math.max(1, body.length);

  const find = (re: RegExp, skip: number[] = []) => (hasHeader ? cols.find((i) => !skip.includes(i) && re.test(head[i] ?? "")) ?? -1 : -1);
  // The email column: a header that says so and actually holds emails, else the column holding the most.
  let email = hasHeader ? cols.find((i) => HEAD.email.test(head[i] ?? "") && emailShare(i) > 0) ?? -1 : -1;
  if (email < 0) email = cols.reduce((best, i) => (emailShare(i) > (best < 0 ? 0 : emailShare(best)) ? i : best), -1);

  let first = find(HEAD.first, [email]);
  let last = find(HEAD.last, [email, first]);
  if (first < 0 || last < 0) first = last = -1;
  // A header that says "name" beats "Client" or "Account", and never take "Client type" for the name.
  const typeCols = hasHeader ? cols.filter((i) => HEAD.checklist.test(head[i] ?? "") && !/name/.test(head[i] ?? "")) : [];
  let name = first >= 0 ? -1 : find(/name|nom/, [email]);
  if (first < 0 && name < 0) name = find(HEAD.name, [email, ...typeCols]);
  if (first < 0 && name < 0) name = cols.find((i) => i !== email && body.some((r) => (r[i] ?? "") && !emailIn(r[i]!))) ?? -1;
  const checklist = find(HEAD.checklist, [email, name, first, last]);
  return { hasHeader, name, first, last, email, checklist };
}

/** Clients from the table with the chosen columns. Rows without a valid email, and repeats, are skipped. */
export function applyColumns(table: Table, c: Columns): { clients: ImportedClient[]; skipped: number } {
  const seen = new Set<string>();
  const clients: ImportedClient[] = [];
  let skipped = 0;
  for (const r of (c.hasHeader ? table.slice(1) : table).slice(0, MAX_IMPORT_ROWS)) {
    const email = c.email >= 0 ? emailIn(r[c.email] ?? "") : null;
    if (!email || seen.has(email)) {
      skipped++;
      continue;
    }
    seen.add(email);
    const name = (c.first >= 0 ? `${r[c.first] ?? ""} ${c.last >= 0 ? (r[c.last] ?? "") : ""}` : c.name >= 0 ? (r[c.name] ?? "") : "").replace(/\s+/g, " ").trim();
    clients.push({ name: (name || email.split("@")[0]!).slice(0, 120), email, checklistHint: c.checklist >= 0 ? (r[c.checklist] ?? "").trim() : "" });
  }
  return { clients, skipped };
}

/** "A", "B", ... "AA": how a spreadsheet names a column, for files without a header row. */
export function columnLetter(i: number): string {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}
