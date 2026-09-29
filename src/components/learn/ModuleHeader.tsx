import type { ModuleContent } from "@/lib/aie/types";
import { LEARN_BASE } from "./nav";
import { ModuleTabs, type ModuleTab } from "./ModuleTabs";

/** Stage line, "Module n · title", and the tab bar. A tab only exists if the module has that content. */
export function ModuleHeader({ mod, lessonHref }: { mod: ModuleContent; lessonHref: string | null }) {
  const base = `${LEARN_BASE}/modules/${mod.number}`;
  const tabs: ModuleTab[] = [{ label: "Overview", href: base, match: base }];
  if (lessonHref) tabs.push({ label: "Lessons", href: lessonHref, match: `${base}/lessons` });
  if (mod.exercise) tabs.push({ label: "Exercise", href: `${base}/exercise`, match: `${base}/exercise` });
  if (mod.quiz) tabs.push({ label: "Quiz", href: `${base}/quiz`, match: `${base}/quiz` });
  if (mod.project) tabs.push({ label: "Project", href: `${base}/project`, match: `${base}/project` });
  if (mod.cheatSheet) tabs.push({ label: "Cheat sheet", href: `${base}/cheat-sheet`, match: `${base}/cheat-sheet` });

  return (
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-dim">{mod.stage}</span>
        <span className="text-[20px] font-medium tracking-[-0.02em]">
          <span className="text-cyan">Module {mod.number} ·</span> {mod.title}
        </span>
      </div>
      <ModuleTabs tabs={tabs} overviewHref={base} />
    </div>
  );
}
