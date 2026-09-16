"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, localeNames, type Locale } from "@/i18n/routing";
import { FlagUS, FlagES, FlagFR, FlagSE } from "@/components/flags";

const flags: Record<Locale, (props: { className?: string }) => React.ReactElement> = {
  en: FlagUS,
  es: FlagES,
  fr: FlagFR,
  sv: FlagSE,
};

const codes: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  fr: "FR",
  sv: "SE",
};

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const CurrentFlag = flags[locale];

  function switchTo(next: Locale) {
    setOpen(false);
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2 py-2 text-xs font-semibold text-white/80 backdrop-blur-xl transition hover:bg-white/10 lg:gap-2 lg:px-3"
      >
        <CurrentFlag className="h-4 w-6 flex-shrink-0 rounded-sm" />
        <span className="hidden lg:inline">{codes[locale]}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`hidden h-3 w-3 flex-shrink-0 transition-transform lg:block ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c14]/95 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
          {routing.locales.map((code) => {
            const Flag = flags[code];
            const active = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => switchTo(code)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
                  active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Flag className="h-4 w-6 flex-shrink-0 rounded-sm" />
                <span>{localeNames[code]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
