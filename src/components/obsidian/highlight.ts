/** Tiny syntax highlighter for the course's code cards. Colours are the Obsidian code tokens (tokens.css). */

export type Token = { text: string; color: string };

const C = {
  base: "#E6E8EE",
  keyword: "#C7B0FF",
  string: "#7FF0BD",
  comment: "#6B7180",
  number: "#FFD27A",
  fn: "#9BDDFF",
  type: "#FFB6C8",
} as const;

const PY_KEYWORDS = new Set(
  "and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield None True False".split(" "),
);
const PY_TYPES = new Set("str int float bool list dict set tuple bytes Any Literal Optional BaseModel Field".split(" "));

const PY_RE = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|[rbfRBF]{0,2}"(?:\\.|[^"\\\n])*"|[rbfRBF]{0,2}'(?:\\.|[^'\\\n])*')|(\b\d[\d_]*(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+|.)/g;
const JSON_RE = /("(?:\\.|[^"\\\n])*")(\s*:)?|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|\b(true|false|null)\b|(\s+|.)/g;

export function highlight(code: string, language: string): Token[] {
  const out: Token[] = [];
  const push = (text: string, color: string) => {
    const last = out[out.length - 1];
    if (last && last.color === color) last.text += text;
    else out.push({ text, color });
  };

  if (language === "python") {
    let prevWord = "";
    for (const m of code.matchAll(PY_RE)) {
      const [text, comment, str, num, word] = m;
      if (comment) push(text, C.comment);
      else if (str) push(text, C.string);
      else if (num) push(text, C.number);
      else if (word) {
        if (PY_KEYWORDS.has(word)) push(text, C.keyword);
        else if (prevWord === "def" || prevWord === "class") push(text, prevWord === "class" ? C.type : C.fn);
        else if (PY_TYPES.has(word)) push(text, C.type);
        else push(text, C.base);
        prevWord = word;
        continue;
      } else push(text, C.base);
      if (!/^\s+$/.test(text)) prevWord = "";
    }
    return out;
  }

  if (language === "json") {
    for (const m of code.matchAll(JSON_RE)) {
      const [text, str, colon, num, lit] = m;
      if (str) {
        push(str, colon ? C.fn : C.string);
        if (colon) push(colon, C.base);
      } else if (num) push(text, C.number);
      else if (lit) push(text, C.keyword);
      else push(text, C.base);
    }
    return out;
  }

  return [{ text: code, color: C.base }];
}

export function languageFor(file: string): string {
  if (file.endsWith(".py")) return "python";
  if (file.endsWith(".json") || file.endsWith(".jsonl")) return "json";
  return "text";
}
