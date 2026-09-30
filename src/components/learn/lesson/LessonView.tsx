import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Icon } from "@/components/obsidian/Icon";
import { LessonRow } from "@/components/obsidian/LessonRow";
import { completeLessonAction } from "@/app/lab/ai-engineering/learn/actions";
import { extractToc } from "@/lib/aie/toc";
import type { ModuleContent } from "@/lib/aie/types";
import { LEARN_BASE } from "../nav";
import { lessonComponents } from "./mdx-components";
import { remarkCodeMeta } from "./remark-code-meta";

type Next = { label: string; href: string };

/** Where "Next" goes after the last lesson: the next tab this module has. */
function afterLessons(mod: ModuleContent): Next {
  const base = `${LEARN_BASE}/modules/${mod.number}`;
  if (mod.exercise) return { label: "Next: code exercise", href: `${base}/exercise` };
  if (mod.quiz) return { label: "Next: quiz", href: `${base}/quiz` };
  if (mod.project) return { label: "Next: project", href: `${base}/project` };
  if (mod.cheatSheet) return { label: "Next: cheat sheet", href: `${base}/cheat-sheet` };
  return { label: "Back to the overview", href: base };
}

export function LessonView({
  mod,
  lesson,
  body,
  done,
  data,
  furtherReading,
}: {
  mod: ModuleContent;
  lesson: string;
  body: string;
  done: Set<string>;
  data: Record<string, unknown>;
  furtherReading: string | null;
}) {
  const base = `${LEARN_BASE}/modules/${mod.number}`;
  const index = mod.lessons.findIndex((l) => l.number === lesson);
  const current = mod.lessons[index]!;
  const prev = mod.lessons[index - 1];
  const nextLesson = mod.lessons[index + 1];
  const isLast = !nextLesson;
  const next: Next = nextLesson ? { label: `Next: ${nextLesson.title}`, href: `${base}/lessons/${nextLesson.number}` } : afterLessons(mod);
  const toc = extractToc(body);
  const exercise = mod.exercise
    ? { href: `${base}/exercise`, title: mod.exercise.cardTitle ?? mod.lessons.find((l) => l.number === mod.exercise!.id)?.title ?? "Code exercise" }
    : undefined;
  const components = lessonComponents({ module: mod.number, data, exercise });

  return (
    <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
      <article className="flex min-w-0 max-w-[780px] flex-1 flex-col gap-[22px]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-cyan">Lesson {current.number}</span>
          <span className="font-mono text-[12px] text-dim">· {current.minutes} min read</span>
        </div>
        <h1 className="m-0 text-[36px] font-medium leading-[1.02] tracking-[-0.045em] sm:text-[52px]">{current.title}</h1>
        <MDXRemote source={body} components={components} options={{ blockJS: false, mdxOptions: { remarkPlugins: [remarkCodeMeta] } }} />

        {isLast && (mod.glossary?.length || furtherReading) ? (
          <div className="flex flex-col gap-6 pt-4">
            {furtherReading && (
              <section aria-labelledby="further-reading" className="flex flex-col gap-3">
                <h2 id="further-reading" className="m-0 text-[28px] font-medium tracking-[-0.025em]">Further reading</h2>
                <MDXRemote source={furtherReading} components={components} options={{ blockJS: false, mdxOptions: { remarkPlugins: [remarkCodeMeta] } }} />
              </section>
            )}
            {!!mod.glossary?.length && (
              <section aria-labelledby="glossary" className="flex flex-col gap-3">
                <h2 id="glossary" className="m-0 text-[28px] font-medium tracking-[-0.025em]">Glossary</h2>
                <dl className="glass m-0 flex flex-col rounded-[20px] p-2">
                  {mod.glossary.map((g) => (
                    <div key={g.term} className="flex flex-col gap-1 rounded-[14px] px-4 py-3.5">
                      <dt className="font-mono text-[13px] text-cyan-text">{g.term}</dt>
                      <dd className="m-0 text-[15.5px] leading-[1.6] text-soft">{g.definition}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        ) : null}

        <nav aria-label="Lesson navigation" className="flex flex-col-reverse items-stretch justify-between gap-4 border-t border-white/[0.08] pt-[22px] sm:flex-row sm:items-center">
          {prev ? (
            <Link
              href={`${base}/lessons/${prev.number}`}
              className="inline-flex min-h-11 items-center gap-2.5 text-[15px] text-soft no-underline hover:text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
            >
              <Icon name="back" size={17} color="#C9CCD4" />
              {prev.number} {prev.title}
            </Link>
          ) : (
            <span />
          )}
          <form action={completeLessonAction}>
            <input type="hidden" name="lessonId" value={current.number} />
            <input type="hidden" name="next" value={next.href} />
            <button
              type="submit"
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-full bg-frost px-[22px] text-[15px] font-medium text-void transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan sm:w-auto"
            >
              {next.label}
              <Icon name="arrow" size={17} color="#05060A" strokeWidth={2} />
            </button>
          </form>
        </nav>
      </article>

      <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px]">
        <div className="glass flex flex-col gap-0.5 rounded-[22px] p-2.5">
          <span className="px-3 pb-2 pt-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Module {mod.number} lessons</span>
          {mod.lessons.map((l) => (
            <LessonRow
              key={l.number}
              compact
              href={`${base}/lessons/${l.number}`}
              number={l.number}
              title={l.title}
              minutes={l.minutes}
              state={done.has(l.number) ? "done" : l.number === lesson ? "current" : "next"}
            />
          ))}
        </div>
        {toc.length > 0 && (
          <nav aria-label="On this page" className="glass flex flex-col gap-3 rounded-[22px] p-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">On this page</span>
            {toc.map((t, i) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={`text-[14.5px] no-underline hover:text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${i === 0 ? "text-frost" : "text-mist"}`}
              >
                {t.label}
              </a>
            ))}
          </nav>
        )}
        {mod.cheatSheet && (
          <Link
            href={`${base}/cheat-sheet`}
            className="flex items-center gap-3 rounded-[18px] border border-[rgba(61,220,151,0.35)] bg-[rgba(61,220,151,0.06)] p-4 text-frost no-underline hover:bg-[rgba(61,220,151,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            <Icon name="sheet" size={20} color="#7FF0BD" />
            <span className="flex-1 text-[14px] leading-[1.4]">Pin the one-page cheat sheet for this module</span>
          </Link>
        )}
      </aside>
    </div>
  );
}
