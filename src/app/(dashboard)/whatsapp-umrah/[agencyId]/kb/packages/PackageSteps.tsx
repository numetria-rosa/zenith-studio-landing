"use client";

import { useState, type ReactNode } from "react";
import { PACKAGE_TYPES, AIRPORT_SUGGESTIONS, AVAILABILITY_SUGGESTIONS, BASIS_SUGGESTIONS, LIMITS, canAddAirport, canAddItem, nightsLabel, totalNights, walkMinutes, type ChipState, type PackageDraft } from "@/lib/whatsapp-umrah/kb/package-form";
import { WaIcon } from "@/components/wa/Icon";
import { FieldLabel, GhostButton, Hint, INPUT, Input, Label, Pill, PopoverMenu, Textarea } from "@/components/wa/ui";
import { CYAN, EMBER, MINT, cx } from "@/components/wa/tokens";

type Set = (patch: Partial<PackageDraft>) => void;
type StepProps = { d: PackageDraft; set: Set; agentName: string };

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Quick chip (price basis, airports, availability). `on` gives the selected chip its cyan ring. */
const chip = (on: boolean) => cx("inline-flex cursor-pointer items-center gap-[7px] whitespace-nowrap rounded-full border px-[13px] disabled:cursor-not-allowed disabled:opacity-50", FOCUS, on ? "border-[rgba(92,200,255,.55)] bg-[rgba(92,200,255,.12)] text-frost" : "border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.03)] text-soft");
const SMALL_CHIP = "h-[30px] text-[12.5px]";

function StepHead({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start gap-[14px]">
      <div className="flex-1">
        <h2 className="m-0 text-[18px] font-semibold">{title}</h2>
        <div className="mt-1 text-[13.5px] text-mist">{sub}</div>
      </div>
      {children}
    </div>
  );
}

/* ---------- 1. Basics ---------- */

function TypeListbox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <PopoverMenu
      role="listbox"
      label="Package type"
      width={240}
      offset={6}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button id="pkg-type" type="button" aria-haspopup="listbox" aria-expanded={open} className={cx(INPUT, "flex cursor-pointer items-center justify-between text-left", FOCUS)}>
          {value}
          <WaIcon name="chevronDown" size={16} stroke="#A9AEBA" />
        </button>
      }
    >
      {PACKAGE_TYPES.map((t) => {
        const on = t === value;
        return (
          <button
            key={t}
            type="button"
            role="option"
            aria-selected={on}
            onClick={() => {
              onChange(t);
              setOpen(false);
            }}
            className={cx("flex h-[38px] w-full cursor-pointer items-center rounded-[10px] border-0 px-3 text-left text-[14px] text-frost", FOCUS, on ? "bg-[rgba(255,255,255,.06)]" : "bg-transparent hover:bg-[rgba(255,255,255,.04)]")}
          >
            <span className="flex-1">{t}</span>
            {on && <WaIcon name="check" size={15} stroke="#7FF0BD" strokeWidth={2.4} />}
          </button>
        );
      })}
    </PopoverMenu>
  );
}

