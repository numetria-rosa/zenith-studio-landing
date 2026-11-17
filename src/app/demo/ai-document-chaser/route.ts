import { serveStaticHtml } from "@/lib/static-html";

/* Serves public/demos/ai-document-chaser.html at /demo/ai-document-chaser, same pattern as ai-inbox-manager. */
export async function GET(request: Request) {
  return serveStaticHtml(request, "demos/ai-document-chaser.html");
}
