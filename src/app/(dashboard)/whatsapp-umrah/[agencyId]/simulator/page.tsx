import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { Card, Chip, Label } from "@/components/wa/ui";
import { WaIcon, type WaIconName } from "@/components/wa/Icon";
import { SimulatorChat } from "./SimulatorChat";

const Row = ({ label, children, icon }: { label: string; children: React.ReactNode; icon?: WaIconName }) => (
  <div className="flex justify-between gap-3 border-t border-[rgba(255,255,255,.06)] py-[11px] text-[14px]">
    <span className="flex items-center gap-[6px] text-mist">{icon && <WaIcon name={icon} size={14} stroke="#A9AEBA" />}{label}</span>
    <span className="text-right">{children}</span>
  </div>
);

export default async function SimulatorPage({ params }: { params: Promise<{ agencyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const s = agency.agentSettings;
  const agentName = s?.agentName ?? "Assistant";
  const base = `/whatsapp-umrah/${agencyId}`;
  const packages = agency.kbDocuments.filter((d) => d.kind === "PACKAGE").length;
  const faqs = agency.kbDocuments.filter((d) => d.kind === "FAQ").length;
  const info = agency.kbDocuments.length - packages - faqs;
  const emoji = s?.emojiEnabled ?? true;

  const rail = (
    <>
      <Card className="px-[22px] pb-[10px] pt-5">
        <Label className="mb-2 block">How {agentName} is set up</Label>
        <Row label="Tone">{s?.tone === "FORMAL" ? "Formal" : "Warm"}</Row>
        <Row label="Sign-off">{s?.signOff || <span className="text-dim">None</span>}</Row>
        <Row label="Emoji">{emoji ? "On" : <span className="text-dim">Off</span>}</Row>
        <Row label="Languages">
          <span className="inline-flex gap-[5px]">{(s?.languagesEnabled ?? ["en", "ar", "tr", "ur"]).map((l) => <Chip key={l} className="px-[10px] font-mono text-[11px] uppercase tracking-[.06em] text-soft">{l}</Chip>)}</span>
        </Row>
        <Row label="Hours">{s?.businessHours ? "Set hours" : "Open 24/7"}</Row>
        <Link href={`${base}/settings`} className="mb-[10px] mt-2 inline-block text-[13.5px] text-cyan-text no-underline">Change in Settings →</Link>
      </Card>
      <Card className="px-[22px] pb-[10px] pt-5">
        <Label className="mb-2 block">What {agentName} can answer from</Label>
        <Row label="Packages" icon="plane">{packages}</Row>
        <Row label="FAQs" icon="chat">{faqs}</Row>
        <Row label="General info" icon="file">{info}</Row>
        <Link href={`${base}/kb`} className="mb-[10px] mt-2 inline-block text-[13.5px] text-cyan-text no-underline">Open knowledge base →</Link>
      </Card>
      <div className="flex gap-3 rounded-[18px] border border-[rgba(199,176,255,.25)] bg-[rgba(139,92,246,.08)] px-[18px] py-4 text-[13.5px] leading-[1.5] text-soft">
        <WaIcon name="info" size={18} stroke="#C7B0FF" />
        <span>If {agentName} gets something wrong, fix the package or FAQ it came from, then ask again here.</span>
      </div>
    </>
  );

  return <SimulatorChat agencyId={agencyId} agencyName={agency.name} agentName={agentName} rail={rail} />;
}
