import { readFile } from "fs/promises";
import path from "path";

/* Serves public/demos/law-firm-ai-team.html directly at the pretty
   /demo/law-firm-ai-team URL used on the homepage and in outreach emails.
   That file is the real, hand-designed details+demo+pricing+FAQ page the
   user built and approved (real Whop pricing, quarterly billing, 4-day
   trial) - it is NOT ported into a React component, on purpose: it's a
   complete, self-contained HTML document (own <html>/<head>/nav/footer),
   so serving it verbatim is correct, not a shortcut. Read fresh each
   request (not imported at build time) so editing the html file doesn't
   require a redeploy. */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "demos", "law-firm-ai-team.html");
  const html = await readFile(filePath, "utf-8");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
