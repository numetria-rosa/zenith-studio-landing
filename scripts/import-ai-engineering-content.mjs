// One-off importer: pulls the real AI Engineering course content out of the old static HTML
// (courses/ai-engineering/module-0N.html) into /content/ai-engineering, as
//   modules/N.json          module facts, lesson list, exercise, quiz bank, glossary
//   lessons/N/N.M.mdx       lesson bodies (MDX, verbatim text)
//   lessons/N/further-reading.mdx
//   interactives/N.json     every top-level data constant the old page's scripts define (samples, options, traces)
//   exercises/N.py          the old Python test harness, unchanged
//
// Run: node scripts/import-ai-engineering-content.mjs [moduleNumber ...]
// It uses htmlparser2, dom-serializer, acorn, unified and remark-mdx from node_modules (present through Next/MDX
// dependencies; this script is not part of the app and is not meant to be run again once the content is imported).
// Every text node of every lesson is checked against the source: the run fails if any words were dropped.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { parseDocument, DomUtils } from "htmlparser2";
import * as acorn from "acorn";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "courses/ai-engineering");
const OUT = path.join(ROOT, "content/ai-engineering");
const course = JSON.parse(readFileSync(path.join(OUT, "course.json"), "utf8"));

const args = process.argv.slice(2).map(Number);
const modules = args.length ? args : [1, 2, 3, 4, 5, 6, 7];

// ---------------------------------------------------------------- DOM helpers
const isTag = (n) => n.type === "tag" || n.type === "script" || n.type === "style";
const hasClass = (n, c) => isTag(n) && (n.attribs.class || "").split(/\s+/).includes(c);
const kids = (n) => (n.children || []).filter((c) => !(c.type === "text" && !c.data.trim()));
const text = (n) => DomUtils.textContent(n).replace(/\s+/g, " ").trim();
const find = (n, pred) => DomUtils.findOne(pred, n.children || [], true);
const findAll = (n, pred) => DomUtils.findAll(pred, n.children || []);
const byClass = (n, c) => find(n, (x) => hasClass(x, c));
const stripGlyph = (s) => s.replace(/^[^\p{L}\p{N}]+/u, "").trim();
// House style: no em dashes anywhere in the course copy. " \u2014 " becomes ": " (a definition or a label), a bare one becomes a hyphen.
const noEmDash = (s) => s.replace(/ \u2014 /g, ": ").replace(/\u2014/g, "-");
const writeClean = (file, content) => writeFileSync(file, noEmDash(content));

