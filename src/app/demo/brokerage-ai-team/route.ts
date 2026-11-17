import { serveStaticHtml } from "@/lib/static-html";

/* Serves public/demos/brokerage-ai-team.html directly at the pretty
   /demo/brokerage-ai-team URL used on the homepage and in outreach emails.
   Same reasoning as /demo/law-firm-ai-team/route.ts: this is a complete,
   self-contained HTML document the user hand-designed and approved (real
   Whop pricing, quarterly billing), served verbatim rather
   than ported into React. Read fresh each request, not bundled at build
   time. */
export async function GET(request: Request) {
  return serveStaticHtml(request, "demos/brokerage-ai-team.html");
}
