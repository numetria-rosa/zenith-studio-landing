export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** "On this page" entries for a lesson: its `##` headings and the titled blocks (definitions, warnings, interactives). */
export function extractToc(mdx: string): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const line of mdx.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) out.push({ id: slugify(h[1]!.replace(/\\(.)/g, "$1")), label: h[1]!.replace(/\\(.)/g, "$1") });
    const c = line.match(/^<(?:Def|ProdWarn|Connection|Interactive|Decision|DebugCase)\b[^>]*?\b(?:title|label)=\{("(?:[^"\\]|\\.)*")\}/);
    if (c) {
      const label = JSON.parse(c[1]!) as string;
      out.push({ id: slugify(label), label });
    }
  }
  return out;
}