// ---------------------------------------------------------------- HTML -> MDX
const esc = (s) => s.replace(/[\\`*_{}[\]<>#~|]/g, "\\$&").replace(/&/g, "&amp;").replace(/^(\d+)\./, "$1\\.").replace(/^-/, "\\-");
const attr = (v) => `{${JSON.stringify(v)}}`;

function codeSpan(s) {
  const fence = "`".repeat((s.match(/`+/g) || []).reduce((m, r) => Math.max(m, r.length), 0) + 1);
  return `${fence}${s.startsWith("`") || s.endsWith("`") ? ` ${s} ` : s}${fence}`;
}
function wrapMark(mark, inner) {
  const lead = inner.match(/^\s*/)[0];
  const trail = inner.match(/\s*$/)[0];
  const core = inner.trim();
  return core ? `${lead}${mark}${core}${mark}${trail}` : inner;
}

function inline(nodes) {
  let out = "";
  for (const n of nodes) {
    if (n.type === "text") {
      out += esc(n.data.replace(/\s+/g, " "));
    } else if (n.type === "tag") {
      const mono = hasClass(n, "mono-inline");
      if (n.name === "br") out += "<br />";
      else if (mono && (n.name === "span" || n.name === "b")) {
        const c = codeSpan(DomUtils.textContent(n));
        out += n.name === "b" ? wrapMark("**", c) : c;
      } else if (n.name === "b" || n.name === "strong") out += wrapMark("**", inline(n.children));
      else if (n.name === "i" || n.name === "em") out += wrapMark("*", inline(n.children));
      else if (n.name === "code") out += codeSpan(DomUtils.textContent(n));
      else if (n.name === "a") out += `[${inline(n.children)}](${n.attribs.href})`;
      else if (n.name === "span") out += inline(n.children);
      else throw new Error(`unhandled inline <${n.name}>: ${text(n).slice(0, 60)}`);
    }
  }
  return out;
}
const inl = (n) => inline(n.children).replace(/[ \t]+/g, " ").trim();

function list(n, ordered) {
  return kids(n)
    .filter((c) => c.name === "li")
    .map((li, i) => `${ordered ? `${i + 1}.` : "-"} ${inl(li)}`)
    .join("\n");
}

const uiLabels = new Set();
// static text of each script-driven widget (labels, captions, buttons), by widget id: the ported component must show all of it
export const widgetText = {};
// Module 0's widgets, by the container id the old script fills.
const M0_BARE = { roleGrid: "roles", ecoGrid: "eco", roadmapCol: "roadmap" };
const M0_FRAMED = { classifyGrid: "classify", flowCol: "flow", pTable: "priority", pathQuizArea: "path" };
function m0WidgetFor(n) {
  const hit = findAll(n, (x) => x.attribs && M0_FRAMED[x.attribs.id])[0];
  if (!hit) throw new Error(`module 0: unknown interactive: ${text(n).slice(0, 60)}`);
  return M0_FRAMED[hit.attribs.id];
}

function blocks(nodes, ctx) {
  const out = [];
  for (const n of nodes) {
    if (n.type === "text") {
      if (n.data.trim()) throw new Error(`stray text: ${n.data.trim().slice(0, 60)}`);
      continue;
    }
    if (!isTag(n)) continue;
    if (n.name === "p") {
      const body = inl(n);
      out.push(hasClass(n, "mut") ? `<Muted>${body}</Muted>` : body);
    } else if (n.name === "ul") out.push(list(n, false));
    else if (n.name === "ol") out.push(list(n, true));
    else if (n.name === "h2" || n.name === "h3") out.push(`${n.name === "h2" ? "##" : "###"} ${inl(n)}`);
    else if (hasClass(n, "def")) {
      const k = text(byClass(n, "k"));
      uiLabels.add(k);
      out.push(`<Def title=${attr(k)}>\n\n${blocks(kids(n).filter((c) => !hasClass(c, "k")), ctx).join("\n\n")}\n\n</Def>`);
    } else if (hasClass(n, "callout")) out.push(`<Callout>\n\n${inl(n)}\n\n</Callout>`);
    else if (hasClass(n, "assume")) out.push(`<Assume>\n\n${inl(n)}\n\n</Assume>`);
    else if (hasClass(n, "connection")) {
      const l = text(byClass(n, "clbl"));
      uiLabels.add(l);
      out.push(`<Connection title=${attr(l)}>\n\n${blocks(kids(n).filter((c) => !hasClass(c, "clbl")), ctx).join("\n\n")}\n\n</Connection>`);
    } else if (hasClass(n, "prodwarn")) {
      const l = stripGlyph(text(byClass(n, "plbl")));
      uiLabels.add(text(byClass(n, "plbl")));
      const rest = kids(n).filter((c) => !hasClass(c, "plbl") && !hasClass(c, "prule"));
      const rule = byClass(n, "prule");
      out.push(`<ProdWarn title=${attr(l)}>\n\n${blocks(rest, ctx).join("\n\n")}\n\n<Rule>\n\n${inl(rule)}\n\n</Rule>\n\n</ProdWarn>`);
    } else if (hasClass(n, "practice")) {
      const label = text(byClass(n, "lbl"));
      const q = kids(n).filter((c) => c.name === "p").map(inl);
      const ans = byClass(n, "ans");
      uiLabels.add("Practice check");
      uiLabels.add("Check your answer");
      out.push(`<Practice${label === "Practice check" ? "" : ` label=${attr(label)}`}>\n\n${q.join("\n\n")}\n\n<Answer>\n\n${inl(ans)}\n\n</Answer>\n\n</Practice>`);
    } else if (hasClass(n, "decision")) {
      const dl = stripGlyph(text(byClass(n, "dlbl")));
      uiLabels.add(text(byClass(n, "dlbl")));
      out.push(`<Decision id=${attr(`m${ctx.module}`)} label=${attr(dl)}>\n\n${inl(byClass(n, "dsit"))}\n\n</Decision>`);
    } else if (hasClass(n, "debugcase")) {
      const label = stripGlyph(text(byClass(n, "glbl")));
      uiLabels.add(text(byClass(n, "glbl")));
      const intro = kids(n).filter((c) => c.name === "p").map((p) => (hasClass(p, "mut") ? `<Muted>${inl(p)}</Muted>` : inl(p))).join("\n\n");
      const evidence = DomUtils.textContent(byClass(n, "evidence")).replace(/\r/g, "");
      out.push(`<DebugCase id=${attr(`m${ctx.module}`)} label=${attr(label)} evidence=${attr(evidence)} question=${attr(text(byClass(n, "gquestion")))}>\n\n${intro}\n\n</DebugCase>`);
    } else if (hasClass(n, "interactive")) {
      const label = text(byClass(n, "ilbl"));
      uiLabels.add(label);
      if (byClass(n, "hintbox")) out.push(`<ExerciseLink />`);
      else {
        const id = ctx.module === 0 ? `m0-${m0WidgetFor(n)}` : `m${ctx.module}-s${ctx.section}`;
        const strings = [];
        const collect = (x) => {
          if (x.type === "text" && x.data.trim()) strings.push(x.data.replace(/\s+/g, " ").trim());
          (x.children || []).forEach(collect);
        };
        collect(n);
        widgetText[id] = strings.filter((t) => t !== "–");
        out.push(`<Interactive id=${attr(id)} label=${attr(label)} />`);
      }
    } else if (ctx.module === 0 && n.name === "div" && M0_BARE[n.attribs.id]) {
      // grids the script fills in (role cards, toolbox, roadmap): no frame, the component draws its own cards
      const id = `m0-${M0_BARE[n.attribs.id]}`;
      widgetText[id] = [];
      out.push(`<Interactive id=${attr(id)} label="" />`);
    } else if (hasClass(n, "orient")) {
      const l = text(byClass(n, "lbl"));
      uiLabels.add(l);
      out.push(`<Def title=${attr(l)}>\n\n${blocks(kids(n).filter((c) => !hasClass(c, "lbl")), ctx).join("\n\n")}\n\n</Def>`);
    } else if (ctx.module === 0 && (hasClass(n, "selfcheck-part") || hasClass(n, "finalscore") || hasClass(n, "optnote"))) {
      // the self-check is one widget; its parts are read from the HTML in importModule
    } else if (n.name === "div" && n.attribs.id === "spotCards") {
      // script-built "spot the ..." cards that sit outside an .interactive frame (modules 4 and 7)
      const id = `m${ctx.module}-s${ctx.section}`;
      widgetText[id] = [];
      out.push(`<Interactive id=${attr(id)} label="Live check" />`);
    } else if (n.name === "div" && n.attribs.id === "spotSummary") {
      // filled in by the spotCards widget
    } else if (n.name === "div" && n.attribs.id) {
      throw new Error(`unhandled script-built container #${n.attribs.id}`);
    } else if (n.name === "div" && kids(n).every((c) => c.name === "div" && kids(c).length)) {
      out.push(blocks(kids(n), ctx).join("\n\n"));
    } else throw new Error(`unhandled block <${n.name} class="${n.attribs.class || ""}">: ${text(n).slice(0, 70)}`);
  }
  return out;
}

// ---------------------------------------------------------------- script data
function extractConsts(scriptText) {
  const ast = acorn.parse(scriptText, { ecmaVersion: "latest", sourceType: "script" });
  const consts = {};
  const calls = [];
  const evalNode = (node) => {
    try {
      return vm.runInNewContext(`(${scriptText.slice(node.start, node.end)})`, {}, { timeout: 500 });
    } catch {
      return undefined;
    }
  };
  for (const stmt of ast.body) {
    if (stmt.type === "VariableDeclaration") {
      for (const d of stmt.declarations) {
        if (d.id.type === "Identifier" && d.init && ["ArrayExpression", "ObjectExpression", "TemplateLiteral", "Literal", "CallExpression"].includes(d.init.type)) {
          const v = evalNode(d.init);
          if (v !== undefined && typeof v !== "function") consts[d.id.name] = v;
        }
      }
    } else if (stmt.type === "ExpressionStatement" && stmt.expression.type === "CallExpression" && stmt.expression.callee.type === "Identifier") {
      const args = stmt.expression.arguments.map(evalNode);
      if (args.every((a) => a !== undefined)) calls.push({ fn: stmt.expression.callee.name, args });
    }
  }
  return { consts, calls };
}

const pyUnquote = (lit) => lit.slice(1, -1).replace(/\\(['"\\])/g, "$1").replace(/\\n/g, "\n");

function parseHarness(py) {
  const fn = (py.match(/ns\.get\('([A-Za-z_]\w*)'\)/) || [])[1];
  const tests = [];
  const pyStr = `('(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*")`;
  const re = new RegExp(`results\\.append\\(\\{\\s*['"]name['"]:\\s*${pyStr}[\\s\\S]*?['"]hint['"]:\\s*${pyStr}`, "g");
  for (const m of py.matchAll(re)) tests.push({ name: pyUnquote(m[1]), hint: pyUnquote(m[2]) });
  const declared = (py.match(/results\.append\(/g) || []).length;
  if (declared !== tests.length) throw new Error(`harness: found ${tests.length} test name/hint pairs but ${declared} results.append calls`);
  return { functionName: fn, tests };
}

// ---------------------------------------------------------------- quiz
function numericChecks(scriptText) {
  const out = {};
  for (const m of scriptText.matchAll(/function checkQ(\d)\(\)\{([\s\S]*?)\n\}/g)) out[`q${m[1]}`] = m[2];
  return out;
}

function buildQuiz(module, section, consts, calls, scriptText) {
  const cards = findAll(section, (x) => hasClass(x, "qcard"));
  const numeric = numericChecks(scriptText);
  const mc = Object.fromEntries(calls.filter((c) => c.fn === "buildMC").map((c) => [c.args[0], c.args[1]]));
  const questions = [];
  // renderQuizExplain(ex, opt, "principle") belongs to the question whose q<N>explain element was read just before it
  const principles = {};
  for (const m of scriptText.matchAll(/renderQuizExplain\(ex, opt, ("(?:[^"\\]|\\.)*")\)/g)) {
    const before = scriptText.slice(0, m.index);
    const ids = [...before.matchAll(/getElementById\("(q\d+)explain"\)/g)];
    if (ids.length) principles[ids[ids.length - 1][1]] = JSON.parse(m[1]);
  }
  for (const card of cards) {
    const opts = find(card, (x) => /^q\d+opts$/.test(x.attribs?.id || ""));
    const exp = find(card, (x) => /^q\d+explain$/.test(x.attribs?.id || ""));
    const key = (opts?.attribs.id || exp.attribs.id).match(/^(q\d+)/)[1];
    const q = { id: `m${module}-${key}`, question: inl(byClass(card, "qtext")), source: "checkpoint" };
    const list = consts[`${key}Options`] || mc[key];
    const select = find(card, (x) => x.name === "select");
    if (list) {
      const principle = principles[key];
      q.options = list.map((o) => ({ text: o.text, correct: !!o.correct, why: o.correct ? (o.correctText || principle || "").replace(/^Correct\.\s*/, "") : o.reason || "" }));
      if (principle) q.principle = principle;
      else if (list.find((o) => o.correct)?.correctText) q.principle = list.find((o) => o.correct).correctText.replace(/^Correct\.\s*/, "");
    } else if (select) {
      // yes/no select (module 1, Q5): the source's two feedback strings become the two options' explanations
      const code = numeric[key] || scriptText.slice(scriptText.indexOf("function checkQ5"));
      const strings = [...code.matchAll(/ex\.textContent = ("(?:[^"\\]|\\.)*")/g)].map((m) => JSON.parse(m[1]));
      const optionEls = findAll(select, (x) => x.name === "option").filter((o) => o.attribs.value);
      const correctVal = (code.match(/val === "(\w+)"/) || [])[1];
      q.options = optionEls.map((o) => ({ text: text(o), correct: o.attribs.value === correctVal, why: o.attribs.value === correctVal ? strings[0] : strings[1] }));
    } else {
      const code = numeric[key];
      if (!code) throw new Error(`m${module} ${key}: no options, select or numeric check found`);
      const m = code.match(/val === (-?[\d.]+)/) || code.match(/Math\.abs\(val - (-?[\d.]+)\) (?:<=|<) ([\d.]+)/);
      const strings = [...code.matchAll(/ex\.textContent = ("(?:[^"\\]|\\.)*"|`[^`]*`)/g)].map((x) => (x[1][0] === "`" ? x[1].slice(1, -1) : JSON.parse(x[1])));
      if (!m || strings.length < 2) throw new Error(`m${module} ${key}: unhandled numeric check:\n${code}`);
      q.numeric = { answer: Number(m[1]), tolerance: m[2] ? Number(m[2]) : 0, correct: strings[0], incorrect: strings[1] };
    }
    questions.push(q);
  }
  return questions;
}

// ---------------------------------------------------------------- sections
const words = (s) => (s.match(/\S+/g) || []).length;

/** Module 0's self-check: five parts read from the HTML, the choice options from the script's buildSC() calls. */
function buildSelfCheck(section, calls) {
  const parts = findAll(section, (x) => hasClass(x, "selfcheck-part")).map((part) => {
    const label = text(byClass(part, "sclbl"));
    const area = find(part, (x) => x.name === "textarea");
    if (area) return { kind: "text", label, placeholder: area.attribs.placeholder };
    const id = find(part, (x) => /^sc\d+opts$/.test((x.attribs && x.attribs.id) || "")).attribs.id.replace("opts", "");
    const call = calls.find((c) => c.fn === "buildSC" && c.args[0] === id);
    if (!call) throw new Error(`self-check ${id}: buildSC call not found`);
    return { kind: "choice", id, label, question: text(byClass(part, "qtext")), options: call.args[1] };
  });
  return { parts, scoreLabel: text(byClass(section, "fslbl")), note: text(byClass(section, "optnote")) };
}

function importModule(number) {
  const file = path.join(SRC, `module-0${number}.html`);
  const doc = parseDocument(readFileSync(file, "utf8"));
  const wrap = byClass(doc, "wrap");
  const hero = byClass(wrap, "hero");
  const scripts = findAll(doc, (x) => x.name === "script" && !x.attribs.src).map((s) => DomUtils.textContent(s));
  const scriptText = scripts.join("\n");
  const { consts, calls } = extractConsts(scriptText);

  const courseModule = course.stages.flatMap((s) => s.modules.map((m) => ({ ...m, stage: s }))).find((m) => m.number === number);
  const stageLabel = courseModule.stage.name ? `${courseModule.stage.label} · ${courseModule.stage.name}` : courseModule.stage.label;

  const meta = {
    number,
    slug: text(byClass(hero, "serif") || find(hero, (x) => x.name === "h1")).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    title: text(find(hero, (x) => x.name === "h1")),
    stage: stageLabel,
    minutes: courseModule.minutes,
    summary: text(byClass(hero, "sub")),
    objectives: findAll(byClass(hero, "objectives"), (x) => x.name === "li").map(text),
  };

  const lessons = []; // {title, mdx}
  let exercise = null;
  let quiz = null;
  let glossary = [];
  let furtherReading = null;
  let selfCheck = null;
  const ctxBase = { module: number };

  const orient = kids(wrap).find((c) => hasClass(c, "orient"));
  if (orient) {
    uiLabels.add(text(byClass(orient, "lbl")));
    lessons.push({ title: "Before you start", section: 0, mdx: blocks(kids(orient).filter((c) => !hasClass(c, "lbl")), { ...ctxBase, section: 0 }).join("\n\n") });
  }

  for (const section of kids(wrap).filter((n) => n.name === "section")) {
    const kh = byClass(section, "kh");
    const numText = text(byClass(kh, "num"));
    const num = Number(numText);
    const title = text(find(kh, (x) => x.name === "h2"));
    const body = kids(section).filter((c) => c !== kh);
    if (/^Checkpoint/.test(title)) {
      quiz = { passMark: 4, questions: buildQuiz(number, section, consts, calls, scriptText) };
    } else if (/^Glossary/.test(title)) {
      const grid = body.find((c) => c.name === "div");
      glossary = kids(grid).map((row) => {
        const term = text(find(row, (x) => x.name === "b"));
        return { term, definition: text(row).slice(term.length).replace(/^\s*[\u2014\u2013-]\s*/, "") };
      });
    } else if (/^Further reading/.test(title)) {
      furtherReading = blocks(body, { ...ctxBase, section: num }).join("\n\n");
    } else if (number === 0) {
      // Orientation: sections keep their printed numbers (0.1 appears twice: the text and its interactive), so equal numbers merge into one lesson
      let mdx = blocks(body, { ...ctxBase, section: numText }).join("\n\n");
      if (/^Can you explain/.test(title)) {
        selfCheck = buildSelfCheck(section, calls);
        mdx += `\n\n<Interactive id="m0-selfcheck" label="" />`;
      }
      const prev = lessons[lessons.length - 1];
      if (prev && prev.numText === numText) prev.mdx += `\n\n## ${title}\n\n${mdx}`;
      else lessons.push({ title, section: num, numText, mdx });
    } else {
      const mdx = blocks(body, { ...ctxBase, section: num }).join("\n\n");
      lessons.push({ title, section: num, mdx });
      if (/^Build it/.test(title)) {
        const box = findAll(section, (x) => hasClass(x, "interactive") && byClass(x, "hintbox"))[0];
        const hintbox = byClass(box, "hintbox");
        const starterKey = Object.keys(consts).find((k) => /_STARTER$/.test(k));
        const harnessKey = Object.keys(consts).find((k) => /_HARNESS_PY$/.test(k));
        if (!starterKey || !harnessKey) throw new Error(`m${number}: exercise starter/harness constants not found (${Object.keys(consts).join(", ")})`);
        const hints = findAll(hintbox, (x) => x.name === "details" && x.attribs["data-hint"] && x.attribs["data-hint"] !== "solution").map((d) => ({
          title: text(find(d, (x) => x.name === "summary")),
          mdx: inl(byClass(d, "hbody")),
        }));
        const sol = findAll(hintbox, (x) => x.name === "details" && x.attribs["data-hint"] === "solution")[0];
        const harness = parseHarness(consts[harnessKey]);
        exercise = {
          label: text(byClass(box, "ilbl")),
          instructions: inl(find(box, (x) => x.name === "p" && hasClass(x, "mut"))),
          functionName: harness.functionName,
          fileName: `${harness.functionName}.py`,
          starter: consts[starterKey],
          solution: DomUtils.textContent(find(sol, (x) => x.name === "pre")).replace(/\r/g, ""),
          hints,
          tests: harness.tests,
          harness: `exercises/${number}.py`,
        };
        mkdirSync(path.join(OUT, "exercises"), { recursive: true });
        writeClean(path.join(OUT, "exercises", `${number}.py`), consts[harnessKey] + "\n");
      }
    }
  }

  // read time per lesson: the module's minutes spread by word count
  const totalWords = lessons.reduce((n, l) => n + words(l.mdx), 0);
  lessons.forEach((l, i) => {
    l.number = `${number}.${i + 1}`;
    // modules with no stated length (orientation) get plain reading time, 200 words a minute
    l.minutes = Math.max(2, Math.round(courseModule.minutes ? (courseModule.minutes * words(l.mdx)) / totalWords : words(l.mdx) / 200));
  });
  if (exercise) exercise.id = lessons.find((l) => /^Build it/.test(l.title)).number;

  // write
  const lessonDir = path.join(OUT, "lessons", String(number));
  mkdirSync(lessonDir, { recursive: true });
  for (const l of lessons) writeClean(path.join(lessonDir, `${l.number}.mdx`), `${l.mdx}\n`);
  if (furtherReading) writeClean(path.join(lessonDir, "further-reading.mdx"), `${furtherReading}\n`);

  const moduleJson = {
    ...meta,
    lessons: lessons.map((l) => ({ number: l.number, title: l.title, minutes: l.minutes })),
    ...(exercise ? { exercise } : {}),
    ...(quiz ? { quiz } : {}),
    glossary,
    ...(furtherReading ? { furtherReading: true } : {}),
  };
  mkdirSync(path.join(OUT, "modules"), { recursive: true });
  writeClean(path.join(OUT, "modules", `${number}.json`), JSON.stringify(moduleJson, null, 2) + "\n");

  const data = { ...consts };
  if (selfCheck) data.selfCheck = selfCheck;
  // the exercise, the quiz and page state live elsewhere; what is left is the widgets' own data
  for (const k of Object.keys(data)) if (/_HARNESS_PY$|_STARTER$|^MODULE_ID$|^score$|^answered$|HasAttempted$|^q\d+Options$|^(pathAnswers|sc1Checked|scAnswered|scScore|activePFilter)$|^(rankPicked|rankRevealed|traceIdx|travelIdx|travelLastAction|travelStreak|travelEnded)$/.test(k)) delete data[k];
  const decisionKey = Object.keys(data).find((k) => /^DECISION\d*_OPTS$/.test(k));
  const decisionCall = calls.find((c) => c.fn === "initDecision");
  if (decisionKey) data.decision = data[decisionKey];
  else if (decisionCall) data.decision = decisionCall.args[1];
  const debugCall = calls.find((c) => c.fn === "initDebugCase");
  if (debugCall) data.debugCase = debugCall.args[1];
  mkdirSync(path.join(OUT, "interactives"), { recursive: true });
  writeClean(path.join(OUT, "interactives", `${number}.json`), JSON.stringify(data, null, 2) + "\n");
  const own = Object.fromEntries(Object.entries(widgetText).filter(([k]) => k.startsWith(`m${number}-`)));
  writeClean(path.join(OUT, "interactives", `${number}.static.json`), JSON.stringify(own, null, 2) + "\n");

  // verbatim check: every word of the source sections (minus UI labels and script-built widgets) is in the MDX
  verify(number, wrap, lessons, furtherReading, quiz, glossary, meta, exercise);
  return moduleJson;
}

function mdxWords(mdx) {
  const tree = unified().use(remarkParse).use(remarkMdx).parse(mdx);
  const out = [];
  const visit = (n) => {
    if (n.type === "text" || n.type === "inlineCode") out.push(n.value);
    for (const a of n.attributes || []) {
      if (typeof a.value === "string") out.push(a.value);
      else if (a.value?.value) {
        try {
          out.push(JSON.parse(a.value.value));
        } catch {
          /* not a string literal */
        }
      }
    }
    (n.children || []).forEach(visit);
  };
  visit(tree);
  return out.join(" ").replace(/\s+/g, " ").trim();
}

function verify(number, wrap, lessons, furtherReading, quiz, glossary, meta, exercise) {
  const produced = lessons.map((l) => mdxWords(l.mdx)).join(" ") + " " + (furtherReading ? mdxWords(furtherReading) : "");
  const normalise = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const have = new Set(normalise(produced).split(" "));
  const sourceTexts = [];
  const orient = kids(wrap).find((c) => hasClass(c, "orient"));
  if (orient) sourceTexts.push(text(orient));
  for (const section of kids(wrap).filter((n) => n.name === "section")) {
    const kh = byClass(section, "kh");
    const title = text(find(kh, (x) => x.name === "h2"));
    if (/^(Checkpoint|Glossary)/.test(title)) continue;
    // widgets built by script have no text in the HTML; the exercise box moves to the Exercise tab
    const skip = (c) => hasClass(c, "interactive") || hasClass(c, "kh") || hasClass(c, "selfcheck-part") || hasClass(c, "finalscore") || hasClass(c, "optnote");
    const clone = { ...section, children: section.children.filter((c) => !skip(c)) };
    sourceTexts.push(text(clone));
  }
  const missing = [];
  for (const s of sourceTexts) for (const w of normalise(s).split(" ")) if (w && !have.has(w) && !missing.includes(w)) missing.push(w);
  const ignore = new Set([...uiLabels].flatMap((l) => normalise(l).split(" ")));
  const real = missing.filter((w) => !ignore.has(w));
  if (real.length) throw new Error(`module ${number}: words missing from the MDX: ${real.slice(0, 20).join(", ")}`);
}

for (const n of modules) {
  const m = importModule(n);
  console.log(`module ${n}: ${m.lessons.length} lessons, ${m.quiz?.questions.length ?? 0} checkpoint questions, exercise ${m.exercise ? m.exercise.tests.length + " tests" : "none"}, ${m.glossary.length} glossary terms`);
}
