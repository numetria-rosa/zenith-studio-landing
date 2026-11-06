import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAnalyticsSummary, getOwnedAgency, listConversations } from "@/lib/whatsapp-umrah/dashboard-data";
import { isWaitingOnPerson } from "@/lib/whatsapp-umrah/handoff-alerts";
import { Card, GlassButton, Label, PageHeader, Pill, PrimaryButton, Tile } from "@/components/wa/ui";
import { AMBER, MINT, CYAN, VIOLET, EMBER, isRtl } from "@/components/wa/tokens";
import { WaIcon, type WaIconName } from "@/components/wa/Icon";
import { Modal } from "@/components/wa/ConfirmDialog";
import { initialOf, replyTime, shortTime } from "@/components/wa/format";
import { ConnectPanel } from "./ConnectPanel";

const LANG_ENABLED_DEFAULT = 4;

export default async function OverviewPage({ params }: { params: Promise<{ agencyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const [summary, conversations] = await Promise.all([getAnalyticsSummary(agencyId, 30), listConversations(agencyId)]);
  const base = `/whatsapp-umrah/${agencyId}`;
  const agentName = agency.agentSettings?.agentName ?? "Your agent";
  const { used, cap } = summary.usage;
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;

  const waitingChats = conversations.filter((c) => isWaitingOnPerson({ status: c.status, lastCustomerMessageAt: c.lastCustomerMessageAt, lastHumanReplyAt: c.messages[0]?.createdAt ?? null }));
  const waitingIds = new Set(waitingChats.map((c) => c.id));
  const firstWaiting = waitingChats[0];

  const packages = agency.kbDocuments.filter((d) => d.kind === "PACKAGE").length;
  const faqs = agency.kbDocuments.filter((d) => d.kind === "FAQ").length;
  const info = agency.kbDocuments.length - packages - faqs;
  const kbHasContent = agency.kbDocuments.some((d) => d._count.chunks > 0);
  const connected = agency.whatsapp?.status === "CONNECTED";
  const s = agency.agentSettings;
  const languages = s?.languagesEnabled.length ?? LANG_ENABLED_DEFAULT;
  const open247 = !s?.businessHours;
  const tested = conversations.length > 0;

  const setup = [
    { done: kbHasContent, title: "Packages and FAQs added", detail: `${packages} ${packages === 1 ? "package" : "packages"} · ${faqs} ${faqs === 1 ? "FAQ" : "FAQs"} · ${info} info`, action: kbHasContent ? null : { label: "Add", href: `${base}/kb` } },
    { done: connected, title: connected ? "WhatsApp connected" : "WhatsApp not connected", detail: connected ? (agency.whatsapp?.displayPhoneNumber ?? "") : "Not connected", amber: !connected, manage: connected },
    { done: !!s, title: "Tone, languages and hours set", detail: `${s?.tone === "FORMAL" ? "Formal" : "Warm"} · ${languages} ${languages === 1 ? "language" : "languages"} · ${open247 ? "open 24/7" : "set hours"}`, action: s ? null : { label: "Set up", href: `${base}/settings` } },
    { done: tested, title: "Tested in the simulator", detail: "Run a test any time", action: tested ? null : { label: "Test", href: `${base}/simulator` } },
  ];
  const doneCount = setup.filter((r) => r.done).length;

  const subtitle = agency.status === "LIVE" && connected ? `${agentName} is live and answering your customers on WhatsApp.` : connected ? "A few steps left before you're live." : "Connect your WhatsApp number to go live.";

  const stats: { label: string; value: React.ReactNode; caption: string; color: string; icon: WaIconName }[] = [
    { label: "Conversations", value: summary.conversations, caption: "LAST 30 DAYS", color: CYAN, icon: "chat" },
    { label: "Hot leads", value: summary.hotLeads, caption: "READY TO BOOK", color: EMBER, icon: "flame" },
    { label: "Avg. first reply", value: replyTime(summary.avgFirstReplySeconds), caption: "AI, 24/7", color: VIOLET, icon: "bolt" },
    { label: "AI replies", value: <>{used.toLocaleString("en-GB")}<span className="text-[18px] font-normal text-dim"> / {cap.toLocaleString("en-GB")}</span></>, caption: "THIS MONTH", color: MINT, icon: "sparkle" },
  ];

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle={subtitle}
        actions={
          <>
            <GlassButton href={`${base}/simulator`} icon="chat">Open simulator</GlassButton>
            <PrimaryButton href={`${base}/inbox`} icon="inbox">Open inbox</PrimaryButton>
          </>
        }
      />

      {!connected && (
        <Card className="mb-[18px] p-6">
          <div className="flex items-start gap-4">
            <Tile size={46} radius={14} color={MINT}>
              <WaIcon name="whatsapp" size={22} stroke={MINT} />
            </Tile>
            <div className="min-w-0 flex-1">
              <h2 className="m-0 text-[18px] font-semibold">Connect your WhatsApp number</h2>
              <p className="mb-4 mt-1 text-[14px] text-mist">{agentName} starts answering customers as soon as your number is connected.</p>
              <ConnectPanel agency={agency} email={session.user.email ?? ""} />
            </div>
          </div>
        </Card>
      )}

      {agency.whatsapp?.lastError && (
        <div role="alert" className="mb-[18px] flex items-start gap-4 rounded-[22px] border border-[rgba(255,92,122,.4)] bg-[rgba(255,92,122,.07)] px-[22px] py-5">
          <WaIcon name="info" size={22} stroke={EMBER} />
          <div>
            <div className="text-[16px] font-semibold">WhatsApp replies are not going out</div>
            <div className="mt-1 text-[14px] text-soft">{agency.whatsapp.lastError}</div>
          </div>
        </div>
      )}

      {firstWaiting && (
        <div role="status" className="flex items-center gap-[18px] rounded-[22px] border border-[rgba(255,210,122,.35)] px-[22px] py-5" style={{ background: "linear-gradient(90deg, rgba(255,210,122,.10), rgba(255,210,122,.02))" }}>
          <Tile size={46} radius={14} color={AMBER} style={{ background: "rgba(255,210,122,.14)", border: "1px solid rgba(255,210,122,.45)" }}>
            <WaIcon name="userCheck" size={22} stroke={AMBER} />
          </Tile>
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-semibold">
              {waitingChats.length} {waitingChats.length === 1 ? "customer is" : "customers are"} waiting for a person
            </div>
            <div className="mt-1 truncate text-[14px] text-soft">
              {firstWaiting.contact.name || firstWaiting.contact.phone}
              {firstWaiting.lastMessage?.body && (
                <>
                  {" · "}
                  <span dir={isRtl(firstWaiting.lastMessage.body) ? "rtl" : "ltr"}>{firstWaiting.lastMessage.body}</span>
                </>
              )}
              {firstWaiting.lastMessage && <span className="font-mono text-[12px] text-dim"> · {shortTime(firstWaiting.lastMessage.createdAt)}</span>}
            </div>
          </div>
          <PrimaryButton href={`${base}/inbox?c=${firstWaiting.id}`} iconRight="arrow">Reply now</PrimaryButton>
        </div>
      )}

      <div className="mt-[18px] grid grid-cols-4 gap-[14px]" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        {stats.map((st) => (
          <Card key={st.label} className="rounded-[20px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] text-mist">{st.label}</span>
              <Tile size={30} radius={10} color={st.color}>
                <WaIcon name={st.icon} size={15} stroke={st.color} />
              </Tile>
            </div>
            <div className="mt-[10px] text-[34px] font-semibold tracking-[-0.03em]">{st.value}</div>
            <div className="mt-[6px] font-mono text-[11.5px] text-dim">{st.caption}</div>
            {st.label === "AI replies" && (
              <div className="mt-3 h-[6px] overflow-hidden rounded-[3px] bg-[rgba(255,255,255,.08)]">
                <div className="h-full min-w-[6px] rounded-[3px] bg-mint" style={{ width: `${pct}%` }} />
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-[18px] grid items-start gap-[18px]" style={{ gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)" }}>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-[22px] pb-[14px] pt-5">
            <Label>Latest conversations</Label>
            <Link href={`${base}/inbox`} className="text-[13.5px] text-cyan-text no-underline hover:text-[#C9ECFF]">View inbox →</Link>
          </div>
          {conversations.length === 0 && <div className="border-t border-[rgba(255,255,255,.06)] px-[22px] py-8 text-center text-[14px] text-dim">No conversations yet. They appear here as customers message your number.</div>}
          {conversations.slice(0, 4).map((c) => {
            const waiting = waitingIds.has(c.id);
            const preview = c.lastMessage?.body ?? "";
            return (
              <Link key={c.id} href={`${base}/inbox?c=${c.id}`} className="flex items-center gap-[14px] border-t border-[rgba(255,255,255,.06)] px-[22px] py-[14px] text-frost no-underline hover:bg-[rgba(255,255,255,.03)]">
                <Tile size={38} radius={19} className="border border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.06)] text-[13px] font-semibold">{initialOf(c.contact.name)}</Tile>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-[10px]">
                    <span className="text-[15px]">{c.contact.name || c.contact.phone}</span>
                    {waiting ? <Pill color={AMBER}>Needs you</Pill> : c.status === "HUMAN" ? <Pill color={VIOLET}>Your team</Pill> : <Pill color={MINT}>{agentName} answered</Pill>}
                  </div>
                  <div dir={isRtl(preview) ? "rtl" : "ltr"} className="mt-[3px] truncate text-[13.5px] text-mist">{preview}</div>
                </div>
                {c.lastMessage && <span className="font-mono text-[12px] text-dim">{shortTime(c.lastMessage.createdAt)}</span>}
              </Link>
            );
          })}
        </Card>

        <div className="flex min-w-0 flex-col gap-[18px]">
          <Card className="px-[22px] pb-2 pt-5">
            <div className="mb-2 flex items-center justify-between">
              <Label>Setup</Label>
              <Pill color={doneCount === setup.length ? MINT : AMBER}>{doneCount} of {setup.length} done</Pill>
            </div>
            {setup.map((r) => (
              <div key={r.title} className="flex gap-3 border-t border-[rgba(255,255,255,.06)] py-3">
                <Tile size={24} radius={12} style={r.done ? { background: MINT } : { border: "1.5px solid rgba(255,255,255,.25)" }}>
                  {r.done && <WaIcon name="check" size={13} stroke="#05060A" strokeWidth={2.6} />}
                </Tile>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px]">{r.title}</div>
                  <div className="mt-[2px] text-[13px]" style={{ color: r.amber ? AMBER : "#7D8392" }}>{r.detail}</div>
                </div>
                {r.manage && (
                  <Modal title="Manage your WhatsApp number" description="Reconnect your number, or connect a different one." trigger={<button type="button" className="cursor-pointer self-center border-0 bg-transparent p-0 text-[13px] text-cyan-text">Manage</button>}>
                    <ConnectPanel agency={agency} email={session.user.email ?? ""} />
                  </Modal>
                )}
                {r.action && <Link href={r.action.href} className="self-center text-[13px] text-cyan-text no-underline">{r.action.label}</Link>}
              </div>
            ))}
          </Card>

          <Card className="overflow-hidden">
            <div className="px-[22px] pb-3 pt-5"><Label>Quick actions</Label></div>
            {[
              { href: `${base}/kb/packages/new`, title: "Add a package", sub: "New dates, prices or hotels", color: MINT, icon: "plus" as const },
              { href: `${base}/kb?tab=faqs`, title: "Add an FAQ", sub: `Teach ${agentName} a new answer`, color: CYAN, icon: "book" as const },
              { href: `${base}/simulator`, title: "Test in the simulator", sub: "Never touches WhatsApp", color: VIOLET, icon: "chat" as const },
            ].map((a) => (
              <Link key={a.title} href={a.href} className="flex items-center gap-[14px] border-t border-[rgba(255,255,255,.06)] px-[22px] py-[14px] text-frost no-underline hover:bg-[rgba(255,255,255,.03)]">
                <Tile size={34} radius={11} color={a.color}>
                  <WaIcon name={a.icon} size={16} stroke={a.color} />
                </Tile>
                <div className="flex-1">
                  <div className="text-[14.5px]">{a.title}</div>
                  <div className="mt-[2px] text-[12.5px] text-dim">{a.sub}</div>
                </div>
                <WaIcon name="arrow" size={16} stroke="#7D8392" />
              </Link>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
