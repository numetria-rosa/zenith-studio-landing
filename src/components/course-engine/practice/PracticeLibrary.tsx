"use client";

import { PRACTICE_TASKS } from "./practice-tasks";
import { PracticeTaskCard } from "./PracticeTaskCard";
import { usePracticeProgress } from "./usePracticeProgress";
import type { CourseRailData } from "@/lib/course-rail-data";

export function PracticeLibrary({ courseId, railData }: { courseId: string; railData: CourseRailData }) {
  const { practice, markTask, loaded } = usePracticeProgress(courseId);

  const total = PRACTICE_TASKS.length;
  const passedCount = Object.values(practice).filter((r) => r.passed).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-[#232838] bg-[#151920] p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[#9aa0ae]">Practice tasks passed</span>
          <span className="font-[family-name:var(--font-course-mono)] text-[15px] font-bold text-[#8b7cf6]">
            {loaded ? `${passedCount} / ${total}` : "…"}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full border border-[#232838] bg-[#0a0c10]">
          <div
            className="h-full rounded-full bg-[#8b7cf6] transition-all"
            style={{ width: `${total > 0 ? (passedCount / total) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-3 text-[12.5px] text-[#676e7d]">
          Every task here is separate from each module&apos;s checkpoint quiz — untimed, retriable, and not required to
          unlock the next module. Progress is saved to your account, the same way checkpoint quizzes are.
        </p>
      </div>

      {railData.modules.map((m) => {
        const tasks = PRACTICE_TASKS.filter((t) => t.moduleId === m.id);
        if (tasks.length === 0) return null;
        const stage = railData.stages.find((s) => s.modules.includes(m.id));
        return (
          <div key={m.id}>
            <div className="mb-3">
              <span className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#676e7d]">
                {stage ? `${stage.label} · ` : ""}Module {m.id}
              </span>
              <h3 className="mt-1 font-[family-name:var(--font-course-serif)] text-[19px] font-semibold text-[#eeeee7]">{m.title}</h3>
            </div>
            <div className="flex flex-col gap-3">
              {tasks.map((task) => (
                <PracticeTaskCard
                  key={task.id}
                  task={task}
                  passed={!!practice[task.id]?.passed}
                  onResult={(passed) => markTask(task.id, passed)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
