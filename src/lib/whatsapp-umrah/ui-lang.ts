import { UI_FR } from "./ui-fr";

/* The language of the agency dashboard (not the language the agent replies in: that is agent/types.ts LANGUAGES). The English
   text in the code is the key, so a screen without a French entry simply shows English. The choice is saved in a cookie by the
   language dropdown; until it is used, a browser set to French gets French. */

export const UI_LANGS = ["en", "fr"] as const;
export type UiLang = (typeof UI_LANGS)[number];
export const UI_LANG_COOKIE = "wa_ui_lang";
export const UI_LANG_LABELS: Record<UiLang, string> = { en: "English", fr: "Français" };

export function isUiLang(value: unknown): value is UiLang {
  return typeof value === "string" && (UI_LANGS as readonly string[]).includes(value);
}

/** French when the browser's first language is French (the Accept-Language header), English otherwise. */
export function langFromAcceptLanguage(header: string | null | undefined): UiLang {
  return /^\s*fr\b/i.test(header ?? "") ? "fr" : "en";
}

export function translate(lang: UiLang, text: string): string {
  return lang === "fr" ? (UI_FR[text] ?? text) : text;
}

/** Fills "{n}"-style placeholders after translating, for text that carries a number or a name. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));
}

/** The date and number locale that goes with the language. */
export const uiLocale = (lang: UiLang) => (lang === "fr" ? "fr-FR" : "en-GB");
