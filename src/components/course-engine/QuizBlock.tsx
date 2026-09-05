"use client";

import { useEffect, useState } from "react";

export type QuizOption = {
  text: string;
  correct: boolean;
  /** Only for wrong options - the mistake-driven feedback system (course
      brief section 11): why it's wrong, what reasoning likely produced it,
      the durable rule, and a targeted correction. */
  whyWrong?: string;
  misconception?: string;
  principle?: string;
  tryThis?: string;
  /** Optional Socratic follow-up: a guiding question shown FIRST on a wrong
      answer, before the full explanation - nudging the student to find
      their own mistake rather than reading the answer immediately. Falls
      back to showing the explanation directly when not authored, so this
      is additive and doesn't require touching every existing question. */
  socratic?: string;
};
export type QuizQuestion = { id: string; text: string; options: QuizOption[] };

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* Checkpoint quiz for a "react" course module. Same pedagogy as the other
   4 courses' quiz-data.js pattern (question AND option order shuffled every
   attempt - see quiz-data.js's Fisher-Yates), same 80% pass threshold, but
   feeding /api/progress directly via the courseId-aware validator instead of
   going through course-progress.js's localStorage-first flow. */
export function QuizBlock({
  moduleId,
  courseId,
  questions,
  onPassed,
}: {
  moduleId: number;
  courseId: string;
  questions: QuizQuestion[];
  onPassed?: (score: number, total: number) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  // Renders in the same unshuffled order the server rendered, on purpose -
  // Math.random() during the initial render would make the server's HTML
  // and the client's first hydration pass disagree (a hydration error).
  // Reshuffling only inside this effect, which never runs during SSR, keeps
  // the first paint identical on both sides; the reshuffle then happens a
  // frame later, same as the other courses' quiz-data.js pattern in spirit
  // (order is randomized "every attempt," it just can't be randomized
  // before the page has hydrated).
  const [shuffled, setShuffled] = useState<QuizQuestion[]>(questions);
  useEffect(() => {
    // Deliberately client-only randomization to avoid a hydration mismatch
    // (see the comment above) - this is exactly the "value differs between
    // server and client" escape hatch, not state that belongs in render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShuffled(shuffle(questions).map((q) => ({ ...q, options: shuffle(q.options) })));
  }, [questions, attempt]);
  const [answered, setAnswered] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const total = shuffled.length;
  const allDone = Object.keys(answered).length === total;
  const passed = allDone && score / total >= 0.8;

  function choose(qId: string, optIndex: number, correct: boolean) {
    if (answered[qId] !== undefined) return;
    setAnswered((prev) => {
      const next = { ...prev, [qId]: optIndex };
      const newScore = correct ? score + 1 : score;
      if (correct) setScore(newScore);
      if (Object.keys(next).length === total) {
        const finalScore = correct ? score + 1 : score;
        void fetch("/api/progress", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            courseId,
            data: { modules: { [moduleId]: { score: finalScore, total, completed: finalScore / total >= 0.8 } } },
          }),
        }).catch(() => {});
        if (finalScore / total >= 0.8) onPassed?.(finalScore, total);
      }
      return next;
    });
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
                  <p className="text-[#4ade95]">
                    Correct. {q.options[chosen].principle ?? "That's the underlying principle here."}
                  </p>
                ) : q.options[chosen].socratic && !revealed[q.id] ? (
                  <div className="flex flex-col gap-2.5 text-[#eeeee7]">
                    <p>
                      <span className="font-semibold text-[#f0b429]">Before the answer - think about this: </span>
                      {q.options[chosen].socratic}
                    </p>
                    <button
                      type="button"
                      onClick={() => setRevealed((prev) => ({ ...prev, [q.id]: true }))}
                      className="self-start rounded-lg border border-[#333a4c] px-3 py-1.5 text-[12px] font-semibold text-[#9aa0ae] hover:border-[#8b7cf6] hover:text-[#eeeee7]"
                    >
                      Show me the explanation →
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 text-[#eeeee7]">
                    <p><span className="font-semibold text-[#ff8585]">Why this is wrong: </span>{q.options[chosen].whyWrong}</p>
                    {q.options[chosen].misconception && (
                      <p><span className="font-semibold text-[#9aa0ae]">What you may be thinking: </span>{q.options[chosen].misconception}</p>
                    )}
                    {q.options[chosen].principle && (
                      <p><span className="font-semibold text-[#5fc2e8]">The principle: </span>{q.options[chosen].principle}</p>
                    )}
                    {q.options[chosen].tryThis && (
                      <p><span className="font-semibold text-[#8b7cf6]">Try this: </span>{q.options[chosen].tryThis}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {allDone && (
        <div
          className={`rounded-xl border p-4 text-[14px] font-semibold ${
            passed ? "border-[#4ade95] bg-[#4ade95]/10 text-[#4ade95]" : "border-[#ff8585] bg-[#ff8585]/10 text-[#ff8585]"
          }`}
        >
          {passed
            ? `Passed - ${score}/${total}. This module is complete.`
            : `${score}/${total} - you need 80% to pass. Reread the sections above and try again.`}
          {!passed && (
            <button
              type="button"
              onClick={() => {
                setAnswered({});
                setRevealed({});
                setScore(0);
                setAttempt((n) => n + 1);
              }}
              className="ml-3 rounded-lg border border-[#ff8585] px-3 py-1 text-[12.5px] font-semibold text-[#ff8585] hover:bg-[#ff8585]/10"
            >
              ↺ Retry with new questions
            </button>
          )}
        </div>
      )}
    </div>
  );
}
