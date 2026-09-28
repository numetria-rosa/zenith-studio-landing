/* Voyage AI embeddings - Anthropic's own recommended embeddings partner
   (Claude has no embeddings API of its own; neither does Groq). Confirmed
   via a real call, not the docs alone: voyage-4-lite and
   voyage-multilingual-2 both return 1024-dim vectors, matching
   WaKbChunk.embedding's column type. If a different Voyage model is ever
   used, re-check its dimension before writing to that column - a mismatch
   fails loudly at the database, not silently.
   API reference: https://docs.voyageai.com/reference/embeddings-api */

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

export type VoyageModel = "voyage-4-lite" | "voyage-multilingual-2";

export const EMBEDDING_DIMENSIONS = 1024;

export type EmbedResult = { ok: true; embeddings: number[][] } | { ok: false; error: string };

/** Embeds up to 128 strings in one call (Voyage's own batch limit).
    `inputType` matters for Voyage's models: "document" when embedding KB
    content to store, "query" when embedding a customer's message to
    search with - using the wrong one measurably hurts retrieval quality
    per Voyage's own docs, so callers must pick correctly, not default. */
export async function embed(
  texts: string[],
  inputType: "document" | "query",
  model: VoyageModel = "voyage-4-lite"
): Promise<EmbedResult> {
  if (texts.length === 0) return { ok: true, embeddings: [] };
  const key = process.env.VOYAGE_API_KEY;
  if (!key) return { ok: false, error: "VOYAGE_API_KEY is not set" };
  try {
    const res = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      // output_dimension pinned explicitly (Voyage supports 2048/1024/512/256
      // per model) so a future Voyage-side default change can't silently
      // produce a vector that no longer fits WaKbChunk's fixed-width column.
      body: JSON.stringify({ input: texts, model, input_type: inputType, output_dimension: EMBEDDING_DIMENSIONS }),
    });
    if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
    const body = (await res.json()) as { data?: { embedding: number[] }[] };
    const embeddings = body.data?.map((d) => d.embedding);
    if (!embeddings || embeddings.length !== texts.length) return { ok: false, error: "unexpected Voyage response shape" };
    return { ok: true, embeddings };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Voyage request failed" };
  }
}

/** Postgres pgvector literal format: '[0.1,0.2,...]'. Used to splice an
    embedding into raw SQL safely (values are numbers we generated, never
    user input, so string interpolation here is not an injection risk -
    still passed as a bound parameter, not concatenated into the query
    text, for defense in depth). */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
