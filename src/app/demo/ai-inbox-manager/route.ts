import { readFile } from "fs/promises";
import path from "path";

/* Serves public/demos/ai-inbox-manager.html directly at the pretty
   /demo/ai-inbox-manager URL, same pattern as law-firm-ai-team,
   insurance-ai-team and brokerage-ai-team: a complete, hand-designed
   details+demo+pricing+FAQ HTML document served verbatim, not ported
   into a React component. Replaced the old split React
   page.tsx + InboxManagerDemo.tsx (simulated inbox sandbox) on
   2026-09-24 so this service gets the same single all-in-one page as
   the AI team bundles. Read fresh each request so editing the html
   file doesn't require a redeploy. */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "demos", "ai-inbox-manager.html");
  const html = await readFile(filePath, "utf-8");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
