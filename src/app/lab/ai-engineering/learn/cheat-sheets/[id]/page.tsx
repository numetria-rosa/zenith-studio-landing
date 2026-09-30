import { notFound } from "next/navigation";
import { AutoPrint } from "@/components/learn/cheatsheet/AutoPrint";
import { CheatSheetView } from "@/components/learn/cheatsheet/CheatSheetView";
import { LEARN_BASE } from "@/components/learn/nav";
import { getCheatSheet } from "@/lib/aie/cheatsheets";
import { getModule } from "@/lib/aie/content";
import { requireEnrollment } from "@/lib/require-enrollment";

export const dynamic = "force-dynamic";

/** Reads a cheat sheet on the page; the PDF route stays a download. */
export default async function CheatSheetPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const [{ id }, { print }] = await Promise.all([params, searchParams]);
  const sheet = await getCheatSheet(id);
  if (!sheet) notFound();
  await requireEnrollment("ai-engineering", LEARN_BASE);
  const mod = /^\d+$/.test(id) ? await getModule(Number(id)) : null;
  const eyebrow = mod ? `Cheat sheet · Module ${mod.number}` : `Cheat sheet · ${sheet.tag}`;
  return (
    <>
      {print === "1" && <AutoPrint />}
      <CheatSheetView sheet={sheet} glossary={mod?.cheatSheet ? mod.glossary : undefined} eyebrow={eyebrow} title={sheet.title} pdfHref={`${LEARN_BASE}/cheat-sheets/${id}/pdf`} />
    </>
  );
}
