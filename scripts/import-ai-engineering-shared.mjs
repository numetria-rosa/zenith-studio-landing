// One-off importer: career paths and the final-assessment pool from the old static pages into /content/ai-engineering.
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const old = (f) => readFileSync(`courses/ai-engineering/${f}`, "utf8");
function literal(src, name) {
  const start = src.indexOf(`const ${name} = [`);
  if (start < 0) throw new Error(`${name} not found`);
  let i = src.indexOf("[", start), depth = 0, inStr = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (inStr) { if (c === "\\") j++; else if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === "`") inStr = c;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) return vm.runInNewContext(`(${src.slice(i, j + 1)})`);
  }
  throw new Error(`${name} unterminated`);
}

const paths = literal(old("career.html"), "PATHS");
writeFileSync("content/ai-engineering/career.json", JSON.stringify(paths, null, 2) + "\n");

const pool = literal(old("final-assessment.html"), "POOL");
const questions = pool.map((q) => {
  const base = { id: q.id, question: q.text, source: "pool", objective: q.tag };
  if (q.type === "calc") {
    return { ...base, numeric: { answer: q.correct, tolerance: 0, correct: q.hint, incorrect: `The answer is ${q.correct}. ${q.hint}` } };
  }
  const options = q.opts.map((o) => ({ text: o.t, correct: !!o.correct, why: o.why ?? "" }));
  if (options.filter((o) => o.correct).length !== 1) throw new Error(`${q.id}: expected exactly one correct option`);
  return { ...base, ...(q.logs ? { logs: q.logs } : {}), options };
});
writeFileSync("content/ai-engineering/final-assessment.json", JSON.stringify({ passMark: 8, draw: 10, questions }, null, 2) + "\n");
console.log(`career paths: ${paths.length}, final assessment questions: ${questions.length}`);
