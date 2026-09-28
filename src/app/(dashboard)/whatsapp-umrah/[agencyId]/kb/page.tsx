import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { addKbDocumentAction, deleteKbDocumentAction } from "../actions";
import waStyles from "../waConsole.module.css";

export default async function KbPage({ params }: { params: Promise<{ agencyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const addAction = addKbDocumentAction.bind(null, agencyId);

  return (
    <div>
      <h1 className={waStyles.pageTitle}>Knowledge base</h1>
      <p className={waStyles.pageDesc}>Paste your packages, prices, and FAQs. The agent only ever answers from what&apos;s here.</p>

      <div className={waStyles.card} style={{ marginBottom: 24 }}>
        <form action={addAction}>
          <div className={waStyles.formRow}>
            <label className={waStyles.label} htmlFor="title">
              Title
            </label>
            <input id="title" name="title" className={waStyles.input} placeholder="e.g. Packages, Cancellation policy, ATOL details" required />
          </div>
          <div className={waStyles.formRow}>
            <label className={waStyles.label} htmlFor="rawText">
              Content
            </label>
            <textarea id="rawText" name="rawText" className={waStyles.textarea} placeholder="Economy Umrah Package: 10 nights, £950 per person. Hotel is 800 metres from the Haram..." required />
          </div>
          <button type="submit" className={waStyles.badgeAi} style={{ padding: "9px 18px", fontSize: 14, border: "1px solid var(--zc-done)" }}>
            Add and process
          </button>
        </form>
      </div>

      {agency.kbDocuments.length === 0 ? (
        <p style={{ color: "var(--zc-muted)", fontSize: 14 }}>Nothing added yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {agency.kbDocuments.map((doc) => {
            const del = deleteKbDocumentAction.bind(null, agencyId, doc.id);
            return (
              <div key={doc.id} className={waStyles.card} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{doc.title}</div>
                  <div style={{ fontSize: 12, color: "var(--zc-muted)", marginTop: 2 }}>
                    {doc._count.chunks} chunk{doc._count.chunks === 1 ? "" : "s"} · added {doc.createdAt.toISOString().slice(0, 10)}
                  </div>
                </div>
                <form action={del}>
                  <button type="submit" style={{ fontSize: 13, color: "var(--zc-error-text)" }}>
                    Remove
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
