/* Mirrors the relevant subset of courses/ai-engineering/course-progress.js's
   gating math (REQUIRED_SECTIONS, PASS_THRESHOLD, isModuleDataComplete,
   overall) so the server-rendered dashboard can show real progress without
   loading that browser-only script. Deliberately duplicated rather than
   shared — one is a vanilla <script src> file for the static course pages,
   this is server TS — but the numbers must stay in sync if that file's
   gating rules ever change. */

const PASS_THRESHOLD = 0.8;

const REQUIRED_SECTIONS: Record<string, string[]> = {
  "1": ["structuredOutputExercise"],
  "2": ["chunkerExercise"],
  "3": ["retrievalExercise"],
  "4": ["toolExecutorExercise"],
  "5": ["agentLoopExercise"],
  "6": ["retryFallbackExercise"],
  "7": ["evalHarnessExercise"],
  "8": [],
};

const TOTAL_MODULES = 8;

type ModuleRecord = {
  score?: number;
  total?: number;
  sections?: Record<string, boolean | { passCount: number; total: number }>;
};

function quizPassed(m: ModuleRecord | undefined): boolean {
  return !!m && typeof m.total === "number" && m.total > 0 && (m.score ?? 0) / m.total >= PASS_THRESHOLD;
}

function sectionSatisfied(sections: ModuleRecord["sections"], key: string): boolean {
  const v = sections?.[key];
  if (v === true) return true;
  if (v && typeof v === "object" && typeof v.total === "number" && v.total > 0 && v.passCount === v.total) {
    return true;
  }
  return false;
}

function isModuleComplete(id: string, m: ModuleRecord | undefined): boolean {
  if (!quizPassed(m)) return false;
  return (REQUIRED_SECTIONS[id] || []).every((key) => sectionSatisfied(m?.sections, key));
}

export function summarizeProgress(data: unknown): { completed: number; total: number; pct: number } {
  const modules =
    data && typeof data === "object" && "modules" in data && data.modules && typeof data.modules === "object"
      ? (data.modules as Record<string, ModuleRecord>)
      : {};

  let completed = 0;
  for (const id of Object.keys(REQUIRED_SECTIONS)) {
    if (isModuleComplete(id, modules[id])) completed++;
  }
  return { completed, total: TOTAL_MODULES, pct: Math.round((completed / TOTAL_MODULES) * 100) };
}
