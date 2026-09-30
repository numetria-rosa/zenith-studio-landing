// Imports the portfolio projects (courses/ai-engineering/projects.html DETAILS + course-progress.js PROJECTS/rubric)
// into content/ai-engineering/projects/N.json and points each module's `project` at its project.
// Text is carried over as written; only the old <br>/<code> markup becomes plain steps and `code` spans.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const OLD = "courses/ai-engineering";
const OUT = "content/ai-engineering";
const html = readFileSync(path.join(OLD, "projects.html"), "utf8");
const progress = readFileSync(path.join(OLD, "course-progress.js"), "utf8");

const grab = (src, start, end) => {
  const a = src.indexOf(start);
  const b = src.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error(`cannot find ${start}`);
  return src.slice(a, b);
};
const DETAILS = new Function(`return ${grab(html, "const DETAILS = ", "\n};").replace("const DETAILS = ", "")}\n}`)();
const PROJECTS = new Function(`return ${grab(progress, "const PROJECTS = [", "\n  ];").replace("const PROJECTS = ", "")}\n  ]`)();
const WEIGHTS = new Function(`return ${grab(progress, "const RUBRIC_WEIGHTS = ", "};").replace("const RUBRIC_WEIGHTS = ", "")}}`)();

const noDash = (s) => s.replace(/\s*[—–]\s*/g, ", ");
const code = (s) => s.replace(/<code>(.*?)<\/code>/g, "`$1`");
const steps = (s) => code(s).split(/<br>/).map((x) => noDash(x.replace(/^\d+\.\s*/, "").trim())).filter(Boolean);

mkdirSync(path.join(OUT, "projects"), { recursive: true });
for (const p of PROJECTS) {
  const d = DETAILS[p.id];
  const total = p.rubric.reduce((n, k) => n + WEIGHTS[k], 0);
  const rubric = p.rubric.map((key) => ({ key, label: key[0].toUpperCase() + key.slice(1), weight: Math.round((WEIGHTS[key] / total) * 100) }));
  const project = {
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    modules: p.modules,
    summary: noDash(p.summary),
    requirements: d.requirements.map((s) => noDash(code(s))),
    start: noDash(d.start),
    acceptance: d.acceptance.map((s) => noDash(code(s))),
    tests: d.tests.map((s) => noDash(code(s))),
    mistakes: d.mistakes.map((s) => noDash(code(s))),
    solution: steps(d.solution),
    rubric,
  };
  writeFileSync(path.join(OUT, "projects", `${p.id}.json`), JSON.stringify(project, null, 2) + "\n");

  // Each project lives on the module it belongs to; the capstone (spans 1-8) lives on module 8.
  const owner = Math.max(...p.modules);
  const modFile = path.join(OUT, "modules", `${owner}.json`);
  try {
    const mod = JSON.parse(readFileSync(modFile, "utf8"));
    mod.project = { title: p.title, brief: project.summary, projectId: p.id };
    writeFileSync(modFile, JSON.stringify(mod, null, 2) + "\n");
    console.log(`project ${p.id} -> module ${owner}: ${p.title}`);
  } catch {
    console.log(`project ${p.id}: module ${owner} not imported yet, project file written only`);
  }
}
