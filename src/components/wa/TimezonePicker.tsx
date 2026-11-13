"use client";

import { useMemo, useState } from "react";
import { WaIcon } from "@/components/wa/Icon";
import { INPUT, PopoverMenu } from "@/components/wa/ui";
import { cx } from "@/components/wa/tokens";
import { TIMEZONE_OPTIONS, timezoneChoices } from "@/lib/whatsapp-umrah/timezone";
import { useT } from "@/components/wa/i18n";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";
const SUGGESTED = new Set<string>(TIMEZONE_OPTIONS.map((o) => o.id));

/** "GMT+1", "GMT-5", "GMT+5:30": where the zone sits right now (daylight saving included), so owners can recognise theirs. */
function offsetLabel(id: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: id, timeZoneName: "shortOffset" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

/** A searchable timezone list in the dashboard's own style (the browser's native menu ignores the dark theme). */
export function TimezonePicker({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const choices = useMemo(() => timezoneChoices(value).map((o) => ({ ...o, offset: offsetLabel(o.id) })), [value]);
  const current = choices.find((o) => o.id === value);

  const q = query.trim().toLowerCase();
  const shown = q ? choices.filter((o) => `${o.label} ${o.id} ${o.offset}`.toLowerCase().includes(q)) : choices;
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const row = (o: (typeof choices)[number], i: number) => {
    const on = o.id === value;
    return (
      <button
        key={o.id}
        type="button"
        role="option"
        aria-selected={on}
        ref={(el) => {
          if (el && i === active) el.scrollIntoView({ block: "nearest" });
        }}
        onClick={() => pick(o.id)}
        onMouseEnter={() => setActive(i)}
        className={cx("flex h-[38px] w-full cursor-pointer items-center gap-3 rounded-[10px] border-0 px-3 text-left text-[14px] text-frost", FOCUS, i === active ? "bg-[rgba(255,255,255,.07)]" : "bg-transparent")}
      >
        <span className="min-w-0 flex-1 truncate">{t(o.label)}</span>
        <span className="font-mono text-[12px] text-dim">{o.offset}</span>
        {on && <WaIcon name="check" size={15} stroke="#7FF0BD" strokeWidth={2.4} />}
      </button>
    );
  };

  return (
    <PopoverMenu
      role="listbox"
      label={t("Timezone")}
      width={440}
      offset={6}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setQuery("");
          setActive(Math.max(0, choices.findIndex((c) => c.id === value)));
        }
      }}
      trigger={
        <button id={id} type="button" aria-haspopup="listbox" aria-expanded={open} className={cx(INPUT, "flex cursor-pointer items-center gap-3 text-left", FOCUS)}>
          <WaIcon name="globe" size={16} stroke="#A9AEBA" />
          <span className="min-w-0 flex-1 truncate">{current?.label ?? value}</span>
          <span className="font-mono text-[12.5px] text-dim">{current?.offset}</span>
          <WaIcon name="chevronDown" size={16} stroke="#A9AEBA" />
        </button>
      }
    >
      <div className="relative mb-[6px]">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"><WaIcon name="search" size={15} stroke="#A9AEBA" /></span>
        <input
          autoFocus
          value={query}
          placeholder={t("Search a city or country")}
          aria-label={t("Search timezones")}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            else if (e.key === "Enter") { e.preventDefault(); if (shown[active]) pick(shown[active].id); }
          }}
          className="box-border h-10 w-full rounded-[10px] border border-[rgba(255,255,255,.10)] bg-[rgba(255,255,255,.04)] pl-9 pr-3 text-[14px] text-frost outline-none placeholder:text-dim focus:border-[rgba(92,200,255,.6)]"
        />
      </div>
      <div className="max-h-[320px] overflow-y-auto pr-[2px]">
        {shown.length === 0 && <div className="px-3 py-6 text-center text-[13.5px] text-dim">{t("No timezone matches “")}{query}&rdquo;.</div>}
        {shown.map((o, i) => (
          <div key={o.id}>
            {!q && i === 0 && SUGGESTED.has(o.id) && <div className="px-3 pb-1 pt-2 font-mono text-[11px] uppercase tracking-[.16em] text-dim">{t("Suggested")}</div>}
            {!q && !SUGGESTED.has(o.id) && (i === 0 || SUGGESTED.has(shown[i - 1].id)) && <div className="px-3 pb-1 pt-3 font-mono text-[11px] uppercase tracking-[.16em] text-dim">{t("All timezones")}</div>}
            {row(o, i)}
          </div>
        ))}
      </div>
    </PopoverMenu>
  );
}
