import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

/* The Final module: five sellable agents, their code kit, and the sell kit. Everything is read from
   content/ai-engineering/final-module, so the marketing page, the app and the downloadable kit share one source. */

const ROOT = () => path.join(process.cwd(), "content", "ai-engineering", "final-module");

export type Niche = { name: string; why: string; pain: string; offer: string };
export type CityGroup = { region: string; cities: string[]; why: string };
export type Agent = {
  id: string;
  kitDir: string;
  modelKey: string;
  name: string;
  icon: "chat" | "phone" | "mail" | "calendar" | "file";
  color: string;
  tagline: string;
  what: string;
  channels: string[];
  integrations: { name: string; docs: string; note: string }[];
  niches: Niche[];
  cities: CityGroup[];
  pricing: { setupUsd: number; monthlyUsd: number; note: string };
  email: { subjectOptions: string[]; body: string; followUp: string };
  deploy: string[];
  evals: string[];
};
export type FinalModule = {
  title: string;
  eyebrow: string;
  headline: string;
  lede: string;
  modelPricingVerified: string;
  agents: Agent[];
  findClients: { title: string; detail: string }[];
  compliance: { region: string; rule: string; source: string }[];
  sellPlan: { id: string; week: number; title: string; detail: string }[];
  clientsGuide: {
    intro: string;
    statuses: { key: string; meaning: string; move: string }[];
    steps: { title: string; detail: string }[];
    tips: string[];
    example: { business: string; niche: string; city: string; agentId: string; notes: string; steps: string[] };
  };
  revenueGuide: { intro: string; terms: { term: string; meaning: string }[]; tips: string[] };
};

export type ModelEntry = {
  provider: "anthropic" | "groq";
  id: string;
  label: string;
  price_in: number;
  price_out: number;
  context: string;
  note: string;
};
export type ModelRegistry = {
  verified: string;
  sources: Record<string, string>;
  models: Record<string, ModelEntry>;
  agents: Record<string, { primary: string; budget: string; escalation: string; why: string }>;
};

export async function getFinalModule(): Promise<FinalModule> {
  return JSON.parse(await readFile(path.join(ROOT(), "agents.json"), "utf8"));
}

export async function getModelRegistry(): Promise<ModelRegistry> {
  return JSON.parse(await readFile(path.join(ROOT(), "kit", "core", "models.json"), "utf8"));
}

export async function getAgent(id: string): Promise<Agent | null> {
  return (await getFinalModule()).agents.find((a) => a.id === id) ?? null;
}

/** USD cost of one model call, from the verified per-million-token prices. */
export function callCostUsd(model: ModelEntry, inputTokens: number, outputTokens: number): number {
  return (inputTokens * model.price_in + outputTokens * model.price_out) / 1_000_000;
}

// ---- the code kit on disk ---------------------------------------------------

export type TreeNode = { name: string; path: string; kind: "dir" | "file"; children?: TreeNode[] };

const SKIP = new Set(["__pycache__", ".pytest_cache", ".venv", "node_modules", ".env"]);
const TEXT_EXT = new Set([".py", ".md", ".json", ".jsonl", ".toml", ".txt", ".example", ""]);
const MAX_FILE_BYTES = 200_000;

const kitRoot = () => path.join(ROOT(), "kit");

async function walk(dir: string, rel: string): Promise<TreeNode[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nodes: TreeNode[] = [];
  for (const e of entries.sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))) {
    if (SKIP.has(e.name)) continue;
    const p = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) nodes.push({ name: e.name, path: p, kind: "dir", children: await walk(path.join(dir, e.name), p) });
    else nodes.push({ name: e.name, path: p, kind: "file" });
  }
  return nodes;
}

export async function kitTree(): Promise<TreeNode[]> {
  return walk(kitRoot(), "");
}

export function flattenFiles(nodes: TreeNode[]): string[] {
  return nodes.flatMap((n) => (n.kind === "file" ? [n.path] : flattenFiles(n.children ?? [])));
}

/** Read one kit file by its kit-relative path. Refuses anything outside the kit, hidden secrets and non-text files. */
export async function readKitFile(rel: string): Promise<string | null> {
  const full = path.resolve(kitRoot(), rel);
  if (!full.startsWith(kitRoot() + path.sep)) return null;
  if (rel.split("/").some((part) => SKIP.has(part))) return null;
  if (!TEXT_EXT.has(path.extname(full))) return null;
  try {
    const text = await readFile(full, "utf8");
    return text.length > MAX_FILE_BYTES ? null : text;
  } catch {
    return null;
  }
}

export async function readKitFiles(paths: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(paths.map(async (p) => [p, await readKitFile(p)] as const));
  return Object.fromEntries(entries.filter((e): e is readonly [string, string] => e[1] !== null));
}
