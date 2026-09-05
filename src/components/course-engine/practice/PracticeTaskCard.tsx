"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { PracticeTask } from "./types";

const TYPE_LABEL: Record<PracticeTask["type"], string> = {
  calculation: "Calculation",
  interpretation: "Interpretation",
  debugging: "Debugging",
  decision: "Decision",
};
const TYPE_COLOR: Record<PracticeTask["type"], string> = {
  calculation: "#5fc2e8",
  interpretation: "#4ade95",
  debugging: "#ff8585",
  decision: "#f0b429",
};

export function PracticeTaskCard({
  task,
  passed,
  onResult,
}: {
  task: PracticeTask;
  passed: boolean;
  onResult: (passed: boolean) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);

  function checkCalculation() {
    if (task.type !== "calculation") return;
    const val = Number(inputValue);
    const correct = !Number.isNaN(val) && Math.abs(val - task.answer) <= task.tolerance;
    setChecked(true);
    setWasCorrect(correct);
    onResult(correct);
  }

  function chooseOption(i: number) {
    if (task.type === "calculation" || chosenIndex !== null) return;
    setChosenIndex(i);
    const correct = task.options[i].correct;
    setWasCorrect(correct);
    onResult(correct);
  }

  function retry() {
    setInputValue("");
    setChosenIndex(null);
    setChecked(false);
    setWasCorrect(false);
  }

  const color = TYPE_COLOR[task.type];
  const answered = task.type === "calculation" ? checked : chosenIndex !== null;

  return (
    <div className={`rounded-xl border p-5 ${answered && wasCorrect ? "border-[#4ade95]/40" : "border-[#232838]"} bg-[#151920]`}>
      <div className="mb-3 flex items-center gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 font-[family-name:var(--font-course-mono)] text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{ color, background: `${color}1a` }}
        >
          {TYPE_LABEL[task.type]}
        </span>
        {passed && (
          <span className="inline-flex items-center gap-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold text-[#4ade95]">
            <Check size={12} aria-hidden /> passed
          </span>
        )}
      </div>

      {task.given && (
        <div className="mb-2 rounded-lg bg-[#0a0c10] px-3 py-2 font-[family-name:var(--font-course-mono)] text-[13px] text-[#9aa0ae]">
          {task.given}
        </div>
      )}
      <p className="text-[14.5px] font-semibold text-[#eeeee7]">{task.prompt}</p>

      {task.type === "calculation" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            step="any"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (checked) {
                setChecked(false);
              }
            }}
            disabled={checked && wasCorrect}
            placeholder="Your answer"
            className="w-36 rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-1.5 text-[14px] text-[#eeeee7] outline-none focus:border-[#8b7cf6]"
          />
          {task.unit && <span className="text-[13px] text-[#676e7d]">{task.unit}</span>}
          {!(checked && wasCorrect) && (
            <button
              type="button"
              onClick={checkCalculation}
              className="rounded-lg border border-[#8b7cf6] bg-[#8b7cf6]/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#8b7cf6] hover:bg-[#8b7cf6]/20"
            >
              Check
            </button>
          )}
          {checked && !wasCorrect && (
            <button type="button" onClick={retry} className="text-[12.5px] font-semibold text-[#ff8585] hover:underline">
              ↺ Try again
            </button>
          )}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {task.options.map((opt, i) => {
            const showState = chosenIndex !== null;
            const cls = showState
              ? opt.correct
                ? "border-[#4ade95] bg-[#4ade95]/10"
                : i === chosenIndex
                  ? "border-[#ff8585] bg-[#ff8585]/10"
                  : "border-[#232838] bg-[#191d26] opacity-60"
              : "border-[#232838] bg-[#191d26] hover:border-[#333a4c]";
            return (
              <button
                key={i}
                type="button"
                disabled={showState}
                onClick={() => chooseOption(i)}
                className={`rounded-lg border px-3.5 py-2 text-left text-[13.5px] transition ${cls}`}
              >
                {opt.text}
              </button>
            );
          })}
        </div>
      )}

      {task.type === "calculation" && checked && (
        <div className={`mt-3 rounded-lg border p-3 text-[13px] leading-relaxed ${wasCorrect ? "border-[#4ade95]/30 bg-[#4ade95]/5 text-[#4ade95]" : "border-[#232838] bg-[#0a0c10] text-[#eeeee7]"}`}>
          {wasCorrect ? `Correct. ${task.explanation}` : <><span className="font-semibold text-[#ff8585]">Not quite. </span>{task.hint}</>}
        </div>
      )}
      {task.type !== "calculation" && chosenIndex !== null && (
        <div className="mt-3 rounded-lg border border-[#232838] bg-[#0a0c10] p-3 text-[13px] leading-relaxed text-[#eeeee7]">
          {task.options[chosenIndex].feedback}
        </div>
      )}
    </div>
  );
}
