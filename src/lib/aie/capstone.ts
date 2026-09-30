/* The Module 8 capstone: content shape and the grading rules, ported unchanged from module-08.html.
   Grading runs on the server (capstone actions), so a student cannot score themselves. */

export type DesignField = { id: string; label: string; mod: string; placeholder: string; minWords: number; groups: string[][]; minGroups: number; needsNumber?: boolean };
export type DebugOption = { text: string; correct: boolean; reason?: string };

export type CapstoneContent = {
  passMark: number;
  design: { title: string; intro: string; frame: string; check: string; scoreLabel: string; scoreEmpty: string; fields: DesignField[] };
  implementation: {
    title: string;
    intro: string;
    frame: string;
    instructions: string;
    editorLabel: string;
    run: string;
    reset: string;
    scoreLabel: string;
    scoreEmpty: string;
    functionName: string;
    fileName: string;
    starter: string;
    tests: { name: string; hint: string }[];
    harness: string;
  };
  debugging: {
    title: string;
    intro: string;
    frame: string;
    code: string;
    q1: string;
    q2: string;
    answerLabel: string;
    placeholder: string;
    retry: string;
    check: string;
    scoreLabel: string;
    scoreEmpty: string;
    options: DebugOption[];
  };
  final: { title: string; intro: string; rows: string[]; empty: string; totalLabel: string; recompute: string };
  review: { title: string; intro: string; questions: { tag: string; text: string; placeholder: string }[] };
};

export type CapstoneText = {
  design: { notWritten: string; tooBrief: string; fewIdeas: string; noNumber: string; complete: string };
  debug: { correct: string; wrong: string; pass: string; brief: string; neither: string; noProblem: string; noStructure: string; noFix: string };
  final: { score: string; locked: string; ready: string; banner: string; bannerText: string };
};

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (w, k: string) => (k in v ? String(v[k]) : w));

export type DesignStatus = { state: "empty" | "pass" | "fail"; message: string };

/** Part 1: per field, enough words, enough distinct ideas (keyword groups), and a number where one is needed. */
export function gradeDesign(fields: DesignField[], values: Record<string, string>, text: CapstoneText["design"]) {
  const statuses: Record<string, DesignStatus> = {};
  let passed = 0;
  for (const f of fields) {
    const val = values[f.id] ?? "";
    const n = words(val).length;
    const lower = val.toLowerCase();
    const hit = f.groups.filter((g) => g.some((kw) => lower.includes(kw))).length;
    const hasNumber = !f.needsNumber || /\d/.test(val);
    const pass = n >= f.minWords && hit >= f.minGroups && hasNumber;
    if (pass) passed++;
    statuses[f.id] = !val.trim()
      ? { state: "empty", message: text.notWritten }
      : n < f.minWords
        ? { state: "fail", message: fill(text.tooBrief, { words: n, min: f.minWords }) }
        : hit < f.minGroups
          ? { state: "fail", message: fill(text.fewIdeas, { hit, total: f.groups.length, missing: f.groups.length - hit }) }
          : !hasNumber
            ? { state: "fail", message: text.noNumber }
            : { state: "pass", message: text.complete };
  }
  return { statuses, score: Math.round((passed / fields.length) * 100) };
}

export type DebugGrade = { pass: boolean; namesProblem: boolean; namesFix: boolean; enoughDistinctContent: boolean; hasStructure: boolean };

/** Part 3's free-text diagnosis: names the problem AND the fix, in enough distinct words, as a sentence rather than a keyword list. */
export function gradeDebugAnswer(raw: string): DebugGrade {
  const val = raw.trim();
  const lower = val.toLowerCase();
  const ws = val.split(/\s+/).filter(Boolean);
  const unique = new Set(ws.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))).size;
  const namesProblem = /no delay|instant(ly)?|immediat|tight loop|hammer(s|ing)?|zero delay|right away|no wait|without (a |any )?delay|no backoff|as fast as possible|back.?to.?back|retries? too (fast|quickly)|calls? itself right away/.test(lower);
  const namesFix = /backoff|jitter|\bsleep\b|add(ing|ed)?\s+(a |an |some )?delay|introduc(e|ing)\s+(a |an )?delay|increas(e|ing)\s+(the\s+)?delay|put\s+(a |an )?delay|insert\s+(a |an )?delay|with\s+a\s+delay|wait\s+before\s+(retry|retrying|each|the next)/.test(lower);
  const enoughDistinctContent = ws.length >= 10 && unique >= 8;
  const connectors = (lower.match(/\b(the|a|an|to|so|because|since|which|that|this|before|each|every|between|instead|currently|right now|so that|causes?|means?|when|then)\b/g) ?? []).length;
  const hasStructure = connectors >= 2 || /[,.;]/.test(val);
  return { pass: namesProblem && namesFix && enoughDistinctContent && hasStructure, namesProblem, namesFix, enoughDistinctContent, hasStructure };
}

/** The message shown for a graded diagnosis, in the old page's order of checks. */
export function debugMessage(g: DebugGrade, t: CapstoneText["debug"]): string {
  if (g.pass) return t.pass;
  if (!g.enoughDistinctContent) return t.brief;
  if (!g.namesProblem && !g.namesFix) return t.neither;
  if (!g.namesProblem) return t.noProblem;
  if (!g.hasStructure) return t.noStructure;
  return t.noFix;
}

/** Part 3's score: the multiple-choice and the diagnosis, half each. */
export const debugScore = (mcqCorrect: boolean, textOk: boolean) => Math.round(((mcqCorrect ? 1 : 0) + (textOk ? 1 : 0)) / 2 * 100);

export type Scores = { design: number | null; impl: number | null; debug: number | null };

/** Part 4: the three parts averaged (a part not attempted counts as 0). Completing the course needs the pass mark. */
export function finalScore(s: Scores, passMark: number) {
  const parts = [s.design, s.impl, s.debug];
  const total = parts.some((p) => p !== null) ? Math.round(parts.reduce<number>((a, b) => a + (b ?? 0), 0) / 3) : 0;
  return { total, complete: total >= passMark };
}
