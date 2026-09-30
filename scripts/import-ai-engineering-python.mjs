// One-off importer: courses/ai-engineering/python-foundations.html -> content/ai-engineering/python/.
// Writes topics.json, one Python harness per topic, and verifies each harness: the reference solution must pass every
// test and the starter code must not (tests' names and hints come from running the harness, so they cannot drift).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync("courses/ai-engineering/python-foundations.html", "utf8");
const OUT = "content/ai-engineering/python";
mkdirSync(`${OUT}/harness`, { recursive: true });

const ENT = { "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&rarr;": "→", "&larr;": "←", "&nbsp;": " ", "&mdash;": "—", "&ndash;": "–", "&hellip;": "…" };
const unent = (s) => s.replace(/&[a-z#0-9]+;/gi, (e) => ENT[e] ?? e);
/** Inline HTML -> plain text with `code` and **bold** markers. */
const rich = (h) => unent(h.replace(/<span class="mono-inline">([\s\S]*?)<\/span>/g, "`$1`").replace(/<(b|strong)>([\s\S]*?)<\/\1>/g, "**$2**").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const one = (re, s) => { const m = s.match(re); if (!m) throw new Error(`no match for ${re}`); return m[1]; };

function literalAt(src, from) {
  let i = src.indexOf("{", from), depth = 0, str = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (str) { if (c === "\\") j++; else if (c === str) str = null; continue; }
    if (c === '"' || c === "'" || c === "`") str = c;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return vm.runInNewContext(`(${src.slice(i, j + 1)})`);
  }
  throw new Error("unterminated literal");
}
const script = html.slice(html.indexOf("const PF_KEY"));
const cfgs = new Map();
for (const m of script.matchAll(/wireExercise\(\{/g)) { const c = literalAt(script, m.index); cfgs.set(c.id, c); }

const topics = [];
for (let n = 1; n <= 8; n++) {
  const sec = one(new RegExp(`<section id="t${n}">([\\s\\S]*?)</section>`), html);
  const cfg = cfgs.get(`t${n}`);
  if (!cfg) throw new Error(`no exercise config for t${n}`);
  const [beforeEx, exBlock] = sec.split('<div class="interactive">');
  const blocks = [];
  const concept = beforeEx.match(/<div class="def">\s*<div class="k">([\s\S]*?)<\/div>\s*<p>([\s\S]*?)<\/p>/);
  const intro = beforeEx.replace(/<div class="why">[\s\S]*?<\/p><\/div>|<div class="def">[\s\S]*?<\/p>\s*<\/div>|<div class="practice">[\s\S]*$/g, "");
  for (const p of intro.matchAll(/<p>([\s\S]*?)<\/p>/g)) blocks.push({ type: "p", text: rich(p[1]) });
  if (concept) blocks.push({ type: "concept", title: rich(concept[1]).replace(/^Concept: /, ""), text: rich(concept[2]) });
  const code = beforeEx.match(/<pre class="codeblock">([\s\S]*?)<\/pre>/);
  if (code) blocks.push({ type: "code", code: unent(code[1]) });
  const practice = beforeEx.match(/<div class="practice">[\s\S]*?<p>([\s\S]*?)<\/p>\s*<details><summary>[\s\S]*?<\/summary><div class="ans">([\s\S]*?)<\/div>/);
  const hints = [...exBlock.matchAll(/<details data-hint="(\d+)"><summary>([\s\S]*?)<\/summary><div class="hbody">([\s\S]*?)<\/div><\/details>/g)].map((h) => ({ title: rich(h[2]), text: rich(h[3]) }));
  const solution = unent(one(/data-hint="solution"[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/, exBlock));
  const harness = cfg.harnessPy;
  writeFileSync(`${OUT}/harness/t${n}.py`, harness + "\n");

  // Names and hints come from the harness itself, run against the reference solution (and the starter, which must fail).
  const probe = `import asyncio, json, inspect, sys
exec(open("${OUT}/harness/t${n}.py").read())
def run(code, lenient=False):
    try:
        r = harness(code)
        if inspect.iscoroutine(r): r = asyncio.run(r)
        return r
    except Exception as e:
        if not lenient: raise
        # The browser runner reports a harness that raises on unfinished code as failing tests.
        return {"ranOk": True, "results": [{"pass": False}], "harnessError": str(e)}
sol, starter = json.load(sys.stdin)
print(json.dumps({"sol": run(sol), "starter": run(starter, True)}))`;
  const res = JSON.parse(execFileSync("python3", ["-c", probe], { input: JSON.stringify([solution, cfg.starter]) }).toString());
  const results = res.sol.results ?? [];
  if (!res.sol.ranOk || results.length === 0 || !results.every((r) => r.pass)) throw new Error(`t${n}: the reference solution does not pass its own tests: ${JSON.stringify(res.sol).slice(0, 300)}`);
  if ((res.starter.results ?? []).every((r) => r.pass) && res.starter.ranOk) throw new Error(`t${n}: the starter already passes`);

  topics.push({
    number: n,
    title: rich(one(/<h2 class="serif">([\s\S]*?)<\/h2>/, sec)),
    why: rich(one(/<div class="why">[\s\S]*?<p>([\s\S]*?)<\/p>/, sec)),
    body: blocks,
    practice: practice ? { question: rich(practice[1]), answer: rich(practice[2]) } : null,
    exercise: {
      functionName: cfg.fnLabel,
      fileName: `${cfg.fnLabel}.py`,
      instructions: rich(one(/<p class="mut" style="margin-bottom:8px">([\s\S]*?)<\/p>/, exBlock)),
      starter: cfg.starter,
      solution,
      hints,
      harness: `python/harness/t${n}.py`,
      tests: results.map((r) => ({ name: r.name, hint: r.hint })),
    },
  });
}

// Self-check questions (ungraded): the text is in the HTML, the options in the buildSC calls.
const selfCheck = [];
for (let q = 1; q <= 5; q++) {
  const text = rich(one(new RegExp(`<div class="qtext">([\\s\\S]*?)</div>\\s*<div id="scq${q}opts">`), html));
  const start = script.indexOf(`buildSC("scq${q}", [`) + `buildSC("scq${q}", `.length;
  const arr = vm.runInNewContext(script.slice(start, script.indexOf(`], "scq${q}opts")`, start) + 1));
  selfCheck.push({ id: `scq${q}`, question: text, options: arr.map((o) => ({ text: o.text, correct: !!o.correct, why: o.correct ? o.correctText : o.reason })) });
}
if (selfCheck.some((s) => s.options.filter((o) => o.correct).length !== 1)) throw new Error("self-check needs exactly one correct option each");

writeFileSync(`${OUT}/topics.json`, JSON.stringify({ topics, selfCheck }, null, 2) + "\n");
console.log(topics.map((t) => `${t.number}:${t.exercise.tests.length}tests/${t.exercise.hints.length}hints`).join("  "), `selfcheck=${selfCheck.length}`);
