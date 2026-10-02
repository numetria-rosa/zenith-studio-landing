import { db } from "@/lib/db";
import { chunkText } from "./chunk";
import { embed, toVectorLiteral } from "./voyage";

export type IngestResult = { ok: true; chunkCount: number } | { ok: false; error: string };

/** Chunks a document's rawText, embeds every chunk as "document" type
    (see voyage.ts on why that matters), and stores them. Deletes any
    existing chunks for this document first, so re-running ingestion
    (e.g. after the agency edits a package) is idempotent rather than
    accumulating stale duplicates. Written via $executeRaw because
    WaKbChunk.embedding is an Unsupported("vector") column - the normal
    Prisma client can't select or write it. */
export async function ingestDocument(documentId: string): Promise<IngestResult> {
  const doc = await db.waKbDocument.findUnique({ where: { id: documentId }, select: { id: true, agencyId: true, rawText: true, kind: true } });
  if (!doc) return { ok: false, error: "not_found" };

  // A package or FAQ is already one short, labelled block: keep it whole so a price never lands in a different chunk to its hotel.
  const chunks = doc.kind === "PACKAGE" || doc.kind === "FAQ" ? [doc.rawText.trim()].filter(Boolean) : chunkText(doc.rawText);
  if (chunks.length === 0) return { ok: false, error: "no content to embed after chunking" };

  const result = await embed(chunks, "document");
  if (!result.ok) return { ok: false, error: result.error };

  await db.$executeRaw`DELETE FROM "WaKbChunk" WHERE "documentId" = ${documentId}`;

  for (let i = 0; i < chunks.length; i++) {
    const id = `wakbc_${documentId}_${i}_${Date.now().toString(36)}`;
    const vectorLiteral = toVectorLiteral(result.embeddings[i]);
    const tokenCount = Math.ceil(chunks[i].length / 4); // rough estimate, not billed on - Voyage's own usage.total_tokens is the real figure, logged separately if needed
    await db.$executeRaw`
      INSERT INTO "WaKbChunk" ("id", "agencyId", "documentId", "content", "embedding", "tokenCount", "createdAt")
      VALUES (${id}, ${doc.agencyId}, ${documentId}, ${chunks[i]}, ${vectorLiteral}::vector, ${tokenCount}, now())
    `;
  }

  return { ok: true, chunkCount: chunks.length };
}
