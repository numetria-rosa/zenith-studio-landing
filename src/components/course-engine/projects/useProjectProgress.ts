"use client";

import { useEffect, useState } from "react";

/* Project completion state, synced through the same /api/progress endpoint
   as checkpoint quizzes and the Practice Library - stored under
   extra.projects, mirroring the shape the static courses use for their own
   projects (getProject/setProject in course-progress.js: checklist,
   reflection/description, completed).

   Same replace-not-merge caveat as usePracticeProgress: every write must
   resend the current modules + the rest of extra, or it would silently
   erase other saved progress. */

export type ProjectRecord = {
  checklist: Record<string, boolean>;
  reflection: string;
  completed: boolean;
};

const EMPTY: ProjectRecord = { checklist: {}, reflection: "", completed: false };

type ExtraShape = { projects?: Record<string, ProjectRecord>; [key: string]: unknown };

export function useProjectProgress(courseId: string, projectId: string) {
  const [record, setRecord] = useState<ProjectRecord>(EMPTY);
  const [modules, setModules] = useState<Record<string, unknown>>({});
  const [extra, setExtra] = useState<ExtraShape>({});
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
        const existing = data.extra?.projects?.[projectId];
        if (existing) setRecord({ ...EMPTY, ...existing });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, projectId]);

  function save(patch: Partial<ProjectRecord>) {
    setRecord((prev) => {
      const next = { ...prev, ...patch };
      const nextProjects = { ...(extra.projects ?? {}), [projectId]: next };
      void fetch("/api/progress", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courseId,
          data: { modules, extra: { ...extra, projects: nextProjects } },
        }),
      }).catch(() => {});
      return next;
    });
  }

  function toggleChecklistItem(key: string) {
    save({ checklist: { ...record.checklist, [key]: !record.checklist[key] } });
  }
  function setReflection(text: string) {
    save({ reflection: text });
  }
  function setCompleted(completed: boolean) {
    save({ completed });
  }

  return { record, loaded, toggleChecklistItem, setReflection, setCompleted };
}
