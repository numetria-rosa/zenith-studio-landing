"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UI_LANGS, UI_LANG_LABELS, isUiLang } from "@/lib/whatsapp-umrah/ui-lang";
import { setUiLangAction } from "@/lib/whatsapp-umrah/ui-lang-action";
import { useT, useUiLang } from "./i18n";

/** The dashboard language dropdown (English / Français). Saves the choice in a cookie, then reloads the page's server data. */
export function LanguageSelect() {
  const lang = useUiLang();
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center justify-between gap-3 px-2 pt-4 text-[12.5px] text-dim">
      <span>{t("Language")}</span>
      <select
        value={lang}
        disabled={pending}
        aria-label={t("Dashboard language")}
        onChange={(e) => {
          const next = e.target.value;
          if (!isUiLang(next)) return;
          start(async () => {
            await setUiLangAction(next);
            router.refresh();
          });
        }}
        className="h-[34px] cursor-pointer rounded-lg border border-[rgba(255,255,255,.14)] bg-[#12141C] px-2 text-[13px] text-frost outline-none focus-visible:outline-2 focus-visible:outline-cyan"
        style={{ colorScheme: "dark" }}
      >
        {UI_LANGS.map((l) => (
          <option key={l} value={l}>
            {UI_LANG_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
