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

// ---- Cross-module challenges (challenges.html): two scenarios, answered as multiple choice, all must be right ----
const ch = old("challenges.html");
const strip = (h) => h.replace(/<[^>]+>/g, "").replace(/&rarr;/g, "→").replace(/&amp;/g, "&").replace(/&#8635;/g, "↻").replace(/\s+/g, " ").trim();
const arrayOf = (name) => literal(ch, name);
const sections = ch.split("<section>").slice(1).map((sec) => sec.split("</section>")[0]);
const optsFor = { p: arrayOf("pQuestions"), i: arrayOf("iQuestions") };
function questionsOf(sec, prefix) {
  const cards = [...sec.matchAll(/<div class="qn">([\s\S]*?)<\/div>\s*(?:<div class="qtext">([\s\S]*?)<\/div>)?\s*<div id="(\w+)opts">/g)];
  return cards.map((m) => {
    const src = optsFor[prefix].find((q) => q.id === m[3]);
    if (!src) throw new Error(`no options for ${m[3]}`);
    const options = src.opts.map((o) => ({ text: o.t, correct: !!o.correct, why: o.why ?? "" }));
    if (options.filter((o) => o.correct).length !== 1) throw new Error(`${m[3]}: expected one correct option`);
    return { id: m[3], label: strip(m[1]), question: m[2] ? strip(m[2]) : strip(m[1]), source: "pool", options };
  });
}
const [rag, incident] = sections;
const challenges = [
  {
    id: "rag",
    title: strip(rag.match(/<h2 class="serif">([\s\S]*?)<\/h2>/)[1]),
    intro: strip(rag.match(/<p class="mut">([\s\S]*?)<\/p>/)[1]),
    pipeline: [...rag.matchAll(/<span>([^<]+)<\/span>/g)].map((m) => strip(m[1])),
    note: strip(rag.match(/<p class="mut" style="margin-top:14px">([\s\S]*?)<\/p>/)[1]),
    questions: questionsOf(rag, "p"),
  },
  {
    id: "incident",
    title: strip(incident.match(/<h2 class="serif">([\s\S]*?)<\/h2>/)[1]),
    intro: strip(incident.match(/<p class="mut">([\s\S]*?)<\/p>/)[1]),
    stats: [...incident.matchAll(/<div class="sv"[^>]*>([\s\S]*?)<\/div><div class="sl">([\s\S]*?)<\/div>/g)].map((m) => ({ value: strip(m[1]), label: strip(m[2]), bad: /var\(--red\)/.test(m[0]) })),
    logs: [...incident.matchAll(/<div class="logline( err)?"><span class="lt">([^<]*)<\/span> <span class="ltrace">([^<]*)<\/span> <span class="lstep">([^<]*)<\/span>([\s\S]*?)<\/div>/g)].map((m) => ({ err: !!m[1], time: m[2], req: m[3], kind: m[4], text: strip(m[5]).replace(/^— /, "") })),
    questions: questionsOf(incident, "i"),
  },
];
if (challenges[0].questions.length !== 6 || challenges[1].questions.length !== 5) throw new Error("unexpected challenge question counts");
writeFileSync("content/ai-engineering/challenges.json", JSON.stringify(challenges, null, 2) + "\n");
console.log(`challenges: ${challenges.map((c) => `${c.id}=${c.questions.length}q`).join(", ")}`);
