import { readFile } from "node:fs/promises";
import path from "node:path";

export type CheatSheetSection = { label: string; items?: string[]; formula?: string; checklist?: string[] };
export type CheatSheet = { id: string; title: string; tag: string; sections: CheatSheetSection[] };

/** Every sheet, in course order: the hub lists them, the module Cheat sheet tab shows the module's own. */
export const SHEET_IDS = ["0", "python", "1", "2", "3", "4", "5", "6", "7", "8"] as const;

const dir = () => path.join(process.env.AIE_CONTENT_DIR ?? path.join(process.cwd(), "content", "ai-engineering"), "cheatsheets");

export async function getCheatSheet(id: string): Promise<CheatSheet | null> {
  if (!(SHEET_IDS as readonly string[]).includes(id)) return null;
  try {
    return JSON.parse(await readFile(path.join(dir(), `${id}.json`), "utf8"));
  } catch {
    return null;
  }
}

export async function getAllCheatSheets(): Promise<CheatSheet[]> {
  const all = await Promise.all(SHEET_IDS.map(getCheatSheet));
  return all.filter((s): s is CheatSheet => s !== null);
}

export type Token = { t: string; bold?: boolean; code?: boolean };

/** Sheet lines are plain text with **bold** and `code` spans. A run of backticks closes with a run of the same length. */
export function inlineTokens(text: string): Token[] {
  const out: Token[] = [];
  const re = /(`+)([\s\S]+?)\1(?!`)|\*\*([\s\S]+?)\*\*/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ t: text.slice(last, m.index) });
    if (m[2] !== undefined) out.push({ t: m[2].trim(), code: true });
    else out.push({ t: m[3]!, bold: true });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}

/** The plain text of every line in a sheet (markup removed): used for the PDF and to check nothing was reworded. */
export function sheetLines(sheet: CheatSheet): string[] {
  const plain = (s: string) => inlineTokens(s).map((t) => t.t).join("");
  return sheet.sections.flatMap((s) => [s.label, ...(s.items ?? []).map(plain), ...(s.formula ? [s.formula] : []), ...(s.checklist ?? []).map(plain)]);
}
