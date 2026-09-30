import Link from "next/link";
import { LEARN_BASE } from "@/components/learn/nav";
import { PageHead } from "@/components/learn/PageHead";
import { Icon } from "@/components/obsidian/Icon";
import { getAllCheatSheets } from "@/lib/aie/cheatsheets";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function CheatSheets() {
  await requireEnrollment("ai-engineering", LEARN_BASE);
  const sheets = await getAllCheatSheets();
  return (
    <>
      <PageHead eyebrow="Learn" title="Cheat Sheets" subtitle="One page per module: the formulas, rules and checklists worth keeping open while you build. Print them or download the PDF." />
      <div className="grid gap-4 md:grid-cols-2">
        {sheets.map((sheet) => {
          const href = `${LEARN_BASE}/cheat-sheets/${sheet.id}`;
          return (
            <div key={sheet.id} className="glass flex flex-col gap-3 rounded-[24px] p-6">
              <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-dim">{sheet.tag}</span>
              <b className="text-[19px] font-medium leading-tight tracking-[-0.02em]">{sheet.title}</b>
              <span className="text-[13.5px] text-mist">{sheet.sections.length} sections</span>
              <div className="mt-auto flex flex-wrap gap-3 pt-1">
                <Link href={href} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-frost px-[18px] text-[14px] font-medium text-void no-underline hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">Open <Icon name="arrow" size={15} color="#05060A" strokeWidth={2} /></Link>
                <a href={`${LEARN_BASE}/cheat-sheets/${sheet.id}/pdf`} className="glass inline-flex min-h-11 items-center gap-2 rounded-full px-[18px] text-[14px] font-medium text-frost no-underline hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"><Icon name="download" size={15} /> PDF</a>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
