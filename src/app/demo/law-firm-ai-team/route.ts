import { serveStaticHtml } from "@/lib/static-html";

/* Serves public/demos/law-firm-ai-team.html directly at the pretty
   /demo/law-firm-ai-team URL used on the homepage and in outreach emails.
   That file is the real, hand-designed details+demo+pricing+FAQ page the
   user built and approved (real Whop pricing, quarterly billing,) - it is NOT ported into a React component, on purpose: it's a
   complete, self-contained HTML document (own <html>/<head>/nav/footer),
   so serving it verbatim is correct, not a shortcut. Read fresh each
   request (not imported at build time) so editing the html file doesn't
   require a redeploy. */
export async function GET(request: Request) {
  return serveStaticHtml(request, "demos/law-firm-ai-team.html");
}
