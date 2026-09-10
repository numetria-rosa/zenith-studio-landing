import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { exportApprovedTimeEntriesCsv } from "@/lib/billing-clerk";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const admin = await requireAdmin();
  if (!admin) return new Response("forbidden", { status: 403 });

  const { id } = await params;
  const csv = await exportApprovedTimeEntriesCsv(id);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="billing-${id}.csv"`,
    },
  });
}
