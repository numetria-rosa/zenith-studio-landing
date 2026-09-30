import { notFound } from "next/navigation";
import { CheatSheetView } from "@/components/learn/cheatsheet/CheatSheetView";
import { LEARN_BASE } from "@/components/learn/nav";
import { getCheatSheet } from "@/lib/aie/cheatsheets";
import { getModule } from "@/lib/aie/content";
import { requireEnrollment } from "@/lib/require-enrollment";

export const dynamic = "force-dynamic";

/** Reads a cheat sheet on the page; the PDF route stays a download. */
export default async function CheatSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sheet = await getCheatSheet(id);
  if (!sheet) notFound();
  await requireEnrollment("ai-engineering", LEARN_BASE);
  const mod = /^\d+$/.test(id) ? await getModule(Number(id)) : null;
  const eyebrow = mod ? `Cheat sheet · Module ${mod.number}` : `Cheat sheet · ${sheet.tag}`;
  return <CheatSheetView sheet={sheet} glossary={mod?.cheatSheet ? mod.glossary : undefined} eyebrow={eyebrow} title={sheet.title} pdfHref={`${LEARN_BASE}/cheat-sheets/${id}/pdf`} />;
}
