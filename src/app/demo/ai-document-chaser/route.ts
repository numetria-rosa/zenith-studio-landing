import { readFile } from "fs/promises";
import path from "path";

/* Serves public/demos/ai-document-chaser.html at /demo/ai-document-chaser, same pattern as ai-inbox-manager. */
export async function GET() {
  const html = await readFile(path.join(process.cwd(), "public", "demos", "ai-document-chaser.html"), "utf-8");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
