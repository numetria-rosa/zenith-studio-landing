import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { packageFromJson, type FaqFields, type PackageFields } from "@/lib/whatsapp-umrah/kb/structured";
import { addKbDocumentAction, deleteKbDocumentAction, saveFaqAction, savePackageAction } from "../actions";
import waStyles from "../waConsole.module.css";
import { PackageForm } from "./PackageForm";

type Tab = "packages" | "faqs" | "info";
const TABS: { id: Tab; label: string }[] = [
  { id: "packages", label: "Packages" },
  { id: "faqs", label: "FAQs" },
  { id: "info", label: "General info" },
];

const gbp = (n: number) => `£${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
const muted: React.CSSProperties = { fontSize: 12, color: "var(--zc-muted)", marginTop: 2 };

export default async function KbPage({ params, searchParams }: { params: Promise<{ agencyId: string }>; searchParams: Promise<{ tab?: string; edit?: string; new?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const sp = await searchParams;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const tab: Tab = sp.tab === "faqs" || sp.tab === "info" ? sp.tab : "packages";
  const base = `/whatsapp-umrah/${agencyId}/kb`;
  const docs = agency.kbDocuments;
  const packages = docs.filter((d) => d.kind === "PACKAGE");
  const faqs = docs.filter((d) => d.kind === "FAQ");
  const info = docs.filter((d) => d.kind !== "PACKAGE" && d.kind !== "FAQ");
  const counts: Record<Tab, number> = { packages: packages.length, faqs: faqs.length, info: info.length };

  const editing = sp.edit ? docs.find((d) => d.id === sp.edit && d.kind === (tab === "faqs" ? "FAQ" : "PACKAGE")) : undefined;
  const showPackageForm = tab === "packages" && (sp.new === "1" || Boolean(editing));

  return (
    <div>
      <h1 className={waStyles.pageTitle}>Knowledge base</h1>
      <p className={waStyles.pageDesc}>Everything the agent knows. It only ever answers from what&apos;s here, so keep packages, FAQs and general info up to date.</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }} role="tablist" aria-label="Knowledge base sections">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`${base}?tab=${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            className={`${waStyles.navLink} ${tab === t.id ? waStyles.navLinkActive : ""}`}
            style={{ width: "auto", padding: "8px 16px" }}
          >
            {t.label} <span style={{ opacity: 0.6, marginLeft: 6 }}>{counts[t.id]}</span>
          </Link>
        ))}
      </div>

      {tab === "packages" && (
        <>
          {showPackageForm ? (
            <PackageForm
              action={savePackageAction.bind(null, agencyId, editing?.id ?? null)}
              values={editing ? packageFromJson(editing.fields) : packageFromJson(null)}
              cancelHref={`${base}?tab=packages`}
            />
          ) : (
            <div style={{ marginBottom: 18 }}>
              <Link href={`${base}?tab=packages&new=1`} className={waStyles.badgeAi} style={{ padding: "9px 18px", fontSize: 14, border: "1px solid var(--zc-done)", display: "inline-block" }}>
                + Add a package
              </Link>
            </div>
          )}
          {packages.length === 0 ? (
            <p style={{ color: "var(--zc-muted)", fontSize: 14 }}>No packages yet. Add your first one: each field you fill in becomes something the agent can answer from.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {packages.map((doc) => {
                const f = doc.fields ? (packageFromJson(doc.fields) as PackageFields) : null;
                const del = deleteKbDocumentAction.bind(null, agencyId, doc.id);
                return (
                  <div key={doc.id} className={waStyles.card} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: 16 }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {doc.title} {f && <span style={{ color: "var(--zc-done-text)", marginLeft: 8 }}>{gbp(f.pricePerPerson)} pp</span>}
                      </div>
                      {f && (
                        <div style={muted}>
                          {f.type} · {f.nightsMakkah + f.nightsMadinah} nights
                          {f.makkahHotel.name ? ` · ${f.makkahHotel.name}` : ""}
                          {f.departureAirports ? ` · from ${f.departureAirports}` : ""}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 13, whiteSpace: "nowrap" }}>
                      <Link href={`${base}?tab=packages&edit=${doc.id}`} style={{ color: "var(--zc-run-text)" }}>
                        Edit
                      </Link>
                      <form action={del}>
                        <button type="submit" style={{ fontSize: 13, color: "var(--zc-error-text)" }}>
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "faqs" && (
        <>
          <form action={saveFaqAction.bind(null, agencyId, editing?.id ?? null)} className={waStyles.card} style={{ marginBottom: 24 }}>
            <div className={waStyles.formRow}>
              <label className={waStyles.label} htmlFor="question">
                Question
              </label>
              <input id="question" name="question" className={waStyles.input} defaultValue={editing ? (editing.fields as FaqFields | null)?.question ?? editing.title : ""} placeholder="e.g. Is the visa included?" required />
            </div>
            <div className={waStyles.formRow}>
              <label className={waStyles.label} htmlFor="answer">
                Answer
              </label>
              <textarea id="answer" name="answer" className={waStyles.textarea} style={{ minHeight: 90 }} defaultValue={editing ? (editing.fields as FaqFields | null)?.answer ?? "" : ""} placeholder="The answer exactly as you want customers to hear it." required />
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button type="submit" className={waStyles.badgeAi} style={{ padding: "9px 18px", fontSize: 14, border: "1px solid var(--zc-done)" }}>
                {editing ? "Save FAQ" : "Add FAQ"}
              </button>
              {editing && (
                <Link href={`${base}?tab=faqs`} style={{ fontSize: 14, color: "var(--zc-muted)" }}>
                  Cancel
                </Link>
              )}
            </div>
          </form>
          {faqs.length === 0 ? (
            <p style={{ color: "var(--zc-muted)", fontSize: 14 }}>No FAQs yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {faqs.map((doc) => {
                const f = doc.fields as FaqFields | null;
                const del = deleteKbDocumentAction.bind(null, agencyId, doc.id);
                return (
                  <div key={doc.id} className={waStyles.card} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: 16 }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{f?.question ?? doc.title}</div>
                      {f?.answer && <div style={{ ...muted, fontSize: 13, marginTop: 4 }}>{f.answer}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 13, whiteSpace: "nowrap" }}>
                      <Link href={`${base}?tab=faqs&edit=${doc.id}`} style={{ color: "var(--zc-run-text)" }}>
                        Edit
                      </Link>
                      <form action={del}>
                        <button type="submit" style={{ fontSize: 13, color: "var(--zc-error-text)" }}>
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "info" && (
        <>
          <p style={{ color: "var(--zc-muted)", fontSize: 14, marginBottom: 14 }}>Policies and anything that is not a package or a question: cancellation policy, ATOL details, opening hours, visa guidance you offer.</p>
          <div className={waStyles.card} style={{ marginBottom: 24 }}>
            <form action={addKbDocumentAction.bind(null, agencyId)}>
              <div className={waStyles.formRow}>
                <label className={waStyles.label} htmlFor="title">
                  Title
                </label>
                <input id="title" name="title" className={waStyles.input} placeholder="e.g. Cancellation policy, ATOL details" required />
              </div>
              <div className={waStyles.formRow}>
                <label className={waStyles.label} htmlFor="rawText">
                  Content
                </label>
                <textarea id="rawText" name="rawText" className={waStyles.textarea} placeholder="Paste or type the text exactly as you want the agent to use it." required />
              </div>
              <button type="submit" className={waStyles.badgeAi} style={{ padding: "9px 18px", fontSize: 14, border: "1px solid var(--zc-done)" }}>
                Add and process
              </button>
            </form>
          </div>
          {info.length === 0 ? (
            <p style={{ color: "var(--zc-muted)", fontSize: 14 }}>Nothing added yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {info.map((doc) => {
                const del = deleteKbDocumentAction.bind(null, agencyId, doc.id);
                return (
                  <div key={doc.id} className={waStyles.card} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{doc.title}</div>
                      <div style={muted}>
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
        </>
      )}
    </div>
  );
}
