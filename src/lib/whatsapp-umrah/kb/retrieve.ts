import { db } from "@/lib/db";
import { embed, toVectorLiteral } from "./voyage";
import { normalizeForRetrieval } from "./normalize";

export type RetrievedChunk = { id: string; documentId: string; content: string; distance: number };

const TOP_K = 6;

/** Embeds the customer's message as a "query" (not "document" - see
    voyage.ts) and returns the closest KB chunks for this agency by
    cosine distance (pgvector's <=> operator). The message is normalized
    toward English first - see normalize.ts - since cross-lingual
    retrieval quality isn't well-established for any embedding model,
    and this agency's KB is itself stored in whatever language it was
    written in (usually English), so aligning the query to that gives
    retrieval an easier job than hoping the embedding space aligns
    cross-lingually on its own. */
export async function retrieveKbChunks(agencyId: string, customerMessage: string, excludePackages = false): Promise<{ ok: true; chunks: RetrievedChunk[] } | { ok: false; error: string }> {
  const normalized = await normalizeForRetrieval(customerMessage);
  const queryText = normalized.ok ? normalized.text : customerMessage; // fail open to the raw message, never block retrieval on normalization

  const result = await embed([queryText], "query");
  if (!result.ok) return { ok: false, error: result.error };

  const vectorLiteral = toVectorLiteral(result.embeddings[0]);
  const rows = await db.$queryRaw<{ id: string; documentId: string; content: string; distance: number }[]>`
    SELECT "id", "documentId", "content", (embedding <=> ${vectorLiteral}::vector) AS distance
    FROM "WaKbChunk"
    WHERE "agencyId" = ${agencyId}
      AND (${!excludePackages}::boolean OR "documentId" NOT IN (SELECT "id" FROM "WaKbDocument" WHERE "agencyId" = ${agencyId} AND "kind"::text = 'PACKAGE'))
    ORDER BY distance ASC
    LIMIT ${TOP_K}
  `;
  return { ok: true, chunks: rows };
}

/** An agency has a handful of packages, so the model is given ALL of them on every message (a "what do you have
    for ... ?" question can't be answered from the top few similar chunks), plus the closest FAQ / policy / text
    chunks by similarity. Past MAX_ALL_PACKAGES it falls back to plain similarity search so the prompt stays small.
    Package text still works if the embedding service is down. */
const MAX_ALL_PACKAGES = 30;
export async function loadKbChunks(agencyId: string, customerMessage: string): Promise<{ ok: true; chunks: RetrievedChunk[] } | { ok: false; error: string }> {
  const packages = await db.waKbChunk.findMany({
    where: { agencyId, document: { kind: "PACKAGE" } },
    orderBy: { createdAt: "asc" },
    take: MAX_ALL_PACKAGES + 1,
    select: { id: true, documentId: true, content: true },
  });
  if (packages.length > MAX_ALL_PACKAGES) return retrieveKbChunks(agencyId, customerMessage);
  const rest = await retrieveKbChunks(agencyId, customerMessage, true);
  if (!rest.ok && packages.length === 0) return rest;
  return { ok: true, chunks: [...packages.map((p) => ({ ...p, distance: 0 })), ...(rest.ok ? rest.chunks : [])] };
}
