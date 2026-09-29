import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/* The ported widgets carry their own wording in content/ai-engineering/interactives/N.text.json. Two checks keep that
   honest: every label the old widget showed is still shown, and nothing was reworded (each string is found in the old page). */

const ROOT = path.join(process.cwd(), "content/ai-engineering/interactives");
const OLD = path.join(process.cwd(), "courses/ai-engineering");
const norm = (s: string) => s.toLowerCase().replace(/&[a-z]+;/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const strings = (v: unknown): string[] => (typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === "object" ? Object.values(v).flatMap(strings) : []);

describe.each([0, 1, 2, 3, 4, 5, 6, 7])("module %i widget text", (n) => {
  const file = path.join(ROOT, `${n}.text.json`);
  const dataFile = path.join(ROOT, `${n}.json`);
  const own = norm([...strings(JSON.parse(readFileSync(file, "utf8"))), ...strings(JSON.parse(readFileSync(dataFile, "utf8")))].join(" "));
  const staticText = JSON.parse(readFileSync(path.join(ROOT, `${n}.static.json`), "utf8")) as Record<string, string[]>;

  it("shows every label the old widget showed", () => {
    const missing = Object.values(staticText)
      .flat()
      .filter((s) => !/^[\d.,+\-%°/ ]+$/.test(s) && !/^Live |^Query:|^Agent trace|^Trace player/.test(s)) // numbers, and the frame labels kept in the lesson MDX
      .filter((s) => !own.includes(norm(s)));
    expect(missing).toEqual([]);
  });

  const oldFile = path.join(OLD, `module-0${n}.html`);
  (existsSync(oldFile) ? it : it.skip)("does not reword anything", () => {
    const source = norm(readFileSync(oldFile, "utf8"));
    const invented = strings(JSON.parse(readFileSync(file, "utf8")))
      .flatMap((s) => s.split(/\{\w+\}/))
      .map((s) => norm(s))
      .filter((s) => s.length > 3 && !source.includes(s));
    expect(invented).toEqual([]);
  });
});
