import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DOC_CHASER_SERVICE_ID, docBlobToken } from "@/lib/document-chaser-db";

/* Streams one uploaded document from private Blob storage to the accountant who owns it. Nobody else,
   including the client after upload, can fetch it. */
export async function GET(_req: Request, { params }: { params: Promise<{ itemId: string }> }): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return new Response("Not found", { status: 404 });
  const { itemId } = await params;
  const item = await db.docChaseItem.findFirst({
    where: { id: itemId, client: { project: { userId: session.user.id, sourceServiceId: DOC_CHASER_SERVICE_ID } } },
    select: { filePathname: true, fileName: true },
  });
  if (!item?.filePathname) return new Response("Not found", { status: 404 });
  const blob = await get(item.filePathname, { access: "private", token: docBlobToken() });
  if (!blob || blob.statusCode !== 200) return new Response("Not found", { status: 404 });
  const name = (item.fileName ?? "document").replace(/[^\w.\- ]/g, "_");
  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
