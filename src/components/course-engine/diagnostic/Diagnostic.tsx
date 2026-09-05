"use client";

import { useEffect, useState } from "react";
import { DIAGNOSTIC_QUESTIONS, SKILL_AREA_LABEL, type SkillArea } from "./diagnostic-questions";

/* The onboarding diagnostic (brief section 3). Produces a real per-area
   breakdown from real answers — never gatekeeps (there is no "you must
   score X to continue" branch anywhere here), and never collapses the
   result to a single misleading percentage. Result is saved to
   extra.diagnostic, not modules — this isn't a course module, so it must
   not go through the modules-id-bounded validator every checkpoint quiz
   uses. */

const FOUNDATION_LINK: Record<SkillArea, { href: string; label: string }> = {
  algebra: { href: "foundation-a-algebra", label: "Foundation A: Algebra for ML" },
  graphs: { href: "foundation-b-graphs", label: "Foundation B: Graphs and Functions" },
  notation: { href: "foundation-c-notation", label: "Foundation C: Mathematical Notation" },
  vectors: { href: "01-vectors", label: "Module 1: Thinking in Vectors (go slowly through 1.1-1.2)" },
  probability: { href: "06-probability", label: "Module 6: Reasoning Under Uncertainty (go slowly through 6.1)" },
};

export function Diagnostic({ courseId, basePath }: { courseId: string; basePath: string }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = Object.keys(answers).length === DIAGNOSTIC_QUESTIONS.length;

  function choose(qId: string, idx: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: idx }));
  }

  const [serverModules, setServerModules] = useState<Record<string, unknown>>({});
  const [serverExtra, setServerExtra] = useState<Record<string, unknown>>({});
  useEffect(() => {
    fetch(`/api/progress?courseId=${courseId}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!body) return;
        setServerModules(body.data?.modules ?? {});
        setServerExtra(body.data?.extra ?? {});
      })
      .catch(() => {});
  }, [courseId]);

  // Re-send preserving whatever else was in extra, matching the same
  // replace-not-merge care as the Practice Library and Projects.
  function submitPreserving() {
    setSubmitted(true);
    const byArea: Record<SkillArea, { correct: number; total: number }> = {
      algebra: { correct: 0, total: 0 },
      graphs: { correct: 0, total: 0 },
      notation: { correct: 0, total: 0 },
      vectors: { correct: 0, total: 0 },
      probability: { correct: 0, total: 0 },
    };
    DIAGNOSTIC_QUESTIONS.forEach((q) => {
      byArea[q.area].total += 1;
      if (answers[q.id] === q.correctIndex) byArea[q.area].correct += 1;
    });
    void fetch("/api/progress", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId,
        data: {
          modules: serverModules,
          extra: { ...serverExtra, diagnostic: { byArea, completedAt: new Date().toISOString() } },
        },
      }),
    }).catch(() => {});
  }

  const results: { area: SkillArea; correct: number; total: number }[] = submitted
    ? (Object.keys(SKILL_AREA_LABEL) as SkillArea[]).map((area) => {
        const qs = DIAGNOSTIC_QUESTIONS.filter((q) => q.area === area);
        const correct = qs.filter((q) => answers[q.id] === q.correctIndex).length;
        return { area, correct, total: qs.length };
      })
    : [];

  const strong = results.filter((r) => r.correct === r.total);
  const needsRefresh = results.filter((r) => r.correct < r.total);

  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-[#232838] bg-[#151920] p-5">
          <div className="mb-3 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#8b7cf6]">
            Your mathematical starting point
          </div>
          <p className="text-[13.5px] text-[#9aa0ae]">
            This is a snapshot, not a gate — every module and the whole Foundation Bridge stay open regardless of
            these results.
          </p>
        </div>

        {strong.length > 0 && (
          <div>
            <div className="mb-2 text-[13px] font-bold text-[#4ade95]">Strong already</div>
            <ul className="flex flex-col gap-1.5">
              {strong.map((r) => (
                <li key={r.area} className="flex items-center justify-between rounded-lg border border-[#4ade95]/30 bg-[#4ade95]/5 px-3.5 py-2 text-[13.5px] text-[#eeeee7]">
                  {SKILL_AREA_LABEL[r.area]}
                  <span className="font-[family-name:var(--font-course-mono)] text-[#4ade95]">{r.correct}/{r.total}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {needsRefresh.length > 0 && (
          <div>
            <div className="mb-2 text-[13px] font-bold text-[#f0b429]">Needs refreshing</div>
            <ul className="flex flex-col gap-1.5">
              {needsRefresh.map((r) => (
                <li key={r.area} className="rounded-lg border border-[#f0b429]/30 bg-[#f0b429]/5 px-3.5 py-2 text-[13.5px] text-[#eeeee7]">
                  <div className="flex items-center justify-between">
                    {SKILL_AREA_LABEL[r.area]}
                    <span className="font-[family-name:var(--font-course-mono)] text-[#f0b429]">{r.correct}/{r.total}</span>
                  </div>
                  <a href={`${basePath}/${FOUNDATION_LINK[r.area].href}`} className="mt-1.5 inline-block text-[12.5px] text-[#5fc2e8] hover:underline">
                    → {FOUNDATION_LINK[r.area].label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-[#8b7cf6]/30 bg-[#8b7cf6]/5 p-4">
          <div className="mb-1 text-[13px] font-bold text-[#8b7cf6]">Recommended path</div>
          <p className="text-[13.5px] text-[#eeeee7]">
            {needsRefresh.length === 0
              ? "Every area looks solid — head straight into Module 1."
              : `Skim ${needsRefresh.length === 1 ? "the lesson" : "the lessons"} linked above before or alongside Module 1 — not required, just efficient.`}
          </p>
          <a href={`${basePath}/01-vectors`} className="mt-3 inline-block rounded-full border border-[#8b7cf6] bg-[#8b7cf6]/10 px-4 py-2 text-[13px] font-semibold text-[#8b7cf6] hover:bg-[#8b7cf6]/20">
            Begin Module 1 →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {DIAGNOSTIC_QUESTIONS.map((q, qi) => (
        <div key={q.id} className="rounded-xl border border-[#232838] bg-[#151920] p-5">
          <div className="mb-2 font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.08em] text-[#676e7d]">
            {qi + 1}. {SKILL_AREA_LABEL[q.area]}
          </div>
          <div className="mb-3 text-[14.5px] font-semibold text-[#eeeee7]">{q.text}</div>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                type="button"
                onClick={() => choose(q.id, oi)}
                className={`rounded-lg border px-3.5 py-2 text-left text-[13.5px] transition ${
                  answers[q.id] === oi ? "border-[#8b7cf6] bg-[#8b7cf6]/10 text-[#eeeee7]" : "border-[#232838] bg-[#191d26] text-[#9aa0ae] hover:border-[#333a4c]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={!allAnswered}
        onClick={submitPreserving}
        className="self-start rounded-full border border-[#8b7cf6] bg-[#8b7cf6]/10 px-4 py-2 text-[13px] font-semibold text-[#8b7cf6] hover:bg-[#8b7cf6]/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {allAnswered ? "See my results →" : `Answer all ${DIAGNOSTIC_QUESTIONS.length} questions to see results`}
      </button>
    </div>
  );
}
