import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency, getAnalyticsSummary } from "@/lib/whatsapp-umrah/dashboard-data";
import { Card, Label, PageHeader, Tile } from "@/components/wa/ui";
import { AMBER, CYAN, EMBER, LEAD_STATUSES, MINT, STATUS, VIOLET, cx } from "@/components/wa/tokens";
import { WaIcon, type WaIconName } from "@/components/wa/Icon";
import { replyTime } from "@/components/wa/format";

const RANGES = [7, 30, 90] as const;
const LANGS: { code: string; name: string; color: string }[] = [
  { code: "en", name: "English", color: "#5CC8FF" },
  { code: "ar", name: "Arabic", color: "#3DDC97" },
  { code: "tr", name: "Turkish", color: "#C7B0FF" },
  { code: "ur", name: "Urdu", color: "#FFD27A" },
];

const delta = (n: number) => (n === 0 ? "SAME AS PREVIOUS" : `${n > 0 ? "+" : ""}${n} VS PREVIOUS`);

export default async function AnalyticsPage({ params, searchParams }: { params: Promise<{ agencyId: string }>; searchParams: Promise<{ range?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const { range } = await searchParams;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const days = RANGES.find((r) => String(r) === range) ?? 30;
  const sm = await getAnalyticsSummary(agencyId, days);
  const agentName = agency.agentSettings?.agentName ?? "Your agent";
  const base = `/whatsapp-umrah/${agencyId}`;
  const { used, cap } = sm.usage;
  const maxDay = Math.max(1, ...sm.perDay.map((d) => d.count));
  const maxHour = Math.max(1, ...sm.hourly);
  const totalLeads = Object.values(sm.leadsByStatus).reduce((a, b) => a + b, 0);
  const W = 760, H = 220, slot = W / sm.perDay.length, barW = Math.max(2, slot - 6);

  const kpis: { label: string; value: React.ReactNode; caption: string; color: string; icon: WaIconName; bar?: boolean }[] = [
    { label: "Conversations", value: sm.conversations, caption: delta(sm.conversationsDelta), color: CYAN, icon: "chat" },
    { label: "Hot leads", value: sm.hotLeads, caption: delta(sm.hotLeadsDelta), color: EMBER, icon: "flame" },
    { label: "Avg. first reply", value: replyTime(sm.avgFirstReplySeconds), caption: "AI, ANY HOUR", color: VIOLET, icon: "bolt" },
    { label: "Handed to your team", value: `${Math.round(sm.handoffRate * 100)}%`, caption: "OF CONVERSATIONS", color: AMBER, icon: "userCheck" },
    { label: "AI replies", value: <>{used.toLocaleString("en-GB")}<span className="text-[17px] font-normal text-dim"> / {cap.toLocaleString("en-GB")}</span></>, caption: "THIS MONTH", color: MINT, icon: "sparkle", bar: true },
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle={<>How {agentName} is doing with your customers. <span className="text-dim">Last {days} days.</span></>}
        actions={
          <div role="group" aria-label="Date range" className="flex gap-1 rounded-xl border border-[rgba(255,255,255,.08)] bg-[rgba(255,255,255,.03)] p-1">
            {RANGES.map((r) => (
              <Link key={r} href={`${base}/analytics?range=${r}`} aria-current={r === days ? "true" : undefined} className={cx("inline-flex h-[34px] items-center rounded-[9px] px-[14px] text-[13.5px] no-underline focus-visible:outline-2 focus-visible:outline-cyan", r === days ? "bg-[rgba(255,255,255,.09)] text-frost" : "text-mist")}>
                {r} days
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-[14px]" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
        {kpis.map((k) => (
          <Card key={k.label} className="rounded-[20px] p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13.5px] text-mist">{k.label}</span>
              <Tile size={30} radius={10} color={k.color}><WaIcon name={k.icon} size={15} stroke={k.color} /></Tile>
            </div>
            <div className="mt-[10px] text-[34px] font-semibold tracking-[-0.03em]">{k.value}</div>
            <div className="mt-[6px] font-mono text-[11.5px] text-dim">{k.caption}</div>
            {k.bar && <div className="mt-3 h-[6px] overflow-hidden rounded-[3px] bg-[rgba(255,255,255,.08)]"><div className="h-full min-w-[6px] rounded-[3px] bg-mint" style={{ width: `${cap ? Math.min(100, (used / cap) * 100) : 0}%` }} /></div>}
          </Card>
        ))}
      </div>

      <div className="mt-[18px] grid gap-[18px]" style={{ gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1fr)" }}>
        <Card className="p-[22px]">
          <Label>Conversations per day</Label>
          <div className="mt-[6px] text-[13.5px] text-mist">New chats started by customers</div>
          {sm.conversations === 0 ? (
            <div className="mt-[18px] flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-[rgba(255,255,255,.12)] text-[14px] text-dim">No conversations in this period yet.</div>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bar chart of conversations per day" preserveAspectRatio="none" className="mt-[18px] h-[220px] w-full">
              <defs>
                <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#5CC8FF" stopOpacity=".85" />
                  <stop offset="1" stopColor="#5CC8FF" stopOpacity=".25" />
                </linearGradient>
              </defs>
              {[20, 87, 153, 220].map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />)}
              {sm.perDay.map((d, i) => {
                const h = (d.count / maxDay) * (H - 20);
                return <rect key={d.date} x={i * slot + 3} y={H - h} width={barW} height={h} rx="4" fill={i === sm.perDay.length - 1 ? "#9BDDFF" : "url(#gb)"}><title>{`${d.date}: ${d.count}`}</title></rect>;
              })}
            </svg>
          )}
          <div className="mt-2 flex justify-between font-mono text-[11px] text-dim">
            <span>{new Date(sm.perDay[0].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            <span>{new Date(sm.perDay[Math.floor(sm.perDay.length / 2)].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
        </Card>

        <Card className="p-[22px]">
          <Label className="mb-[10px] block">Leads by status</Label>
          {LEAD_STATUSES.map((s) => {
            const n = sm.leadsByStatus[s] ?? 0;
            const c = STATUS[s].color;
            return (
              <div key={s} className="grid items-center gap-3 py-[9px]" style={{ gridTemplateColumns: "96px minmax(0, 1fr) 28px" }}>
                <span className="flex items-center gap-2 text-[14px] text-soft"><span className="h-2 w-2 rounded-[4px]" style={{ background: c }} />{STATUS[s].label}</span>
                <div className="h-[10px] overflow-hidden rounded-[5px] bg-[rgba(255,255,255,.05)]"><div className="h-full rounded-[5px]" style={{ width: `${totalLeads ? (n / totalLeads) * 100 : 0}%`, background: c, boxShadow: `0 0 12px ${c}66` }} /></div>
                <span className="text-right font-mono text-[13px]">{n}</span>
              </div>
            );
          })}
          <Link href={`${base}/leads`} className="mt-[10px] inline-block text-[13.5px] text-cyan-text no-underline">Open Leads →</Link>
        </Card>
      </div>

      <div className="mt-[18px] grid gap-[18px]" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <Card className="p-[22px]">
          <Label>Languages customers use</Label>
          <div className="mb-[10px] mt-4 flex h-3 gap-[3px] overflow-hidden rounded-md bg-[rgba(255,255,255,.05)]">
            {LANGS.filter((l) => sm.languages[l.code] > 0).map((l) => <div key={l.code} style={{ width: `${sm.languages[l.code]}%`, background: l.color }} />)}
          </div>
          {LANGS.map((l) => (
            <div key={l.code} className="flex items-center gap-[10px] py-2 text-[14px]">
              <span className="h-2 w-2 rounded-[4px]" style={{ background: l.color }} />
              <span className="flex-1 text-soft">{l.name}</span>
              <span className="font-mono text-[12.5px]">{sm.languages[l.code]}%</span>
            </div>
          ))}
        </Card>

        <Card className="p-[22px]">
          <Label>When customers message</Label>
          <div className="mt-[18px] grid gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
            {sm.hourly.map((n, h) => <span key={h} title={`${h}:00 · ${n}`} className="h-[34px] rounded-md" style={{ background: `rgba(92,200,255,${n === 0 ? 0.06 : 0.16 + (n / maxHour) * 0.7})` }} />)}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-dim"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
          {sm.outsideHoursPct !== null && (
            <div className="mt-4 flex gap-[10px] rounded-[14px] border border-[rgba(61,220,151,.22)] bg-[rgba(61,220,151,.06)] px-[14px] py-3 text-[13.5px] leading-[1.5] text-soft">
              <WaIcon name="moon" size={17} stroke="#7FF0BD" />
              <span>{sm.outsideHoursPct}% of messages came outside office hours.{agency.agentSettings?.awayMode === "AI_REPLIES" ? ` ${agentName} answered them.` : ""}</span>
            </div>
          )}
        </Card>

        <Card className="px-[22px] pb-3 pt-[22px]">
          <Label className="mb-[10px] block">Most asked</Label>
          <div className="flex flex-col items-center gap-2 border-t border-[rgba(255,255,255,.06)] px-2 py-8 text-center">
            <WaIcon name="chat" size={22} stroke="#7D8392" />
            <div className="text-[14px] text-soft">Coming soon</div>
            <div className="text-[13px] leading-[1.5] text-dim">The questions customers ask most will show here.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
