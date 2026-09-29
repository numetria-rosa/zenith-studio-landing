import course from "@content/ai-engineering/course.json";

export type Module = { number: number; title: string; minutes: number | null; summary: string };
export type Stage = { label: string; name: string | null; color: string; modules: Module[] };
export type AppSection = {
  name: string;
  color: string;
  description: string;
  pages: { icon: string; name: string; description: string }[];
};

export const courseContent = course as unknown as typeof course & { stages: Stage[]; appSections: AppSection[] };

export const allModules = courseContent.stages.flatMap((s) => s.modules.map((m) => ({ ...m, stage: s })));
/** Numbered modules only (Orientation is module 0 and not counted in "8 modules"). */
export const numberedModules = allModules.filter((m) => m.number > 0);
export const totalMinutes = numberedModules.reduce((n, m) => n + (m.minutes ?? 0), 0);
export const totalPages = courseContent.appSections.reduce((n, s) => n + s.pages.length, 0);
export const totalHours = `${Math.round((totalMinutes / 60) * 10) / 10}h`;
