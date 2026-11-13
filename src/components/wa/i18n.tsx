"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { fill, translate, uiLocale, type UiLang } from "@/lib/whatsapp-umrah/ui-lang";

const LangContext = createContext<UiLang>("en");

/** Mounted once in the dashboard layout with the language the server chose, so every client component can translate. */
export function UiLangProvider({ lang, children }: { lang: UiLang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useUiLang = (): UiLang => useContext(LangContext);

/** `const t = useT();` then `t("English text")`. */
export function useT(): (text: string, values?: Record<string, string | number>) => string {
  const lang = useContext(LangContext);
  return useMemo(() => (text: string, values?: Record<string, string | number>) => (values ? fill(translate(lang, text), values) : translate(lang, text)), [lang]);
}

export const useLocale = (): string => uiLocale(useContext(LangContext));
