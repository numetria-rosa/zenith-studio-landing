import { serveStaticHtml } from "@/lib/static-html";

/* Serves public/services-catalog.html directly at /services, same pattern
   as the /demo/* pages: a complete, hand-designed catalog document (all 4
   services, comparison table, "help me choose" matcher, dashboard
   walkthrough videos, FAQ) served verbatim rather than ported into a React
   page. Linked from the homepage navbar. Read fresh each request so
   editing the html file doesn't require a redeploy. */
export async function GET(request: Request) {
  return serveStaticHtml(request, "services-catalog.html");
}
