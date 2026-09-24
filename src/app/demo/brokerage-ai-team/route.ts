import { readFile } from "fs/promises";
import path from "path";

/* Serves public/demos/brokerage-ai-team.html directly at the pretty
   /demo/brokerage-ai-team URL used on the homepage and in outreach emails.
   Same reasoning as /demo/law-firm-ai-team/route.ts: this is a complete,
   self-contained HTML document the user hand-designed and approved (real
   Whop pricing, quarterly billing, 4-day trial), served verbatim rather
   than ported into React. Read fresh each request, not bundled at build
   time. */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "demos", "brokerage-ai-team.html");
  const html = await readFile(filePath, "utf-8");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
