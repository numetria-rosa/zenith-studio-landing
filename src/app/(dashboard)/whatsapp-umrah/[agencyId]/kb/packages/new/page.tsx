import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { emptyDraft } from "@/lib/whatsapp-umrah/kb/package-form";
import { savePackageAction } from "../../../actions";
import { PackageEditor } from "../PackageEditor";

export default async function NewPackagePage({ params }: { params: Promise<{ agencyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  return <PackageEditor base={`/whatsapp-umrah/${agencyId}`} mode="new" savedName="" initial={emptyDraft()} agentName={agency.agentSettings?.agentName ?? "Your agent"} agencyName={agency.name} save={savePackageAction.bind(null, agencyId, null)} />;
}
