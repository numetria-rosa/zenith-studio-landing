import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { AGENT_NAME } from "@/lib/whatsapp-umrah/agent-name";
import { formatOccasionDates } from "@/lib/whatsapp-umrah/occasions";
import { addSuggestedOccasionsAction, deleteOccasionAction, saveOccasionAction } from "../actions";
import { PageHeader } from "@/components/wa/ui";
import { OccasionsView } from "./OccasionsView";
import { getT } from "@/lib/whatsapp-umrah/ui-lang-server";

const day = (d: Date) => d.toISOString().slice(0, 10);

export default async function OccasionsPage({ params }: { params: Promise<{ agencyId: string }> }) {
  const t = await getT();
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const rows = await db.waOccasion.findMany({ where: { agencyId }, orderBy: { startDate: "asc" } });
  const items = rows.map((o) => ({
    id: o.id,
    name: o.name,
    start: day(o.startDate),
    end: o.endDate ? day(o.endDate) : "",
    label: formatOccasionDates(o.startDate, o.endDate),
    remove: deleteOccasionAction.bind(null, agencyId, o.id),
  }));

  return (
    <div>
      <PageHeader title={t("Occasions")} subtitle={t("Your own calendar of Ramadan, Eid, Hajj, school holidays and anything else you sell around. {AGENT_NAME} uses it to match what customers ask for to your packages.", { AGENT_NAME })} />
      <OccasionsView items={items} agentName={AGENT_NAME} save={saveOccasionAction.bind(null, agencyId)} addSuggested={addSuggestedOccasionsAction.bind(null, agencyId)} />
    </div>
  );
}
