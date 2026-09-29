"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { saveProjectAction } from "@/app/lab/ai-engineering/learn/actions";
import { Icon } from "@/components/obsidian/Icon";
import { rubricScore, safeHttpUrl } from "@/lib/aie/project";
import type { ProjectProgress } from "@/lib/aie/progress";
import { RUBRIC_LEVELS, type ProjectDetail } from "@/lib/aie/types";

const glass = "border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";
const card = `flex flex-col gap-1.5 rounded-[24px] p-6 ${glass}`;

/** `code` spans in the project copy (a run of backticks closes with a run of the same length). */
function Inline({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(/(`+)([\s\S]+?)(?!`)/g)) {
    out.push(<Fragment key={last}>{text.slice(last, m.index)}</Fragment>);
    out.push(
      <code key={m.index} className="font-mono text-[0.92em] text-cyan-text">
        {m[2]!.trim()}
      </code>,
    );
    last = m.index! + m[0].length;
  }
  out.push(<Fragment key="end">{text.slice(last)}</Fragment>);
  return <>{out}</>;
}

const hintTiers = [
  { title: "Hint 1: conceptual", body: "Re-read the relevant module's cheat sheet section before diving into code, the requirements above map directly onto concepts already covered." },
  { title: "Hint 2: specific", body: 'Look at the "Common mistakes" list above first, most students hit exactly one of those, identify which one applies to your current approach before writing more code.' },
];

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13.5px] text-soft">
        {label}
      </label>
      {children}
    </div>
  );
}
const input = `min-h-11 w-full rounded-xl border border-white/[0.12] bg-white/[0.03] px-3.5 text-[15px] text-frost placeholder:text-dim ${focus}`;

