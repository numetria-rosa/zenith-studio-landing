"use client";

import { useState } from "react";
import type { DetectiveScenario } from "./types";
import { useDetectiveProgress } from "./useDetectiveProgress";

export function MathDetective({ courseId, scenario }: { courseId: string; scenario: DetectiveScenario }) {
  const { records, save } = useDetectiveProgress(courseId);
  const record = records[scenario.id] ?? { phase1Passed: false, phase2Passed: false };

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [phase1Submitted, setPhase1Submitted] = useState(false);
  const [fixChosen, setFixChosen] = useState<number | null>(null);

  const allTrueIds = new Set(scenario.chargeSheet.filter((c) => c.isTrue).map((c) => c.id));
  const checkedIds = new Set(Object.keys(checked).filter((id) => checked[id]));
  const phase1Correct =
    phase1Submitted && checkedIds.size === allTrueIds.size && [...checkedIds].every((id) => allTrueIds.has(id));
  const phase1Unlocked = record.phase1Passed || phase1Correct;

  function toggle(id: string) {
    if (phase1Submitted) return;
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function submitPhase1() {
    setPhase1Submitted(true);
    const correct =
      Object.keys(checked).filter((id) => checked[id]).length === allTrueIds.size &&
      Object.keys(checked).filter((id) => checked[id]).every((id) => allTrueIds.has(id));
    if (correct) save(scenario.id, { phase1Passed: true });
  }

  function retryPhase1() {
    setChecked({});
    setPhase1Submitted(false);
  }

  function chooseFix(i: number) {
    if (fixChosen !== null) return;
    setFixChosen(i);
    if (scenario.fixOptions[i].correct) save(scenario.id, { phase2Passed: true });
  }

  return (
    <div className="rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <h3 className="font-[family-name:var(--font-course-serif)] text-[19px] font-semibold text-[#eeeee7]">{scenario.title}</h3>
      <p className="mt-2 text-[13.5px] text-[#9aa0ae]">{scenario.context}</p>

      <div className="mt-4 rounded-lg border-l-[3px] border-[#f0b429] bg-[#0a0c10] px-4 py-3">
        <p className="text-[14px] italic text-[#eeeee7]">&ldquo;{scenario.claim}&rdquo;</p>
        <p className="mt-1 text-[12px] text-[#676e7d]">{scenario.claimSource}</p>
      </div>

      <div className="mt-5">
        <div className="mb-2 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#5fc2e8]">
          Phase 1 — The charge sheet
        </div>
        <p className="mb-3 text-[13px] text-[#9aa0ae]">
          Check every statement below that is actually TRUE. Leave the false ones unchecked. You need every true
          statement checked and no false ones checked — partial credit isn&apos;t how this works, same as a real
          investigation.
        </p>
        <div className="flex flex-col gap-2">
          {scenario.chargeSheet.map((item) => {
            const isChecked = !!checked[item.id];
            const showResult = phase1Submitted;
            const wasRight = showResult && isChecked === item.isTrue;
            return (
              <div
                key={item.id}
                className={`rounded-lg border px-3.5 py-2.5 ${
                  showResult
                    ? wasRight
                      ? "border-[#4ade95]/40 bg-[#4ade95]/5"
                      : "border-[#ff8585]/40 bg-[#ff8585]/5"
                    : "border-[#232838] bg-[#191d26]"
                }`}
              >
                <label className={`flex items-start gap-2.5 text-[13.5px] text-[#eeeee7] ${phase1Submitted ? "" : "cursor-pointer"}`}>
                  <input type="checkbox" checked={isChecked} disabled={phase1Submitted} onChange={() => toggle(item.id)} className="mt-0.5 accent-[#8b7cf6]" />
                  {item.label}
                </label>
                {showResult && (
                  <p className="mt-1.5 pl-6 text-[12px] text-[#9aa0ae]">
                    {item.isTrue ? "True. " : "False. "}
                    {item.why}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {!phase1Submitted ? (
          <button
            type="button"
            onClick={submitPhase1}
            className="mt-3 rounded-full border border-[#8b7cf6] bg-[#8b7cf6]/10 px-4 py-2 text-[13px] font-semibold text-[#8b7cf6] hover:bg-[#8b7cf6]/20"
          >
            File the charge sheet →
          </button>
        ) : (
          <div className={`mt-3 rounded-lg border p-3 text-[13.5px] font-semibold ${phase1Correct ? "border-[#4ade95]/40 bg-[#4ade95]/5 text-[#4ade95]" : "border-[#ff8585]/40 bg-[#ff8585]/5 text-[#ff8585]"}`}>
            {phase1Correct
              ? "Exactly right — every true statement flagged, no false ones. Phase 2 is unlocked below."
              : "Not quite — check the per-item feedback above, then try again. Every true statement must be checked, with none of the false ones."}
            {!phase1Correct && (
              <button type="button" onClick={retryPhase1} className="ml-3 rounded-lg border border-[#ff8585] px-3 py-1 text-[12px] hover:bg-[#ff8585]/10">
                ↺ Retry
              </button>
            )}
          </div>
        )}
      </div>

      {phase1Unlocked && (
        <div className="mt-6 border-t border-[#232838] pt-5">
          <div className="mb-2 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#4ade95]">
            Phase 2 — The fix
          </div>
          <p className="mb-3 text-[13px] text-[#9aa0ae]">
            Pick the version of the original claim that&apos;s actually correct — not a flat denial, not an
            overcorrection, the accurately-qualified version.
          </p>
          <div className="flex flex-col gap-2">
            {scenario.fixOptions.map((opt, i) => {
              const showState = fixChosen !== null;
              const cls = showState
                ? opt.correct
                  ? "border-[#4ade95] bg-[#4ade95]/10"
                  : i === fixChosen
                    ? "border-[#ff8585] bg-[#ff8585]/10"
                    : "border-[#232838] bg-[#191d26] opacity-60"
                : "border-[#232838] bg-[#191d26] hover:border-[#333a4c]";
              return (
                <button key={i} type="button" disabled={showState} onClick={() => chooseFix(i)} className={`rounded-lg border px-3.5 py-2.5 text-left text-[13.5px] transition ${cls}`}>
                  {opt.text}
                </button>
              );
            })}
          </div>
          {fixChosen !== null && (
            <div className="mt-3 rounded-lg border border-[#232838] bg-[#0a0c10] p-3 text-[13px] text-[#eeeee7]">
              {scenario.fixOptions[fixChosen].feedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