export function BasicsStep({ d, set, agentName }: StepProps) {
  return (
    <section className="px-7 py-[26px]">
      <StepHead title="Basics" sub="What customers will ask for by name." />
      <div className="grid gap-[14px]" style={{ gridTemplateColumns: "minmax(0, 1fr) 240px" }}>
        <div>
          <FieldLabel htmlFor="pkg-name">Package name</FieldLabel>
          <Input id="pkg-name" value={d.name} maxLength={LIMITS.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Economy Umrah, 10 nights" />
        </div>
        <div>
          <FieldLabel htmlFor="pkg-type">Type</FieldLabel>
          <TypeListbox value={d.type} onChange={(type) => set({ type })} />
        </div>
      </div>
      <div className="mt-4">
        <FieldLabel htmlFor="pkg-description">
          Description <span className="text-dim">(optional)</span>
        </FieldLabel>
        <Textarea id="pkg-description" rows={3} value={d.description} maxLength={LIMITS.long} onChange={(e) => set({ description: e.target.value })} placeholder={`One or two sentences ${agentName} can use to describe this package.`} />
      </div>
    </section>
  );
}

/* ---------- 2. Stay ---------- */

function Stepper({ value, onChange, city }: { value: number; onChange: (n: number) => void; city: string }) {
  const btn = cx("h-9 w-[34px] cursor-pointer border-0 bg-transparent text-[17px] text-soft", FOCUS);
  return (
    <div className="flex items-center rounded-xl border border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.04)]">
      <button type="button" aria-label={`Fewer nights in ${city}`} onClick={() => onChange(Math.max(0, value - 1))} className={cx(btn, "rounded-l-xl")}>
        −
      </button>
      <span className="min-w-[26px] text-center font-mono text-[14px]" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label={`More nights in ${city}`} onClick={() => onChange(Math.min(60, value + 1))} className={cx(btn, "rounded-r-xl")}>
        +
      </button>
    </div>
  );
}

/** Tapping the same star again clears the rating. */
function Stars({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        return (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} ${n === 1 ? "star" : "stars"}`} onClick={() => onChange(value === n ? 0 : n)} className={cx("flex h-[30px] w-[30px] cursor-pointer items-center justify-center border-0 bg-transparent p-0", FOCUS)}>
            <WaIcon name="star" size={20} strokeWidth={1.6} fill={on ? "#FFD27A" : "none"} stroke={on ? "#FFD27A" : "#7D8392"} strokeLinejoin="round" />
          </button>
        );
      })}
    </div>
  );
}

type Hotel = { key: "makkah" | "madinah"; city: string; labelColor: string; distanceLabel: string };
const HOTELS: Hotel[] = [
  { key: "makkah", city: "Makkah", labelColor: "#7FF0BD", distanceLabel: "Distance to the Haram" },
  { key: "madinah", city: "Madinah", labelColor: "#9BDDFF", distanceLabel: "Distance to the Prophet's Mosque" },
];

const KEYS = {
  makkah: { nights: "nightsMakkah", name: "makkahName", stars: "makkahStars", metres: "makkahMetres" },
  madinah: { nights: "nightsMadinah", name: "madinahName", stars: "madinahStars", metres: "madinahMetres" },
} as const;

function HotelCard({ h, d, set }: { h: Hotel } & Omit<StepProps, "agentName">) {
  const k = KEYS[h.key];
  const put = (key: keyof PackageDraft, value: string | number) => set({ [key]: value } as Partial<PackageDraft>);
  const walk = walkMinutes(d[k.metres]);
  return (
    <div className="rounded-[18px] border border-[rgba(255,255,255,.08)] bg-[rgba(255,255,255,.02)] p-[18px]">
      <div className="flex items-center justify-between">
        <Label style={{ color: h.labelColor }}>{h.city}</Label>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-mist">Nights</span>
          <Stepper value={d[k.nights]} city={h.city} onChange={(n) => put(k.nights, n)} />
        </div>
      </div>
      <FieldLabel htmlFor={`pkg-${h.key}-hotel`} className="mt-4">
        Hotel
      </FieldLabel>
      <Input id={`pkg-${h.key}-hotel`} aria-label={`${h.city} hotel`} value={d[k.name]} maxLength={LIMITS.short} onChange={(e) => put(k.name, e.target.value)} placeholder="e.g. Dar Al Safa Hotel" />
      <div className="mt-[14px] flex items-center justify-between">
        <span className="text-[13.5px] text-soft">Stars</span>
        <Stars value={d[k.stars]} label={`${h.city} hotel stars`} onChange={(n) => put(k.stars, n)} />
      </div>
      <div className="mt-[14px]">
        <FieldLabel htmlFor={`pkg-${h.key}-metres`}>{h.distanceLabel}</FieldLabel>
        <div className="relative">
          <Input id={`pkg-${h.key}-metres`} mono inputMode="numeric" value={d[k.metres]} maxLength={5} onChange={(e) => put(k.metres, e.target.value.replace(/\D/g, ""))} placeholder="600" className="pr-16" />
          <span className="pointer-events-none absolute right-[14px] top-[14px] text-[13px] text-dim">metres</span>
        </div>
      </div>
      <div className="mt-2 text-right font-mono text-[11.5px] text-dim">{walk ? `≈ ${walk} min walk` : "Walking time is worked out for you"}</div>
    </div>
  );
}

export function StayStep({ d, set }: StepProps) {
  return (
    <section className="px-7 py-[26px]">
      <StepHead title="Stay" sub="Where they sleep, and how close it is.">
        <Pill color={CYAN}>{nightsLabel(totalNights(d))} total</Pill>
      </StepHead>
      <div className="grid gap-[14px]" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        {HOTELS.map((h) => (
          <HotelCard key={h.key} h={h} d={d} set={set} />
        ))}
      </div>
    </section>
  );
}

/* ---------- 3. Price ---------- */

export function PriceStep({ d, set, agentName }: StepProps) {
  return (
    <section className="px-7 py-[26px]">
      <StepHead title="Price" sub={`Exactly what ${agentName} quotes. Always per person.`} />
      <div className="grid items-start gap-[18px]" style={{ gridTemplateColumns: "220px minmax(0, 1fr)" }}>
        <div>
          <FieldLabel htmlFor="pkg-price">Price per person</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-[14px] top-[13px] text-[15px] text-mist">£</span>
            <Input id="pkg-price" mono inputMode="decimal" value={d.price} maxLength={12} onChange={(e) => set({ price: e.target.value })} placeholder="1295" className="!h-14 pl-8 text-[22px] text-mint-text" />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="pkg-basis">Price basis</FieldLabel>
          <Input id="pkg-basis" value={d.basis} maxLength={LIMITS.short} onChange={(e) => set({ basis: e.target.value })} placeholder="e.g. quad sharing" />
          <div className="mt-[10px] flex flex-wrap gap-[6px]">
            {BASIS_SUGGESTIONS.map((b) => (
              <button key={b} type="button" aria-pressed={same(d.basis, b)} onClick={() => set({ basis: b })} className={cx(chip(same(d.basis, b)), SMALL_CHIP)}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-[18px] grid gap-[18px]" style={{ gridTemplateColumns: "220px minmax(0, 1fr)" }}>
        <div>
          <FieldLabel htmlFor="pkg-deposit">Deposit per person</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-[14px] top-[13px] text-[15px] text-mist">£</span>
            <Input id="pkg-deposit" mono inputMode="decimal" value={d.deposit} maxLength={12} onChange={(e) => set({ deposit: e.target.value })} placeholder="250" className="pl-[30px]" />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="pkg-terms">Payment terms</FieldLabel>
          <Input id="pkg-terms" value={d.terms} maxLength={LIMITS.long} onChange={(e) => set({ terms: e.target.value })} placeholder="e.g. balance due 8 weeks before departure" />
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. Travel ---------- */

export function TravelStep({ d, set, agentName }: StepProps) {
  const [draft, setDraft] = useState("");
  const [full, setFull] = useState(false);
  const add = (raw: string) => {
    const v = raw.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    if (!v) return;
    if (d.airports.some((a) => same(a, v))) return setDraft("");
    if (!canAddAirport(d, v)) return setFull(true);
    setFull(false);
    set({ airports: [...d.airports, v] });
    setDraft("");
  };
  const suggestions = AIRPORT_SUGGESTIONS.filter((a) => !d.airports.some((x) => same(x, a)));
  return (
    <section className="px-7 py-[26px]">
      <StepHead title="Travel" sub="Flights, dates and whether there's still space." />
      <FieldLabel htmlFor="pkg-airport-input">Departure airports</FieldLabel>
      <div className="box-border flex min-h-[50px] w-full flex-wrap items-center gap-[6px] rounded-[14px] border border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.04)] px-2 py-[7px] focus-within:border-[rgba(92,200,255,.6)] focus-within:shadow-[0_0_0_3px_rgba(92,200,255,.15)]">
        {d.airports.map((a) => (
          <span key={a} className="inline-flex h-[34px] items-center gap-[6px] rounded-full border border-[rgba(92,200,255,.35)] bg-[rgba(92,200,255,.10)] pl-3 pr-[6px] text-[13.5px]">
            <WaIcon name="plane" size={13} stroke="#9BDDFF" />
            {a}
            <button type="button" aria-label={`Remove ${a}`} onClick={() => set({ airports: d.airports.filter((x) => x !== a) })} className={cx("flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-[11px] border-0 bg-transparent p-0", FOCUS)}>
              <WaIcon name="x" size={12} stroke="#9BDDFF" strokeWidth={2.2} />
            </button>
          </span>
        ))}
        <input
          id="pkg-airport-input"
          value={draft}
          maxLength={LIMITS.short}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder="Add airport"
          className="h-[34px] min-w-[120px] flex-1 border-0 bg-transparent font-sans text-[14.5px] text-frost outline-none placeholder:text-dim"
        />
        <GhostButton className="!h-8" onClick={() => add(draft)}>
          <WaIcon name="plus" size={14} stroke="#A9AEBA" />
          Add
        </GhostButton>
      </div>
      <div className="mt-[10px] flex flex-wrap items-center gap-[6px]">
        <span className="mr-1 text-[12.5px] text-dim">Quick add</span>
        {suggestions.map((a) => (
          <button key={a} type="button" disabled={!canAddAirport(d, a)} onClick={() => add(a)} className={cx(chip(false), SMALL_CHIP)}>
            <WaIcon name="plus" size={12} stroke="#A9AEBA" />
            {a}
          </button>
        ))}
      </div>
      {full && <Hint className="mt-2">That is as many airports as {agentName} can hold for one package. Remove one to add another.</Hint>}
      <div className="mt-[18px] grid gap-[14px]" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <div>
          <FieldLabel htmlFor="pkg-airline">Airline and flights</FieldLabel>
          <Input id="pkg-airline" value={d.airline} maxLength={LIMITS.short} onChange={(e) => set({ airline: e.target.value })} placeholder="e.g. Saudia direct, return included" />
        </div>
        <div>
          <FieldLabel htmlFor="pkg-dates">Travel dates</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-[14px] top-[14px]">
              <WaIcon name="calendar" size={17} stroke="#7D8392" />
            </span>
            <Input id="pkg-dates" value={d.dates} maxLength={LIMITS.long} onChange={(e) => set({ dates: e.target.value })} placeholder="e.g. 14 Feb and 21 Feb 2027, or the season" className="pl-[42px]" />
          </div>
        </div>
      </div>
      <div className="mt-[18px]">
        <FieldLabel htmlFor="pkg-availability">Availability</FieldLabel>
        <div className="grid items-center gap-[10px]" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
          <Input id="pkg-availability" value={d.availability} maxLength={LIMITS.short} onChange={(e) => set({ availability: e.target.value })} placeholder="e.g. 12 seats left" />
          <div className="flex gap-[6px]">
            {AVAILABILITY_SUGGESTIONS.map((a) => (
              <button key={a} type="button" aria-pressed={same(d.availability, a)} onClick={() => set({ availability: a })} className={cx(chip(same(d.availability, a)), "h-[46px] rounded-[14px] text-[13.5px]")}>
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 5. Included ---------- */

const NEXT: Record<ChipState, ChipState> = { 0: 1, 1: 2, 2: 0 };
const STATE_NAME: Record<ChipState, string> = { 0: "Not set", 1: "Included", 2: "Not included" };
const STATE_STYLE: Record<ChipState, string> = {
  0: "border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.03)] text-soft",
  1: "border-[rgba(61,220,151,.5)] bg-[rgba(61,220,151,.10)] text-mint-text",
  2: "border-[rgba(255,92,122,.45)] bg-[rgba(255,92,122,.08)] text-ember-text",
};

export function IncludedStep({ d, set, agentName }: StepProps) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const nInc = d.items.filter((i) => i.state === 1).length;
  const nExc = d.items.filter((i) => i.state === 2).length;
  const commit = () => {
    const label = text.replace(/\s+/g, " ").trim().slice(0, LIMITS.short);
    setText("");
    setAdding(false);
    if (!label || d.items.some((i) => same(i.label, label)) || !canAddItem(d)) return;
    set({ items: [...d.items, { label, state: 1 }] });
  };
  return (
    <section className="px-7 py-[26px]">
      <StepHead title="What's included" sub="Tap once for included, twice for not included.">
        <div className="flex gap-2">
          <Pill color={MINT}>{nInc} included</Pill>
          <Pill color={EMBER}>{nExc} not included</Pill>
        </div>
      </StepHead>
      <div className="flex flex-wrap gap-2">
        {d.items.map((item) => (
          <button
            key={item.label}
            type="button"
            aria-label={`${item.label}: ${STATE_NAME[item.state]}`}
            onClick={() => set({ items: d.items.map((i) => (i === item ? { ...i, state: NEXT[i.state] } : i)) })}
            className={cx("inline-flex h-10 cursor-pointer items-center gap-[7px] whitespace-nowrap rounded-full border pl-[11px] pr-[14px] text-[14px]", FOCUS, STATE_STYLE[item.state])}
          >
            <WaIcon name={item.state === 1 ? "check" : item.state === 2 ? "x" : "plus"} size={15} strokeWidth={2.2} />
            {item.label}
          </button>
        ))}
        {adding ? (
          <input
            autoFocus
            aria-label="Add your own item"
            value={text}
            maxLength={LIMITS.short}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setText("");
                setAdding(false);
              }
            }}
            placeholder="e.g. Wheelchair assistance"
            className="h-10 w-[220px] rounded-full border border-dashed border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.03)] px-[14px] font-sans text-[14px] text-frost outline-none placeholder:text-dim focus:border-[rgba(92,200,255,.6)]"
          />
        ) : (
          <button type="button" disabled={!canAddItem(d)} onClick={() => setAdding(true)} className={cx("inline-flex h-10 cursor-pointer items-center gap-[7px] whitespace-nowrap rounded-full border border-dashed border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.03)] px-[13px] text-[13.5px] text-cyan-text disabled:cursor-not-allowed disabled:opacity-50", FOCUS)}>
            <WaIcon name="plus" size={14} stroke="#9BDDFF" />
            Add your own
          </button>
        )}
      </div>
      <div className="mt-[14px] flex gap-[18px] text-[12.5px] text-dim">
        <span className="inline-flex items-center gap-[6px]">
          <span className="h-2 w-2 rounded-[4px] bg-mint" />
          Included
        </span>
        <span className="inline-flex items-center gap-[6px]">
          <span className="h-2 w-2 rounded-[4px] bg-ember" />
          Not included
        </span>
        <span className="inline-flex items-center gap-[6px]">
          <span className="box-border h-2 w-2 rounded-[4px] border border-[rgba(255,255,255,.3)]" />
          {agentName} won&apos;t mention it
        </span>
      </div>
    </section>
  );
}

/* ---------- 6. Extras ---------- */

export function ExtrasStep({ d, set, agentName }: StepProps) {
  return (
    <section className="px-7 py-[26px]">
      <StepHead title="Extras" sub={`Optional notes ${agentName} may repeat word for word.`} />
      <Textarea aria-label="Anything else" rows={4} value={d.notes} maxLength={LIMITS.long} onChange={(e) => set({ notes: e.target.value })} placeholder="e.g. Children 2 to 11 sharing with two adults are £1,150. Cancellation follows our standard policy." />
    </section>
  );
}
