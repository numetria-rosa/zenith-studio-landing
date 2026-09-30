"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { submitQuizAction } from "@/app/lab/ai-engineering/learn/actions";
import { Icon } from "@/components/obsidian/Icon";
import { drawQuestions, isCorrect, type QuizAnswer } from "@/lib/aie/quiz";
import type { QuizQuestion } from "@/lib/aie/types";

const unescape = (s: string) => s.replace(/\\([\\`*_{}[\]()#+\-.!<>])/g, "$1");

/** Quiz strings are plain text with `code` spans and MDX escapes (\[ \]). Fenced spans of any backtick length are honoured. */
function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(/(`+)([\s\S]+?)\1(?!`)/g)) {
    parts.push(<Fragment key={last}>{unescape(text.slice(last, m.index))}</Fragment>);
    parts.push(
      <code key={m.index} className="font-mono text-[0.9em] text-cyan-text">
        {m[2]!.trim()}
      </code>,
    );
    last = m.index! + m[0].length;
  }
  parts.push(<Fragment key="end">{unescape(text.slice(last))}</Fragment>);
  return <>{parts}</>;
}

const glass = "border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";

type Props = {
  module: number;
  title: string;
  bank: QuizQuestion[];
  passMark: number;
  seed: number;
  stuck: { href: string; label: string };
  next: { href: string; label: string };
};

export function QuizView({ module, title, bank, passMark, seed, stuck, next }: Props) {
  const [round, setRound] = useState(0);
  const questions = useMemo(() => drawQuestions(bank, seed + round * 7919), [bank, seed, round]);
  const total = questions.length;
  const [q, setQ] = useState(0);
  const [sel, setSel] = useState<number>(-1);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const Q = questions[q]!;
  const answer: QuizAnswer | null = Q.numeric ? (typed.trim() === "" ? null : typed) : sel >= 0 ? sel : null;
  const right = checked && answer !== null && isCorrect(Q, answer);
  const picked = Q.options?.[sel];
  const why = Q.numeric ? (right ? Q.numeric.correct : Q.numeric.incorrect) : picked?.why;
  const correctOption = Q.options?.find((o) => o.correct);
  const last = q === total - 1;
  const score = questions.filter((x) => answers[x.id] !== undefined && isCorrect(x, answers[x.id]!)).length;

  const finish = async (all: Record<string, QuizAnswer>) => {
    setSaving(true);
    setError(null);
    try {
      setResult(await submitQuizAction({ module }, all));
    } catch {
      // Not saved: still show the score the student earned, and say so.
      const s = questions.filter((x) => isCorrect(x, all[x.id]!)).length;
      setResult({ score: s, passed: s >= passMark });
      setError("Your attempt could not be saved. Check your connection and retake the quiz to record a score.");
    }
    setSaving(false);
  };

  const onMain = () => {
    if (answer === null || saving) return;
    if (!checked) {
      setAnswers((a) => ({ ...a, [Q.id]: answer }));
      setChecked(true);
      return;
    }
    if (last) return void finish(answers);
    setQ(q + 1);
    setSel(-1);
    setTyped("");
    setChecked(false);
  };

  const retake = () => {
    setRound((r) => r + 1);
    setQ(0);
    setSel(-1);
    setTyped("");
    setChecked(false);
    setAnswers({});
    setResult(null);
    setError(null);
  };

  const dots = questions.map((x, i) => {
    const done = i < q || (i === q && checked);
    return { done, ok: done && answers[x.id] !== undefined && isCorrect(x, answers[x.id]!), current: i === q };
  });

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-col gap-2.5">
        <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-cyan">Module {module} quiz</span>
        <h1 className="m-0 text-[36px] font-medium leading-[1.05] tracking-[-0.04em] sm:text-[44px]">{title}</h1>
      </div>

      <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
        {!result ? (
          <section aria-label="Question" className={`flex min-w-0 flex-1 flex-col gap-6 rounded-[28px] p-6 sm:p-9 ${glass}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12.5px] uppercase tracking-[0.14em] text-cyan">
                Question {q + 1} of {total}
              </span>
              <div className="flex items-center gap-1.5" role="img" aria-label={`Question ${q + 1} of ${total}`}>
                {dots.map((d, i) => (
                  <span
                    key={i}
                    className="h-2.5 rounded-[5px] transition-all duration-300"
                    style={{
                      width: d.current ? 34 : 10,
                      background: d.done ? (d.current ? (d.ok ? "#3DDC97" : "#FF5C7A") : "#5CC8FF") : d.current ? "#F5F6F8" : "rgba(255,255,255,0.14)",
                    }}
                  />
                ))}
              </div>
            </div>

            <h2 className="m-0 max-w-[760px] text-[24px] font-medium leading-[1.25] tracking-[-0.025em] sm:text-[30px]">
              <Inline text={Q.question} />
            </h2>

            {Q.numeric ? (
              <div className="flex flex-col gap-2.5">
                <label htmlFor="quiz-number" className="text-[15px] text-soft">
                  Type your answer as a number
                </label>
                <input
                  id="quiz-number"
                  inputMode="decimal"
                  autoComplete="off"
                  value={typed}
                  disabled={checked}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onMain()}
                  className={`min-h-[60px] w-full max-w-[280px] rounded-[18px] border bg-white/[0.03] px-[18px] font-mono text-[20px] text-frost ${focus} ${
                    checked ? (right ? "border-[rgba(61,220,151,0.7)] bg-[rgba(61,220,151,0.10)]" : "border-[rgba(255,92,122,0.7)] bg-[rgba(255,92,122,0.08)]") : "border-white/[0.12]"
                  }`}
                />
              </div>
            ) : (
              <div role="radiogroup" aria-label="Answers" className="flex flex-col gap-2.5">
                {Q.options!.map((o, i) => {
                  const isSel = sel === i;
                  const state = checked ? (o.correct ? "right" : isSel ? "wrong" : "idle") : isSel ? "sel" : "idle";
                  const look = {
                    idle: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.03)", "rgba(255,255,255,0.25)"],
                    sel: ["#5CC8FF", "rgba(92,200,255,0.10)", "#5CC8FF"],
                    right: ["rgba(61,220,151,0.7)", "rgba(61,220,151,0.10)", "#3DDC97"],
                    wrong: ["rgba(255,92,122,0.7)", "rgba(255,92,122,0.08)", "#FF5C7A"],
                  }[state];
                  return (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={isSel}
                      disabled={checked}
                      onClick={() => setSel(i)}
                      className={`flex min-h-[60px] w-full items-center gap-4 rounded-[18px] border px-[18px] py-3.5 text-left text-[16px] leading-[1.4] text-frost transition-all duration-200 disabled:cursor-default ${focus}`}
                      style={{ borderColor: look[0], background: look[1] }}
                    >
                      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] border font-mono text-[13px] text-soft" style={{ borderColor: look[2] }}>
                        {"ABCDEF"[i]}
                      </span>
                      <span>
                        <Inline text={o.text} />
                        {state === "right" && <span className="sr-only"> (correct answer)</span>}
                        {state === "wrong" && <span className="sr-only"> (your answer, not correct)</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {checked && (
              <div role="status" className={`flex gap-3.5 rounded-[18px] border px-5 py-[18px] ${right ? "border-[rgba(61,220,151,0.45)] bg-[rgba(61,220,151,0.07)]" : "border-[rgba(255,92,122,0.45)] bg-[rgba(255,92,122,0.07)]"}`}>
                <Icon name={right ? "check" : "close"} size={20} color={right ? "#7FF0BD" : "#FF9BB0"} strokeWidth={2.4} className="mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <b className={`text-[16px] font-medium ${right ? "text-mint-text" : "text-ember-text"}`}>{right ? "Correct" : "Not quite"}</b>
                  <span className="text-[15px] leading-[1.55] text-soft">{why ? <Inline text={why} /> : null}</span>
                  {!right && correctOption && correctOption.why !== why && (
                    <span className="mt-1 text-[15px] leading-[1.55] text-soft">
                      <b className="font-medium text-frost">The answer: </b>
                      <Inline text={correctOption.text} />
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onMain}
                aria-disabled={answer === null}
                disabled={saving}
                className={`inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-frost px-[26px] text-[15.5px] font-medium text-void transition-opacity ${focus} ${answer === null ? "opacity-45" : ""}`}
              >
                {saving ? "Saving…" : checked ? (last ? "See my score" : "Next question") : "Check answer"}
                <Icon name="arrow" size={16} color="#05060A" strokeWidth={2} />
              </button>
            </div>
          </section>
        ) : (
          <section aria-label="Your score" className="flex min-w-0 flex-1 flex-col items-start gap-5 rounded-[28px] border border-[rgba(92,200,255,0.30)] bg-[linear-gradient(135deg,rgba(92,200,255,0.10),rgba(255,255,255,0.02))] p-6 sm:p-12">
            <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-cyan">Your score</span>
            <b className="text-[64px] font-medium leading-none tracking-[-0.05em] sm:text-[88px]">
              {result.score} / {total}
            </b>
            <div className="h-2 w-full max-w-[520px] rounded bg-white/[0.08]" role="img" aria-label={`${result.score} of ${total} correct`}>
              <div className="h-full rounded bg-cyan" style={{ width: `${(result.score / total) * 100}%` }} />
            </div>
            <p role="status" className="m-0 max-w-[560px] text-[18px] leading-[1.6] text-soft">
              {result.passed ? "Passed. This counts toward your final assessment." : `You need ${passMark} of ${total} to pass. Re-read the lessons, then try again.`}
            </p>
            {error && <p className="m-0 max-w-[560px] text-[14.5px] leading-[1.55] text-ember-text">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={retake} className={`inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-[26px] text-[15.5px] font-medium text-frost ${glass} ${focus}`}>
                <Icon name="reset" size={16} color="#F5F6F8" />
                Retake quiz
              </button>
              <Link href={next.href} className={`inline-flex min-h-12 items-center gap-2.5 rounded-full bg-frost px-[22px] text-[15px] font-medium text-void no-underline ${focus}`}>
                {next.label}
                <Icon name="arrow" size={16} color="#05060A" strokeWidth={2} />
              </Link>
            </div>
          </section>
        )}

        <aside className="flex w-full shrink-0 flex-col gap-3.5 lg:w-[320px]">
          <div className={`flex flex-col gap-3.5 rounded-[22px] p-[22px] ${glass}`}>
            <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-dim">About this quiz</span>
            {[
              ["Questions", String(total)],
              ["To pass", `${passMark} of ${total}`],
              ["Attempts", "Unlimited"],
              ["Counts toward", "Final assessment"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/[0.06] pb-3 text-[14.5px]">
                {k}
                <b className="font-medium">{v}</b>
              </div>
            ))}
          </div>
          <Link href={stuck.href} className={`flex items-center gap-3 rounded-[20px] p-[18px] text-frost no-underline ${glass} ${focus}`}>
            <Icon name="list" size={20} color="#9BDDFF" />
            <span className="flex-1 text-[14.5px] leading-[1.45]">{stuck.label}</span>
            <Icon name="arrow" size={18} color="#A9AEBA" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
