import { serveStaticHtml } from "@/lib/static-html";

/* Serves public/demos/ai-receptionist.html directly, same pattern as
   ai-inbox-manager: a complete, hand-designed details+demo+pricing+FAQ
   HTML document served verbatim. Replaced the old React page.tsx (gated
   signup + live Vapi call widget + live Cal.com bookings feed) on
   2026-09-25 so this service matches the unified /demo design system.
   The real demo number is kept as a prominent tel: CTA in the hero
   instead of an embedded call widget. Read fresh each request. */
export async function GET(request: Request) {
  return serveStaticHtml(request, "demos/ai-receptionist.html");
}
