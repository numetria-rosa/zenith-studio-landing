"use client";

import { answerChecks, exampleAnswer, gbp, joinAirports, nightsLabel, parsePrice, totalNights, type PackageDraft } from "@/lib/whatsapp-umrah/kb/package-form";
import { WaIcon } from "@/components/wa/Icon";
import { Card, Hint, Label, Pill } from "@/components/wa/ui";
import { CYAN } from "@/components/wa/tokens";

/** Sticky right rail: live package card, an example reply (a front-end template, no AI call), and what Sara can answer. */
export function PackageRail({ d, agentName, agencyName }: { d: PackageDraft; agentName: string; agencyName: string }) {
  const price = parsePrice(d.price);
  const nights = totalNights(d);
  const checks = answerChecks(d);
  const done = checks.filter(([, ok]) => ok).length;
  const name = d.name.trim() || "Package name";
  return (
    <aside className="sticky top-6 self-start">
      <Label className="mb-[10px] block">Live preview</Label>
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Pill color={CYAN} style={{ border: "1px solid rgba(92,200,255,.35)", background: "rgba(92,200,255,.10)" }}>
            {d.type}
          </Pill>
          <span className="font-mono text-[12px] text-dim">{nights ? nightsLabel(nights) : "Nights"}</span>
        </div>
        <div className="mt-[14px] text-[18px] font-semibold tracking-[-0.015em]">{name}</div>
        <div className="mt-2">
          <span className="text-[28px] font-semibold tracking-[-0.03em] text-mint-text">{price !== null && price > 0 ? gbp(price) : "£-"}</span>
          <span className="text-[13.5px] text-mist"> per person</span>
        </div>
        <div className="mt-[14px] flex flex-col gap-[7px] border-t border-[rgba(255,255,255,.06)] pt-3 text-[13.5px] text-soft">
          <span className="flex items-center gap-[9px]">
            <WaIcon name="hotel" size={15} stroke="#7D8392" />
            {d.makkahName.trim() || "Makkah hotel"}
          </span>
          <span className="flex items-center gap-[9px]">
            <WaIcon name="plane" size={15} stroke="#7D8392" />
            {d.airports.length ? `From ${joinAirports(d.airports)}` : "Departure airports"}
          </span>
        </div>
      </Card>

      <Label className="mb-[10px] mt-[22px] block">How {agentName} will answer</Label>
      <div className="rounded-[18px] border border-[rgba(255,255,255,.07)] bg-[rgba(255,255,255,.02)] p-4">
        <div className="max-w-[calc(80%+28px)] rounded-[16px_16px_16px_6px] bg-bubble px-[14px] py-[10px] text-[13.5px]">Tell me about the {name}</div>
        <div className="ml-auto mt-[10px] max-w-[calc(92%+30px)] rounded-[16px_16px_6px_16px] border border-[rgba(61,220,151,.3)] bg-[rgba(61,220,151,.10)] px-[14px] py-3 text-[13.5px] leading-[1.55]">{exampleAnswer(d, agentName, agencyName)}</div>
        <Hint className="mt-[10px]">An example. {agentName} writes each reply herself, using only what you enter here.</Hint>
      </div>

      <Card className="mt-[18px] px-5 py-[18px]">
        <div className="flex items-center justify-between">
          <Label>{agentName} can answer</Label>
          <span className="font-mono text-[12px] text-mist">
            {done} of {checks.length}
          </span>
        </div>
        <div className="mb-[6px] mt-3 h-[6px] overflow-hidden rounded-[3px] bg-[rgba(255,255,255,.07)]">
          <div className="h-full rounded-[3px]" style={{ width: `${Math.round((done / checks.length) * 100)}%`, background: "linear-gradient(90deg, #5CC8FF, #3DDC97)" }} />
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {checks.map(([label, ok]) => (
            <div key={label} className="flex min-w-0 items-center gap-2 py-1 text-[13px]">
              {ok ? (
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-lg bg-mint">
                  <WaIcon name="check" size={10} stroke="#05060A" strokeWidth={3} />
                </span>
              ) : (
                <span className="box-border h-4 w-4 shrink-0 rounded-lg border-[1.5px] border-dashed border-[rgba(255,255,255,.25)]" />
              )}
              <span className={ok ? "overflow-hidden text-ellipsis whitespace-nowrap text-soft" : "overflow-hidden text-ellipsis whitespace-nowrap text-dim"}>{label}</span>
            </div>
          ))}
        </div>
      </Card>
    </aside>
  );
}
