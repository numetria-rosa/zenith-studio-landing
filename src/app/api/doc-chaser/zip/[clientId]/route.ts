import { get } from "@vercel/blob";
import JSZip from "jszip";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { zipEntryName } from "@/lib/document-chaser";
import { DOC_CHASER_SERVICE_ID, docBlobToken } from "@/lib/document-chaser-db";

export const maxDuration = 60;

/* Every file one client uploaded, in one zip named for the client, for the accountant who owns them. Files
   are stored as-is (PDFs and photos are already compressed). ponytail: built in memory; a client is capped at
   MAX_ITEMS documents of up to 20 MB, so stream the zip if real clients ever get near that. */
export async function GET(_req: Request, { params }: { params: Promise<{ clientId: string }> }): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return new Response("Not found", { status: 404 });
  const { clientId } = await params;
  const client = await db.docChaseClient.findFirst({
    where: { id: clientId, project: { userId: session.user.id, sourceServiceId: DOC_CHASER_SERVICE_ID } },
    select: { name: true, items: { where: { filePathname: { not: null } }, orderBy: { order: "asc" }, select: { label: true, fileName: true, filePathname: true } } },
  });
  if (!client || client.items.length === 0) return new Response("No files to download", { status: 404 });

  const zip = new JSZip();
  const taken = new Set<string>();
  for (const item of client.items) {
    const blob = await get(item.filePathname!, { access: "private", token: docBlobToken() }).catch(() => null);
    if (!blob || blob.statusCode !== 200) continue;
    zip.file(zipEntryName(client.name, item.label, item.fileName ?? "", taken), new Uint8Array(await new Response(blob.stream).arrayBuffer()), { binary: true });
  }
  const body = await zip.generateAsync({ type: "uint8array", compression: "STORE" });
  const name = `${client.name.replace(/[^\w.\- ]+/g, " ").trim() || "client"} - documents.zip`;
  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
