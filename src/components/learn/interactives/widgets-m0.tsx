"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { LEARN_BASE } from "@/components/learn/nav";
import { Btn, OptionButton, Result, fmt } from "./ui";

/* Module 0 (Orientation) widgets, ported from module-00.html. Wording is in interactives/0.text.json, data in 0.json. */

type Data = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- the widgets' own JSON
type Props = { data: Data };

const card = "rounded-[20px] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const arrow = (
  <div aria-hidden className="py-1 text-center font-mono text-[18px] text-dim">
    ↓
  </div>
);

// ------------------------------------------------------------------------------------------ 0.1 classify

export function M0Classify({ data }: Props) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  return (
    <div className="grid gap-3.5 md:grid-cols-2">
      {data.TASKS.map((t: { id: string; text: string; role: string; explain: string }) => {
        const picked = picks[t.id];
        return (
          <div key={t.id} className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="m-0 text-[15px] leading-[1.55] text-frost">{t.text}</p>
            <div className="flex flex-wrap gap-2">
              {data.ROLES.map((r: string) => {
                const state = !picked ? "idle" : r === t.role ? "right" : r === picked ? "wrong" : "dim";
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={!!picked}
                    onClick={() => setPicks((p) => ({ ...p, [t.id]: r }))}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
                      { idle: "border-white/[0.14] text-soft hover:border-cyan/40 hover:text-frost", right: "border-[rgba(61,220,151,0.55)] bg-[rgba(61,220,151,0.10)] text-frost", wrong: "border-[rgba(255,92,122,0.55)] bg-[rgba(255,92,122,0.08)] text-frost", dim: "border-white/[0.08] text-dim" }[state]
                    }`}
                  >
                    {r}
                    {state === "right" && <span className="sr-only"> (correct role)</span>}
                    {state === "wrong" && <span className="sr-only"> (your pick, not correct)</span>}
                  </button>
                );
              })}
            </div>
            {picked && <Result tone={picked === t.role ? "ok" : "bad"}>{t.explain}</Result>}
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------------------------------ 0.2 flow

export function M0Flow({ data }: Props) {
  const t = data.text.flow;
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[14.5px] leading-[1.6] text-mist">{t.intro}</p>
      <ol className="m-0 flex max-w-[460px] list-none flex-col p-0">
        {data.FLOW.map((f: { name: string; ai: boolean }, i: number) => (
          <li key={f.name}>
            {i > 0 && arrow}
            <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${f.ai ? "border-[rgba(92,200,255,0.45)] bg-[rgba(92,200,255,0.08)]" : "border-white/[0.08] bg-white/[0.02]"}`}>
              <span className="text-[15px] text-frost">{f.name}</span>
              <span className={`font-mono text-[11px] uppercase tracking-[0.1em] ${f.ai ? "text-cyan-text" : "text-dim"}`}>{f.ai ? t.ai : t.adjacent}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ------------------------------------------------------------------------------------------ 0.3 roles

export function M0Roles({ data }: Props) {
  const t = data.text.roles;
  const rows: [string, string][] = [["build", t.build], ["with", t.with], ["prog", t.prog], ["tools", t.tools], ["math", t.math], ["projects", t.projects]];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.ROLE_DETAILS.map((r: Data) => (
        <article key={r.name} className={`${card} flex flex-col gap-3`}>
          <h3 className="m-0 text-[18px] font-medium tracking-[-0.01em]">{r.name}</h3>
          <dl className="m-0 flex flex-col gap-2.5">
            {rows.map(([key, label]) => (
              <div key={key}>
                <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">{label}</dt>
                <dd className="m-0 text-[14.5px] leading-[1.55] text-soft">{r[key]}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------------------------------ 0.4 priority

export function M0Priority({ data }: Props) {
  const t = data.text.priority;
  const [filter, setFilter] = useState("all");
  const tone: Record<string, string> = { now: "border-[rgba(61,220,151,0.5)] text-mint-text", next: "border-[rgba(92,200,255,0.5)] text-cyan-text", spec: "border-[rgba(245,184,61,0.5)] text-amber-text" };
  const rows = data.PRIORITY.filter((p: { pri: string }) => filter === "all" || p.pri === filter);
  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={t.cols[1]} className="flex flex-wrap gap-2.5">
        {Object.entries(t.filters).map(([key, label]) => (
          <Btn key={key} primary={filter === key} aria-pressed={filter === key} onClick={() => setFilter(key)}>
            {label as string}
          </Btn>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
        <table className="w-full min-w-[720px] border-collapse text-left text-[14px] leading-[1.5]">
          <thead>
            <tr>
              {t.cols.map((c: string) => (
                <th key={c} scope="col" className="border-b border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-dim">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p: Data) => (
              <tr key={p.tech} className="border-b border-white/[0.06] last:border-b-0 align-top">
                <th scope="row" className="px-4 py-3 font-medium text-frost">
                  {p.tech}
                </th>
                <td className="px-4 py-3">
                  <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-[12.5px] ${tone[p.pri]}`}>{t.labels[p.pri]}</span>
                </td>
                <td className="px-4 py-3 text-soft">{p.why}</td>
                <td className="px-4 py-3 text-soft">{p.now}</td>
                <td className="px-4 py-3 text-soft">{p.later}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------ 0.5 toolbox

export function M0Eco({ data }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {data.ECOSYSTEM.map((e: { name: string; why: string; ex: string }) => (
        <article key={e.name} className={`${card} flex flex-col gap-2`}>
          <h3 className="m-0 text-[17px] font-medium tracking-[-0.01em]">{e.name}</h3>
          <p className="m-0 text-[14.5px] leading-[1.55] text-soft">{e.why}</p>
          <p className="m-0 font-mono text-[12.5px] leading-[1.5] text-cyan-text">{e.ex}</p>
        </article>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------------------------------ 0.6 roadmap

export function M0Roadmap({ data }: Props) {
  const t = data.text.roadmap;
  const look: Record<string, string> = {
    taught: "border-[rgba(92,200,255,0.45)] bg-[rgba(92,200,255,0.08)]",
    partial: "border-[rgba(245,184,61,0.40)] bg-[rgba(245,184,61,0.06)]",
    not: "border-white/[0.08] bg-white/[0.02]",
  };
  const tagTone: Record<string, string> = { taught: "text-cyan-text", partial: "text-amber-text", not: "text-dim" };
  return (
    <ol className="m-0 flex max-w-[640px] list-none flex-col p-0">
      {data.ROADMAP.map((r: { name: string; taught: string; why: string }, i: number) => (
        <li key={r.name}>
          {i > 0 && arrow}
          <div className={`flex flex-col gap-1.5 rounded-2xl border px-4 py-3.5 ${look[r.taught]}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[15.5px] font-medium text-frost">{r.name}</span>
              <span className={`font-mono text-[11px] uppercase tracking-[0.1em] ${tagTone[r.taught]}`}>{t[r.taught]}</span>
            </div>
            <p className="m-0 text-[14px] leading-[1.55] text-mist">{r.why}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ------------------------------------------------------------------------------------------ 0.7 path finder

export function M0Path({ data }: Props) {
  const t = data.text.path;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [shown, setShown] = useState(false);
  const total = data.PATH_QUESTIONS.length;

  const ranked = () => {
    const scores: Record<string, number> = Object.fromEntries(Object.keys(data.PATH_NAMES).map((k) => [k, 0]));
    data.PATH_QUESTIONS.forEach((pq: Data, qi: number) => {
      const opt = pq.opts[answers[qi]!];
      if (opt) for (const [k, v] of Object.entries(opt.tags)) scores[k] = (scores[k] ?? 0) + (v as number);
    });
    return Object.entries(scores).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0).slice(0, 3);
  };

  return (
    <div className="flex flex-col gap-5">
      {data.PATH_QUESTIONS.map((pq: Data, qi: number) => (
        <fieldset key={qi} className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-2 text-[15.5px] leading-[1.55] text-frost">
            {qi + 1}. {pq.q}
          </legend>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            {pq.opts.map((o: { t: string }, oi: number) => (
              <Btn key={o.t} primary={answers[qi] === oi} aria-pressed={answers[qi] === oi} onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))} className="justify-start text-left sm:flex-1">
                {o.t}
              </Btn>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-2.5">
        <Btn primary disabled={Object.keys(answers).length < total} onClick={() => setShown(true)}>
          {t.result}
        </Btn>
        <Btn
          onClick={() => {
            setAnswers({});
            setShown(false);
          }}
        >
          {t.reset}
        </Btn>
      </div>
      {shown && (
        <div role="status" className="flex flex-col gap-3 rounded-2xl border border-[rgba(92,200,255,0.30)] bg-[rgba(92,200,255,0.06)] p-5">
          <b className="font-mono text-[12.5px] font-medium uppercase tracking-[0.14em] text-cyan">{t.title}</b>
          {ranked().map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
              <span className="text-[16px] font-medium">{data.PATH_NAMES[k]}</span>
              <span className="font-mono text-[12.5px] text-mist">{fmt(t.score, { score: v })}</span>
            </div>
          ))}
          <p className="m-0 text-[13.5px] leading-[1.6] text-mist">
            {t.note1}
            <Link href={`${LEARN_BASE}/career`} className="text-cyan-text underline">
              {t.link}
            </Link>
            {t.note2}
          </p>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------ self-check

/** Same rule as the old page: at least 12 words and one of these ideas. */
const DEFINITION_HINTS = ["ai model", "language model", "llm", "production", "integrat", "build"];

export function M0SelfCheck({ data }: Props) {
  const t = data.text.selfCheck;
  const sc = data.selfCheck as { parts: Data[]; scoreLabel: string; note: string };
  const [text, setText] = useState("");
  const [written, setWritten] = useState(false); // status is judged when the field loses focus, as before
  const [picks, setPicks] = useState<Record<string, number>>({});

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const good = words >= 12 && DEFINITION_HINTS.some((k) => text.toLowerCase().includes(k));
  const status = !text.trim() ? "empty" : good ? "pass" : "fail";
  const choices = sc.parts.filter((p) => p.kind === "choice");
  const right = choices.filter((p) => p.options[picks[p.id]!]?.correct).length;
  const started = written || Object.keys(picks).length > 0;
  const pct = Math.round(((written && good ? 1 : 0) + right) / sc.parts.length * 100);

  return (
    <div className="flex flex-col gap-5">
      {sc.parts.map((p) => (
        <div key={p.label} className={`${card} flex flex-col gap-3`}>
          <b className="text-[16px] font-medium">{p.label}</b>
          {p.kind === "text" ? (
            <>
              <textarea
                aria-label={p.label}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={() => setWritten(text.trim() !== "")}
                placeholder={p.placeholder}
                rows={3}
                className="w-full rounded-xl border border-white/[0.12] bg-white/[0.03] px-3.5 py-2.5 text-[15px] text-frost placeholder:text-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
              />
              <span role="status" className={`text-[13.5px] ${!written ? "text-dim" : status === "pass" ? "text-mint-text" : status === "fail" ? "text-ember-text" : "text-dim"}`}>
                {!written || status === "empty" ? t.notWritten : status === "pass" ? t.good : t.try}
              </span>
            </>
          ) : (
            <Choice part={p} picked={picks[p.id]} onPick={(i) => setPicks((s) => ({ ...s, [p.id]: i }))} wrong={t.wrong} />
          )}
        </div>
      ))}
      {started && (
        <div role="status" className="flex flex-col gap-1 rounded-2xl border border-[rgba(92,200,255,0.30)] bg-[rgba(92,200,255,0.06)] p-5">
          <b className="text-[40px] font-medium tracking-[-0.04em]">{pct}%</b>
          <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-mist">{sc.scoreLabel}</span>
        </div>
      )}
      <p className="m-0 text-[14px] leading-[1.6] text-mist">{sc.note}</p>
    </div>
  );
}

function Choice({ part, picked, onPick, wrong }: { part: Data; picked?: number; onPick: (i: number) => void; wrong: string }): ReactNode {
  const opt = picked === undefined ? null : part.options[picked];
  return (
    <div className="flex flex-col gap-2.5">
      <p className="m-0 text-[15px] leading-[1.6] text-soft">{part.question}</p>
      {part.options.map((o: Data, i: number) => (
        <OptionButton key={o.t} disabled={picked !== undefined} state={picked === undefined ? "idle" : o.correct ? "correct" : i === picked ? "wrong" : "idle"} onClick={() => picked === undefined && onPick(i)}>
          {o.t}
        </OptionButton>
      ))}
      {opt && <Result tone={opt.correct ? "ok" : "bad"}>{opt.correct ? opt.correctText : `${wrong}${opt.reason}`}</Result>}
    </div>
  );
}
