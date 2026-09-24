import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedServiceProject } from "@/lib/service-workspace";
import { planActivityFeed, isSupportedPlan } from "@/lib/client-console-data";
import { ActivityRow, Eyebrow } from "../ui";
import u from "../ui.module.css";

export default async function ActivityPage({ params }: { params: Promise<{ clientId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { clientId } = await params;
  const project = await getOwnedServiceProject(clientId, session.user.id);
  if (!project) notFound();
  if (!isSupportedPlan(project.sourceServiceId)) notFound();

  const activity = planActivityFeed(project);

  return (
    <div>
      <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.025em", margin: 0 }}>Activity</h1>
      <p style={{ marginTop: 8, fontSize: 15, color: "var(--zc-muted)" }}>Everything your agents have done, newest first.</p>

      <section className={u.card} style={{ marginTop: 28, padding: "20px 22px", maxWidth: 760 }}>
        <Eyebrow>Full feed</Eyebrow>
        <div style={{ marginTop: 8 }}>
          {activity.length === 0 && <p style={{ color: "var(--zc-muted)", fontSize: 14, padding: "20px 0" }}>Nothing yet.</p>}
          {activity.map((a, i) => (
            <ActivityRow key={i} tone={a.tone} text={a.text} meta={a.meta} />
          ))}
        </div>
      </section>
    </div>
  );
}
