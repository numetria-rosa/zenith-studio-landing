import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { canUpload, docBlobToken } from "@/lib/document-chaser-db";
import { MAX_UPLOAD_BYTES, UPLOAD_CONTENT_TYPES } from "@/lib/document-chaser";

/* Issues a short-lived Vercel Blob upload token for one document on one client's upload page, so the
   browser uploads the file straight to private storage (files can be larger than a function request).
   The client's secret upload token and the item id come in clientPayload and are checked here. */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      token: docBlobToken(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const { token, itemId } = JSON.parse(clientPayload ?? "{}") as { token?: string; itemId?: string };
        const allowed = token && itemId ? await canUpload(token, itemId) : null;
        if (!allowed || !pathname.startsWith(`doc-chaser/${allowed.clientId}/${itemId}-`)) throw new Error("Upload not allowed");
        return {
          allowedContentTypes: UPLOAD_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: false,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return Response.json(result);
  } catch (err) {
    console.error("doc-chaser upload token refused:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Upload not allowed" }, { status: 400 });
  }
}
