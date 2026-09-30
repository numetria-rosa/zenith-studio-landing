import Link from "next/link";
import { LEARN_BASE } from "@/components/learn/nav";
import { PageHead, Tag } from "@/components/learn/PageHead";
import { Icon } from "@/components/obsidian/Icon";
import { getMixedQuizzes } from "@/lib/aie/content";
import { masteryBand } from "@/lib/aie/quiz";
import { loadCourseState } from "@/lib/aie/state";
import { requireEnrollment } from "@/lib/require-enrollment";

const pct = (s: { score: number; total: number } | null) => (s ? Math.round((s.score / s.total) * 100) : null);

function Row({ href, title, sub, stat, passed }: { href: string; title: string; sub: string; stat?: { attempts: number; best: { score: number; total: number } | null }; passed: boolean }) {
  const best = pct(stat?.best ?? null);
  const band = best === null ? null : masteryBand(best);
  return (
    <Link href={href} className="glass flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[18px] px-5 py-4 text-frost no-underline transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
      <div className="flex min-w-[220px] flex-1 flex-col gap-0.5"><b className="text-[16px] font-medium">{title}</b><span className="text-[13px] text-mist">{sub}</span></div>
      <div className="flex items-center gap-3">
        {band ? <Tag tone={band.tone}>{band.label} · {best}%</Tag> : <Tag>Not attempted</Tag>}
        {stat && stat.attempts > 0 && <span className="text-[12.5px] text-dim">{stat.attempts} {stat.attempts === 1 ? "attempt" : "attempts"}</span>}
        {passed && <Icon name="check" size={16} color="#7FF0BD" strokeWidth={2.4} />}
        <Icon name="arrow" size={15} color="#7D8392" />
      </div>
    </Link>
  );
}

export default async function QuizCenter() {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const [s, mixed] = await Promise.all([loadCourseState(userId), getMixedQuizzes()]);
  const withQuiz = s.modules.filter((m) => m.quiz);
  const final = s.quizStats.get("final");

  return (
    <>
      <PageHead eyebrow="Practice" title="Quiz Center" subtitle="Every module quiz, the mixed reviews and the final assessment. Each attempt draws fresh questions, so retakes are real tests." />
      <section className="flex flex-col gap-3" aria-labelledby="mq">
        <h2 id="mq" className="m-0 text-[22px] font-medium tracking-[-0.02em]">Module quizzes</h2>
        {withQuiz.map((m) => (
          <Row key={m.number} href={`${LEARN_BASE}/modules/${m.number}/quiz`} title={`Module ${m.number} · ${m.title}`} sub={`${m.quiz!.questions.length} questions in the bank · pass at ${m.quiz!.passMark}`} stat={s.quizStats.get(`m${m.number}`)} passed={s.passedQuizzes.has(m.number)} />
        ))}
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="mx">
        <h2 id="mx" className="m-0 text-[22px] font-medium tracking-[-0.02em]">Mixed reviews</h2>
        {mixed.map((m) => (
          <Row key={m.id} href={`${LEARN_BASE}/quizzes/mixed/${m.id}`} title={m.title} sub={`${m.perModule * m.modules.length} questions across modules ${m.modules.join(", ")}`} stat={s.quizStats.get(m.id)} passed={!!s.quizStats.get(m.id)?.best && (s.quizStats.get(m.id)!.best!.score / s.quizStats.get(m.id)!.best!.total) >= 0.8} />
        ))}
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="fa">
        <h2 id="fa" className="m-0 text-[22px] font-medium tracking-[-0.02em]">Final assessment</h2>
        <Row href={`${LEARN_BASE}/final-assessment`} title="Final competency assessment" sub="Ten unseen scenarios · 80% to pass · unlimited attempts" stat={final} passed={!!final?.best && final.best.score / final.best.total >= 0.8} />
      </section>
    </>
  );
}
