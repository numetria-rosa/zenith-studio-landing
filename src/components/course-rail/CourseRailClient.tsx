"use client";

import { useEffect, useState } from "react";
import { CourseRail } from "./CourseRail";
import type { CourseRailData } from "@/lib/course-rail-data";

type ModuleRecord = { completed?: boolean };
type ProgressData = { modules?: Record<string, ModuleRecord> };

/* Client wrapper: CourseRail itself is a stateless presentational shell, this
   is the piece that knows progress. Reads the same /api/progress GET the
   static courses' course-progress.js already calls - no new endpoint. */
export function CourseRailClient({
  data,
  courseId,
  activeModuleId,
  basePath,
}: {
  data: CourseRailData;
  courseId: string;
  activeModuleId: number;
  basePath?: string;
}) {
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/progress?courseId=${courseId}`, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled && body) setProgress(body.data ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  function moduleStatus(moduleId: number): "completed" | "current" | "upcoming" | "locked" {
    const rec = progress?.modules?.[String(moduleId)];
    if (rec?.completed) return "completed";
    if (moduleId === activeModuleId) return "current";
    // Locked until the previous module is complete - first module is always open.
    if (moduleId > 1) {
      const prev = progress?.modules?.[String(moduleId - 1)];
      if (!prev?.completed) return "locked";
    }
    return "upcoming";
  }

  return <CourseRail data={data} courseId={courseId} activeModuleId={activeModuleId} moduleStatus={moduleStatus} basePath={basePath} />;
}
