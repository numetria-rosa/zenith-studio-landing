import { AGENT_NAME } from "@/lib/whatsapp-umrah/agent-name";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency, listLeads } from "@/lib/whatsapp-umrah/dashboard-data";
import { PageHeader } from "@/components/wa/ui";
import { shortTime } from "@/components/wa/format";
import { LeadsTable, type LeadRow } from "./LeadsTable";
import { getT } from "@/lib/whatsapp-umrah/ui-lang-server";

export default async function LeadsPage({ params }: { params: Promise<{ agencyId: string }> }) {
  const t = await getT();
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const leads = await listLeads(agencyId);
  const rows: LeadRow[] = leads.map((l) => ({
    id: l.id,
    conversationId: l.conversationId,
    name: l.contact.name,
    phone: l.contact.phone,
    status: l.status,
    lastActive: shortTime(l.updatedAt),
    travelDates: l.travelDates,
    travelers: l.travelers,
    budgetGbp: l.budgetGbp,
    packagePreference: l.packagePreference,
  }));

  return (
    <div>
      <PageHeader title={t("Leads")} subtitle={t("Every enquiry {AGENT_NAME} has qualified, newest first. Change a status and it saves straight away.", { AGENT_NAME })} />
      <LeadsTable agencyId={agencyId} rows={rows} />
    </div>
  );
}
