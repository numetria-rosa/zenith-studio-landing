import type { NextRequest } from "next/server";
import { captureLead } from "@/lib/lead-capture";

/* Public, unauthenticated by design, this is the endpoint a client's own
   website form (or a simple fetch()) posts to from anonymous visitors'
   browsers, e.g. <form action="https://zenith-studio.site/api/leads/capture/PROJECT_ID" method="POST">.
   Accepts either a normal form submission or JSON.
   ponytail: no rate limiting/CAPTCHA, fine while volume is low; add if a
   client's form starts attracting spam submissions. Worst case today is a
   junk Lead row and a wasted Groq call, not a security issue. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }): Promise<Response> {
  const { projectId } = await params;

  const contentType = request.headers.get("content-type") ?? "";
  let input: { name?: string; email?: string; phone?: string; message?: string };
  if (contentType.includes("application/json")) {
    input = (await request.json()) as typeof input;
  } else {
    const formData = await request.formData();
    input = {
      name: formData.get("name")?.toString(),
      email: formData.get("email")?.toString(),
      phone: formData.get("phone")?.toString(),
      message: formData.get("message")?.toString(),
    };
  }

  const result = await captureLead(projectId, input);
  if (contentType.includes("application/json")) {
    if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: 400 });
    return Response.json({ ok: true });
  }
  // A plain HTML form lands the visitor here, so answer with a page, not JSON.
  return thankYouPage(result.ok, request.headers.get("referer"));
}

function thankYouPage(ok: boolean, referer: string | null): Response {
  const back = referer && /^https?:\/\//.test(referer) ? referer.replace(/"/g, "&quot;") : null;
  const title = ok ? "Thanks, we got your message." : "Sorry, that didn't go through.";
  const body = ok
    ? "We'll text you back in just a moment."
    : "Please try again in a moment, or contact the business directly.";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f6f7f9;color:#111}main{max-width:420px;margin:24px;padding:32px;border-radius:16px;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.08);text-align:center}h1{font-size:22px;margin:0 0 8px}p{margin:0;color:#555;line-height:1.5}a{display:inline-block;margin-top:20px;color:#111;font-weight:600}</style></head>
<body><main><h1>${title}</h1><p>${body}</p>${back ? `<a href="${back}">Back to the site</a>` : ""}</main></body></html>`;
  return new Response(html, { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } });
}
