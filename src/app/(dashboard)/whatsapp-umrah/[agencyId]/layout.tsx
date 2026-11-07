import { AGENT_NAME } from "@/lib/whatsapp-umrah/agent-name";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOwnedAgency, getUsageSummary } from "@/lib/whatsapp-umrah/dashboard-data";
import { countWaitingConversations } from "@/lib/whatsapp-umrah/handoff-alerts";
import { Glass, Label, Tile } from "@/components/wa/ui";
import { WaIcon } from "@/components/wa/Icon";
import { SidebarNav } from "./SidebarNav";
import { TermsGate } from "./TermsGate";
import { needsTerms } from "@/lib/whatsapp-umrah/terms";
import waStyles from "./waConsole.module.css";

/* The shell: sidebar (brand, live status, nav, replies meter, account) and the main column. The shell is flex,
   and main has min-width 0 so wide content can never push the page sideways. */

export default async function WhatsAppUmrahLayout({ children, params }: { children: React.ReactNode; params: Promise<{ agencyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const [waiting, usage, membership] = await Promise.all([
    countWaitingConversations(agencyId),
    getUsageSummary(agencyId),
    db.waMembership.findFirst({ where: { agencyId, userId: session.user.id }, select: { role: true } }),
  ]);

  const agentName = AGENT_NAME;
  const connected = agency.whatsapp?.status === "CONNECTED";
  const live = agency.status === "LIVE" && connected;
  const status = live
    ? { color: "#3DDC97", text: `${agentName} is live` }
    : !connected
      ? { color: "#FF9BB0", text: "WhatsApp not connected" }
      : agency.status === "PAUSED"
        ? { color: "#FFD27A", text: `${agentName} is paused` }
        : { color: "#FFD27A", text: "Not live yet" };
  const pct = usage.cap > 0 ? Math.min(100, (usage.used / usage.cap) * 100) : 0;
  const displayName = session.user.name || session.user.email || "Account";

  return (
    <div className={`${waStyles.waConsole} flex min-h-screen bg-void font-sans text-frost`}>
      <aside className="sticky top-0 box-border flex h-screen w-[264px] shrink-0 flex-col overflow-y-auto border-r border-[rgba(255,255,255,.07)] bg-wa-sidebar px-4 pb-5 pt-[26px]">
        <div className="flex items-center gap-3 px-2">
          <Tile size={40} style={{ background: "linear-gradient(135deg, rgba(61,220,151,.28), rgba(92,200,255,.20))", border: "1px solid rgba(127,240,189,.4)" }}>
            <WaIcon name="whatsapp" size={20} stroke="#7FF0BD" />
          </Tile>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold">{agency.name}</div>
            <div className="mt-[3px] font-mono text-[10.5px] tracking-[.1em] text-dim">WHATSAPP AI AGENT</div>
          </div>
        </div>

        <Glass className="mx-1 mb-[18px] mt-5 flex items-center gap-[10px] rounded-[14px] px-3 py-[11px]">
          <span className="h-2 w-2 rounded-[4px]" style={{ background: status.color, boxShadow: `0 0 10px ${status.color}` }} />
          <div className="min-w-0 flex-1 truncate text-[13.5px]">{status.text}</div>
          {connected && agency.whatsapp?.displayPhoneNumber && <span className="font-mono text-[11px] text-dim">{agency.whatsapp.displayPhoneNumber}</span>}
        </Glass>

        <SidebarNav base={`/whatsapp-umrah/${agencyId}`} waiting={waiting} />

        <div className="mt-auto pt-6">
          <Glass className="rounded-2xl p-[14px]">
            <Label className="text-[10.5px]">AI replies · this month</Label>
            <div className="mt-2 text-[18px] font-semibold">
              {usage.used.toLocaleString("en-GB")} <span className="text-[14px] font-normal text-dim">/ {usage.cap.toLocaleString("en-GB")}</span>
            </div>
            <div className="mt-[10px] h-[5px] overflow-hidden rounded-[3px] bg-[rgba(255,255,255,.08)]">
              <div className="h-full min-w-[4px] bg-mint" style={{ width: `${pct}%`, background: pct >= 80 ? "#FFD27A" : "#3DDC97" }} />
            </div>
          </Glass>
          <div className="flex items-center gap-3 px-2 pt-4">
            <Tile size={34} radius={17} className="text-[13px] font-semibold text-void" style={{ background: "linear-gradient(135deg, #5CC8FF, #8B5CF6)" }}>
              {displayName.charAt(0).toUpperCase()}
            </Tile>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px]">{displayName}</div>
              <div className="text-[12.5px] text-dim">{membership?.role === "AGENT" ? "Team member" : "Owner"}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative box-border min-w-0 flex-1 px-12 pb-12 pt-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-[260px] -top-[320px] h-[900px] w-[900px] rounded-full" style={{ background: "radial-gradient(circle, #5CC8FF22, rgba(5,6,10,0) 62%)" }} />
        </div>
        <div className="relative">{needsTerms(agency) ? <TermsGate agencyId={agencyId} /> : children}</div>
      </main>
    </div>
  );
}
