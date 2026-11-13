"use server";

import { cookies } from "next/headers";
import { UI_LANG_COOKIE, isUiLang } from "./ui-lang";

/** Saves the dashboard language the owner picked in the dropdown. A display preference only, so any signed-in visitor may set it. */
export async function setUiLangAction(lang: string): Promise<void> {
  if (!isUiLang(lang)) return;
  (await cookies()).set(UI_LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
