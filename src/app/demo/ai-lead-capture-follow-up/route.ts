import { readFile } from "fs/promises";
import path from "path";

/* Serves public/demos/ai-lead-capture-follow-up.html directly, same
   pattern as ai-inbox-manager and ai-receptionist. Replaced the old
   React page.tsx + LeadCaptureDemo.tsx (simulated sandbox) on
   2026-09-25 so this service matches the unified /demo design system.
   Read fresh each request. */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "demos", "ai-lead-capture-follow-up.html");
  const html = await readFile(filePath, "utf-8");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
