// Merges the Quiz Center pools (courses/ai-engineering/quiz-data.js) into each module's quiz bank, next to the in-module
// checkpoint questions, and writes the mixed quizzes to content/ai-engineering/quiz/mixed.json. Safe to re-run.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = "content/ai-engineering";
const win = {};
new Function("window", readFileSync("courses/ai-engineering/quiz-data.js", "utf8"))(win);
const { POOLS, MIXED_QUIZZES } = win.QuizData;

const noDash = (s) => s.replace(/ — /g, ": ").replace(/—/g, "-");
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

for (const [key, pool] of Object.entries(POOLS)) {
  const file = path.join(OUT, "modules", `${key}.json`);
  const mod = JSON.parse(readFileSync(file, "utf8"));
  const checkpoint = mod.quiz.questions.filter((q) => q.source !== "pool");
  const have = new Set(checkpoint.map((q) => norm(q.question)));
  const merged = pool.questions
    .filter((q) => !have.has(norm(q.text))) // a few pool questions are the checkpoint's own
    .map((q) => ({
      id: q.id,
      question: noDash(q.text),
      source: "pool",
      type: q.type,
      difficulty: q.difficulty,
      objective: noDash(q.objective),
      options: q.opts.map((o) => ({ text: noDash(o.t), correct: o.correct, why: noDash(o.why) })),
    }));
  mod.quiz.questions = [...checkpoint, ...merged];
  writeFileSync(file, JSON.stringify(mod, null, 2) + "\n");
  console.log(`module ${key}: ${checkpoint.length} checkpoint + ${merged.length} pool = ${mod.quiz.questions.length}`);
}

mkdirSync(path.join(OUT, "quiz"), { recursive: true });
writeFileSync(path.join(OUT, "quiz", "mixed.json"), JSON.stringify(MIXED_QUIZZES.map((m) => ({ ...m, title: noDash(m.title) })), null, 2) + "\n");
