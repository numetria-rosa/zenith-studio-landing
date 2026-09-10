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
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: 400 });
  return Response.json({ ok: true });
}
