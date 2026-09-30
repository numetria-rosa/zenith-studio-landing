// Imports courses/ai-engineering/cheatsheets.html (the SHEETS array) into content/ai-engineering/cheatsheets/<id>.json
// and points modules 1-7 at their sheet. Sheets 0 (orientation), 8 (capstone) and python live in the Cheat Sheets hub only.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = "content/ai-engineering";
const html = readFileSync("courses/ai-engineering/cheatsheets.html", "utf8");
const a = html.indexOf("const SHEETS = ");
const b = html.indexOf("\n];", a) + 3;
const SHEETS = new Function(`return ${html.slice(a, b).replace("const SHEETS = ", "")}`)();

const noDash = (s) => s.replace(/ — /g, ": ").replace(/—/g, "-");
const entities = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const span = (s) => {
  const fence = "`".repeat((s.match(/`+/g) || []).reduce((m, r) => Math.max(m, r.length), 0) + 1);
  return `${fence}${s.startsWith("`") || s.endsWith("`") ? ` ${s} ` : s}${fence}`;
};
/** <b> and <code> to **bold** and `code`; those are the only tags the old sheets use. */
const md = (s) => noDash(entities(s.replace(/<b>(.*?)<\/b>/g, "**$1**").replace(/<code>(.*?)<\/code>/g, (_, c) => span(entities(c)))));
const plain = (s) => noDash(entities(s));

mkdirSync(path.join(OUT, "cheatsheets"), { recursive: true });
for (const sheet of SHEETS) {
  const key = sheet.id === 9 ? "python" : String(sheet.id);
  const json = {
    id: key,
    title: plain(sheet.title),
    tag: sheet.tag,
    sections: sheet.sections.map((s) => ({
      label: plain(s.label),
      ...(s.items ? { items: s.items.map(md) } : {}),
      ...(s.formula ? { formula: plain(s.formula) } : {}),
      ...(s.checklist ? { checklist: s.checklist.map(md) } : {}),
    })),
  };
  writeFileSync(path.join(OUT, "cheatsheets", `${key}.json`), JSON.stringify(json, null, 2) + "\n");
  if (sheet.id >= 1 && sheet.id <= 7) {
    const file = path.join(OUT, "modules", `${sheet.id}.json`);
    const mod = JSON.parse(readFileSync(file, "utf8"));
    mod.cheatSheet = { title: json.title };
    writeFileSync(file, JSON.stringify(mod, null, 2) + "\n");
  }
  console.log(`sheet ${key}: ${json.sections.length} sections`);
}
