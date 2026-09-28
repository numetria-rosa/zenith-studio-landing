import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { SimulatorChat } from "./SimulatorChat";
import waStyles from "../waConsole.module.css";

export default async function SimulatorPage({ params }: { params: Promise<{ agencyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  return (
    <div>
      <h1 className={waStyles.pageTitle}>Simulator</h1>
      <p className={waStyles.pageDesc}>Test your agent exactly as a customer would. This never touches WhatsApp and never counts against your reply limit.</p>
      <SimulatorChat agencyId={agencyId} />
    </div>
  );
}
