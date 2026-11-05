"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { WaIcon, type WaIconName } from "@/components/wa/Icon";
import { ConfirmAction } from "@/components/wa/ConfirmDialog";
import { AMBER, Card, CYAN, FieldLabel, GhostButton, GlassButton, Hint, Input, Label, MINT, Pill, PrimaryButton, Segmented, Tile, Toggle, VIOLET, cx } from "@/components/wa/ui";
import { updateAgentSettingsAction } from "../actions";

const DAYS = [["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]] as const;
const LANGS = [["en", "English", "English"], ["ar", "Arabic", "العربية"], ["tr", "Turkish", "Türkçe"], ["ur", "Urdu", "اردو"]] as const;

type DayKey = (typeof DAYS)[number][0];
export type SettingsState = {
  agencyName: string;
  agentName: string;
  tone: "WARM" | "FORMAL";
  signOff: string;
  emoji: boolean;
  langs: string[];
  allDay: boolean;
  days: Record<DayKey, { on: boolean; open: string; close: string }>;
  outside: "AI_REPLIES" | "AWAY_MESSAGE_ONLY";
  awayMessage: string;
  resumeOn: boolean;
  mins: number;
  limit: string;
  retention: string;
};

type Billing = { planLabel: string; active: boolean; foundingOffer: boolean; canCancel: boolean } | null;
type Props = { agencyId: string; initial: SettingsState; used: number; planCap: number; billing: Billing; cancelAction: () => Promise<void> };

const SECTIONS: { id: string; label: string; icon: WaIconName }[] = [
  { id: "s-agent", label: "Agent", icon: "person" },
  { id: "s-lang", label: "Languages", icon: "globe" },
  { id: "s-hours", label: "Hours", icon: "clock" },
  { id: "s-handoff", label: "Handoff", icon: "userCheck" },
  { id: "s-limit", label: "Reply limit", icon: "sparkle" },
  { id: "s-data", label: "Data & privacy", icon: "shield" },
  { id: "s-billing", label: "Billing", icon: "card" },
];

function SectionHead({ icon, color, title, sub }: { icon: WaIconName; color: string; title: string; sub: string }) {
  return (
    <div className="mb-5 flex gap-[14px]">
      <Tile size={38} color={color}><WaIcon name={icon} size={18} stroke={color} /></Tile>
      <div>
        <h2 className="m-0 text-[18px] font-semibold">{title}</h2>
        <div className="mt-1 text-[14px] text-mist">{sub}</div>
      </div>
    </div>
  );
}

const sectionCard = "scroll-mt-6 px-[26px] py-6";

export function SettingsForm({ agencyId, initial, used, planCap, billing, cancelAction }: Props) {
  const [baseline, setBaseline] = useState(initial);
  const [s, setS] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState("s-agent");

  const set = <K extends keyof SettingsState>(k: K, v: SettingsState[K]) => setS((p) => ({ ...p, [k]: v }));
  const dirty = useMemo(() => JSON.stringify(s) !== JSON.stringify(baseline), [s, baseline]);
  const noDayOpen = !s.allDay && !DAYS.some(([k]) => s.days[k].on);
  const badMessage = s.outside === "AWAY_MESSAGE_ONLY" && !s.awayMessage.trim();
  const invalid = noDayOpen || badMessage || s.langs.length === 0 || !s.agentName.trim();

  // Highlight the section being read in the left nav.
  useEffect(() => {
    const els = SECTIONS.map((x) => document.getElementById(x.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => { const hit = entries.find((e) => e.isIntersecting); if (hit) setActive(hit.target.id); }, { rootMargin: "-20% 0px -65% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Leave the page with unsaved changes? Ask first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function save() {
    const f = new FormData();
    f.set("agencyName", s.agencyName);
    f.set("agentName", s.agentName);
    f.set("tone", s.tone);
    f.set("signOff", s.signOff);
    if (s.emoji) f.set("emojiEnabled", "on");
    s.langs.forEach((l) => f.append("languages", l));
    f.set("awayMode", s.outside);
    f.set("awayMessage", s.awayMessage);
    // "Open 24/7" is stored as no open day at all (what hours.ts reads as always open).
    if (!s.allDay) DAYS.forEach(([k]) => { if (s.days[k].on) { f.set(`hours_${k}_open`, "on"); f.set(`hours_${k}_start`, s.days[k].open); f.set(`hours_${k}_end`, s.days[k].close); } });
    if (s.resumeOn) f.set("autoResumeIdleMinutes", String(s.mins)); // blank = off
    f.set("monthlyReplyLimit", s.limit);
    f.set("retentionMonths", s.retention);
    setError(null);
    startTransition(async () => {
      try {
        await updateAgentSettingsAction(agencyId, f);
        setBaseline(s);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save your settings. Please try again.");
      }
    });
  }

  const limitNum = Math.floor(Number(s.limit));
  const effectiveCap = Number.isFinite(limitNum) && limitNum > 0 ? Math.min(limitNum, planCap) : planCap;
  const pct = effectiveCap > 0 ? Math.min(100, (used / effectiveCap) * 100) : 0;
  const formal = s.tone === "FORMAL";
  const previewReply = formal ? "The Umrah visa is included in every package. Our team will apply for it on your behalf." : "Yes, the Umrah visa is included in every package and our team applies for it for you.";
  const radio = (on: boolean) => (on ? "border-[5px] border-cyan" : "border-[1.5px] border-[rgba(255,255,255,.3)]");

  return (
    <div className="grid items-start gap-7" style={{ gridTemplateColumns: "200px minmax(0, 1fr)" }}>
      <nav aria-label="Settings sections" className="sticky top-6 flex flex-col gap-[2px]">
        {SECTIONS.map((x) => (
          <a key={x.id} href={`#${x.id}`} className={cx("flex h-[38px] items-center gap-3 rounded-xl px-3 text-[14px] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan", active === x.id ? "bg-[rgba(92,200,255,.10)] text-frost shadow-[inset_0_0_0_1px_rgba(92,200,255,.30)]" : "text-mist")}>
            <WaIcon name={x.icon} size={16} stroke={active === x.id ? "#F5F6F8" : "#A9AEBA"} />
            {x.label}
          </a>
        ))}
      </nav>

      <div className="min-w-0">
        <div className="flex flex-col gap-[18px]">
          {/* Agent */}
          <Card as="section" id="s-agent" className={sectionCard}>
            <SectionHead icon="person" color={CYAN} title="Agent" sub="Who customers are talking to, and how your agent sounds." />
            <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr) 300px" }}>
              <div className="flex flex-col gap-[18px]">
                <div className="grid grid-cols-2 gap-[14px]">
                  <div><FieldLabel htmlFor="agencyName">Agency name</FieldLabel><Input id="agencyName" value={s.agencyName} maxLength={80} onChange={(e) => set("agencyName", e.target.value)} /></div>
                  <div><FieldLabel htmlFor="agentName">Agent name</FieldLabel><Input id="agentName" value={s.agentName} onChange={(e) => set("agentName", e.target.value)} /></div>
                </div>
                <div>
                  <FieldLabel>Tone</FieldLabel>
                  <Segmented label="Tone" size="sm" value={s.tone} onChange={(v) => set("tone", v)} options={[{ value: "WARM", label: "Warm" }, { value: "FORMAL", label: "Formal" }]} className="rounded-[14px] [&_button]:h-[38px] [&_button]:rounded-[10px] [&_button]:text-[14px]" />
                </div>
                <div>
                  <FieldLabel htmlFor="signOff">Sign-off (optional)</FieldLabel>
                  <Input id="signOff" value={s.signOff} placeholder="e.g. Sara, Zenith Demo Travel" onChange={(e) => set("signOff", e.target.value)} />
                  <Hint>Added to the end of every reply.</Hint>
                </div>
                <div className="flex items-center gap-[14px]">
                  <Toggle checked={s.emoji} onChange={(v) => set("emoji", v)} label="Allow emoji in replies" />
                  <div><div className="text-[14.5px]">Allow emoji in replies</div><div className="text-[13px] text-dim">Off keeps replies plain and formal.</div></div>
                </div>
              </div>
              <div className="rounded-[18px] border border-[rgba(255,255,255,.07)] bg-[rgba(255,255,255,.02)] p-[18px]">
                <Label className="text-[10.5px]">Preview</Label>
                <div className="mt-[14px] max-w-[85%] rounded-[16px_16px_16px_6px] bg-bubble px-[14px] py-[10px] text-[14px]">Is the visa included?</div>
                <div className="ml-auto mt-[10px] max-w-[90%] rounded-[16px_16px_6px_16px] border border-[rgba(61,220,151,.3)] bg-[rgba(61,220,151,.10)] px-[14px] py-3 text-[14px] leading-[1.5]">
                  {previewReply}
                  {s.signOff.trim() && (<><br /><span className="text-mint-text">{s.signOff.trim()}</span></>)}
                </div>
                <Hint className="mt-3">How a reply looks with your current tone and sign-off.</Hint>
              </div>
            </div>
          </Card>

          {/* Languages */}
          <Card as="section" id="s-lang" className={sectionCard}>
            <SectionHead icon="globe" color={VIOLET} title="Languages" sub="Your agent replies in any language you tick." />
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
              {LANGS.map(([code, name, native]) => {
                const on = s.langs.includes(code);
                return (
                  <button key={code} type="button" role="checkbox" aria-checked={on} onClick={() => set("langs", on ? s.langs.filter((l) => l !== code) : [...s.langs, code])} className={cx("flex cursor-pointer items-center gap-3 rounded-2xl border-0 p-4 text-left text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan", on ? "bg-[rgba(61,220,151,.08)] shadow-[inset_0_0_0_1px_rgba(61,220,151,.45)]" : "bg-[rgba(255,255,255,.02)] opacity-70 shadow-[inset_0_0_0_1px_rgba(255,255,255,.10)]")}>
                    <span className={cx("box-border flex h-5 w-5 items-center justify-center rounded-md border-[1.5px]", on ? "border-mint bg-mint" : "border-[rgba(255,255,255,.3)]")}>{on && <WaIcon name="check" size={13} stroke="#05060A" strokeWidth={2.8} />}</span>
                    <div><div className="text-[15px]">{name}</div><div className="mt-[2px] text-[13px] text-mist">{native}</div></div>
                  </button>
                );
              })}
            </div>
            <Hint className="mt-3">Your agent replies in the customer&apos;s language when it&apos;s one of these. Keep at least one on.</Hint>
          </Card>

          {/* Hours */}
          <Card as="section" id="s-hours" className={sectionCard}>
            <SectionHead icon="clock" color={AMBER} title="Business hours" sub="When your office is open, and what your agent does outside it." />
            <div className="flex items-center gap-[14px] rounded-2xl border border-[rgba(255,255,255,.08)] bg-[rgba(255,255,255,.02)] p-4">
              <Toggle checked={s.allDay} onChange={(v) => set("allDay", v)} label="Open 24/7" />
              <div className="flex-1"><div className="text-[15px]">Open 24/7</div><div className="text-[13px] text-dim">Turn off to set your office hours.</div></div>
            </div>
            {!s.allDay && (
              <>
                <div className="mt-[10px]">
                  {DAYS.map(([k, label]) => {
                    const d = s.days[k];
                    const upd = (patch: Partial<typeof d>) => set("days", { ...s.days, [k]: { ...d, ...patch } });
                    return (
                      <div key={k} className="grid items-center gap-[14px] border-t border-[rgba(255,255,255,.06)] py-[10px]" style={{ gridTemplateColumns: "54px 120px minmax(0, 1fr)" }}>
                        <Toggle checked={d.on} onChange={(v) => upd({ on: v })} label={`Open on ${label}`} />
                        <span className="text-[14.5px]">{label}</span>
                        {d.on ? (
                          <div className="flex items-center gap-[10px]">
                            <Input type="time" mono value={d.open} aria-label={`${label} opens at`} onChange={(e) => upd({ open: e.target.value })} className="h-10 w-[120px] text-[14px]" />
                            <span className="text-[13px] text-dim">to</span>
                            <Input type="time" mono value={d.close} aria-label={`${label} closes at`} onChange={(e) => upd({ close: e.target.value })} className="h-10 w-[120px] text-[14px]" />
                          </div>
                        ) : (
                          <span className="font-mono text-[12.5px] text-dim">CLOSED</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {noDayOpen && <p role="alert" className="mb-0 mt-2 text-[13px] text-amber">Turn on at least one day, or switch Open 24/7 back on.</p>}
                <Label className="mb-3 mt-[22px] block">Outside these hours</Label>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Outside business hours">
                  {([["AI_REPLIES", "Keep answering", "Your agent replies as normal. Handoffs wait for your team.", true], ["AWAY_MESSAGE_ONLY", "Send an away message", "Customers get one message, and your agent stays quiet until you open.", false]] as const).map(([v, title, text, rec]) => {
                    const on = s.outside === v;
                    return (
                      <div key={v} role="radio" aria-checked={on} tabIndex={0} onClick={() => set("outside", v)} onKeyDown={(e) => (e.key === " " || e.key === "Enter") && set("outside", v)} className={cx("flex cursor-pointer gap-[14px] rounded-2xl p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan", on ? "bg-[rgba(92,200,255,.06)] shadow-[inset_0_0_0_1px_rgba(92,200,255,.5)]" : "shadow-[inset_0_0_0_1px_rgba(255,255,255,.10)]")}>
                        <span className={cx("box-border mt-[1px] h-5 w-5 shrink-0 rounded-[10px]", radio(on))} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px]">{title}{rec && <span className="text-[12.5px] text-mint-text"> · recommended</span>}</div>
                          <div className="mt-[3px] text-[13px] leading-[1.5] text-mist">{text}</div>
                          {v === "AWAY_MESSAGE_ONLY" && (
                            <Input value={s.awayMessage} disabled={!on} onClick={(e) => e.stopPropagation()} onChange={(e) => set("awayMessage", e.target.value)} aria-label="Away message" placeholder="We're closed right now, back within office hours." className={cx("mt-3 h-[42px] text-[14px]", !on && "opacity-45")} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {badMessage && <p role="alert" className="mb-0 mt-2 text-[13px] text-amber">Write the away message customers should get.</p>}
              </>
            )}
          </Card>

          {/* Handoff */}
          <Card as="section" id="s-handoff" className={sectionCard}>
            <SectionHead icon="userCheck" color={CYAN} title="Handoff" sub="What happens after your team takes over a chat." />
            <div className="flex items-start gap-[14px]">
              <Toggle checked={s.resumeOn} onChange={(v) => set("resumeOn", v)} label="Let your agent take over again" />
              <div className="flex-1">
                <div className="text-[15px]">Let your agent take over again when your team goes quiet</div>
                <div className="mt-[3px] text-[13px] leading-[1.5] text-dim">If a customer writes in a chat your team took over and nobody replies for this long, your agent answers again. Off keeps the chat with your team until you hand it back.</div>
                <div className={cx("mt-[14px] flex items-center gap-[10px]", !s.resumeOn && "pointer-events-none opacity-40")} aria-disabled={!s.resumeOn}>
                  <span className="text-[14px] text-soft">After</span>
                  <div className="flex items-center rounded-xl border border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.04)]">
                    <button type="button" disabled={!s.resumeOn} onClick={() => set("mins", Math.max(5, s.mins - 5))} aria-label="Fewer minutes" className="h-10 w-[38px] cursor-pointer border-0 bg-transparent text-[18px] text-soft">−</button>
                    <span className="min-w-[36px] text-center font-mono text-[14px]">{s.mins}</span>
                    <button type="button" disabled={!s.resumeOn} onClick={() => set("mins", s.mins + 5)} aria-label="More minutes" className="h-10 w-[38px] cursor-pointer border-0 bg-transparent text-[18px] text-soft">+</button>
                  </div>
                  <span className="text-[14px] text-soft">minutes of silence</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Reply limit */}
          <Card as="section" id="s-limit" className={sectionCard}>
            <SectionHead icon="sparkle" color={MINT} title="Monthly reply limit" sub="A safety cap on what your agent sends each month." />
            <div className="grid items-start gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr) 280px" }}>
              <div>
                <div className="flex items-baseline gap-2"><span className="text-[28px] font-semibold">{used.toLocaleString("en-GB")}</span><span className="text-dim">of {effectiveCap.toLocaleString("en-GB")} replies used this month</span></div>
                <div className="relative mt-[14px] h-[10px] rounded-[5px] bg-[rgba(255,255,255,.07)]">
                  <div className="h-full min-w-[8px] rounded-[5px] bg-mint" style={{ width: `${pct}%` }} />
                  <span className="absolute -top-1 h-[18px] w-[2px] bg-amber" style={{ left: "80%" }} />
                </div>
                <div className="relative mt-2 h-4 font-mono text-[11px] text-dim"><span className="absolute left-0">0</span><span className="absolute text-amber" style={{ left: "80%", transform: "translateX(-50%)" }}>80% WARNING</span><span className="absolute right-0">CAP</span></div>
                <Hint className="mt-[14px]">Each reply is a message Meta bills to your own WhatsApp account. At 80% you&apos;ll see a warning, and at 100% your agent pauses until next month. New messages are still saved.</Hint>
              </div>
              <div>
                <FieldLabel htmlFor="limit">Monthly cap</FieldLabel>
                <div className="relative">
                  <Input id="limit" mono inputMode="numeric" value={s.limit} placeholder={planCap.toLocaleString("en-GB")} onChange={(e) => set("limit", e.target.value.replace(/[^\d]/g, ""))} className="pr-[70px]" />
                  <span className="pointer-events-none absolute right-[14px] top-[14px] text-[13px] text-dim">replies</span>
                </div>
                <Hint>Leave blank to use your plan&apos;s full allowance ({planCap.toLocaleString("en-GB")}).</Hint>
              </div>
            </div>
          </Card>

          {/* Data */}
          <Card as="section" id="s-data" className={sectionCard}>
            <SectionHead icon="shield" color={VIOLET} title="Data & privacy" sub="Retention and the paperwork for your customers." />
            <div className="grid grid-cols-2 gap-[18px]">
              <div>
                <FieldLabel htmlFor="retention">Delete inactive customer data after</FieldLabel>
                <div className="relative">
                  <Input id="retention" mono inputMode="numeric" value={s.retention} onChange={(e) => set("retention", e.target.value.replace(/[^\d]/g, ""))} className="pr-[76px]" />
                  <span className="pointer-events-none absolute right-[14px] top-[14px] text-[13px] text-dim">months</span>
                </div>
                <Hint>UK GDPR retention. A contact with no activity for this long is permanently deleted on the 1st of each month.</Hint>
              </div>
              <Link href="/whatsapp-umrah/dpa" target="_blank" rel="noopener noreferrer" className="flex gap-[14px] rounded-2xl border border-[rgba(255,255,255,.08)] bg-[rgba(255,255,255,.02)] p-[18px] text-frost no-underline">
                <Tile size={38} style={{ background: "rgba(92,200,255,.10)", border: "1px solid rgba(92,200,255,.35)" }}><WaIcon name="file" size={18} stroke="#9BDDFF" /></Tile>
                <div className="flex-1"><div className="text-[15px]">Data Processing Agreement</div><div className="mt-[3px] text-[13px] leading-[1.5] text-mist">Includes ready-to-use WhatsApp opt-in wording for your customers.</div></div>
                <WaIcon name="external" size={18} stroke="#A9AEBA" />
              </Link>
            </div>
          </Card>

          {/* Billing */}
          <Card as="section" id="s-billing" className={sectionCard}>
            <SectionHead icon="card" color="#7D8392" title="Billing" sub="Your plan with Zenith Studio." />
            <div className="flex items-center gap-[18px] rounded-2xl border border-[rgba(255,255,255,.08)] bg-[rgba(255,255,255,.02)] p-[18px]">
              {billing ? (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-[10px]"><span className="text-[17px] font-semibold">{billing.planLabel}</span><Pill color={billing.active ? MINT : AMBER}>{billing.active ? "Active" : "Inactive"}</Pill></div>
                    <div className="mt-1 text-[13.5px] text-mist">Billed monthly via Whop · {planCap.toLocaleString("en-GB")} AI replies a month{billing.foundingOffer ? " · Founding offer" : ""}</div>
                  </div>
                  {billing.canCancel && (
                    <ConfirmAction action={cancelAction} title="Cancel your plan?" description="Your plan stays active until the end of the period you've paid for, then the agent stops answering." confirmLabel="Cancel plan" trigger={<GhostButton className="!text-ember-text">Cancel plan</GhostButton>} />
                  )}
                </>
              ) : (
                <div className="text-[14px] text-mist">No active plan on this agency.</div>
              )}
            </div>
          </Card>
        </div>

        {dirty && (
          <div role="region" aria-label="Unsaved changes" className="sticky bottom-5 z-10 mt-[18px] flex items-center gap-[14px] rounded-full border border-[rgba(255,255,255,.14)] bg-[rgba(14,15,22,.92)] py-3 pl-[22px] pr-3 shadow-[0_24px_60px_rgba(0,0,0,.6)] backdrop-blur-[10px]">
            <span className="h-2 w-2 rounded-[4px] bg-amber shadow-[0_0_8px_#FFD27A]" />
            <span className="flex-1 text-[14.5px]">{error ? <span className="text-ember-text">{error}</span> : "You have unsaved changes"}</span>
            <GlassButton onClick={() => { setS(baseline); setError(null); }} disabled={pending}>Discard</GlassButton>
            <PrimaryButton onClick={save} disabled={pending || invalid}>{pending ? "Saving..." : "Save settings"}</PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
