import type { ModuleContent } from "./types";

/** Modules 1-8 whose lessons are all done and whose quiz (if any) is passed. Module 0 (orientation) has no quiz and never counts. */
export function modulesComplete(modules: ModuleContent[], done: Set<string>, passedQuizzes: Set<number>): number {
  return modules.filter((m) => m.number > 0 && m.lessons.every((l) => done.has(l.number)) && (!m.quiz || passedQuizzes.has(m.number))).length;
}

export type ProjectFacts = { completed: boolean; score: number; description: string; githubUrl: string; testsPassed: string };

/** Career-page readiness, the old page's formula: 40% modules, 35% project rubric scores, 25% portfolio completeness. */
export function readiness(moduleCount: number, complete: number, projects: ProjectFacts[], projectTotal: number) {
  const technical = moduleCount === 0 ? 0 : Math.round((complete / moduleCount) * 100);
  const practicalSum = projects.reduce((n, p) => n + (p.completed ? p.score : 0), 0);
  const practical = projectTotal === 0 ? 0 : Math.round(practicalSum / (projectTotal * 100) * 100);
  const portfolioSum = projects.reduce((n, p) => (p.completed ? n + (p.description ? 1 / 3 : 0) + (p.githubUrl ? 1 / 3 : 0) + (p.testsPassed ? 1 / 3 : 0) : n), 0);
  const portfolio = projectTotal === 0 ? 0 : Math.round((portfolioSum / projectTotal) * 100);
  return {
    technical, practical, portfolio,
    overall: Math.round(technical * 0.4 + practical * 0.35 + portfolio * 0.25),
    projectsComplete: projects.filter((p) => p.completed).length,
  };
}

/** What each project demonstrates, in resume language (from the old portfolio page). */
export const SKILL_PHRASES: Record<number, string> = {
  1: "structured-output repair and schema validation for LLM responses",
  2: "token-budget planning and overlap-aware content chunking",
  3: "cosine-similarity retrieval with relevance-threshold filtering",
  4: "idempotent tool-calling execution safe against retried requests",
  5: "bounded agent control flow with stuck-loop detection",
  6: "resilient model-API calls with retry, backoff, jitter, and fallback",
  7: "deterministic evaluation harnesses with baseline regression detection",
  8: "an integrated production AI agent combining retrieval, tool execution, control flow, and reliability",
};

/** A paste-ready portfolio blurb for the completed projects. */
export function portfolioSummary(items: { id: number; title: string; score: number }[]): string {
  if (items.length === 0) return "";
  const skills = items.map((i) => SKILL_PHRASES[i.id]).filter(Boolean);
  const list = skills.length > 1 ? `${skills.slice(0, -1).join("; ")}; and ${skills[skills.length - 1]}` : skills[0] ?? "";
  const avg = Math.round(items.reduce((n, i) => n + i.score, 0) / items.length);
  return `Completed ${items.length} of 8 hands-on projects in Zenith Lab's AI Engineering course, building ${list}. Self-assessed average rubric score: ${avg}%. Projects: ${items.map((i) => i.title).join(", ")}.`;
}
