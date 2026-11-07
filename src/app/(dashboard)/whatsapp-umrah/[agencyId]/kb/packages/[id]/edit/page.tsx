import { AGENT_NAME } from "@/lib/whatsapp-umrah/agent-name";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { draftFromFields } from "@/lib/whatsapp-umrah/kb/package-form";
import { packageFromJson } from "@/lib/whatsapp-umrah/kb/structured";
import { savePackageAction } from "../../../../actions";
import { PackageEditor } from "../../PackageEditor";

export default async function EditPackagePage({ params }: { params: Promise<{ agencyId: string; id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId, id } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();
  const doc = agency.kbDocuments.find((k) => k.id === id && k.kind === "PACKAGE");
  if (!doc) notFound();

  const fields = packageFromJson(doc.fields);
  const initial = draftFromFields({ ...fields, name: fields.name || doc.title });
  return <PackageEditor base={`/whatsapp-umrah/${agencyId}`} mode="edit" savedName={initial.name} initial={initial} agentName={AGENT_NAME} agencyName={agency.name} save={savePackageAction.bind(null, agencyId, doc.id)} />;
}
