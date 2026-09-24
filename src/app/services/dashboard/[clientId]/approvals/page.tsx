import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOwnedServiceProject, approveOwnedTimeEntry, rejectOwnedTimeEntry, approveOwnedInboxDraft, rejectOwnedInboxDraft } from "@/lib/service-workspace";
import { planApprovalItems, isSupportedPlan } from "@/lib/client-console-data";
import { Icon } from "../Icon";
import { Eyebrow } from "../ui";
import u from "../ui.module.css";
import s from "./approvals.module.css";

export default async function ApprovalsPage({ params }: { params: Promise<{ clientId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { clientId } = await params;
  const project = await getOwnedServiceProject(clientId, session.user.id);
  if (!project) notFound();
  if (!isSupportedPlan(project.sourceServiceId)) notFound();

  const items = planApprovalItems(project, (agentId) => `/services/dashboard/${clientId}/agents/${agentId}`);

  async function decide(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/services/dashboard/${clientId}/approvals`)}`);
    const kind = String(formData.get("kind") || "");
    const id = String(formData.get("id") || "");
    const action = String(formData.get("decision") || "");
    if (kind === "timeEntry") {
      await (action === "approve" ? approveOwnedTimeEntry : rejectOwnedTimeEntry)(clientId, session2.user.id, id);
    } else if (kind === "inboxDraft") {
      await (action === "approve" ? approveOwnedInboxDraft : rejectOwnedInboxDraft)(clientId, session2.user.id, id);
    }
    revalidatePath(`/services/dashboard/${clientId}`);
    redirect(`/services/dashboard/${clientId}/approvals`);
  }

  return (
    <div>
      <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.025em", margin: 0 }}>Approvals</h1>
      <p style={{ marginTop: 8, fontSize: 15, color: "var(--zc-muted)" }}>Everything waiting on you.</p>

      <div style={{ marginTop: 28, maxWidth: 760 }}>
        {items.length === 0 && (
          <div className={s.empty}>
            <Eyebrow>All clear</Eyebrow>
            <p style={{ marginTop: 8 }}>You are all caught up.</p>
          </div>
        )}
        {items.map((item) => (
          <div key={`${item.kind}-${item.id}`} className={s.row}>
            <div className={s.iconTile}>
              <Icon name="userCheck" size={22} strokeWidth={1.6} />
            </div>
            <div className={s.text}>
              <div className={s.title}>{item.title}</div>
              <div className={s.meta}>
                {item.agentName} · {item.meta}
              </div>
            </div>
            <div className={s.actions}>
              <Link href={item.href} className={u.btnGhost}>
                Details
              </Link>
              {(item.kind === "timeEntry" || item.kind === "inboxDraft") && (
                <form action={decide} style={{ display: "inline" }}>
                  <input type="hidden" name="kind" value={item.kind} />
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <button type="submit" className={u.btnPrimary}>
                    Approve
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
