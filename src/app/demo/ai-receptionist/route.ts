import { readFile } from "fs/promises";
import path from "path";

/* Serves public/demos/ai-receptionist.html directly, same pattern as
   ai-inbox-manager: a complete, hand-designed details+demo+pricing+FAQ
   HTML document served verbatim. Replaced the old React page.tsx (gated
   signup + live Vapi call widget + live Cal.com bookings feed) on
   2026-09-25 so this service matches the unified /demo design system.
   The real demo number is kept as a prominent tel: CTA in the hero
   instead of an embedded call widget. Read fresh each request. */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "demos", "ai-receptionist.html");
  const html = await readFile(filePath, "utf-8");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
