import Link from "next/link";
import { LEARN_BASE } from "@/components/learn/nav";
import { PageHead, Tag } from "@/components/learn/PageHead";
import { Icon } from "@/components/obsidian/Icon";
import { getProject } from "@/lib/aie/content";
import { loadCourseState } from "@/lib/aie/state";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function Projects() {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const s = await loadCourseState(userId);
  const withProject = s.modules.filter((m) => m.project);
  const details = await Promise.all(withProject.map((m) => getProject(m.project!.projectId)));
  const doneCount = withProject.filter((m) => s.projects.get(m.project!.projectId)?.completed).length;

  return (
    <>
      <PageHead
        eyebrow="Build"
        title="Projects"
        subtitle={`One portfolio project per module. Build it, tick the acceptance checklist, score yourself against the rubric and submit. ${doneCount} of ${withProject.length} done.`}
        action={<Link href={`${LEARN_BASE}/portfolio`} className="glass inline-flex min-h-12 items-center gap-2 rounded-full px-[22px] text-[15px] font-medium text-frost no-underline hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-cyan">My portfolio <Icon name="arrow" size={16} /></Link>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {withProject.map((m, i) => {
          const d = details[i];
          const p = s.projects.get(m.project!.projectId);
          const ticked = p?.checklist.filter(Boolean).length ?? 0;
          return (
            <Link key={m.number} href={`${LEARN_BASE}/modules/${m.number}/project`} className="glass flex flex-col gap-3.5 rounded-[24px] p-6 text-frost no-underline transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-amber-text">Module {m.number} project</span>
                {p?.completed ? <Tag tone="mint">Submitted · {p.score}%</Tag> : ticked > 0 ? <Tag tone="cyan">In progress</Tag> : <Tag>Not started</Tag>}
              </div>
              <b className="text-[20px] font-medium leading-tight tracking-[-0.02em]">{m.project!.title}</b>
              <p className="m-0 text-[14.5px] leading-[1.6] text-mist">{m.project!.brief}</p>
              <div className="mt-auto flex items-center justify-between text-[13px] text-dim">
                <span>{d ? `${d.difficulty} · ${d.acceptance.length} acceptance checks` : ""}</span>
                <span className="inline-flex items-center gap-1.5 text-soft">{p?.completed ? "Review" : "Open"} <Icon name="arrow" size={14} /></span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
