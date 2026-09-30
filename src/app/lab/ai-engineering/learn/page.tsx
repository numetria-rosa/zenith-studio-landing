import Link from "next/link";
import { Button } from "@/components/obsidian/Button";
import { Icon } from "@/components/obsidian/Icon";
import { ProgressBar } from "@/components/obsidian/ProgressBar";
import { StatStrip } from "@/components/obsidian/StatStrip";
import { LEARN_BASE } from "@/components/learn/nav";
import { PageHead, Tag } from "@/components/learn/PageHead";
import { nextLesson } from "@/lib/aie/progress";
import { loadCourseState } from "@/lib/aie/state";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function Dashboard() {
  const { userId, name } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const s = await loadCourseState(userId);
  const first = (name ?? "there").split(/\s+/)[0];
  const current = s.modules.find((m) => m.lessons.some((l) => !s.done.has(l.number)));
  const lesson = current ? nextLesson(current, s.done) : null;
  const started = s.done.size > 0;
  const learnable = s.modules.filter((m) => m.number > 0);

  // What to do next, most useful first.
  const next: { icon: "quiz" | "box" | "award" | "code"; title: string; note: string; href: string }[] = [];
  const quizModule = learnable.find((m) => m.quiz && m.lessons.every((l) => s.done.has(l.number)) && !s.passedQuizzes.has(m.number));
  if (quizModule) next.push({ icon: "quiz", title: `Take the Module ${quizModule.number} quiz`, note: "You finished the lessons. Check what stuck.", href: `${LEARN_BASE}/modules/${quizModule.number}/quiz` });
  const exModule = learnable.find((m) => m.exercise && m.lessons.every((l) => s.done.has(l.number)) && !s.exercisesDone.has(m.number));
  if (exModule) next.push({ icon: "code", title: `Do the Module ${exModule.number} exercise`, note: "Real Python, real tests, in your browser.", href: `${LEARN_BASE}/modules/${exModule.number}/exercise` });
  const projModule = learnable.find((m) => m.project && !s.projects.get(m.project.projectId)?.completed && m.lessons.every((l) => s.done.has(l.number)));
  if (projModule?.project) next.push({ icon: "box", title: `Build: ${projModule.project.title}`, note: "Add it to your portfolio.", href: `${LEARN_BASE}/modules/${projModule.number}/project` });
  if (s.modulesComplete >= 7) next.push({ icon: "award", title: "Take the final assessment", note: "Ten unseen scenarios. 80% to pass.", href: `${LEARN_BASE}/final-assessment` });

  return (
    <>
      <PageHead eyebrow="Dashboard" title={`Welcome${started ? " back" : ""}, ${first}.`} subtitle="Your progress, what to do next, and every module in one place." />

      {lesson && current && (
        <section className="relative overflow-hidden rounded-[30px] border border-[rgba(92,200,255,0.30)] bg-[linear-gradient(135deg,rgba(92,200,255,0.12),rgba(59,107,255,0.08)_60%,rgba(255,255,255,0.02))] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] lg:p-9">
          <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-cyan-text">{started ? "Continue learning" : "Start here"}</span>
          <h2 className="m-0 mt-3.5 text-[30px] font-medium leading-[1.1] tracking-[-0.035em] lg:text-[36px]">Module {current.number} · {current.title}</h2>
          <p className="mt-3.5 text-[16px] leading-[1.6] text-soft">Up next: lesson {lesson.number}, {lesson.title} · {lesson.minutes} min.</p>
          <div className="mt-4 flex max-w-[520px] items-center gap-3.5">
            <div className="flex-1"><ProgressBar percent={s.progress.percent} color="linear-gradient(90deg,#5CC8FF,#8B5CF6)" label="Course progress" /></div>
            <span className="font-mono text-[13px] text-soft">{s.progress.percent}%</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href={`${LEARN_BASE}/modules/${current.number}/lessons/${lesson.number}`} size="md" arrow>{started ? `Resume lesson ${lesson.number}` : "Start the course"}</Button>
            <Button href={`${LEARN_BASE}/modules/${current.number}`} variant="glass" size="md">Module overview</Button>
          </div>
        </section>
      )}

      <StatStrip
        stats={[
          { value: `${s.progress.percent}%`, label: "course complete" },
          { value: `${s.done.size}/${s.progress.total}`, label: "lessons done" },
          { value: `${s.passedQuizzes.size}/${learnable.filter((m) => m.quiz).length}`, label: "quizzes passed" },
          { value: `${[...s.projects.values()].filter((p) => p.completed).length}/8`, label: "projects built" },
        ]}
      />

      <div className="flex flex-col gap-7 xl:flex-row xl:items-start">
        <section aria-labelledby="modules" className="flex min-w-0 flex-1 flex-col gap-4">
          <h2 id="modules" className="m-0 text-[26px] font-medium tracking-[-0.025em]">Modules</h2>
          <div className="grid gap-3.5 md:grid-cols-2">
            {s.modules.map((m) => {
              const done = m.lessons.filter((l) => s.done.has(l.number)).length;
              const pct = m.lessons.length ? Math.round((done / m.lessons.length) * 100) : 0;
              const color = s.stageColor.get(m.number) ?? "#5CC8FF";
              return (
                <Link key={m.number} href={`${LEARN_BASE}/modules/${m.number}`} className="glass flex flex-col gap-3.5 rounded-[22px] p-5 text-frost no-underline transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border font-mono text-[15px]" style={{ borderColor: color, color }}>{m.number}</span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <b className="text-[16.5px] font-medium leading-tight tracking-[-0.01em]">{m.title}</b>
                      <span className="text-[13px] text-mist">{m.stage} · {m.lessons.length} lessons</span>
                    </div>
                  </div>
                  <ProgressBar percent={pct} color={pct === 100 ? "#3DDC97" : color} label={`Module ${m.number} progress`} />
                  <div className="flex flex-wrap gap-1.5">
                    {m.exercise && <Tag tone={s.exercisesDone.has(m.number) ? "mint" : "neutral"}>Exercise{s.exercisesDone.has(m.number) ? " ✓" : ""}</Tag>}
                    {m.quiz && <Tag tone={s.passedQuizzes.has(m.number) ? "mint" : "neutral"}>Quiz{s.passedQuizzes.has(m.number) ? " ✓" : ""}</Tag>}
                    {m.project && <Tag tone={s.projects.get(m.project.projectId)?.completed ? "mint" : "neutral"}>Project{s.projects.get(m.project.projectId)?.completed ? " ✓" : ""}</Tag>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="flex w-full shrink-0 flex-col gap-4 xl:w-[340px]">
          <div className="glass rounded-3xl p-[22px]">
            <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-dim">Do next</span>
            {next.length === 0 ? (
              <p className="m-0 pt-3.5 text-[14.5px] leading-normal text-mist">{lesson ? "Keep going with your next lesson. Suggestions for quizzes, exercises and projects appear as you finish each module." : "You've finished every lesson. Check the Portfolio and Career Path pages."}</p>
            ) : (
              next.slice(0, 3).map((n, i) => (
                <Link key={n.href} href={n.href} className={`flex items-center gap-3.5 py-3.5 text-frost no-underline focus-visible:outline-2 focus-visible:outline-cyan ${i > 0 ? "border-t border-white/[0.06]" : ""}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-white/10 bg-white/[0.04]"><Icon name={n.icon} size={17} color="#5CC8FF" /></span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="text-[14.5px]">{n.title}</span><span className="text-[12.5px] text-mist">{n.note}</span></div>
                  <Icon name="arrow" size={15} color="#7D8392" />
                </Link>
              ))
            )}
          </div>
          <Link href={`${LEARN_BASE}/roadmap`} className="glass flex items-center justify-between gap-3 rounded-3xl p-[22px] text-frost no-underline hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-cyan">
            <div className="flex flex-col gap-1"><b className="text-[16px] font-medium">Learning roadmap</b><span className="text-[13.5px] text-mist">The whole journey, stage by stage.</span></div>
            <Icon name="map" size={20} color="#5CC8FF" />
          </Link>
        </aside>
      </div>
    </>
  );
}
