import { cache } from "react";
import { cookies, headers } from "next/headers";
import { UI_LANG_COOKIE, fill, isUiLang, langFromAcceptLanguage, translate, type UiLang } from "./ui-lang";

/** The dashboard language for this request: the saved choice, else the browser's language. */
export const getUiLang = cache(async (): Promise<UiLang> => {
  const saved = (await cookies()).get(UI_LANG_COOKIE)?.value;
  if (isUiLang(saved)) return saved;
  return langFromAcceptLanguage((await headers()).get("accept-language"));
});

/** `const t = await getT();` in a server component, then `t("English text")`. */
export async function getT(): Promise<(text: string, values?: Record<string, string | number>) => string> {
  const lang = await getUiLang();
  return (text: string, values?: Record<string, string | number>) => (values ? fill(translate(lang, text), values) : translate(lang, text));
}
