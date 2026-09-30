import Link from "next/link";
import { notFound } from "next/navigation";
import { LEARN_BASE } from "@/components/learn/nav";
import { PythonExercise } from "@/components/learn/PythonExercise";
import { RichText } from "@/components/learn/RichText";
import { CodeBlock } from "@/components/obsidian/CodeBlock";
import { Icon } from "@/components/obsidian/Icon";
import { getPythonFoundations, getPythonHarness, PYTHON_MODULE_BASE } from "@/lib/aie/content";
import { getExerciseProgress } from "@/lib/aie/progress";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function PythonTopic({ params }: { params: Promise<{ topic: string }> }) {
  const n = Number((await params).topic);
  const { topics } = await getPythonFoundations();
  const topic = topics.find((t) => t.number === n);
  if (!topic) notFound();
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const [harnessSource, progress] = await Promise.all([getPythonHarness(n), getExerciseProgress(userId, PYTHON_MODULE_BASE + n)]);
  const next = topics.find((t) => t.number === n + 1);
  const ex = topic.exercise;

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <Link href={`${LEARN_BASE}/python`} className="inline-flex min-h-11 items-center gap-2 self-start text-[14px] text-mist no-underline hover:text-frost focus-visible:outline-2 focus-visible:outline-cyan"><Icon name="back" size={15} /> Python Foundations</Link>
        <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-cyan">Topic {n} of {topics.length}</span>
        <h1 className="m-0 text-[34px] font-medium leading-[1.05] tracking-[-0.04em] sm:text-[44px]">{topic.title}</h1>
      </div>

      <div className="rounded-[18px] border border-[rgba(199,176,255,0.3)] bg-[rgba(139,92,246,0.08)] p-5">
        <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-violet-text">Why this matters here</span>
        <p className="m-0 mt-2 text-[16px] leading-[1.65] text-soft"><RichText text={topic.why} /></p>
      </div>

      <div className="flex max-w-[820px] flex-col gap-5">
        {topic.body.filter((b) => !(b.type === "p" && b.text === topic.why)).map((b, i) =>
          b.type === "p" ? <p key={i} className="m-0 text-[17px] leading-[1.7] text-soft"><RichText text={b.text} /></p>
          : b.type === "concept" ? (
            <div key={i} className="glass flex flex-col gap-2 rounded-[20px] p-5"><span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-cyan">Concept: {b.title}</span><p className="m-0 text-[15.5px] leading-[1.65] text-soft"><RichText text={b.text} /></p></div>
          ) : <CodeBlock key={i} code={b.code} filename="example.py" />,
        )}
        {topic.practice && (
          <div className="glass flex flex-col gap-3 rounded-[20px] p-5">
            <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-amber-text">Practice check</span>
            <p className="m-0 text-[15.5px] leading-[1.6]"><RichText text={topic.practice.question} /></p>
            <details className="text-[14.5px] leading-[1.6] text-soft"><summary className="min-h-11 cursor-pointer py-2.5 text-cyan-text focus-visible:outline-2 focus-visible:outline-cyan">Check your answer</summary><RichText text={topic.practice.answer} /></details>
          </div>
        )}
      </div>

      <PythonExercise
        topic={n}
        exerciseId={String(n)}
        eyebrow={`Python ${n} · Code`}
        title={ex.functionName}
        description={<RichText text={ex.instructions} />}
        fileName={ex.fileName}
        starter={ex.starter}
        solution={ex.solution}
        tests={ex.tests}
        hints={ex.hints.map((h) => ({ title: h.title, body: <RichText text={h.text} /> }))}
        harnessSource={harnessSource}
        functionName={ex.functionName}
        initial={{ code: progress?.code ?? "", attempted: progress?.attempted ?? false, passed: progress?.passed ?? 0 }}
        next={next ? { label: `Next: ${next.title}`, href: `${LEARN_BASE}/python/${next.number}` } : { label: "Take the self-check", href: `${LEARN_BASE}/python#sc` }}
      />
    </>
  );
}
