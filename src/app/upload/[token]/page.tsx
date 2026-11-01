import { notFound } from "next/navigation";
import { getUploadPortal } from "@/lib/document-chaser-db";
import { buildDocs } from "./model";
import { PortalView } from "./PortalView";

export const metadata = { title: "Upload your documents", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/* The private page a client opens from their accountant's email: what's still needed, one drop zone per
   file, no account. Files go to private storage that only the accountant can open. */
export default async function UploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const portal = await getUploadPortal(token);
  if (!portal) notFound();
  const { client, businessName } = portal;
  return <PortalView token={token} clientId={client.id} firm={businessName} first={client.name.trim().split(/\s+/)[0]} docs={buildDocs(client.items)} />;
}
