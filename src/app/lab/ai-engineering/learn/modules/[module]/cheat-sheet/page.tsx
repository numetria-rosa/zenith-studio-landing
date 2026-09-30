import { notFound } from "next/navigation";
import { CheatSheetView } from "@/components/learn/cheatsheet/CheatSheetView";
import { LEARN_BASE } from "@/components/learn/nav";
import { getCheatSheet } from "@/lib/aie/cheatsheets";
import { getModule } from "@/lib/aie/content";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function ModuleCheatSheet({ params }: { params: Promise<{ module: string }> }) {
  const { module: moduleParam } = await params;
  const mod = await getModule(Number(moduleParam));
  const sheet = mod?.cheatSheet ? await getCheatSheet(String(mod.number)) : null;
  if (!mod || !sheet) notFound();
  await requireEnrollment("ai-engineering", LEARN_BASE);
  return <CheatSheetView sheet={sheet} glossary={mod.glossary} eyebrow={`Cheat sheet · Module ${mod.number}`} title={sheet.title} pdfHref={`${LEARN_BASE}/cheat-sheets/${mod.number}/pdf`} />;
}
