"use client";

import { useMemo, useState } from "react";
import { submitChallengeAction } from "@/app/lab/ai-engineering/learn/actions";
import { Icon } from "@/components/obsidian/Icon";
import type { Challenge } from "@/lib/aie/content";
import { optionOrder } from "@/lib/aie/quiz";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";

/** One cross-module scenario: read the system or incident, answer each call, see why immediately, pass with every answer right. */
export function ChallengeRunner({ challenge, index, seed, best }: { challenge: Challenge; index: number; seed: number; best: boolean }) {
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const total = challenge.questions.length;
  const orders = useMemo(() => challenge.questions.map((q, i) => optionOrder(q, seed + round * 131 + i)), [challenge, seed, round]);
  const answered = Object.keys(answers).length;

  const pick = async (qid: string, optionIndex: number) => {
    if (answers[qid] !== undefined || saving) return;
    const next = { ...answers, [qid]: optionIndex };
    setAnswers(next);
    if (Object.keys(next).length < total) return;
    setSaving(true);
    setError(null);
    try {
      setResult(await submitChallengeAction(challenge.id, next));
    } catch {
      const score = challenge.questions.filter((q) => q.options![next[q.id]!]!.correct).length;
      setResult({ score, passed: score === total });
      setError("Your attempt could not be saved. Check your connection and retry to record it.");
    }
    setSaving(false);
  };
  const retry = () => { setRound((r) => r + 1); setAnswers({}); setResult(null); setError(null); };

  return (
    <section aria-labelledby={`c-${challenge.id}`} className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] border border-amber-text/60 font-mono text-[16px] text-amber-text">{index}</span>
        <div className="flex flex-col gap-1.5">
          <h2 id={`c-${challenge.id}`} className="m-0 text-[26px] font-medium tracking-[-0.03em]">{challenge.title}</h2>
          <p className="m-0 max-w-[720px] text-[15.5px] leading-[1.6] text-mist">{challenge.intro}</p>
          {best && <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-mint-text">Passed before</span>}
        </div>
      </div>

      {challenge.pipeline && (
        <div className="glass flex flex-col gap-3 rounded-[22px] p-5">
          <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-dim">System under design</span>
          <div className="flex flex-wrap items-center gap-2 text-[14px]">
            {challenge.pipeline.map((p, i) => (
              <span key={p} className="flex items-center gap-2"><span className="rounded-full border border-white/[0.14] bg-white/[0.04] px-3 py-1.5">{p}</span>{i < challenge.pipeline!.length - 1 && <Icon name="arrow" size={14} color="#7D8392" />}</span>
            ))}
          </div>
          {challenge.note && <p className="m-0 text-[14px] leading-[1.6] text-mist">{challenge.note}</p>}
        </div>
      )}

      {challenge.stats && (
        <div className="glass flex flex-col gap-4 rounded-[22px] p-5">
          <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-dim">Incident symptoms</span>
          <div className="grid gap-3 sm:grid-cols-3">
            {challenge.stats.map((s) => (
              <div key={s.label} className="rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <b className={`text-[20px] font-medium ${s.bad ? "text-ember-text" : ""}`}>{s.value}</b>
                <div className="text-[12.5px] text-mist">{s.label}</div>
              </div>
            ))}
          </div>
          {challenge.logs && (
            <div role="group" aria-label="Incident log" className="overflow-x-auto rounded-[14px] border border-white/10 bg-[rgba(5,6,10,0.6)] p-4 font-mono text-[12.5px] leading-[1.9]">
              {challenge.logs.map((l, i) => (
                <div key={i} className={`whitespace-nowrap ${l.err ? "text-ember-text" : "text-mist"}`}>
                  <span className="text-dim">{l.time}</span> <span className="text-violet-text">{l.req}</span> <span className="text-mint-text">{l.kind}</span> — {l.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {challenge.questions.map((q, qi) => {
        const chosen = answers[q.id];
        const done = chosen !== undefined;
        return (
          <fieldset key={q.id} className="glass m-0 flex min-w-0 flex-col gap-3 rounded-[22px] border-0 p-6">
            <legend className="sr-only">{q.label}</legend>
            <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-cyan">{q.label}</span>
            {q.question !== q.label && <p className="m-0 text-[17px] leading-[1.5] text-frost">{q.question}</p>}
            <div role="radiogroup" aria-label={q.label} className="flex flex-col gap-2.5">
              {orders[qi]!.map((oi, pos) => {
                const o = q.options![oi]!;
                const state = done ? (o.correct ? "right" : chosen === oi ? "wrong" : "idle") : "idle";
                const border = { idle: "border-white/[0.12] bg-white/[0.03]", right: "border-[rgba(61,220,151,0.7)] bg-[rgba(61,220,151,0.10)]", wrong: "border-[rgba(255,92,122,0.7)] bg-[rgba(255,92,122,0.08)]" }[state];
                return (
                  <button key={oi} type="button" role="radio" aria-checked={chosen === oi} disabled={done} onClick={() => pick(q.id, oi)} className={`flex min-h-[54px] w-full items-center gap-3.5 rounded-[16px] border px-4 py-3 text-left text-[15px] leading-[1.45] text-frost disabled:cursor-default ${border} ${focus}`}>
                    <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[9px] border border-white/25 font-mono text-[12.5px] text-soft">{"ABCDEF"[pos]}</span>
                    <span>{o.text}{state === "right" && <span className="sr-only"> (correct answer)</span>}{state === "wrong" && <span className="sr-only"> (your answer, not correct)</span>}</span>
                  </button>
                );
              })}
            </div>
            {done && (
              <p role="status" className="m-0 text-[14.5px] leading-[1.6] text-soft">
                <b className={q.options![chosen]!.correct ? "text-mint-text" : "text-ember-text"}>{q.options![chosen]!.correct ? "Correct. " : "Not quite. "}</b>
                {q.options![chosen]!.correct ? "" : q.options![chosen]!.why || "See the correct option above."}
              </p>
            )}
          </fieldset>
        );
      })}

      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-[22px] px-6 py-4" aria-live="polite">
        <span className="text-[15px] text-soft">
          {saving ? "Saving…" : result ? `${result.score} / ${total} correct. ${result.passed ? "Challenge passed." : "Every answer needs to be right to pass. Review the explanations and retry."}` : `${answered} / ${total} answered`}
          {error && <span className="ml-2 text-ember-text">{error}</span>}
        </span>
        {result && (
          <button type="button" onClick={retry} className={`glass inline-flex min-h-11 items-center gap-2 rounded-full px-[18px] text-[14px] font-medium text-frost hover:bg-white/[0.07] ${focus}`}>
            <Icon name="reset" size={15} /> Retry this challenge
          </button>
        )}
      </div>
    </section>
  );
}
