import Link from "next/link";
import { LEARN_BASE } from "@/components/learn/nav";
import { PageHead, Tag } from "@/components/learn/PageHead";
import { RichText } from "@/components/learn/RichText";
import { SelfCheck } from "@/components/learn/SelfCheck";
import { Icon } from "@/components/obsidian/Icon";
import { getPythonFoundations, PYTHON_MODULE_BASE } from "@/lib/aie/content";
import { newQuizSeed } from "@/lib/aie/quiz";
import { db } from "@/lib/db";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function PythonFoundations() {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const { topics, selfCheck } = await getPythonFoundations();
  const runs = await db.aieExerciseProgress.findMany({
    where: { userId, module: { gt: PYTHON_MODULE_BASE, lte: PYTHON_MODULE_BASE + topics.length } },
    select: { module: true, passed: true, total: true },
  });
  const byTopic = new Map(runs.map((r) => [r.module - PYTHON_MODULE_BASE, r]));
  const solved = topics.filter((t) => { const r = byTopic.get(t.number); return r && r.total > 0 && r.passed === r.total; }).length;

  return (
    <>
      <PageHead eyebrow="Learn" title="Python Foundations" subtitle="The Python you need, taught through the AI engineering you're about to build. Every exercise runs real Python in your browser. No prior Python required." />
      <div className="glass flex flex-col gap-3 rounded-[22px] p-6 text-[15px] leading-[1.65] text-soft">
        <b className="text-[16px] font-medium text-frost">How to work through it</b>
        <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5">
          <li>Read the why, then the concept, then the worked example.</li>
          <li>Write the exercise function yourself and press Run tests. It is real Python with real results.</li>
          <li>Use the hints if you&apos;re stuck. The solution unlocks after your first run.</li>
        </ol>
        <span className="text-[14px] text-mist">If you&apos;ve ever written a variable or a loop in any language, you&apos;re ready.</span>
      </div>

      <section aria-labelledby="topics" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between"><h2 id="topics" className="m-0 text-[22px] font-medium tracking-[-0.02em]">Eight topics</h2><span className="text-[14px] text-mist">{solved} of {topics.length} exercises solved</span></div>
        {topics.map((t) => {
          const r = byTopic.get(t.number);
          const complete = !!r && r.total > 0 && r.passed === r.total;
          return (
            <Link key={t.number} href={`${LEARN_BASE}/python/${t.number}`} className="glass flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[20px] px-5 py-[18px] text-frost no-underline transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
              <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-cyan/60 font-mono text-[15px] text-cyan">{complete ? <Icon name="check" size={18} color="#7FF0BD" strokeWidth={2.4} /> : t.number}</span>
              <div className="flex min-w-[240px] flex-1 flex-col gap-1"><b className="text-[16.5px] font-medium tracking-[-0.01em]">{t.title}</b><span className="text-[13.5px] leading-normal text-mist"><RichText text={t.why} /></span></div>
              <div className="flex items-center gap-2.5">{complete ? <Tag tone="mint">Solved</Tag> : r ? <Tag tone="cyan">{r.passed}/{r.total} tests</Tag> : <Tag>Not started</Tag>}<Icon name="arrow" size={15} color="#7D8392" /></div>
            </Link>
          );
        })}
      </section>

      <section aria-labelledby="sc" className="flex flex-col gap-3">
        <h2 id="sc" className="m-0 text-[22px] font-medium tracking-[-0.02em]">Self-check</h2>
        <p className="m-0 text-[14.5px] text-mist">Not graded and not gating. A quick gut-check before Module 1.</p>
        <SelfCheck questions={selfCheck} seed={newQuizSeed()} />
      </section>
    </>
  );
}
