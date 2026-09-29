import Link from "next/link";
import { Button } from "@/components/obsidian/Button";
import { Eyebrow } from "@/components/obsidian/Eyebrow";
import { Icon, type IconName } from "@/components/obsidian/Icon";
import { LessonRow } from "@/components/obsidian/LessonRow";
import { ProgressRing } from "@/components/obsidian/ProgressRing";
import { QUIZ_DRAW_SIZE, type ModuleContent } from "@/lib/aie/types";
import { LEARN_BASE } from "./nav";

function PracticeCard({
  href,
  icon,
  color,
  kind,
  title,
  note,
}: {
  href: string;
  icon: IconName;
  color: string;
  kind: string;
  title: string;
  note: string;
}) {
  return (
    <Link
      href={href}
      className="glass flex items-center gap-4 rounded-[20px] p-[18px] text-frost no-underline transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
    >
      <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[14px] border border-white/[0.12] bg-white/[0.05]">
        <Icon name={icon} size={22} color={color} />
      </span>
      <span className="flex flex-1 flex-col gap-[3px]">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color }}>
          {kind}
        </span>
        <b className="text-[16.5px] font-medium">{title}</b>
        <span className="text-[13px] text-mist">{note}</span>
      </span>
      <Icon name="arrow" size={18} color="#A9AEBA" />
    </Link>
  );
}

export function ModuleOverview({ mod, done }: { mod: ModuleContent; done: Set<string> }) {
  const base = `${LEARN_BASE}/modules/${mod.number}`;
  const lessonHref = (n: string) => `${base}/lessons/${n}`;
  const doneCount = mod.lessons.filter((l) => done.has(l.number)).length;
  const current = mod.lessons.find((l) => !done.has(l.number));
  const minutes = mod.minutes ?? mod.lessons.reduce((n, l) => n + l.minutes, 0);
  const quizQuestions = mod.quiz ? Math.min(QUIZ_DRAW_SIZE, mod.quiz.questions.length) : 0;

  const stats = [
    minutes > 0 && { value: `${minutes}m`, label: "of lessons" },
    mod.lessons.length > 0 && { value: String(mod.lessons.length), label: mod.lessons.length === 1 ? "lesson" : "lessons" },
    mod.exercise && { value: "1", label: "code exercise" },
    mod.quiz && { value: String(quizQuestions), label: "quiz questions" },
    mod.project && { value: "1", label: "project" },
  ].filter((s): s is { value: string; label: string } => Boolean(s));

  const resumeLabel = !current
    ? `Review lesson ${mod.lessons[0]?.number}`
    : doneCount === 0
      ? `Start lesson ${current.number}`
      : `Continue lesson ${current.number}`;
  const resumeHref = mod.lessons.length ? lessonHref((current ?? mod.lessons[0]).number) : null;

  const hasPractice = mod.exercise || mod.quiz || mod.project || mod.cheatSheet;

  return (
    <>
      <div
        className="relative grid gap-12 rounded-[30px] p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center"
        style={{
          border: "1px solid rgba(92,200,255,0.30)",
          background: "linear-gradient(135deg, rgba(92,200,255,0.10), rgba(59,107,255,0.06) 60%, rgba(255,255,255,0.02))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
        }}
      >
        <div className="flex flex-col gap-5">
          <Eyebrow className="!text-[12.5px] text-cyan">
            Module {mod.number}
            {minutes > 0 ? ` · ${minutes} minutes` : ""}
          </Eyebrow>
          <h1 className="m-0 text-[40px] font-medium leading-none tracking-[-0.045em] sm:text-[58px]">{mod.title}</h1>
          <p className="m-0 max-w-[640px] text-[18px] leading-[1.6] text-soft">{mod.summary}</p>
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-0 sm:gap-y-4">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex flex-col gap-1 sm:px-7 ${i === 0 ? "sm:pl-0" : "sm:border-l sm:border-white/10"}`}
                >
                  <b className="text-[30px] font-medium tracking-[-0.03em]">{s.value}</b>
                  <span className="text-[13.5px] text-mist">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {mod.lessons.length > 0 && resumeHref && (
          <div className="flex flex-col items-center gap-[18px]">
            <ProgressRing done={doneCount} total={mod.lessons.length} label="lessons done" />
            <Button href={resumeHref} size="md" arrow>
              {resumeLabel}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          {mod.lessons.length > 0 && (
            <>
              <div className="flex items-baseline justify-between">
                <h2 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Lessons</h2>
                <span className="text-[14px] text-mist">
                  {doneCount} of {mod.lessons.length} complete
                </span>
              </div>
              <div className="glass flex flex-col gap-1 rounded-3xl p-2.5">
                {mod.lessons.map((l) => (
                  <LessonRow
                    key={l.number}
                    href={lessonHref(l.number)}
                    number={l.number}
                    title={l.title}
                    minutes={l.minutes}
                    state={done.has(l.number) ? "done" : l.number === current?.number ? "current" : "next"}
                  />
                ))}
              </div>
            </>
          )}
          {mod.objectives.length > 0 && (
            <>
              <h2 className="m-0 mt-[18px] text-[26px] font-medium tracking-[-0.02em]">By the end you can</h2>
              <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
                {mod.objectives.map((o) => (
                  <li key={o} className="glass flex items-start gap-3 rounded-2xl p-4 text-[15px] leading-[1.45] text-soft">
                    <Icon name="check" size={18} color="#7FF0BD" strokeWidth={2.2} />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {hasPractice && (
          <div className="flex w-full shrink-0 flex-col gap-3.5 lg:w-[400px]">
            <h2 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Practice and build</h2>
            {mod.exercise && (
              <PracticeCard
                href={`${base}/exercise`}
                icon="code"
                color="#5CC8FF"
                kind="Code exercise"
                title={mod.exercise.cardTitle ?? mod.exercise.title}
                note={`Runs in the browser · ${mod.exercise.tests.length} tests`}
              />
            )}
            {mod.quiz && (
              <PracticeCard
                href={`${base}/quiz`}
                icon="quiz"
                color="#C7B0FF"
                kind="Module quiz"
                title={mod.quiz.cardTitle ?? `${quizQuestions} questions`}
                note={mod.quiz.cardNote ?? `Pass mark ${mod.quiz.passMark} of ${quizQuestions}`}
              />
            )}
            {mod.project && (
              <PracticeCard
                href={`${base}/project`}
                icon="box"
                color="#FFD27A"
                kind="Project"
                title={mod.project.title}
                note="Portfolio project · graded by rubric"
              />
            )}
            {mod.cheatSheet && (
              <PracticeCard
                href={`${base}/cheat-sheet`}
                icon="sheet"
                color="#7FF0BD"
                kind="Cheat sheet"
                title={mod.cheatSheet.title}
                note="Printable · copy-ready snippets"
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
