import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { UI_FR } from "./ui-fr";
import { fill, langFromAcceptLanguage, translate, uiLocale } from "./ui-lang";

// Every t("English text") in the dashboard code must have a French entry, and a French entry must keep its {placeholders}.
const ROOTS = ["src/app/(dashboard)/whatsapp-umrah", "src/components/wa"];
const files: string[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(name) && !/\.test\./.test(name) && !/^(i18n|LanguageSelect)\.tsx$/.test(name)) files.push(p);
  }
};
ROOTS.forEach(walk);
const keys = new Map<string, string>();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/(?<![\w.$])t\(\s*"((?:[^"\\\n]|\\.)*)"/g)) keys.set(JSON.parse(`"${m[1]}"`), f);
}
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

describe("dashboard French", () => {
  it("has a French entry for every t() text in the code", () => {
    const missing = [...keys.keys()].filter((k) => !(k in UI_FR));
    expect(missing).toEqual([]);
  });
  it("keeps the {placeholders} of every entry", () => {
    const wrong = Object.entries(UI_FR).filter(([en, fr]) => placeholders(en) !== placeholders(fr)).map(([en]) => en);
    expect(wrong).toEqual([]);
  });
  it("translates in French, leaves English alone, and falls back to English for an unknown text", () => {
    expect(translate("fr", "Settings")).toBe("Réglages");
    expect(translate("en", "Settings")).toBe("Settings");
    expect(translate("fr", "A text nobody translated")).toBe("A text nobody translated");
  });
  it("fills placeholders after translating", () => {
    expect(fill(translate("fr", "{agentName} is on"), { agentName: "Zeen" })).toBe("Zeen est activé");
  });
  it("picks French for a French browser and English otherwise", () => {
    expect(langFromAcceptLanguage("fr-FR,fr;q=0.9,en;q=0.8")).toBe("fr");
    expect(langFromAcceptLanguage("en-GB,en;q=0.9,fr;q=0.5")).toBe("en");
    expect(langFromAcceptLanguage(null)).toBe("en");
    expect(uiLocale("fr")).toBe("fr-FR");
  });
});
