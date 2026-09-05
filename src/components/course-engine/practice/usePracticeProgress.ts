"use client";

import { useEffect, useState } from "react";

/* Practice-task completion, synced through the same /api/progress endpoint
   every module's checkpoint quiz already uses - stored under
   extra.practiceTasks, exactly the {passed, attempts, lastAttemptAt} shape
   the static courses' course-progress.js uses for its own practice
   libraries (see mergePracticeTasks in courses/data-science/course-progress.js),
   so this is a consistent pattern, not a new one invented for this course.

   IMPORTANT: POST /api/progress replaces the whole `data` field - it does
   not deep-merge server-side. Every write here must include the current
   `modules` value alongside the updated `extra`, or a practice-task save
   would silently erase checkpoint-quiz completion recorded in `modules`. */

type PracticeRecord = { passed: boolean; attempts: number; lastAttemptAt: string };
type PracticeMap = Record<string, PracticeRecord>;

export function usePracticeProgress(courseId: string) {
  const [practice, setPractice] = useState<PracticeMap>({});
  const [modules, setModules] = useState<Record<string, unknown>>({});
  const [extra, setExtra] = useState<Record<string, unknown>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/progress?courseId=${courseId}`, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled || !body) return;
        const data = body.data ?? {};
        setModules(data.modules ?? {});
        setExtra(data.extra ?? {});
        setPractice((data.extra?.practiceTasks as PracticeMap) ?? {});
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  function markTask(taskId: string, passed: boolean) {
    setPractice((prev) => {
      const cur = prev[taskId];
      const next: PracticeMap = {
        ...prev,
        [taskId]: {
          passed: passed || !!cur?.passed,
          attempts: (cur?.attempts ?? 0) + 1,
          lastAttemptAt: new Date().toISOString(),
        },
      };
      void fetch("/api/progress", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courseId,
          data: { modules, extra: { ...extra, practiceTasks: next } },
        }),
      }).catch(() => {});
      return next;
    });
  }

  return { practice, markTask, loaded };
}
