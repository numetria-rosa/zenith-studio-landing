import Link from "next/link";
import { LEARN_BASE } from "@/components/learn/nav";
import { PageHead, Tag } from "@/components/learn/PageHead";
import { Icon } from "@/components/obsidian/Icon";
import { loadCourseState } from "@/lib/aie/state";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function Roadmap() {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const s = await loadCourseState(userId);
  const byNumber = new Map(s.modules.map((m) => [m.number, m]));
  const currentNumber = s.modules.find((m) => m.lessons.some((l) => !s.done.has(l.number)))?.number ?? null;

  return (
    <>
      <PageHead eyebrow="Learn" title="Learning Roadmap" subtitle="The whole journey in one place, grouped by stage, showing what is done, what is next and why." />
      <ol className="m-0 flex list-none flex-col gap-6 p-0">
        {s.index.stages.map((stage) => (
          <li key={stage.label} className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[12.5px] uppercase tracking-[0.16em]" style={{ color: stage.color }}>{stage.label}</span>
              {stage.name && <h2 className="m-0 text-[22px] font-medium tracking-[-0.02em]">{stage.name}</h2>}
            </div>
            <div className="flex flex-col gap-3">
              {stage.modules.map((sm) => {
                const m = byNumber.get(sm.number);
                if (!m) return null;
                const done = m.lessons.filter((l) => s.done.has(l.number)).length;
                const complete = m.lessons.length > 0 && done === m.lessons.length;
                const current = m.number === currentNumber;
                return (
                  <Link key={m.number} href={`${LEARN_BASE}/modules/${m.number}`} aria-current={current ? "step" : undefined} className={`glass flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[20px] px-5 py-[18px] text-frost no-underline transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${current ? "shadow-[inset_0_0_0_1px_rgba(92,200,255,0.4)]" : ""}`}>
                    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border font-mono text-[15px]" style={{ borderColor: stage.color, color: stage.color }}>
                      {complete ? <Icon name="check" size={18} color="#7FF0BD" strokeWidth={2.4} /> : m.number}
                    </span>
                    <div className="flex min-w-[240px] flex-1 flex-col gap-1">
                      <b className="text-[16.5px] font-medium tracking-[-0.01em]">{m.title}</b>
                      <span className="text-[13.5px] leading-normal text-mist">{sm.summary}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {complete ? <Tag tone="mint">Done</Tag> : current ? <Tag tone="cyan">Up next</Tag> : done > 0 ? <Tag tone="cyan">{done}/{m.lessons.length}</Tag> : <Tag>Not started</Tag>}
                      <Icon name="arrow" size={15} color="#7D8392" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </li>
        ))}
        <li className="flex flex-col gap-3">
          <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-amber-text">Then</span>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { t: "Final assessment", n: "Ten unseen scenarios. 80% to pass.", href: `${LEARN_BASE}/final-assessment` },
              { t: "Portfolio", n: "Your submitted projects and a paste-ready summary.", href: `${LEARN_BASE}/portfolio` },
              { t: "Career path", n: "What your evidence supports, and what's still missing.", href: `${LEARN_BASE}/career` },
            ].map((x) => (
              <Link key={x.href} href={x.href} className="glass flex flex-col gap-1.5 rounded-[20px] p-5 text-frost no-underline hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
                <b className="text-[16px] font-medium">{x.t}</b><span className="text-[13.5px] text-mist">{x.n}</span>
              </Link>
            ))}
          </div>
        </li>
      </ol>
    </>
  );
}
