import { RUBRIC_LEVELS, type ProjectDetail } from "./types";

/** Same maths as the old projects page: each rubric row's level (0-100) weighted by its share, rounded. */
export function rubricScore(project: ProjectDetail, rubric: Record<string, number>): number {
  const total = project.rubric.reduce((n, r) => n + (Math.max(0, Math.min(100, Number(rubric[r.key]) || 0)) / 100) * r.weight, 0);
  return Math.max(0, Math.min(100, Math.round(total)));
}

/** Only http(s) URLs may be stored, so a portfolio link can never be a javascript: URL. Returns "" for blank, null for invalid. */
export function safeHttpUrl(raw: string): string | null {
  const value = raw.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!value) return "";
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export type ProjectInput = {
  checklist: boolean[];
  rubric: Record<string, number>;
  githubUrl: string;
  description: string;
  technologies: string;
  testsPassed: string;
};

/** Validates a client submission against the project: known rubric keys, allowed levels, sane lengths. Throws on anything else. */
export function cleanProjectInput(project: ProjectDetail, input: ProjectInput) {
  const levels: readonly number[] = RUBRIC_LEVELS.map((l) => l.value);
  const rubric: Record<string, number> = {};
  for (const r of project.rubric) {
    const v = Number(input.rubric?.[r.key] ?? 0);
    if (!levels.includes(v)) throw new Error("Invalid rubric level");
    rubric[r.key] = v;
  }
  const checklist = project.acceptance.map((_, i) => input.checklist?.[i] === true);
  const githubUrl = safeHttpUrl(String(input.githubUrl ?? ""));
  if (githubUrl === null) throw new Error("Invalid URL");
  const text = (s: unknown, max: number) => String(s ?? "").trim().slice(0, max);
  return {
    checklist,
    rubric,
    score: rubricScore(project, rubric),
    githubUrl: githubUrl.slice(0, 300),
    description: text(input.description, 1000),
    technologies: text(input.technologies, 300),
    testsPassed: text(input.testsPassed, 40),
  };
}
