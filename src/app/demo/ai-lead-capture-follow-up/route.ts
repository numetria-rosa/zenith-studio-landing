import { serveStaticHtml } from "@/lib/static-html";

/* Serves public/demos/ai-lead-capture-follow-up.html directly, same
   pattern as ai-inbox-manager and ai-receptionist. Replaced the old
   React page.tsx + LeadCaptureDemo.tsx (simulated sandbox) on
   2026-09-25 so this service matches the unified /demo design system.
   Read fresh each request. */
export async function GET(request: Request) {
  return serveStaticHtml(request, "demos/ai-lead-capture-follow-up.html");
}