export function ProjectView({ project, initial, moduleLabel, portfolioHref }: { project: ProjectDetail; initial: ProjectProgress | null; moduleLabel: string; portfolioHref: string }) {
  const [checklist, setChecklist] = useState<boolean[]>(() => project.acceptance.map((_, i) => initial?.checklist[i] ?? false));
  const [rubric, setRubric] = useState<Record<string, number>>(() => Object.fromEntries(project.rubric.map((r) => [r.key, initial?.rubric[r.key] ?? 0])));
  const [github, setGithub] = useState(initial?.githubUrl ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tech, setTech] = useState(initial?.technologies ?? "");
  const [tests, setTests] = useState(initial?.testsPassed ?? "");
  const [completed, setCompleted] = useState(initial?.completed ?? false);
  const [hints, setHints] = useState(0);
  const [note, setNote] = useState<{ tone: "ok" | "bad" | "info"; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const first = useRef(true);

  const score = rubricScore(project, rubric);
  const started = checklist.some(Boolean) || score > 0;
  const status = completed ? `Submitted, ${score}%` : started ? "In progress" : "Not started";
  const safeUrl = github.trim() ? safeHttpUrl(github) : "";
  const body = () => ({ checklist, rubric, githubUrl: github, description, technologies: tech, testsPassed: tests });

  // Autosave the checklist and rubric shortly after a change.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveProjectAction(project.id, { ...body(), githubUrl: safeHttpUrl(github) ? github : "" }, false)
        .then(() => setNote({ tone: "info", text: "Progress saved." }))
        .catch(() => setNote({ tone: "bad", text: "Could not save your progress. Check your connection." }));
    }, 700);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklist, rubric]);

  const submit = async () => {
    if (safeUrl === null) return setNote({ tone: "bad", text: "That is not a valid http or https URL, so it would not show as a link in your portfolio." });
    setNote({ tone: "info", text: "Saving…" });
    try {
      await saveProjectAction(project.id, body(), true);
      setCompleted(true);
      setNote({ tone: "ok", text: "Saved. This project now appears in My Portfolio." });
    } catch {
      setNote({ tone: "bad", text: "Could not save the project. Check your connection and try again." });
    }
  };

  const meta: [string, string][] = [
    ["Status", status],
    ["Uses", moduleLabel],
    ["Level", project.difficulty],
    ["Adds to", "My Portfolio"],
  ];

  return (
    <div className="flex flex-col gap-9">
      <section className="grid gap-8 rounded-[30px] border border-[rgba(245,184,61,0.30)] bg-[linear-gradient(135deg,rgba(245,184,61,0.09),rgba(255,255,255,0.02)_60%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] sm:p-[38px] lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <div className="flex flex-col gap-[18px]">
          <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-amber-text">Project {project.id} · Portfolio</span>
          <h1 className="m-0 text-[38px] font-medium leading-[1.02] tracking-[-0.045em] sm:text-[52px]">{project.title}</h1>
          <p className="m-0 max-w-[640px] text-[17.5px] leading-[1.65] text-soft">{project.summary}</p>
          <div className="flex flex-wrap gap-3">
            <a href="#starting-point" className={`inline-flex min-h-[46px] items-center gap-2.5 rounded-full bg-frost px-[22px] text-[15px] font-medium text-void no-underline ${focus}`}>
              Start project
              <Icon name="arrow" size={16} color="#05060A" strokeWidth={2} />
            </a>
            <a href="#submission" className={`inline-flex min-h-[46px] items-center gap-2.5 rounded-full px-[22px] text-[15px] font-medium text-frost no-underline ${glass} ${focus}`}>
              Submit your project
              <Icon name="arrow" size={16} color="#F5F6F8" />
            </a>
          </div>
        </div>
        <dl className="m-0 flex flex-col gap-3 rounded-[22px] border border-white/10 bg-[rgba(5,6,10,0.55)] p-[22px]">
          {meta.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-white/[0.06] pb-[11px] text-[14.5px] last:border-b-0 last:pb-0">
              <dt>{k}</dt>
              <dd className="m-0 text-right font-medium" aria-live={k === "Status" ? "polite" : undefined}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="starting-point" className={`${card} scroll-mt-24`}>
        <h2 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">Starting point</h2>
        <p className="m-0 max-w-[820px] text-[15.5px] leading-[1.6] text-soft">
          <Inline text={project.start} />
        </p>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <section className={card}>
            <h2 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">Requirements</h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {project.requirements.map((r, i) => (
                <li key={i} className={`flex items-start gap-3.5 py-3.5 ${i ? "border-t border-white/[0.06]" : ""}`}>
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-text" />
                  <span className="text-[15.5px] leading-[1.5] text-soft">
                    <Inline text={r} />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={card}>
            <h2 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">Acceptance criteria</h2>
            <p className="m-0 mb-1 text-[14px] text-mist">Tick each one when your project meets it.</p>
            <ul className="m-0 flex list-none flex-col p-0">
              {project.acceptance.map((a, i) => (
                <li key={i} className={i ? "border-t border-white/[0.06]" : ""}>
                  <label className="flex min-h-11 cursor-pointer items-start gap-3.5 py-3.5">
                    <input
                      type="checkbox"
                      checked={checklist[i]}
                      onChange={(e) => setChecklist((c) => c.map((v, j) => (j === i ? e.target.checked : v)))}
                      className="peer sr-only"
                    />
                    <span aria-hidden className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-white/[0.22] peer-checked:border-[rgba(61,220,151,0.55)] peer-checked:bg-[rgba(61,220,151,0.16)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
                      <Icon name="check" size={14} color="#7FF0BD" strokeWidth={2.6} />
                    </span>
                    <span className="text-[15.5px] leading-[1.5] text-soft">
                      <Inline text={a} />
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className={card}>
            <h2 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">Test cases to verify against</h2>
            <ul className="m-0 flex list-disc flex-col gap-2 pl-5 marker:text-dim">
              {project.tests.map((t, i) => (
                <li key={i} className="text-[15px] leading-[1.55] text-soft">
                  <Inline text={t} />
                </li>
              ))}
            </ul>
          </section>

          <section className={card}>
            <h2 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">Common mistakes</h2>
            <ul className="m-0 flex list-disc flex-col gap-2 pl-5 marker:text-dim">
              {project.mistakes.map((t, i) => (
                <li key={i} className="text-[15px] leading-[1.55] text-soft">
                  <Inline text={t} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className={card}>
            <h2 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">Rubric self-assessment</h2>
            {project.rubric.map((r) => {
              const id = `rubric-${r.key}`;
              return (
                <div key={r.key} className="flex flex-col gap-2 border-t border-white/[0.06] py-3 first:border-t-0">
                  <div className="grid grid-cols-[minmax(0,1fr)_96px_44px] items-center gap-3.5">
                    <label htmlFor={id} className="text-[15px]">
                      {r.label}
                    </label>
                    <span aria-hidden className="h-1.5 rounded-[3px] bg-white/[0.08]">
                      <span className="block h-full rounded-[3px] bg-amber-text transition-[width] duration-300" style={{ width: `${rubric[r.key]}%` }} />
                    </span>
                    <b className="text-right font-mono text-[13px] font-medium text-soft">{r.weight}%</b>
                  </div>
                  <select id={id} value={rubric[r.key]} onChange={(e) => setRubric((c) => ({ ...c, [r.key]: Number(e.target.value) }))} className={`${input} appearance-none`}>
                    {RUBRIC_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
            <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[15px]">
              <span>Estimated score</span>
              <b className="text-[22px] font-medium tracking-[-0.02em]" aria-live="polite">
                {score}%
              </b>
            </div>
          </section>

          <section className={card}>
            <h2 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">Hints</h2>
            {[...hintTiers, { title: "Hint 3: near-solution", body: project.solution.join(" ") }].slice(0, hints).map((h) => (
              <div key={h.title} role="note" className="mb-2 flex gap-3 rounded-[18px] border border-[rgba(245,184,61,0.45)] bg-[rgba(245,184,61,0.07)] p-4 text-[14px] leading-[1.6] text-[#FFE3A6]">
                <Icon name="bulb" size={20} color="#FFD27A" className="shrink-0" />
                <span>
                  <b className="mb-1 block font-mono text-[11.5px] font-medium uppercase tracking-[0.12em] text-amber-text">{h.title}</b>
                  <Inline text={h.body} />
                </span>
              </div>
            ))}
            <button type="button" onClick={() => setHints((n) => Math.min(3, n + 1))} disabled={hints >= 3} className={`inline-flex min-h-11 w-fit items-center gap-2 rounded-full px-[18px] text-[14.5px] font-medium text-frost disabled:opacity-50 ${glass} ${focus}`}>
              <Icon name="bulb" size={16} color="#F5F6F8" />
              {hints >= 3 ? "No more hints" : "Hint"}
            </button>
            <details className="mt-3">
              <summary className={`min-h-11 cursor-pointer py-2.5 text-[15px] text-soft ${focus}`}>Suggested solution outline</summary>
              <ol className="m-0 mt-2 flex list-decimal flex-col gap-2 pl-5 text-[14.5px] leading-[1.6] text-mist marker:text-dim">
                {project.solution.map((s, i) => (
                  <li key={i}>
                    <Inline text={s} />
                  </li>
                ))}
              </ol>
            </details>
          </section>
        </div>
      </div>

      <section id="submission" className={`${card} scroll-mt-24`}>
        <h2 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">Submission</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="gh-url" label="GitHub URL (optional)">
            <input id="gh-url" type="url" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/you/project-name" className={input} />
            {github.trim() && (
              <span className="text-[13px]">
                {safeUrl ? (
                  <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-text">
                    {github} ↗
                  </a>
                ) : (
                  <span className="text-ember-text">Not a valid http or https URL, it won&apos;t render as a link in your portfolio</span>
                )}
              </span>
            )}
          </Field>
          <Field id="proj-tests" label="Tests passed (self-reported, e.g. 18/20)">
            <input id="proj-tests" value={tests} onChange={(e) => setTests(e.target.value)} placeholder="18/20" className={input} />
          </Field>
          <Field id="proj-tech" label="Technologies used">
            <input id="proj-tech" value={tech} onChange={(e) => setTech(e.target.value)} placeholder="e.g. Python, OpenAI SDK, pytest" className={input} />
          </Field>
          <Field id="proj-desc" label="Short description">
            <textarea id="proj-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="One or two sentences describing what you built..." className={`${input} py-2.5`} />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button type="button" onClick={submit} className={`inline-flex min-h-12 items-center gap-2.5 rounded-full bg-frost px-[26px] text-[15.5px] font-medium text-void ${focus}`}>
            Save project
            <Icon name="check" size={16} color="#05060A" strokeWidth={2.4} />
          </button>
          {completed && (
            <Link href={portfolioHref} className={`text-[14.5px] text-cyan-text ${focus}`}>
              View in My Portfolio
            </Link>
          )}
          <span role="status" className={`text-[14px] ${note?.tone === "bad" ? "text-ember-text" : note?.tone === "ok" ? "text-mint-text" : "text-mist"}`}>
            {note?.text}
          </span>
        </div>
      </section>
    </div>
  );
}
