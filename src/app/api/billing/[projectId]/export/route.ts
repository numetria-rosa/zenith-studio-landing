import type { NextRequest } from "next/server";
import { exportApprovedTimeEntriesCsv } from "@/lib/billing-clerk";
import { canManageOAuthForProject } from "@/lib/oauth-connections";

/* Client-facing CSV export: the firm exporting its own approved entries.
   See src/app/api/admin/projects/[id]/billing-export for the admin
   equivalent; kept separate rather than merged since the two have
   different auth models (project owner here, admin-only there). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }): Promise<Response> {
  const { projectId } = await params;
  if (!(await canManageOAuthForProject(projectId))) return new Response("forbidden", { status: 403 });

  const csv = await exportApprovedTimeEntriesCsv(projectId);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="billing-${projectId}.csv"`,
    },
  });
}
