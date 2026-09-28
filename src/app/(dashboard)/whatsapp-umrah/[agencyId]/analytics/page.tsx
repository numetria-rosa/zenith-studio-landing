import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency, getAnalyticsSummary } from "@/lib/whatsapp-umrah/dashboard-data";
import waStyles from "../waConsole.module.css";

export default async function AnalyticsPage({ params }: { params: Promise<{ agencyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const summary = await getAnalyticsSummary(agencyId);
  const avgReplyText = summary.avgFirstReplySeconds != null ? (summary.avgFirstReplySeconds < 60 ? `${Math.round(summary.avgFirstReplySeconds)}s` : `${Math.round(summary.avgFirstReplySeconds / 60)}m`) : "–";

  return (
    <div>
      <h1 className={waStyles.pageTitle}>Analytics</h1>
      <p className={waStyles.pageDesc}>Last 30 days.</p>

      <div className={waStyles.kpiRow}>
        <div className={waStyles.kpi}>
          <div className={waStyles.kpiLabel}>Conversations</div>
          <div className={waStyles.kpiValue}>{summary.conversations}</div>
        </div>
        <div className={waStyles.kpi}>
          <div className={waStyles.kpiLabel}>Hot leads</div>
          <div className={waStyles.kpiValue}>{summary.hotLeads}</div>
        </div>
        <div className={waStyles.kpi}>
          <div className={waStyles.kpiLabel}>Avg. first reply</div>
          <div className={waStyles.kpiValue}>{avgReplyText}</div>
        </div>
        <div className={waStyles.kpi}>
          <div className={waStyles.kpiLabel}>Handoff rate</div>
          <div className={waStyles.kpiValue}>{Math.round(summary.handoffRate * 100)}%</div>
        </div>
        <div className={waStyles.kpi}>
          <div className={waStyles.kpiLabel}>AI replies this month</div>
          <div className={waStyles.kpiValue}>
            {summary.usage.used} / {summary.usage.cap}
          </div>
        </div>
      </div>

      <div className={waStyles.card}>
        <div className={waStyles.label} style={{ marginBottom: 12 }}>
          Leads by status
        </div>
        {Object.keys(summary.leadsByStatus).length === 0 ? (
          <p style={{ color: "var(--zc-muted)", fontSize: 14 }}>No leads in this window.</p>
        ) : (
          Object.entries(summary.leadsByStatus).map(([status, count]) => (
            <div key={status} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--zc-line)", fontSize: 14 }}>
              <span>{status.replace("_", " ")}</span>
              <span style={{ fontWeight: 600 }}>{count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
