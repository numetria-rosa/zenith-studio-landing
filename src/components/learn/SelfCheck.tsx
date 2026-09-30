"use client";

import { useMemo, useState } from "react";
import { optionOrder } from "@/lib/aie/quiz";
import type { QuizQuestion } from "@/lib/aie/types";
import { RichText } from "./RichText";

/** Five ungraded questions: answer, see why straight away, running score. Nothing is stored. */
export function SelfCheck({ questions, seed }: { questions: QuizQuestion[]; seed: number }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const orders = useMemo(() => questions.map((q, i) => optionOrder(q, seed + i)), [questions, seed]);
  const score = questions.filter((q) => answers[q.id] !== undefined && q.options![answers[q.id]!]!.correct).length;
  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="m-0 font-mono text-[13px] text-soft">Self-check: {score} / {questions.length}</p>
      {questions.map((q, qi) => {
        const chosen = answers[q.id];
        return (
          <fieldset key={q.id} className="glass m-0 flex flex-col gap-3 rounded-[22px] border-0 p-6">
            <legend className="sr-only">Question {qi + 1}</legend>
            <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-cyan">Question {qi + 1} of {questions.length}</span>
            <p className="m-0 text-[17px] leading-[1.5]"><RichText text={q.question} /></p>
            <div role="radiogroup" aria-label={`Question ${qi + 1}`} className="flex flex-col gap-2.5">
              {orders[qi]!.map((oi, pos) => {
                const o = q.options![oi]!;
                const state = chosen === undefined ? "idle" : o.correct ? "right" : chosen === oi ? "wrong" : "idle";
                const look = { idle: "border-white/[0.12] bg-white/[0.03]", right: "border-[rgba(61,220,151,0.7)] bg-[rgba(61,220,151,0.10)]", wrong: "border-[rgba(255,92,122,0.7)] bg-[rgba(255,92,122,0.08)]" }[state];
                return (
                  <button key={oi} type="button" role="radio" aria-checked={chosen === oi} disabled={chosen !== undefined} onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))} className={`flex min-h-[54px] w-full items-center gap-3.5 rounded-[16px] border px-4 py-3 text-left text-[15px] leading-[1.45] text-frost disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${look}`}>
                    <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[9px] border border-white/25 font-mono text-[12.5px] text-soft">{"ABCDEF"[pos]}</span>
                    <span><RichText text={o.text} />{state === "right" && <span className="sr-only"> (correct answer)</span>}{state === "wrong" && <span className="sr-only"> (your answer, not correct)</span>}</span>
                  </button>
                );
              })}
            </div>
            {chosen !== undefined && (
              <p role="status" className="m-0 text-[14.5px] leading-[1.6] text-soft">
                <b className={q.options![chosen]!.correct ? "text-mint-text" : "text-ember-text"}>{q.options![chosen]!.correct ? "Correct. " : "Not quite. "}</b>
                <RichText text={q.options![chosen]!.why.replace(/^Correct\.\s*/, "")} />
              </p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
