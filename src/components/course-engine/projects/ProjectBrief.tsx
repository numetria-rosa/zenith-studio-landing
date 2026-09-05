"use client";

import { useState } from "react";
import { useProjectProgress } from "./useProjectProgress";

/* Per the brief's own rule (section 18): "Where verification is not
   possible, clearly label the evidence as student-reported. Never pretend
   something is independently verified when it is not." There is no code
   execution environment wired for this course, so a project's rubric here
   is a self-assessed checklist, not an automatically graded one — labeled
   as such in the UI, not disguised as verified grading. */

export type RubricItem = { key: string; label: string };

export function ProjectBrief({
  courseId,
  projectId,
  objective,
  requirements,
  hints,
  rubric,
  expectedConcepts,
}: {
  courseId: string;
  projectId: string;
  objective: string;
  requirements: string[];
  hints: string[];
  rubric: RubricItem[];
  expectedConcepts: string[];
}) {
  const { record, toggleChecklistItem, setReflection, setCompleted } = useProjectProgress(courseId, projectId);
  const [showHints, setShowHints] = useState(false);
  const checkedCount = rubric.filter((r) => record.checklist[r.key]).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-[#232838] bg-[#151920] p-5">
        <div className="mb-2 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#8b7cf6]">
          Learning objective
        </div>
        <p className="text-[14.5px] text-[#eeeee7]">{objective}</p>
      </div>

      <div>
        <div className="mb-2 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#9aa0ae]">
          Requirements
        </div>
        <ul className="flex flex-col gap-1.5">
          {requirements.map((r, i) => (
            <li key={i} className="relative pl-5 text-[14px] text-[#eeeee7]">
              <span className="absolute left-0 text-[#8b7cf6]">→</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowHints((v) => !v)}
          className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#5fc2e8] hover:underline"
        >
          {showHints ? "▾ Hide hints" : "▸ Show hints"}
        </button>
        {showHints && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {hints.map((h, i) => (
              <li key={i} className="relative pl-5 text-[13.5px] text-[#9aa0ae]">
                <span className="absolute left-0 text-[#5fc2e8]">·</span>
                {h}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-[#232838] bg-[#151920] p-5">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#9aa0ae]">
            Self-assessed rubric
          </span>
          <span className="font-[family-name:var(--font-course-mono)] text-[12px] font-bold text-[#8b7cf6]">
            {checkedCount} / {rubric.length}
          </span>
        </div>
        <p className="mb-3 text-[12px] text-[#676e7d]">
          Student-reported, not automatically graded — there&apos;s no code execution behind this course to verify
          it independently. Check off each item honestly once you&apos;ve actually done it.
        </p>
        <ul className="flex flex-col gap-2">
          {rubric.map((item) => (
            <li key={item.key}>
              <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] text-[#eeeee7]">
                <input
                  type="checkbox"
                  checked={!!record.checklist[item.key]}
                  onChange={() => toggleChecklistItem(item.key)}
                  className="mt-0.5 accent-[#8b7cf6]"
                />
                {item.label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="mb-2 block font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#9aa0ae]">
          Reflection — what did you learn, and where did you get stuck?
        </label>
        <textarea
          value={record.reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={4}
          placeholder="Write a few sentences — this is for you, not graded."
          className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] p-3 text-[13.5px] text-[#eeeee7] outline-none focus:border-[#8b7cf6]"
        />
      </div>

      <div>
        <div className="mb-2 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#9aa0ae]">
          Concepts this project draws on
        </div>
        <div className="flex flex-wrap gap-2">
          {expectedConcepts.map((c) => (
            <span key={c} className="rounded-full border border-[#333a4c] bg-[#191d26] px-2.5 py-1 text-[12px] text-[#9aa0ae]">
              {c}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCompleted(!record.completed)}
        className={`self-start rounded-full border px-4 py-2 text-[13px] font-semibold transition ${
          record.completed
            ? "border-[#4ade95] bg-[#4ade95]/10 text-[#4ade95]"
            : "border-[#8b7cf6] bg-[#8b7cf6]/10 text-[#8b7cf6] hover:bg-[#8b7cf6]/20"
        }`}
      >
        {record.completed ? "✓ Marked complete (student-reported)" : "Mark this project complete →"}
      </button>
    </div>
  );
}
