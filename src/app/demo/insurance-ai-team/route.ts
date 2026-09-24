import { readFile } from "fs/promises";
import path from "path";

/* Serves public/demos/insurance-ai-team.html directly at the pretty
   /demo/insurance-ai-team URL, same as /demo/law-firm-ai-team/route.ts and
   /demo/brokerage-ai-team/route.ts. That file is the real, hand-designed
   details+demo+pricing+FAQ page the user built and approved (real Whop
   pricing, quarterly billing) - a complete, self-contained HTML document,
   so serving it verbatim is correct. Read fresh each request, not bundled
   at build time. */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "demos", "insurance-ai-team.html");
  const html = await readFile(filePath, "utf-8");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
