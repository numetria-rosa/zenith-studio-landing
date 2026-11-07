import { AGENT_NAME } from "@/lib/whatsapp-umrah/agent-name";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { packageFromJson, type FaqFields, type PackageFields } from "@/lib/whatsapp-umrah/kb/structured";
import { addKbDocumentAction, deleteKbDocumentAction, saveFaqAction } from "../actions";
import { Card, Chip, FieldLabel, GlassButton, IconButton, Input, PageHeader, Pill, PrimaryButton, Textarea, Tile } from "@/components/wa/ui";
import { CYAN, MINT, VIOLET, cx } from "@/components/wa/tokens";
import { WaIcon, type WaIconName } from "@/components/wa/Icon";
import { ConfirmAction } from "@/components/wa/ConfirmDialog";
import { gbp } from "@/components/wa/format";
import { FaqList } from "./FaqList";

type Tab = "packages" | "faqs" | "info";

export default async function KbPage({ params, searchParams }: { params: Promise<{ agencyId: string }>; searchParams: Promise<{ tab?: string; edit?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const sp = await searchParams;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const tab: Tab = sp.tab === "faqs" || sp.tab === "info" ? sp.tab : "packages";
  const base = `/whatsapp-umrah/${agencyId}/kb`;
  const agentName = AGENT_NAME;
  const docs = agency.kbDocuments;
  const packages = docs.filter((d) => d.kind === "PACKAGE");
  const faqs = docs.filter((d) => d.kind === "FAQ");
  const info = docs.filter((d) => d.kind !== "PACKAGE" && d.kind !== "FAQ");

  const editing = tab === "faqs" && sp.edit ? docs.find((d) => d.id === sp.edit && d.kind === "FAQ") : undefined;
  const editingFaq = editing ? (editing.fields as FaqFields | null) : null;
  const newPackageHref = `${base}/packages/new`;

  const tabs: { id: Tab; label: string; sub: string; count: number; color: string; icon: WaIconName }[] = [
    { id: "packages", label: "Packages", sub: "Prices, hotels, nights and airports", count: packages.length, color: CYAN, icon: "plane" },
    { id: "faqs", label: "FAQs", sub: "Questions customers ask, in your words", count: faqs.length, color: VIOLET, icon: "chat" },
    { id: "info", label: "General info", sub: "Policies, ATOL, visas, opening hours", count: info.length, color: MINT, icon: "file" },
  ];
  const addAction = tab === "packages" ? { label: "Add a package", href: newPackageHref } : tab === "faqs" ? { label: "Add an FAQ", href: `${base}?tab=faqs#faq-question` } : { label: "Add general info", href: `${base}?tab=info#info-title` };

  return (
    <div>
      <PageHeader title="Knowledge base" subtitle={`Everything ${agentName} knows. ${agentName} only answers from what's here, so keep it up to date.`} actions={<PrimaryButton href={addAction.href} icon="plus">{addAction.label}</PrimaryButton>} />

      <div role="tablist" aria-label="Knowledge base sections" className="mb-[22px] grid gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {tabs.map((t) => {
          const on = t.id === tab;
          return (
            <Link
              key={t.id}
              href={`${base}?tab=${t.id}`}
              role="tab"
              aria-selected={on}
              className={cx("flex items-center gap-[14px] rounded-[18px] px-[18px] py-4 text-left text-frost no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan", on ? "bg-[rgba(92,200,255,.08)] shadow-[inset_0_0_0_1px_rgba(92,200,255,.45),0_0_30px_rgba(92,200,255,.10)]" : "bg-[rgba(255,255,255,.02)] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]")}
            >
              <Tile size={42} color={t.color} style={{ border: `1px solid ${t.color}45` }}>
                <WaIcon name={t.icon} size={19} stroke={t.color} />
              </Tile>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[16px] font-semibold">{t.label}</span>
                  <span className="font-mono text-[13px] text-dim">{t.count}</span>
                </div>
                <div className="mt-[3px] text-[13px] text-mist">{t.sub}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {tab === "packages" && (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {packages.map((doc) => {
              const f = doc.fields ? (packageFromJson(doc.fields) as PackageFields) : null;
              return (
                <Card as="article" key={doc.id} className="flex min-w-0 flex-col p-[22px]">
                  <div className="flex items-center gap-2">
                    {f && <Pill color={CYAN}>{f.type}</Pill>}
                    {f && <span className="font-mono text-[12px] text-dim">{f.nightsMakkah + f.nightsMadinah} nights</span>}
                    <span className="flex-1" />
                    <IconButton icon="edit" label={`Edit ${doc.title}`} href={`${base}/packages/${doc.id}/edit`} />
                    <ConfirmAction
                      action={deleteKbDocumentAction.bind(null, agencyId, doc.id)}
                      title="Remove this package?"
                      description={`${agentName} will stop quoting "${doc.title}" straight away.`}
                      confirmLabel="Remove"
                      trigger={<IconButton icon="trash" label={`Remove ${doc.title}`} stroke="#FF9BB0" />}
                    />
                  </div>
                  <h3 className="mb-0 mt-4 text-[19px] font-semibold tracking-[-0.015em]">{doc.title}</h3>
                  {f && (
                    <>
                      <div className="mt-[10px]">
                        <span className="text-[30px] font-semibold tracking-[-0.03em] text-mint-text">{gbp(f.pricePerPerson)}</span>
                        <span className="text-[14px] text-mist"> per person</span>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 border-t border-[rgba(255,255,255,.06)] pt-[14px] text-[14px] text-soft">
                        {f.makkahHotel.name && (
                          <span className="flex items-center gap-[10px]">
                            <WaIcon name="hotel" size={16} stroke="#7D8392" />
                            {f.makkahHotel.name}
                          </span>
                        )}
                        {f.departureAirports && (
                          <span className="flex items-center gap-[10px]">
                            <WaIcon name="plane" size={16} stroke="#7D8392" />
                            From {f.departureAirports}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </Card>
              );
            })}
            <Link href={newPackageHref} className="flex min-h-[230px] flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-[rgba(255,255,255,.18)] bg-[rgba(255,255,255,.015)] text-[15px] text-soft no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
              <Tile size={46} radius={23} style={{ background: "rgba(61,220,151,.10)", border: "1px solid rgba(61,220,151,.4)" }}>
                <WaIcon name="plus" size={20} stroke="#7FF0BD" strokeWidth={2} />
              </Tile>
              Add a package
              <span className="text-[13px] text-dim">Name, price, nights, hotel, airports</span>
            </Link>
          </div>
        </>
      )}

      {tab === "faqs" && (
        <div className="grid items-start gap-[18px]" style={{ gridTemplateColumns: "minmax(0, 1fr) 380px" }}>
          <FaqList
            agentName={agentName}
            items={faqs.map((doc) => {
              const f = doc.fields as FaqFields | null;
              return { id: doc.id, question: f?.question ?? doc.title, answer: f?.answer ?? "", editHref: `${base}?tab=faqs&edit=${doc.id}#faq-question`, remove: deleteKbDocumentAction.bind(null, agencyId, doc.id) };
            })}
          />
          <Card className="p-[22px]">
            <form key={editing?.id ?? "new"} action={saveFaqAction.bind(null, agencyId, editing?.id ?? null)}>
              <div className="text-[16px] font-semibold">{editing ? "Edit FAQ" : "Add an FAQ"}</div>
              <FieldLabel htmlFor="faq-question" className="mt-4">Question</FieldLabel>
              <Input id="faq-question" name="question" defaultValue={editingFaq?.question ?? (editing ? editing.title : "")} placeholder="e.g. Is the visa included?" required />
              <FieldLabel htmlFor="faq-answer" className="mt-4">Answer</FieldLabel>
              <Textarea id="faq-answer" name="answer" defaultValue={editingFaq?.answer ?? ""} placeholder="The answer exactly as you want customers to hear it." required />
              <PrimaryButton type="submit" className="mt-4 w-full">{editing ? "Save FAQ" : "Add FAQ"}</PrimaryButton>
              {editing && <GlassButton href={`${base}?tab=faqs`} className="mt-2 w-full">Cancel</GlassButton>}
            </form>
          </Card>
        </div>
      )}

      {tab === "info" && (
        <div className="grid items-start gap-[18px]" style={{ gridTemplateColumns: "minmax(0, 1fr) 380px" }}>
          <div className="flex min-w-0 flex-col gap-[14px]">
            {info.map((doc) => (
              <Card key={doc.id} className="flex gap-4 p-[22px]">
                <Tile size={42} style={{ background: "rgba(61,220,151,.10)", border: "1px solid rgba(61,220,151,.35)" }}>
                  <WaIcon name="file" size={19} stroke="#7FF0BD" />
                </Tile>
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-semibold">{doc.title}</div>
                  <div className="mt-[5px] font-mono text-[12px] text-dim">
                    {doc._count.chunks} {doc._count.chunks === 1 ? "chunk" : "chunks"} · added {doc.createdAt.toISOString().slice(0, 10)}
                  </div>
                </div>
                <ConfirmAction
                  action={deleteKbDocumentAction.bind(null, agencyId, doc.id)}
                  title="Remove this info?"
                  description={`${agentName} will stop using "${doc.title}" straight away.`}
                  confirmLabel="Remove"
                  trigger={<IconButton icon="trash" label={`Remove ${doc.title}`} stroke="#FF9BB0" />}
                />
              </Card>
            ))}
            <div className="rounded-[18px] border border-dashed border-[rgba(255,255,255,.14)] px-5 py-[18px]">
              <div className="text-[14px] text-soft">Anything that isn&apos;t a package or a question goes here. For example:</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Cancellation policy", "ATOL details", "Opening hours", "Visa guidance"].map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
            </div>
          </div>
          <Card className="p-[22px]">
            <form action={addKbDocumentAction.bind(null, agencyId)}>
              <div className="text-[16px] font-semibold">Add general info</div>
              <FieldLabel htmlFor="info-title" className="mt-4">Title</FieldLabel>
              <Input id="info-title" name="title" placeholder="e.g. Cancellation policy, ATOL details" required />
              <FieldLabel htmlFor="info-text" className="mt-4">Content</FieldLabel>
              <Textarea id="info-text" name="rawText" placeholder={`Paste or type the text exactly as you want ${agentName} to use it.`} required />
              <PrimaryButton type="submit" className="mt-4 w-full">Add and process</PrimaryButton>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
