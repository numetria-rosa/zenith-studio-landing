import { LEARN_BASE } from "@/components/learn/nav";
import { PageHead, Tag } from "@/components/learn/PageHead";
import { ProgressBar } from "@/components/obsidian/ProgressBar";
import { getCareerPaths } from "@/lib/aie/content";
import { readiness } from "@/lib/aie/career";
import { loadCourseState } from "@/lib/aie/state";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function Career() {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const [s, paths] = await Promise.all([loadCourseState(userId), getCareerPaths()]);
  const learnable = s.modules.filter((m) => m.number > 0);
  const r = readiness(learnable.length, s.modulesComplete, [...s.projects.values()], 8);
  const bars = [
    { label: "Technical mastery", val: r.technical, note: `${s.modulesComplete}/${learnable.length} modules complete (lessons done and quiz passed)` },
    { label: "Practical evidence", val: r.practical, note: `${r.projectsComplete}/8 projects submitted, weighted by your rubric score` },
    { label: "Portfolio readiness", val: r.portfolio, note: "Submitted projects that have a description, a GitHub link and test results" },
  ];

  return (
    <>
      <PageHead eyebrow="Evidence" title="What can I actually do with this?" subtitle="Tied to what you've built in this course, not generic career advice. Every skill below is one you either have evidence for or still need." />
      <div className="rounded-[20px] border border-[rgba(245,184,61,0.35)] bg-[rgba(245,184,61,0.06)] p-5 text-[14.5px] leading-[1.65] text-soft">
        <b className="text-amber-text">This course alone does not qualify you for these roles.</b> Each path separates the skills this course develops from the additional skills required. The readiness score measures course-skill evidence, not your chance of being hired, and completing the course does not guarantee a job.
      </div>

      <section className="glass flex flex-col gap-5 rounded-[26px] p-7" aria-labelledby="ready">
        <div className="flex items-baseline justify-between gap-3"><h2 id="ready" className="m-0 text-[22px] font-medium tracking-[-0.02em]">Course skill readiness</h2><b className="text-[32px] font-medium tracking-[-0.04em]">{r.overall}%</b></div>
        {bars.map((b) => (
          <div key={b.label} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between"><span className="text-[15px]">{b.label}</span><span className="font-mono text-[13px] text-soft">{b.val}%</span></div>
            <ProgressBar percent={b.val} label={b.label} />
            <span className="text-[13px] text-mist">{b.note}</span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="paths">
        <h2 id="paths" className="m-0 text-[22px] font-medium tracking-[-0.02em]">Career pathways</h2>
        {paths.map((p, i) => (
          <details key={p.id} open={i === 0} className="glass group rounded-[22px] p-6">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-[19px] font-medium tracking-[-0.02em] focus-visible:outline-2 focus-visible:outline-cyan [&::-webkit-details-marker]:hidden">
              {p.name}<span className="flex flex-wrap justify-end gap-1.5">{p.jobs.slice(0, 2).map((j) => <Tag key={j}>{j}</Tag>)}</span>
            </summary>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div><h3 className="m-0 mb-2.5 font-mono text-[12px] font-normal uppercase tracking-[0.14em] text-mint-text">This course develops</h3><ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[14.5px] leading-normal text-soft">{p.have.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><h3 className="m-0 mb-2.5 font-mono text-[12px] font-normal uppercase tracking-[0.14em] text-amber-text">Still required</h3><ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[14.5px] leading-normal text-soft">{p.need.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><h3 className="m-0 mb-2.5 font-mono text-[12px] font-normal uppercase tracking-[0.14em] text-dim">Tools to learn</h3><ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[14.5px] leading-normal text-soft">{p.tools.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><h3 className="m-0 mb-2.5 font-mono text-[12px] font-normal uppercase tracking-[0.14em] text-dim">Most relevant projects</h3><div className="flex flex-wrap gap-1.5">{p.projects.map((id) => <Tag key={id} tone={s.projects.get(id)?.completed ? "mint" : "neutral"}>Project {id}{s.projects.get(id)?.completed ? " ✓" : ""}</Tag>)}</div></div>
            </div>
          </details>
        ))}
      </section>
    </>
  );
}
