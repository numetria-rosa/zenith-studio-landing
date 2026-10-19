import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { saveWhatsAppConnection } from "@/lib/whatsapp-umrah/connect";
import { HqTopbar } from "../HqTopbar";
import { Toast } from "../Toast";

/* Manual WABA connect, per CLAUDE.md's onboarding path: "First agencies
   connect manually via the admin dashboard (paste WABA ID, phone number
   ID, token)." Embedded Signup is behind a flag, off, until Zenith is an
   approved Tech Provider - this page is the only way an agency goes live
   until then. */
export default async function AdminWhatsAppUmrahPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const agencies = await db.waAgency.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      whatsapp: true,
      subscription: { select: { plan: true, status: true } },
      kbDocuments: { select: { _count: { select: { chunks: true } } } },
      agentSettings: { select: { id: true } },
      manualConnectRequests: { where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  async function connectAction(formData: FormData): Promise<void> {
    "use server";
    const session = await requireAdmin();
    if (!session) notFound();
    const agencyId = String(formData.get("agencyId") || "");
    const wabaId = String(formData.get("wabaId") || "").trim();
    const phoneNumberId = String(formData.get("phoneNumberId") || "").trim();
    const displayPhoneNumber = String(formData.get("displayPhoneNumber") || "").trim() || null;
    const accessToken = String(formData.get("accessToken") || "").trim();
    if (!agencyId || !wabaId || !phoneNumberId || !accessToken) {
      redirect(`/admin/whatsapp-umrah?flash=${encodeURIComponent("All fields except display number are required.")}`);
    }

    await saveWhatsAppConnection({ agencyId, wabaId, phoneNumberId, displayPhoneNumber, accessToken, method: "MANUAL", actorUserId: session.user.id });
    revalidatePath("/admin/whatsapp-umrah");
    redirect(`/admin/whatsapp-umrah?flash=${encodeURIComponent("WhatsApp number connected.")}`);
  }

  return (
    <>
      <HqTopbar title="WhatsApp Umrah" subtitle="Connect each agency's WhatsApp Business number manually." />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {agencies.length === 0 && <p className="muted">No agencies yet.</p>}
        {agencies.map((agency) => {
          const kbHasContent = agency.kbDocuments.some((d) => d._count.chunks > 0);
          const pendingRequest = agency.manualConnectRequests[0] ?? null;
          return (
            <section className="card sc" key={agency.id}>
              <span className="eyebrow">
                {agency.name} · {agency.status} · {agency.subscription?.plan ?? "no plan"}
              </span>
              <div className="tr">
                <b>Checklist</b>
                <span style={{ fontSize: 13, color: "var(--mist)" }}>
                  KB content: {kbHasContent ? "yes" : "no"} · Settings: {agency.agentSettings ? "yes" : "no"} · WhatsApp:{" "}
                  {agency.whatsapp?.status === "CONNECTED" ? `connected (${agency.whatsapp.displayPhoneNumber ?? agency.whatsapp.phoneNumberId})` : "not connected"}
                </span>
              </div>
              {pendingRequest && (
                <div className="tr" style={{ background: "rgba(245, 184, 61, .08)", borderRadius: 8, padding: "8px 10px" }}>
                  <b>Connect request</b>
                  <span style={{ fontSize: 13, color: "var(--mist)" }}>
                    {pendingRequest.businessName} · {pendingRequest.contactEmail} · {pendingRequest.contactPhone}
                    {pendingRequest.notes ? ` · "${pendingRequest.notes}"` : ""} · requested {pendingRequest.createdAt.toISOString().slice(0, 10)}
                  </span>
                </div>
              )}
              <form action={connectAction} className="fld">
                <input type="hidden" name="agencyId" value={agency.id} />
                <label htmlFor={`waba-${agency.id}`}>WABA ID</label>
                <div className="in">
                  <input id={`waba-${agency.id}`} name="wabaId" defaultValue={agency.whatsapp?.wabaId ?? pendingRequest?.wabaId ?? ""} required />
                </div>
                <label htmlFor={`pnid-${agency.id}`}>Phone number ID</label>
                <div className="in">
                  <input id={`pnid-${agency.id}`} name="phoneNumberId" defaultValue={agency.whatsapp?.phoneNumberId ?? pendingRequest?.phoneNumberId ?? ""} required />
                </div>
                <label htmlFor={`disp-${agency.id}`}>Display phone number (optional)</label>
                <div className="in">
                  <input id={`disp-${agency.id}`} name="displayPhoneNumber" defaultValue={agency.whatsapp?.displayPhoneNumber ?? ""} placeholder="+44..." />
                </div>
                <label htmlFor={`tok-${agency.id}`}>System user access token</label>
                <div className="in">
                  <input id={`tok-${agency.id}`} name="accessToken" type="password" placeholder={agency.whatsapp ? "Re-enter to rotate the token" : ""} required />
                </div>
                <button className="btn" type="submit" style={{ alignSelf: "flex-start", marginTop: 10 }}>
                  {agency.whatsapp?.status === "CONNECTED" ? "Reconnect" : "Connect"}
                </button>
              </form>
            </section>
          );
        })}
      </div>
      <Toast />
    </>
  );
}
