/* Splits one agency's KB document text into retrieval-sized chunks.
   Deliberately simple: paragraph-first, falling back to a word-count
   split for anything too long - agency KBs are packages/FAQs/policies
   (short, structured), not long-form documents, so a heavier chunker
   (sentence-boundary detection, overlap windows) isn't earning its
   complexity here. ponytail: naive word-count split for oversized
   paragraphs, revisit if a real agency's pasted text breaks badly on it. */

const MAX_CHUNK_WORDS = 180; // keeps chunks well inside embedding limits and grounding-check-sized
const MIN_CHUNK_WORDS = 8; // drop near-empty fragments (stray blank lines, headers alone)

export function chunkText(rawText: string): string[] {
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    if (words.length <= MAX_CHUNK_WORDS) {
      chunks.push(paragraph);
      continue;
    }
    for (let i = 0; i < words.length; i += MAX_CHUNK_WORDS) {
      chunks.push(words.slice(i, i + MAX_CHUNK_WORDS).join(" "));
    }
  }

  return chunks.filter((c) => c.split(/\s+/).length >= MIN_CHUNK_WORDS);
}
