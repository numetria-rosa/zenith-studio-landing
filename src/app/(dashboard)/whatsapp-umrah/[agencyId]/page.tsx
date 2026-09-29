import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOwnedAgency, getUsageSummary } from "@/lib/whatsapp-umrah/dashboard-data";
import { isEmbeddedSignupCapReached, EMBEDDED_SIGNUP_ENABLED } from "@/lib/whatsapp-umrah/embedded-signup";
import { requestManualConnectAction } from "./actions";
import { Icon } from "@/app/services/dashboard/[clientId]/Icon";
import waStyles from "./waConsole.module.css";

export default async function OverviewPage({ params }: { params: Promise<{ agencyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();
  const usage = await getUsageSummary(agencyId);
  const usagePct = Math.min(100, Math.round((usage.used / usage.cap) * 100));
  const nearCap = usagePct >= 80;

  const kbHasContent = agency.kbDocuments.some((d) => d._count.chunks > 0);
  const whatsappConnected = agency.whatsapp?.status === "CONNECTED";
  const settingsConfigured = !!agency.agentSettings;
  const pendingConnectRequest = agency.manualConnectRequests[0] ?? null;
  const showEmbeddedSignupWidget = !whatsappConnected && !pendingConnectRequest && EMBEDDED_SIGNUP_ENABLED && !(await isEmbeddedSignupCapReached());

  const checklist = [
    { done: kbHasContent, label: "Add your packages and FAQs", detail: "Paste or upload your knowledge base so the agent has real facts to answer from.", href: `/whatsapp-umrah/${agencyId}/kb` },
    { done: whatsappConnected, label: "Connect your WhatsApp number", detail: "Connect it below.", href: whatsappConnected ? null : "#connect-whatsapp" },
    { done: settingsConfigured, label: "Set your tone, languages and hours", detail: "Configure how the agent sounds and when it's live.", href: `/whatsapp-umrah/${agencyId}/settings` },
    { done: kbHasContent, label: "Test it in the simulator", detail: "Chat with your agent exactly as a customer would, before anything is live.", href: `/whatsapp-umrah/${agencyId}/simulator` },
  ];
  const allDone = checklist.every((c) => c.done);

  return (
    <div>
      <h1 className={waStyles.pageTitle}>Overview</h1>
      <p className={waStyles.pageDesc}>
        {agency.status === "LIVE" ? "Your AI agent is live." : allDone ? "Everything's set - your agent goes live once your WhatsApp number is connected." : "A few steps left before you're live."}
      </p>

      <div className={waStyles.card}>
        {checklist.map((item, i) => (
          <div key={i} className={waStyles.checklistItem}>
            <span className={`${waStyles.checkDot} ${item.done ? waStyles.checkDotDone : ""}`}>{item.done && <Icon name="check" size={12} strokeWidth={2.5} />}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: "var(--zc-muted)", marginTop: 2 }}>{item.detail}</div>
            </div>
            {item.href && !item.done && (
              <Link href={item.href} style={{ fontSize: 13, color: "var(--zc-run-text)", whiteSpace: "nowrap" }}>
                Go to step →
              </Link>
            )}
          </div>
        ))}
      </div>

      {!whatsappConnected && (
        <div className={waStyles.card} style={{ marginTop: 20 }} id="connect-whatsapp">
          <div className={waStyles.label} style={{ marginBottom: 8 }}>
            Connect your WhatsApp number
          </div>
          {pendingConnectRequest ? (
            <p style={{ fontSize: 14, color: "var(--zc-muted)" }}>
              Request sent {pendingConnectRequest.createdAt.toISOString().slice(0, 10)} - our team will connect your number within 24 hours.
            </p>
          ) : showEmbeddedSignupWidget ? (
            <p style={{ fontSize: 14, color: "var(--zc-muted)" }}>Connect with Meta - coming soon.</p>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "var(--zc-muted)", marginBottom: 12 }}>
                Tell us about your WhatsApp Business number and our team will connect it for you, usually within 24 hours. If you
                already have your WABA ID and phone number ID from Meta, add them too - it&apos;ll be faster.
              </p>
              <form action={requestManualConnectAction.bind(null, agencyId)}>
                <div className={waStyles.formRow}>
                  <label className={waStyles.label} htmlFor="businessName">
                    Business name
                  </label>
                  <input id="businessName" name="businessName" defaultValue={agency.name} className={waStyles.input} required />
                </div>
                <div className={waStyles.formRow}>
                  <label className={waStyles.label} htmlFor="contactEmail">
                    Contact email
                  </label>
                  <input id="contactEmail" name="contactEmail" type="email" defaultValue={session.user.email ?? ""} className={waStyles.input} required />
                </div>
                <div className={waStyles.formRow}>
                  <label className={waStyles.label} htmlFor="contactPhone">
                    Contact phone
                  </label>
                  <input id="contactPhone" name="contactPhone" className={waStyles.input} placeholder="+44..." required />
                </div>
                <div className={waStyles.formRow}>
                  <label className={waStyles.label} htmlFor="wabaId">
                    WABA ID (optional)
                  </label>
                  <input id="wabaId" name="wabaId" className={waStyles.input} />
                </div>
                <div className={waStyles.formRow}>
                  <label className={waStyles.label} htmlFor="phoneNumberId">
                    Phone number ID (optional)
                  </label>
                  <input id="phoneNumberId" name="phoneNumberId" className={waStyles.input} />
                </div>
                <div className={waStyles.formRow}>
                  <label className={waStyles.label} htmlFor="notes">
                    Anything else we should know (optional)
                  </label>
                  <input id="notes" name="notes" className={waStyles.input} />
                </div>
                <button type="submit" className={waStyles.badgeAi} style={{ marginTop: 8, padding: "9px 18px", fontSize: 14, border: "1px solid var(--zc-done)" }}>
                  Send request
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <div className={waStyles.card} style={{ marginTop: 20 }}>
        <div className={waStyles.label} style={{ marginBottom: 8 }}>
          AI replies this month
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 600 }}>
            {usage.used} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--zc-muted)" }}>/ {usage.cap}</span>
          </span>
          {usage.overagePacks > 0 && (
            <span style={{ fontSize: 12, color: "var(--zc-muted)" }}>
              +{usage.overagePacks} pack{usage.overagePacks === 1 ? "" : "s"} bought this period
            </span>
          )}
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "var(--zc-line)", overflow: "hidden", marginBottom: 12 }}>
          <div
            style={{
              height: "100%",
              width: `${usagePct}%`,
              background: nearCap ? "var(--zc-error-text)" : "var(--zc-done)",
            }}
          />
        </div>
        <Link href={`/whatsapp-umrah/${agencyId}/settings`} style={{ fontSize: 13, color: "var(--zc-run-text)" }}>
          {usage.overagePacks > 0 || nearCap ? "Buy 1,000 more replies - £5 →" : "Turn on the extra replies add-on →"}
        </Link>
      </div>
    </div>
  );
}
