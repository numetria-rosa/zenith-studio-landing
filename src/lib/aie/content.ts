import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { CapstoneContent, CapstoneText } from "./capstone";
import type { CourseIndex, ModuleContent, ProjectDetail } from "./types";

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

/** What a module's ported widgets need: the old page's data constants plus the widgets' own wording. */
export async function getInteractiveData(module: number): Promise<Record<string, unknown>> {
  const read = async (name: string) => {
    try {
      return JSON.parse(await readFile(path.join(contentDir(), "interactives", name), "utf8"));
    } catch {
      return {};
    }
  };
  const [data, text, common] = await Promise.all([read(`${module}.json`), read(`${module}.text.json`), read("common.text.json")]);
  return { ...data, text, common };
}

/** Python source of a module's exercise harness (content/ai-engineering/<exercise.harness>). */
export async function getExerciseHarness(harness: string): Promise<string> {
  if (!/^exercises\/\d+\.py$/.test(harness)) throw new Error(`Bad harness path: ${harness}`);
  return readFile(path.join(contentDir(), harness), "utf8");
}

export async function getProject(id: number): Promise<ProjectDetail | null> {
  try {
    return JSON.parse(await readFile(path.join(contentDir(), "projects", `${id}.json`), "utf8"));
  } catch {
    return null;
  }
}

export type CapstoneBundle = { content: CapstoneContent; text: CapstoneText; brief: string; reference: string };

/** The Module 8 capstone: parts as JSON, the client brief and reference outline as MDX, and the grader's messages. */
export async function getCapstone(): Promise<CapstoneBundle> {
  const dir = path.join(contentDir(), "capstone");
  const read = (f: string) => readFile(path.join(dir, f), "utf8");
  const [content, text, brief, reference] = await Promise.all([read("capstone.json"), read("text.json"), read("brief.mdx"), read("reference.mdx")]);
  return { content: JSON.parse(content), text: JSON.parse(text), brief, reference };
}
