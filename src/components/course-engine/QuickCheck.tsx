"use client";

import { useEffect, useState } from "react";
import type { QuizQuestion } from "./QuizBlock";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* A lighter QuizBlock for the Foundation Bridge — same shuffled-question,
   mistake-driven-feedback UI, but with no server sync and no pass/fail
   gate. The Bridge is explicitly optional and self-paced (see the
   Orientation page), so there's no "module" for this to complete, and
   nothing here should be posted to /api/progress — module ids there are
   validated against the real course's module count (11), and a Foundation
   quiz isn't one of those modules. */
export function QuickCheck({ questions }: { questions: QuizQuestion[] }) {
  const [shuffled, setShuffled] = useState<QuizQuestion[]>(questions);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only randomization, avoids SSR hydration mismatch
    setShuffled(shuffle(questions).map((q) => ({ ...q, options: shuffle(q.options) })));
  }, [questions]);
  const [answered, setAnswered] = useState<Record<string, number>>({});
  const [score, setScore] = useState(0);
  const total = shuffled.length;
  const allDone = Object.keys(answered).length === total;

  function choose(qId: string, optIndex: number, correct: boolean) {
    if (answered[qId] !== undefined) return;
    setAnswered((prev) => ({ ...prev, [qId]: optIndex }));
    if (correct) setScore((s) => s + 1);
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {shuffled.map((q, qi) => {
        const chosen = answered[q.id];
        return (
          <div key={q.id} className="rounded-xl border border-[#232838] bg-[#151920] p-5">
            <div className="mb-3 font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.1em] text-[#676e7d]">
              Question {qi + 1} of {total}
            </div>
            <div className="mb-3 text-[15px] font-semibold text-[#eeeee7]">{q.text}</div>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                const isChosen = chosen === oi;
                const showState = chosen !== undefined;
                const cls = showState
                  ? opt.correct
                    ? "border-[#4ade95] bg-[#4ade95]/10"
                    : isChosen
                      ? "border-[#ff8585] bg-[#ff8585]/10"
                      : "border-[#232838] bg-[#191d26] opacity-60"
                  : "border-[#232838] bg-[#191d26] hover:border-[#333a4c]";
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={showState}
                    onClick={() => choose(q.id, oi, opt.correct)}
                    className={`rounded-lg border px-4 py-2.5 text-left text-[13.5px] transition ${cls}`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
            {chosen !== undefined && (
              <div className="mt-3 rounded-lg border border-[#232838] bg-[#0a0c10] p-4 text-[13px] leading-relaxed">
                {q.options[chosen].correct ? (
                  <p className="text-[#4ade95]">Correct. {q.options[chosen].principle ?? "That's the underlying principle here."}</p>
                ) : (
                  <div className="flex flex-col gap-2 text-[#eeeee7]">
                    <p><span className="font-semibold text-[#ff8585]">Why this is wrong: </span>{q.options[chosen].whyWrong}</p>
                    {q.options[chosen].misconception && (
                      <p><span className="font-semibold text-[#9aa0ae]">What you may be thinking: </span>{q.options[chosen].misconception}</p>
                    )}
                    {q.options[chosen].principle && (
                      <p><span className="font-semibold text-[#5fc2e8]">The principle: </span>{q.options[chosen].principle}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {allDone && (
        <div className="rounded-xl border border-[#333a4c] bg-[#151920] p-4 text-[14px] font-semibold text-[#eeeee7]">
          {score}/{total} — this is a self-check, not a gate. {score === total ? "Move on whenever you're ready." : "Reread anything that tripped you up, or move on and come back later."}
        </div>
      )}
    </div>
  );
}
