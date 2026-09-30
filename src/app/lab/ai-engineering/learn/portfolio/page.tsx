import Link from "next/link";
import { CopyButton } from "@/components/learn/CopyButton";
import { LEARN_BASE } from "@/components/learn/nav";
import { PageHead, Tag } from "@/components/learn/PageHead";
import { getProject } from "@/lib/aie/content";
import { portfolioSummary, SKILL_PHRASES } from "@/lib/aie/career";
import { safeHttpUrl } from "@/lib/aie/project";
import { loadCourseState } from "@/lib/aie/state";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function Portfolio() {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const s = await loadCourseState(userId);
  const done = [...s.projects.entries()].filter(([, p]) => p.completed).sort(([a], [b]) => a - b);
  const details = await Promise.all(done.map(([id]) => getProject(id)));
  const items = done.map(([id, p], i) => ({ id, p, title: details[i]?.title ?? `Project ${id}` }));
  const summary = portfolioSummary(items.map((i) => ({ id: i.id, title: i.title, score: i.p.score })));

  return (
    <>
      <PageHead eyebrow="Evidence" title="My Portfolio" subtitle="Every project you've submitted, with the skills it shows, your self-assessed score and a summary you can paste into a resume or portfolio site." />
      {items.length === 0 ? (
        <div className="glass rounded-[24px] p-8 text-[15.5px] leading-[1.6] text-mist">
          No submitted projects yet. Build your first in <Link href={`${LEARN_BASE}/projects`} className="text-cyan-text">Projects</Link> and it will appear here automatically.
        </div>
      ) : (
        <>
          <section className="glass flex flex-col gap-4 rounded-[24px] p-6" aria-labelledby="sum">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="sum" className="m-0 text-[20px] font-medium tracking-[-0.02em]">Generated portfolio summary</h2>
              <CopyButton text={summary} label="Copy summary" />
            </div>
            <p className="m-0 text-[15px] leading-[1.7] text-soft">{summary}</p>
          </section>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map(({ id, p, title }) => {
              const url = safeHttpUrl(p.githubUrl);
              return (
                <article key={id} className="glass flex flex-col gap-3 rounded-[24px] p-6">
                  <div className="flex items-start justify-between gap-3">
                    <b className="text-[19px] font-medium leading-tight tracking-[-0.02em]">{title}</b>
                    <Tag tone="mint">{p.score}%</Tag>
                  </div>
                  <p className="m-0 text-[14.5px] leading-[1.6] text-mist">{p.description || "No description added."}</p>
                  <dl className="m-0 grid gap-2 text-[13.5px]">
                    <div><dt className="inline font-medium text-soft">Skills: </dt><dd className="m-0 inline text-mist">{SKILL_PHRASES[id]}</dd></div>
                    {p.technologies && <div><dt className="inline font-medium text-soft">Technologies: </dt><dd className="m-0 inline text-mist">{p.technologies}</dd></div>}
                    {p.testsPassed && <div><dt className="inline font-medium text-soft">Tests: </dt><dd className="m-0 inline text-mist">{p.testsPassed}</dd></div>}
                    <div><dt className="inline font-medium text-soft">Code: </dt><dd className="m-0 inline">{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-cyan-text">{p.githubUrl}</a> : <span className="text-dim">{p.githubUrl ? "Not a valid http(s) link" : "No link added"}</span>}</dd></div>
                  </dl>
                </article>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
