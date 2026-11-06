"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { WaIcon } from "@/components/wa/Icon";
import { ConfirmDialog } from "@/components/wa/ConfirmDialog";
import { Card, GlassButton, IconButton, Input, Label, MenuItem, PopoverMenu, Pill, PrimaryButton, Tile } from "@/components/wa/ui";
import { AMBER, MINT, STATUS, VIOLET, cx, isRtl, type LeadStatus } from "@/components/wa/tokens";
import { initialOf } from "@/components/wa/format";

export type ListItem = { id: string; name: string; phone: string; preview: string; time: string; status: string; waiting: boolean; leadStatus: LeadStatus | null };
export type TimelineItem = { kind: "msg"; id: string; who: "customer" | "ai" | "team"; body: string; time: string; flagged?: boolean } | { kind: "divider"; id: string; label: string; note?: string };
export type ThreadView = {
  id: string;
  contactId: string;
  name: string;
  phone: string;
  status: string;
  messageCount: number;
  items: TimelineItem[];
  lead: { status: LeadStatus; travelDates: string | null; travelers: number | null; budgetGbp: number | null; packagePreference: string | null } | null;
  languages: string;
  exportHref: string;
};

type Props = {
  agencyId: string;
  agencyName: string;
  agentName: string;
  list: ListItem[];
  activeId: string | null;
  thread: ThreadView | null;
  actions: { takeOver: () => Promise<void>; resume: () => Promise<void>; send: (formData: FormData) => Promise<void>; deleteContact: () => Promise<void>; flag: (messageId: string, flagged: boolean) => Promise<void> } | null;
};

