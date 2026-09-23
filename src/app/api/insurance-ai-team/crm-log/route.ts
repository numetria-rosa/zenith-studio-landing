import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { logCrmEntry, listRecentCrmEntries } from "@/lib/insurance-crm-log";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return new Response("unauthorized", { status: 401 });
  const entries = await listRecentCrmEntries();
  return Response.json({ entries });
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return new Response("unauthorized", { status: 401 });

  const body = (await request.json()) as {
    agencyName?: string;
    leadName?: string;
    phone?: string;
    email?: string;
    notes?: string;
  };
  if (!body.agencyName?.trim() || !body.leadName?.trim()) {
    return Response.json({ ok: false, error: "agencyName and leadName are required" }, { status: 400 });
  }

  const entry = await logCrmEntry({
    agencyName: body.agencyName.trim(),
    leadName: body.leadName.trim(),
    phone: body.phone?.trim(),
    email: body.email?.trim(),
    notes: body.notes?.trim(),
  });
  return Response.json({ ok: true, entry });
}
