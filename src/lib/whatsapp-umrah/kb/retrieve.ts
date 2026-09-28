import { db } from "@/lib/db";
import { embed, toVectorLiteral } from "./voyage";
import { normalizeForRetrieval } from "./normalize";

export type RetrievedChunk = { id: string; documentId: string; content: string; distance: number };

const TOP_K = 6;

/** Embeds the customer's message as a "query" (not "document" - see
    voyage.ts) and returns the closest KB chunks for this agency by
    cosine distance (pgvector's <=> operator). The message is normalized
    toward English first - see normalize.ts - since retrieval quality for
    Roman Urdu/Gujarati isn't well-established for any embedding model,
    and this agency's KB is itself stored in whatever language it was
    written in (usually English), so aligning the query to that gives
    retrieval an easier job than hoping the embedding space aligns
    cross-lingually on its own. */
export async function retrieveKbChunks(agencyId: string, customerMessage: string): Promise<{ ok: true; chunks: RetrievedChunk[] } | { ok: false; error: string }> {
  const normalized = await normalizeForRetrieval(customerMessage);
  const queryText = normalized.ok ? normalized.text : customerMessage; // fail open to the raw message, never block retrieval on normalization

  const result = await embed([queryText], "query");
  if (!result.ok) return { ok: false, error: result.error };

  const vectorLiteral = toVectorLiteral(result.embeddings[0]);
  const rows = await db.$queryRaw<{ id: string; documentId: string; content: string; distance: number }[]>`
    SELECT "id", "documentId", "content", (embedding <=> ${vectorLiteral}::vector) AS distance
    FROM "WaKbChunk"
    WHERE "agencyId" = ${agencyId}
    ORDER BY distance ASC
    LIMIT ${TOP_K}
  `;
  return { ok: true, chunks: rows };
}
