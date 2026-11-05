"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { WaIcon } from "@/components/wa/Icon";
import { Card, Input, Label, PopoverMenu, Tile } from "@/components/wa/ui";
import { LEAD_STATUSES, STATUS, cx, type LeadStatus } from "@/components/wa/tokens";
import { initialOf } from "@/components/wa/format";
import { setLeadStatusAction } from "../actions";

export type LeadRow = { id: string; conversationId: string; name: string | null; phone: string; status: LeadStatus; lastActive: string; travelDates: string | null; travelers: number | null; budgetGbp: number | null; packagePreference: string | null };

const COLS = "minmax(0, 1.6fr) 170px minmax(0, 0.9fr) minmax(0, 1.1fr) minmax(0, 0.8fr) minmax(0, 1.4fr) 110px";

export function LeadsTable({ agencyId, rows }: { agencyId: string; rows: LeadRow[] }) {
  const [statuses, setStatuses] = useState<Record<string, LeadStatus>>(() => Object.fromEntries(rows.map((r) => [r.id, r.status])));
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const current = (r: LeadRow) => statuses[r.id] ?? r.status;
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[current(r)] = (c[current(r)] ?? 0) + 1;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, statuses]);
  const visible = rows.filter((r) => (filter === "all" || current(r) === filter) && `${r.name ?? ""} ${r.phone} ${r.packagePreference ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));

  function choose(row: LeadRow, next: LeadStatus) {
    const previous = current(row);
    setMenu(null);
    if (next === previous) return;
    setStatuses((s) => ({ ...s, [row.id]: next })); // optimistic: show it now, save in the background
    startTransition(async () => {
      try {
        await setLeadStatusAction(agencyId, row.id, next);
      } catch {
        setStatuses((s) => ({ ...s, [row.id]: previous }));
        setToast("Couldn't save that status. Please try again.");
        setTimeout(() => setToast(null), 4000);
      }
    });
  }

  const filters = [{ id: "all" as const, label: "All", color: "#C9CCD4", n: rows.length }, ...LEAD_STATUSES.map((s) => ({ id: s, label: STATUS[s].label, color: STATUS[s].color, n: counts[s] ?? 0 }))];

  return (
    <>
      <div className="mb-[18px] flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={cx("inline-flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border px-[14px] text-[13.5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan", filter === f.id ? "border-[rgba(255,255,255,.22)] bg-[rgba(255,255,255,.09)] text-frost" : "border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.035)] text-soft")}
          >
            <span className="h-[7px] w-[7px] rounded-[4px]" style={{ background: f.color }} />
            {f.label}
            <span className="font-mono text-[11.5px] text-dim">{f.n}</span>
          </button>
        ))}
        <div className="relative ml-auto w-[280px]">
          <span className="pointer-events-none absolute left-[14px] top-[13px]"><WaIcon name="search" size={17} stroke="#7D8392" /></span>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads" aria-label="Search leads" className="h-11 pl-[42px]" />
        </div>
      </div>

      <Card className="overflow-visible">
        <div className="grid gap-4 px-[22px] py-4" style={{ gridTemplateColumns: COLS }}>
          {["Customer", "Status", "Dates", "Travellers", "Budget", "Package", ""].map((h, i) => (
            <Label key={i} className="text-[10.5px]">{h}</Label>
          ))}
        </div>
        {visible.map((r) => {
          const status = current(r);
          const st = STATUS[status];
          return (
            <div key={r.id} className="grid items-center gap-4 border-t border-[rgba(255,255,255,.06)] px-[22px] py-[14px] text-[14.5px] hover:bg-[rgba(255,255,255,.03)]" style={{ gridTemplateColumns: COLS }}>
              <div className="flex min-w-0 items-center gap-3">
                <Tile size={36} radius={18} className="border border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.06)] text-[13px] font-semibold">{initialOf(r.name)}</Tile>
                <div className="min-w-0">
                  <div className="truncate">{r.name || r.phone}</div>
                  <div className="mt-[2px] font-mono text-[11.5px] text-dim">{r.phone} · {r.lastActive}</div>
                </div>
              </div>
              <div>
                <PopoverMenu
                  role="listbox"
                  label="Lead status"
                  width={220}
                  open={menu === r.id}
                  onOpenChange={(o) => setMenu(o ? r.id : null)}
                  trigger={
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={menu === r.id}
                      className="inline-flex h-[30px] cursor-pointer items-center gap-[6px] whitespace-nowrap rounded-full pl-3 pr-[10px] font-mono text-[11px] uppercase tracking-[.06em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
                      style={{ background: `${st.color}1A`, border: `1px solid ${st.color}55`, color: st.color }}
                    >
                      {st.label}
                      <WaIcon name="chevronDown" size={13} stroke="currentColor" strokeWidth={2.2} />
                    </button>
                  }
                >
                  <Label className="block px-[10px] pb-[6px] pt-2 text-[10px]">Move to</Label>
                  {LEAD_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="option"
                      aria-selected={s === status}
                      onClick={() => choose(r, s)}
                      className={cx("flex h-[38px] w-full cursor-pointer items-center gap-[10px] rounded-[10px] border-0 px-[10px] text-left text-[14px] text-frost", s === status ? "bg-[rgba(255,255,255,.06)]" : "bg-transparent hover:bg-[rgba(255,255,255,.04)]")}
                    >
                      <span className="h-2 w-2 rounded-[4px]" style={{ background: STATUS[s].color, boxShadow: `0 0 8px ${STATUS[s].color}88` }} />
                      <span className="flex-1">{STATUS[s].label}</span>
                      {s === status && <WaIcon name="check" size={15} stroke="#7FF0BD" strokeWidth={2.4} />}
                    </button>
                  ))}
                </PopoverMenu>
              </div>
              <span className="truncate text-soft">{r.travelDates || "–"}</span>
              <span className="truncate text-soft">{r.travelers ?? "–"}</span>
              <span className="truncate text-soft">{r.budgetGbp ? `£${r.budgetGbp.toLocaleString("en-GB")}` : "–"}</span>
              <span className="truncate text-soft">{r.packagePreference || "–"}</span>
              <Link href={`/whatsapp-umrah/${agencyId}/inbox?c=${r.conversationId}`} className="inline-flex items-center gap-[6px] justify-self-end text-[13.5px] text-cyan-text no-underline">
                Open chat
                <WaIcon name="arrow" size={14} stroke="#9BDDFF" />
              </Link>
            </div>
          );
        })}
        {visible.length === 0 && <div className="border-t border-[rgba(255,255,255,.06)] p-10 text-center text-dim">{rows.length === 0 ? "No leads yet. They appear here when a customer shares what they are looking for." : "No leads match."}</div>}
        <div className="flex justify-between border-t border-[rgba(255,255,255,.06)] px-[22px] py-[14px] text-[13px] text-dim">
          <span>Showing {visible.length} of {rows.length}</span>
        </div>
      </Card>

      {toast && (
        <div role="alert" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[rgba(255,92,122,.4)] bg-popover px-5 py-3 text-[14px] text-ember-text shadow-[0_24px_60px_rgba(0,0,0,.6)]">
          {toast}
        </div>
      )}
    </>
  );
}
