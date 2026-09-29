import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { exportContactData } from "@/lib/whatsapp-umrah/gdpr";

/* UK GDPR data export (CLAUDE.md §7). IDOR-safe: getOwnedAgency re-checks
   {agencyId, userId} in one query, same as every other dashboard read. */
export async function GET(_request: Request, { params }: { params: Promise<{ agencyId: string; contactId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId, contactId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const contact = await exportContactData(agencyId, contactId);
  if (!contact) notFound();

  return new Response(JSON.stringify(contact, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="contact-${contactId}.json"`,
    },
  });
}
