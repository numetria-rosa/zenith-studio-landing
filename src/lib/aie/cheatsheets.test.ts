import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { inlineTokens, sheetLines } from "./cheatsheets";

const norm = (s: string) => s.toLowerCase().replace(/&[a-z]+;/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

describe("inlineTokens", () => {
  it("splits bold and code spans", () => {
    expect(inlineTokens("Use **d.get** or `d[\"k\"]` here")).toEqual([
      { t: "Use " },
      { t: "d.get", bold: true },
      { t: " or " },
      { t: 'd["k"]', code: true },
      { t: " here" },
    ]);
  });
  it("honours longer backtick fences", () => {
    expect(inlineTokens("a ``x ` y`` b")).toEqual([{ t: "a " }, { t: "x ` y", code: true }, { t: " b" }]);
  });
});

describe("imported cheat sheets", () => {
  const dir = path.join(process.cwd(), "content/ai-engineering/cheatsheets");
  // the old page's own SHEETS data (evaluated, so JS escapes are resolved), tags stripped
  const html = readFileSync(path.join(process.cwd(), "courses/ai-engineering/cheatsheets.html"), "utf8");
  const a = html.indexOf("const SHEETS = ");
  const old = new Function(`return ${html.slice(a, html.indexOf("\n];", a) + 3).replace("const SHEETS = ", "")}`)();
  const source = norm(JSON.stringify(old).replace(/<\/?(b|code)>/g, " ").replace(/\\n/g, " "));
  it.each(["0", "1", "2", "3", "4", "5", "6", "7", "8", "python"])("sheet %s is present and nothing was reworded", (id) => {
    const file = path.join(dir, `${id}.json`);
    expect(existsSync(file)).toBe(true);
    const sheet = JSON.parse(readFileSync(file, "utf8"));
    expect(sheet.sections.length).toBeGreaterThan(0);
    const lines = sheetLines(sheet);
    const invented = lines.map(norm).filter((l) => l.length > 3 && !source.includes(l));
    expect(invented).toEqual([]);
  });
  it("modules 1 to 7 point at their sheet", () => {
    for (let n = 1; n <= 7; n++) {
      const mod = JSON.parse(readFileSync(path.join(process.cwd(), `content/ai-engineering/modules/${n}.json`), "utf8"));
      expect(mod.cheatSheet?.title).toBeTruthy();
    }
  });
});