export function InboxView({ agencyId, agencyName, agentName, list, activeId, thread, actions }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "needs" | "ai">("all");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // New messages show up without a manual reload.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [router]);
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [thread?.id, thread?.items.length]);

  const counts = { all: list.length, needs: list.filter((c) => c.waiting).length, ai: list.filter((c) => c.status === "AI").length };
  const shown = useMemo(
    () => list.filter((c) => (filter === "all" || (filter === "needs" ? c.waiting : c.status === "AI")) && `${c.name} ${c.phone} ${c.preview}`.toLowerCase().includes(query.trim().toLowerCase())),
    [list, filter, query],
  );

  const human = thread?.status === "HUMAN";
  const run = (fn: () => Promise<void>) => startTransition(async () => { setError(null); try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); } });

  return (
    <Card className="flex h-[690px] overflow-hidden">
      {/* conversation list */}
      <div className="flex w-[330px] shrink-0 flex-col border-r border-[rgba(255,255,255,.07)]">
        <div className="p-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-[14px] top-[14px]"><WaIcon name="search" size={17} stroke="#7D8392" /></span>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or message" aria-label="Search conversations" className="pl-[42px]" />
          </div>
          <div role="radiogroup" aria-label="Filter conversations" className="mt-3 flex gap-1 rounded-xl border border-[rgba(255,255,255,.07)] bg-[rgba(255,255,255,.03)] p-1">
            {([["all", "All", "#7D8392"], ["needs", "Needs you", AMBER], ["ai", agentName, "#7D8392"]] as const).map(([id, label, color]) => (
              <button key={id} type="button" role="radio" aria-checked={filter === id} onClick={() => setFilter(id)} className={cx("h-8 flex-1 cursor-pointer truncate rounded-[9px] border-0 text-[13px] focus-visible:outline-2 focus-visible:outline-cyan", filter === id ? "bg-[rgba(255,255,255,.08)] text-frost" : "bg-transparent text-mist")}>
                {label} <span className="font-mono" style={{ color: id === "needs" && counts.needs > 0 ? color : "#7D8392" }}>{counts[id]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-[10px]">
          {shown.length === 0 && <p className="px-4 py-6 text-center text-[13.5px] text-dim">{list.length === 0 ? "No conversations yet." : "No conversations match."}</p>}
          {shown.map((c) => {
            const on = c.id === activeId;
            return (
              <Link key={c.id} href={`/whatsapp-umrah/${agencyId}/inbox?c=${c.id}`} aria-current={on ? "true" : undefined} className={cx("mb-1 flex gap-3 rounded-2xl p-[14px] text-frost no-underline focus-visible:outline-2 focus-visible:outline-cyan", on ? "bg-[rgba(92,200,255,.07)] shadow-[inset_0_0_0_1px_rgba(92,200,255,.30)]" : "hover:bg-[rgba(255,255,255,.03)]")}>
                <Tile size={40} radius={20} className="border border-[rgba(255,255,255,.14)] bg-[rgba(255,255,255,.07)] font-semibold">{initialOf(c.name)}</Tile>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <span className="truncate text-[15px] font-semibold">{c.name}</span>
                    <span className="shrink-0 font-mono text-[11.5px] text-dim">{c.time}</span>
                  </div>
                  <div dir={isRtl(c.preview) ? "rtl" : "ltr"} className="mt-[3px] truncate text-left text-[13.5px] text-soft">{c.preview}</div>
                  <div className="mt-2 flex flex-wrap gap-[6px]">
                    {c.waiting ? <Pill color={AMBER}>Needs you</Pill> : c.status === "HUMAN" ? <Pill color={VIOLET}>Your team</Pill> : <Pill color={MINT}>{agentName}</Pill>}
                    {c.leadStatus && c.leadStatus !== "NEW" && <Pill color={STATUS[c.leadStatus].color}>{STATUS[c.leadStatus].label}</Pill>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="p-4 text-[12.5px] leading-[1.5] text-dim">The list refreshes by itself every few seconds.</div>
      </div>

      {/* chat */}
      {thread && actions ? (
        <>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-[14px] border-b border-[rgba(255,255,255,.07)] px-[22px] py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-[10px]">
                  <span className="truncate text-[17px] font-semibold">{thread.name}</span>
                  {human ? <Pill color={VIOLET}>Your team is handling this</Pill> : <Pill color={MINT}>{agentName} is handling this</Pill>}
                </div>
                <div className="mt-1 font-mono text-[12px] text-dim">{thread.phone} · {thread.messageCount} {thread.messageCount === 1 ? "message" : "messages"}</div>
              </div>
              {human ? (
                <GlassButton icon="sparkle" disabled={pending} onClick={() => run(actions.resume)} className="[&_svg]:stroke-[#7FF0BD]">Hand back to {agentName}</GlassButton>
              ) : (
                <GlassButton icon="userCheck" disabled={pending} onClick={() => run(actions.takeOver)}>Take over</GlassButton>
              )}
              <PopoverMenu align="end" label="More actions" open={menuOpen} onOpenChange={setMenuOpen} trigger={<IconButton icon="dots" label="More actions" />}>
                <MenuItem icon="download" onClick={() => { setMenuOpen(false); window.location.assign(thread.exportHref); }}>Export customer data</MenuItem>
                <MenuItem icon="trash" tone="danger" onClick={() => { setMenuOpen(false); setConfirmOpen(true); }}>Delete customer data</MenuItem>
              </PopoverMenu>
            </div>

            <div ref={bodyRef} className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto px-[22px] py-5">
              {thread.items.map((it) =>
                it.kind === "divider" ? (
                  <div key={it.id} className="my-1 flex items-center gap-3">
                    <span className="h-px flex-1 bg-[rgba(255,255,255,.07)]" />
                    <span className="text-center">
                      <span className="block font-mono text-[11px] tracking-[.06em] text-dim">{it.label}</span>
                      {it.note && <span className="mt-[2px] block text-[12.5px] text-mist">Why: {it.note}</span>}
                    </span>
                    <span className="h-px flex-1 bg-[rgba(255,255,255,.07)]" />
                  </div>
                ) : (
                  <div key={it.id} className={cx("flex", it.who !== "customer" && "justify-end")}>
                    <div
                      dir={isRtl(it.body) ? "rtl" : "ltr"}
                      className={cx(
                        "max-w-[70%] whitespace-pre-wrap border px-4 py-3 text-[15px] leading-[1.5]",
                        it.who === "customer" && "rounded-[18px_18px_18px_6px] border-[rgba(255,255,255,.07)] bg-bubble",
                        it.who === "ai" && "rounded-[18px_18px_6px_18px] border-[rgba(61,220,151,.30)] bg-[rgba(61,220,151,.10)]",
                        it.who === "team" && "rounded-[18px_18px_6px_18px] border-[rgba(199,176,255,.30)] bg-[rgba(139,92,246,.12)]",
                      )}
                    >
                      {it.body}
                      <div dir="ltr" className={cx("mt-[6px] flex items-center gap-1 font-mono text-[11px]", it.who === "customer" ? "text-dim" : it.who === "ai" ? "text-mint-text opacity-85" : "text-violet-text")}>
                        {it.who === "ai" && <WaIcon name="sparkle" size={11} stroke="#7FF0BD" />}
                        {it.who === "customer" ? thread.name : it.who === "ai" ? `${agentName} · AI` : "Your team"} · {it.time}
                        {it.who === "ai" && (
                          <button
                            type="button"
                            disabled={pending}
                            aria-pressed={!!it.flagged}
                            title={it.flagged ? "Flagged as wrong. Click to undo." : "Flag this reply as wrong"}
                            onClick={() => run(() => actions.flag(it.id, !it.flagged))}
                            className={cx("ml-auto inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-mono text-[11px]", it.flagged ? "text-ember-text" : "text-mint-text opacity-70 hover:opacity-100")}
                          >
                            <WaIcon name="flag" size={11} stroke={it.flagged ? "#FF9B7A" : "#7FF0BD"} />
                            {it.flagged ? "Flagged" : "Flag"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="border-t border-[rgba(255,255,255,.07)] px-[22px] pb-[18px] pt-[14px]">
              {human ? (
                <>
                  <form
                    ref={formRef}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = new FormData(e.currentTarget);
                      run(async () => {
                        await actions.send(data);
                        formRef.current?.reset();
                      });
                    }}
                    className="flex gap-[10px]"
                  >
                    <Input name="body" required autoComplete="off" placeholder={`Reply as ${agencyName}…`} aria-label="Your reply" className="h-[50px] rounded-full px-5" />
                    <PrimaryButton type="submit" disabled={pending} iconRight="send" className="h-[50px] px-[22px]">Send</PrimaryButton>
                  </form>
                  {error && <p role="alert" className="mb-0 mt-[10px] text-[13px] text-ember-text">{error}</p>}
                  <div className="mt-[10px] flex items-center gap-2 text-[12.5px] text-dim">
                    <WaIcon name="pause" size={13} stroke="#7D8392" strokeWidth={2.2} />
                    {agentName} is paused in this chat until you hand it back.
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 py-[13px] text-[13.5px] text-dim">
                  <WaIcon name="sparkle" size={14} stroke="#7FF0BD" />
                  {agentName} is answering this chat. Take over to reply yourself.
                </div>
              )}
              {!human && error && <p role="alert" className="m-0 text-[13px] text-ember-text">{error}</p>}
            </div>
          </div>

          {/* details */}
          <div className="box-border flex w-[290px] shrink-0 flex-col border-l border-[rgba(255,255,255,.07)] p-5">
            <div className="flex flex-col items-center pb-[18px] pt-[6px] text-center">
              <Tile size={56} radius={28} className="border border-[rgba(255,255,255,.14)] bg-[rgba(255,255,255,.07)] text-[20px] font-semibold">{initialOf(thread.name)}</Tile>
              <div className="mt-[10px] text-[16px] font-semibold">{thread.name}</div>
              {thread.lead && <div className="mt-2"><Pill color={STATUS[thread.lead.status].color}>{STATUS[thread.lead.status].label} lead</Pill></div>}
            </div>
            <Label className="mb-[6px] mt-1 text-[10.5px]">Trip details</Label>
            {([["Dates", thread.lead?.travelDates], ["Travellers", thread.lead?.travelers], ["Budget", thread.lead?.budgetGbp ? `£${thread.lead.budgetGbp.toLocaleString("en-GB")}` : null], ["Package", thread.lead?.packagePreference]] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-t border-[rgba(255,255,255,.06)] py-[10px] text-[14px]">
                <span className="text-mist">{k}</span>
                <span className={cx("text-right", v ? "text-frost" : "text-dim")}>{v ?? "Not shared yet"}</span>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-[rgba(255,255,255,.06)] py-[10px] text-[14px]">
              <span className="text-mist">Languages</span>
              <span className="text-right text-frost">{thread.languages}</span>
            </div>
            <div className="mt-[10px] text-[13px] leading-[1.5] text-dim">{agentName} fills these in as the customer shares them.</div>
            <div className="mt-auto flex flex-col gap-2">
              <GlassButton href={`/whatsapp-umrah/${agencyId}/leads`} icon="users" className="w-full">Open in Leads</GlassButton>
            </div>
          </div>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Delete all data for this customer?"
            description="Every message, lead and note held on this contact is permanently deleted. This can't be undone."
            confirmLabel="Delete data"
            pending={pending}
            onConfirm={() => run(async () => { await actions.deleteContact(); setConfirmOpen(false); })}
          />
        </>
      ) : (
        <div className="flex min-w-0 flex-1 items-center justify-center text-[14px] text-dim">{list.length === 0 ? "Conversations appear here as customers message your number." : "Select a conversation."}</div>
      )}
    </Card>
  );
}
