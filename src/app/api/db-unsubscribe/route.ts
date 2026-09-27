import type { NextRequest } from "next/server";
import { unsubscribeContact } from "@/lib/database-manager";

/* One-click unsubscribe for Database Manager re-engagement emails. */
export async function GET(request: NextRequest): Promise<Response> {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  const ok = /^[a-f0-9]{36}$/.test(token) && (await unsubscribeContact(token));
  const title = ok ? "You're unsubscribed." : "That link didn't work.";
  const body = ok ? "You won't get any more of these emails." : "It may have expired. Reply to any of the emails and ask to be removed.";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f6f7f9;color:#111}main{max-width:420px;margin:24px;padding:32px;border-radius:16px;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.08);text-align:center}h1{font-size:22px;margin:0 0 8px}p{margin:0;color:#555;line-height:1.5}</style></head>
<body><main><h1>${title}</h1><p>${body}</p></main></body></html>`;
  return new Response(html, { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } });
}
