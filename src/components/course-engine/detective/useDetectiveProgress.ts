"use client";

import { useEffect, useState } from "react";

/* Same replace-not-merge care as the Practice Library and Projects hooks -
   stored under extra.mathDetective, not modules (a detective scenario isn't
   one of the 11 real course modules, so it must stay out of the
   module-id-bounded validator). */

export type DetectiveRecord = { phase1Passed: boolean; phase2Passed: boolean };
type Map_ = Record<string, DetectiveRecord>;

export function useDetectiveProgress(courseId: string) {
  const [records, setRecords] = useState<Map_>({});
  const [modules, setModules] = useState<Record<string, unknown>>({});
  const [extra, setExtra] = useState<Record<string, unknown>>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/progress?courseId=${courseId}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled || !body) return;
        const data = body.data ?? {};
        setModules(data.modules ?? {});
        setExtra(data.extra ?? {});
        setRecords((data.extra?.mathDetective as Map_) ?? {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  function save(scenarioId: string, patch: Partial<DetectiveRecord>) {
    setRecords((prev) => {
      const cur = prev[scenarioId] ?? { phase1Passed: false, phase2Passed: false };
      const next = { ...prev, [scenarioId]: { ...cur, ...patch } };
      void fetch("/api/progress", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, data: { modules, extra: { ...extra, mathDetective: next } } }),
      }).catch(() => {});
      return next;
    });
  }

  return { records, save };
}
