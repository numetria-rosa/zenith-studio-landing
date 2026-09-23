import { NextRequest } from "next/server";
import { auditPolicyDocument } from "@/lib/insurance-document-audit";
import { requireAdmin } from "@/lib/admin";

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return new Response("unauthorized", { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const pastedText = form.get("text");

  let text = typeof pastedText === "string" ? pastedText : "";
  if (file instanceof File) {
    const bytes = Buffer.from(await file.arrayBuffer());
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: bytes });
      const parsed = await parser.getText();
      await parser.destroy();
      text = parsed.text;
    } else {
      text = bytes.toString("utf-8");
    }
  }

  const result = await auditPolicyDocument(text);
  if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: 400 });
  return Response.json(result);
}
