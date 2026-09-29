import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { CourseIndex, ModuleContent } from "./types";

/* Course content lives in the repo (content/ai-engineering). AIE_CONTENT_DIR points the
   loader at a different directory (the visual tests use tests/visual/fixtures). */
const contentDir = () => process.env.AIE_CONTENT_DIR ?? path.join(process.cwd(), "content", "ai-engineering");

export async function getCourseIndex(): Promise<CourseIndex> {
  return JSON.parse(await readFile(path.join(contentDir(), "course.json"), "utf8"));
}

export async function getModule(number: number): Promise<ModuleContent | null> {
  try {
    return JSON.parse(await readFile(path.join(contentDir(), "modules", `${number}.json`), "utf8"));
  } catch {
    return null;
  }
}

export async function getAllModules(): Promise<ModuleContent[]> {
  const files = await readdir(path.join(contentDir(), "modules")).catch(() => [] as string[]);
  const mods = await Promise.all(
    files.filter((f) => f.endsWith(".json")).map((f) => getModule(Number(f.replace(".json", "")))),
  );
  return mods.filter((m): m is ModuleContent => m !== null).sort((a, b) => a.number - b.number);
}

/** MDX source of one lesson, or null if the module has no body for it. */
export async function getLessonMdx(module: number, lesson: string): Promise<string | null> {
  try {
    return await readFile(path.join(contentDir(), "lessons", String(module), `${lesson}.mdx`), "utf8");
  } catch {
    return null;
  }
}

export async function getFurtherReadingMdx(module: number): Promise<string | null> {
  return getLessonMdx(module, "further-reading");
}

/** Every top-level data constant the old page's interactives used (samples, options, traces), by module. */
export async function getInteractiveData(module: number): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(path.join(contentDir(), "interactives", `${module}.json`), "utf8"));
  } catch {
    return {};
  }
}
