import { LEARN_BASE } from "@/components/learn/nav";
import { cheatSheetPdf } from "@/lib/aie/cheatsheet-pdf";
import { getCheatSheet } from "@/lib/aie/cheatsheets";
import { getModule } from "@/lib/aie/content";
import { requireEnrollment } from "@/lib/require-enrollment";

export const dynamic = "force-dynamic";

/** A cheat sheet as a printable PDF, for enrolled students only. Module sheets carry their module's glossary. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireEnrollment("ai-engineering", `${LEARN_BASE}/cheat-sheets`);
  const sheet = await getCheatSheet(id);
  if (!sheet) return new Response("Not found", { status: 404 });
  const mod = /^\d+$/.test(id) ? await getModule(Number(id)) : null;
  const pdf = await cheatSheetPdf(sheet, sheet.tag, mod?.cheatSheet ? mod.glossary : undefined);
  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="zenith-cheat-sheet-${id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
