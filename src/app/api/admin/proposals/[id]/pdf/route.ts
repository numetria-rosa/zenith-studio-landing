import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { renderProposalPdfBuffer, proposalPdfFilename } from "@/lib/proposal-pdf";

/* GET /api/admin/proposals/[id]/pdf — on-demand PDF preview/download for
   the admin proposal builder. Independently re-checks requireAdmin() here
   (matching every other admin API route's convention), 404s for
   non-admins so the route's existence isn't confirmed to a non-admin
   caller. `?download=1` swaps Content-Disposition from inline (opens in a
   new browser tab for preview) to attachment (forces a save-as download)
   — same render, same bytes, just how the browser is told to handle it. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return new Response("not found", { status: 404 });

  const { id } = await params;
  const proposal = await db.proposal.findUnique({ where: { id }, select: { companyName: true, clientName: true } });
  if (!proposal) return new Response("not found", { status: 404 });

  const buffer = await renderProposalPdfBuffer(id);
  if (!buffer) return new Response("not found", { status: 404 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  const filename = proposalPdfFilename(proposal.companyName, proposal.clientName);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
    },
  });
}
