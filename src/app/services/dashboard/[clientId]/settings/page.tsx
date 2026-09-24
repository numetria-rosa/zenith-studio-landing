import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getOwnedServiceProject, cancelOwnedMembership } from "@/lib/service-workspace";
import { getService } from "@/lib/services";
import { isSupportedPlan } from "@/lib/client-console-data";
import { Eyebrow } from "../ui";
import { CancelPlanButton } from "../CancelPlanButton";
import { Icon } from "../Icon";
import u from "../ui.module.css";
import s from "./settings.module.css";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ flash?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { clientId } = await params;
  const { flash } = await searchParams;
  const project = await getOwnedServiceProject(clientId, session.user.id);
  if (!project) notFound();
  if (!isSupportedPlan(project.sourceServiceId)) notFound();

  async function cancelPlan(): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/services/dashboard/${clientId}/settings`)}`);
    await cancelOwnedMembership(clientId, session2.user.id);
    revalidatePath(`/services/dashboard/${clientId}`);
    redirect(`/services/dashboard/${clientId}/settings?flash=${encodeURIComponent("Your plan will cancel at the end of the current billing period.")}`);
  }

  const service = project.sourceServiceId ? getService(project.sourceServiceId) : undefined;
  const toolsConnected =
    project.integrations.some((i) => i.status === "CONNECTED") ||
    project.oauthConnections.some((c) => c.status === "CONNECTED") ||
    project.mailConnections.some((c) => c.status === "CONNECTED");
  const setupReady = project.stage === "LIVE" || project.stage === "MAINTENANCE";

  const timeline = [
    { label: "Plan started", done: true },
    { label: "Tools connected", done: toolsConnected },
    { label: "Setup ready", done: setupReady },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.025em", margin: 0 }}>Settings</h1>
      {flash && (
        <p style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(61,220,151,.08)", border: "1px solid rgba(61,220,151,.3)", color: "var(--zc-done-text)", fontSize: 14 }}>
          {flash}
        </p>
      )}

      <div className={s.grid}>
        <section className={`${u.card} ${s.card}`}>
          <Eyebrow>Setup status</Eyebrow>
          <div className={s.timeline}>
            {timeline.map((step, i) => (
              <div key={step.label} className={s.timelineItem}>
                <div className={`${s.timelineDot} ${step.done ? s.timelineDotDone : ""}`}>
                  {step.done && <Icon name="check" size={12} strokeWidth={2.5} />}
                </div>
                {i < timeline.length - 1 && <div className={`${s.timelineLine} ${step.done && timeline[i + 1].done ? s.timelineLineDone : ""}`} />}
                <span className={s.timelineText}>{step.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={`${u.card} ${s.card}`}>
          <Eyebrow>Connected tools</Eyebrow>
          <div style={{ marginTop: 8 }}>
            {project.integrations.length === 0 && project.oauthConnections.length === 0 && project.mailConnections.length === 0 && (
              <p style={{ fontSize: 14, color: "var(--zc-muted)", padding: "12px 0" }}>Nothing connected yet - set one up from the Agents page.</p>
            )}
            {project.integrations.map((i) => (
              <div key={i.id} className={s.toolRow}>
                <span>{i.provider === "signalwire" ? "Phone number" : i.provider === "crm" ? "CRM webhook" : i.provider === "vapi" ? "AI Receptionist number" : i.provider}</span>
                <span style={{ color: i.status === "CONNECTED" ? "var(--zc-done-text)" : "var(--zc-muted)" }}>
                  {i.status === "CONNECTED" ? "Connected" : "Not connected"}
                </span>
              </div>
            ))}
            {project.oauthConnections.map((c) => (
              <div key={c.id} className={s.toolRow}>
                <span>{c.provider === "GOOGLE" ? "Google Calendar & Gmail" : "Microsoft 365"}</span>
                <span style={{ color: c.status === "CONNECTED" ? "var(--zc-done-text)" : "var(--zc-muted)" }}>
                  {c.status === "CONNECTED" ? "Connected" : "Needs reconnect"}
                </span>
              </div>
            ))}
            {project.mailConnections.map((c) => (
              <div key={c.id} className={s.toolRow}>
                <span>{c.emailAddress}</span>
                <span style={{ color: c.status === "CONNECTED" ? "var(--zc-done-text)" : "var(--zc-muted)" }}>
                  {c.status === "CONNECTED" ? "Connected" : "Connection issue"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className={`${u.card} ${s.card}`}>
          <Eyebrow>Plan</Eyebrow>
          <div className={s.price}>{service?.monthlyPriceDisplay ?? "–"}</div>
          <p className={s.priceNote}>Billed monthly, or save paying quarterly.</p>
          {project.whopMonthlyMembershipId && (
            <div style={{ marginTop: 18 }}>
              <CancelPlanButton action={cancelPlan} />
            </div>
          )}
        </section>

        <section className={`${u.card} ${s.card}`}>
          <Eyebrow>Notifications</Eyebrow>
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--zc-muted)", lineHeight: 1.6 }}>
            Notification preferences aren&apos;t configurable yet - you&apos;ll always get an email the moment something needs you.
          </p>
        </section>
      </div>
    </div>
  );
}
