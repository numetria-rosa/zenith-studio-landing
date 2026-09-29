"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { saveExerciseRunAction } from "@/app/lab/ai-engineering/learn/actions";
import { highlightLines } from "@/components/obsidian/highlight";
import { Icon } from "@/components/obsidian/Icon";
import { runHarness, type RunHandle } from "@/lib/aie/py-runner";

type TestState = "idle" | "run" | "pass" | "fail";
type Mode = "attempt" | "typing" | "solved";
type LogLine = { text: string; color: string };

const C = { text: "#E6E8EE", dim: "#7D8392", pass: "#7FF0BD", fail: "#FF9BB0", cyan: "#9BDDFF" };

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Word-wraps a failure message so the terminal (which never wraps) shows all of it. */
function wrap(text: string, width = 68): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      if (line && (line + " " + word).length > width) {
        out.push(line);
        line = word;
      } else line = line ? line + " " + word : word;
    }
    out.push(line);
  }
  return out;
}

const glass = "border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const pill =
  "inline-flex min-h-11 items-center justify-center gap-[9px] rounded-full px-[18px] text-[14.5px] font-medium transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan disabled:cursor-not-allowed";

export type ExerciseViewProps = {
  module: number;
  exerciseId: string;
  title: string;
  description: ReactNode;
  fileName: string;
  starter: string;
  solution: string;
  tests: { name: string; hint: string }[];
  hints: { title: string; body: ReactNode }[];
  harnessSource: string;
  functionName: string;
  initial: { code: string; attempted: boolean; passed: number };
  next: { label: string; href: string };
};

export function ExerciseView(p: ExerciseViewProps) {
  const [code, setCode] = useState(p.initial.code || p.starter);
  const attemptRef = useRef(code);
  const [mode, setMode] = useState<Mode>("attempt");
  const [attempted, setAttempted] = useState(p.initial.attempted);
  const [tests, setTests] = useState<TestState[]>(() => p.tests.map(() => "idle"));
  const [log, setLog] = useState<LogLine[]>([]);
  const [busy, setBusy] = useState<"idle" | "sandbox" | "reveal">("idle");
  const [hintCount, setHintCount] = useState(0);
  const [done, setDone] = useState(p.initial.passed === p.tests.length);
  const handle = useRef<RunHandle | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const escaped = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    handle.current?.stop();
    timers.current.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  const push = (...lines: LogLine[]) => setLog((l) => [...l, ...lines]);
  const later = (fn: () => void, ms: number) => {
    if (reducedMotion()) return fn();
    timers.current.push(setTimeout(fn, ms));
  };

  const passN = tests.filter((t) => t === "pass").length;
  const barColor = passN === tests.length ? "#3DDC97" : "#5CC8FF";
  const lines = useMemo(() => highlightLines(code, "python"), [code]);
  const changed = useMemo(() => {
    const base = new Set(p.starter.split("\n"));
    return code.split("\n").map((l) => mode !== "attempt" && !base.has(l));
  }, [code, mode, p.starter]);
  const locked = !attempted;

  const stop = () => {
    handle.current?.stop();
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const run = async () => {
    if (busy === "sandbox") return stop();
    if (busy === "reveal") return;
    const src = code;
    const savable = mode === "attempt";
    setBusy("sandbox");
    setDone(false);
    setTests(p.tests.map(() => "idle"));
    setLog([{ text: `$ run-tests ${p.fileName}`, color: C.text }, { text: "Starting the Python sandbox. The first run downloads the interpreter and can take up to a minute.", color: C.dim }]);
    if (savable) attemptRef.current = src;
    handle.current = runHarness(p.harnessSource, "harness", src, { onLoaded: () => push({ text: "Sandbox ready, running your code.", color: C.dim }) });
    const outcome = await handle.current.done;

    if (outcome.kind !== "results") {
      const msg = outcome.kind === "code-error" ? `Your code did not run: ${outcome.error}. Check for a syntax error, or that the function is named exactly ${p.functionName}.` : outcome.error;
      push(...wrap(msg).map((text) => ({ text, color: C.fail })));
      setBusy("idle");
      if (outcome.kind === "code-error" || outcome.kind === "timeout") markAttempted(src, savable, 0);
      return;
    }

    setBusy("reveal");
    // The harness could not read what the student's function returned: every test fails, with the reason.
    const results = outcome.results.length
      ? outcome.results
      : p.tests.map((t) => ({ ...t, pass: false, errorMessage: null, hint: `The tests could not read what your function returned (${outcome.harnessError ?? "no results"}). Return exactly the shape the brief describes. ${t.hint}` }));
    let passed = 0;
    results.forEach((r, i) => {
      later(() => setTests((t) => t.map((s, j) => (j === i ? "run" : s))), 380 + i * 620);
      later(() => {
        if (r.pass) passed++;
        setTests((t) => t.map((s, j) => (j === i ? (r.pass ? "pass" : "fail") : s)));
        push(
          { text: `${r.pass ? "PASSED" : "FAILED"}  ${r.name}`, color: r.pass ? C.pass : C.fail },
          ...(r.pass ? [] : wrap(r.errorMessage ? `Your code raised: ${r.errorMessage}. ${r.hint}` : r.hint).map((text) => ({ text: "        " + text, color: C.dim }))),
        );
      }, 760 + i * 620);
    });
    later(() => {
      push({ text: `${passed} / ${results.length} tests passing`, color: passed === results.length ? C.pass : C.dim });
      setDone(passed === results.length);
      setBusy("idle");
      markAttempted(src, savable, passed);
    }, 960 + (results.length - 1) * 620);
  };

  const markAttempted = (src: string, savable: boolean, passed: number) => {
    setAttempted(true);
    if (savable) void saveExerciseRunAction(p.module, src, passed).catch(() => {});
  };

  const watchSolution = () => {
    if (locked || busy !== "idle" || mode === "typing") return;
    if (mode === "attempt") attemptRef.current = code;
    if (reducedMotion()) {
      setCode(p.solution);
      setMode("solved");
      return;
    }
    setMode("typing");
    let n = 0;
    const tick = () => {
      n = Math.min(p.solution.length, n + 3);
      setCode(p.solution.slice(0, n));
      if (n < p.solution.length) timers.current.push(setTimeout(tick, 24));
      else setMode("solved");
    };
    tick();
  };

  const reset = () => {
    stop();
    setBusy("idle");
    setCode(attemptRef.current);
    setMode("attempt");
    setTests(p.tests.map(() => "idle"));
    setLog([]);
    setDone(false);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") escaped.current = true; // Escape then Tab leaves the editor (no keyboard trap)
    else if (e.key === "Tab" && !e.shiftKey && !escaped.current) {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: a, selectionEnd: b } = el;
      setCode(code.slice(0, a) + "    " + code.slice(b));
      requestAnimationFrame(() => el.setSelectionRange(a + 4, a + 4));
    } else if (e.key !== "Tab") escaped.current = false;
  };

  const maxLen = Math.max(...code.split("\n").map((l) => l.length), 1);
  const modeLabel = mode === "attempt" ? "Your attempt" : mode === "typing" ? "Typing solution" : "Solution";
  const editable = mode === "attempt";

  return (
    <div className="flex flex-col gap-7 lg:flex-row">
      <div className="flex w-full shrink-0 flex-col gap-5 lg:w-[360px]">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-cyan">Exercise {p.exerciseId} · Code</span>
          <h1 className="m-0 text-[36px] font-medium leading-[1.05] tracking-[-0.035em]">{p.title}</h1>
          <p className="m-0 text-[15.5px] leading-[1.65] text-soft">{p.description}</p>
        </div>

        <div className={`flex flex-col gap-3.5 rounded-[20px] p-[18px] ${glass}`}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-dim">Tests</span>
            <span className="font-mono text-[13px] text-soft" aria-live="polite">
              {passN} / {tests.length} passing
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-[3px] bg-white/[0.08]">
            <div className="h-full rounded-[3px] transition-[width,background] duration-[350ms]" style={{ width: `${(passN / tests.length) * 100}%`, background: barColor }} />
          </div>
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
            {p.tests.map((t, i) => (
              <li key={t.name} className="flex items-center gap-3 text-[14px] leading-[1.4] text-soft">
                <TestMark state={tests[i]!} />
                <span>{t.name}</span>
                <span className="sr-only">{{ idle: " not run", run: " running", pass: " passed", fail: " failed" }[tests[i]!]}</span>
              </li>
            ))}
          </ul>
        </div>

        {hintCount > 0 && (
          <div className="flex flex-col gap-3">
            {p.hints.slice(0, hintCount).map((h) => (
              <div key={h.title} role="note" className="flex gap-3 rounded-[18px] border border-[rgba(245,184,61,0.45)] bg-[rgba(245,184,61,0.07)] p-4 text-[14px] leading-[1.6] text-[#FFE3A6]">
                <Icon name="bulb" size={20} color="#FFD27A" className="shrink-0" />
                <span>
                  <b className="mb-1 block font-mono text-[11.5px] font-medium uppercase tracking-[0.12em] text-[#FFD27A]">{h.title}</b>
                  {h.body}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={run} disabled={busy === "reveal"} className={`${pill} col-span-2 bg-frost text-void ${busy === "reveal" ? "opacity-60" : ""}`}>
            <Icon name={busy === "sandbox" ? "stop" : "play"} size={16} color="#05060A" strokeWidth={2} />
            {busy === "sandbox" ? "Stop" : busy === "reveal" ? "Running…" : "Run tests"}
          </button>
          <button type="button" onClick={() => setHintCount((n) => Math.min(p.hints.length, n + 1))} disabled={hintCount >= p.hints.length} className={`${pill} ${glass} text-frost disabled:opacity-50`}>
            <Icon name="bulb" size={16} color="#F5F6F8" />
            {hintCount >= p.hints.length ? "No more hints" : "Hint"}
          </button>
          <button type="button" onClick={watchSolution} aria-disabled={locked || busy !== "idle"} aria-describedby={locked ? "solution-lock" : undefined} className={`${pill} ${glass} text-frost ${locked || busy !== "idle" ? "cursor-not-allowed opacity-50" : ""}`}>
            <Icon name="eye" size={16} color="#F5F6F8" />
            Watch solution
          </button>
          <button type="button" onClick={reset} className={`${pill} ${glass} col-span-2 text-soft`}>
            <Icon name="reset" size={16} color="#C9CCD4" />
            Reset to my attempt
          </button>
        </div>
        {locked && (
          <p id="solution-lock" className="m-0 -mt-2 font-mono text-[12px] text-dim">
            Run your code at least once to unlock the solution.
          </p>
        )}

        {done && (
          <Link href={p.next.href} className="cx-pulse flex items-center gap-3.5 rounded-[18px] border border-[rgba(61,220,151,0.55)] bg-[rgba(61,220,151,0.10)] px-[18px] py-4 text-frost no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
            <Icon name="check" size={20} color="#7FF0BD" strokeWidth={2.4} />
            <span className="flex flex-1 flex-col gap-0.5">
              <b className="text-[15px] font-medium">Exercise complete</b>
              <span className="text-[13px] text-mint-text">{p.next.label}</span>
            </span>
            <Icon name="arrow" size={18} color="#7FF0BD" />
          </Link>
        )}
      </div>

      <div className="flex min-h-[560px] min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-white/[0.12] bg-ink shadow-[0_30px_80px_rgba(0,0,0,0.45),0_0_60px_rgba(92,200,255,0.08)]">
        <div className="flex h-[46px] items-center gap-3.5 border-b border-white/[0.08] bg-white/[0.025] px-4">
          <span aria-hidden className="flex gap-[7px]">
            <span className="h-[11px] w-[11px] rounded-md bg-[#FF5F57]" />
            <span className="h-[11px] w-[11px] rounded-md bg-[#FEBC2E]" />
            <span className="h-[11px] w-[11px] rounded-md bg-[#28C840]" />
          </span>
          <span className="inline-flex h-[46px] items-center gap-2 border-b-2 border-cyan px-3.5 font-mono text-[12.5px] text-frost">
            <Icon name="code" size={14} color="#9BDDFF" />
            {p.fileName}
          </span>
          <span className="hidden font-mono text-[12.5px] text-dim sm:inline">{p.tests.length} tests</span>
          <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.12em] text-cyan-text">{modeLabel}</span>
        </div>

        <div className="relative flex-1 overflow-auto py-4 font-mono text-[14px] leading-6 text-[#E6E8EE]">
          <div aria-hidden className="min-w-fit" style={{ width: `calc(${maxLen}ch + 60px)` }}>
            {lines.map((tokens, i) => (
              <div key={i} className="flex min-h-6 gap-[18px] px-5" style={{ background: changed[i] ? "rgba(92,200,255,0.05)" : undefined }}>
                <span className="w-[22px] shrink-0 select-none text-right text-line-num">{i + 1}</span>
                <span className="whitespace-pre">
                  {tokens.map((t, j) => (
                    <span key={j} style={{ color: t.color }}>{t.text}</span>
                  ))}
                  {mode === "typing" && i === lines.length - 1 && (
                    <span className="cx-caret ml-px inline-block h-[18px] w-0.5 align-[-3px] bg-cyan shadow-[0_0_8px_#5CC8FF]" />
                  )}
                </span>
              </div>
            ))}
          </div>
          <textarea
            aria-label={`Python code, ${p.fileName}. Press Escape then Tab to leave the editor.`}
            value={code}
            readOnly={!editable}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            wrap="off"
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onKey}
            className="absolute left-0 top-4 m-0 resize-none overflow-hidden whitespace-pre border-0 bg-transparent py-0 pl-[60px] pr-5 font-mono text-[14px] leading-6 text-transparent caret-cyan outline-none focus-visible:shadow-[inset_0_0_0_2px_rgba(92,200,255,0.55)]"
            style={{ width: `calc(${maxLen}ch + 80px)`, minWidth: "100%", height: `${lines.length * 24}px` }}
          />
        </div>

        <div className="flex h-[210px] shrink-0 flex-col border-t border-white/[0.08] bg-[#07080C]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-[18px] py-2.5 font-mono text-[11.5px] uppercase tracking-[0.12em] text-dim">
            <Icon name="terminal" size={14} color="#7D8392" />
            Terminal
          </div>
          <div ref={logRef} role="log" aria-live="polite" tabIndex={0} className="flex-1 overflow-auto px-[18px] py-3 font-mono text-[13px] leading-[21px] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan">
            {log.map((l, i) => (
              <div key={i} className="whitespace-pre" style={{ color: l.color }}>{l.text}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestMark({ state }: { state: TestState }) {
  const base = "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[11px]";
  if (state === "run") return <span aria-hidden className="cx-spin box-border h-[22px] w-[22px] shrink-0 rounded-[11px] border-2 border-[rgba(92,200,255,0.25)] border-t-cyan" />;
  if (state === "pass")
    return (
      <span aria-hidden className={`${base} border border-[rgba(61,220,151,0.55)] bg-[rgba(61,220,151,0.16)]`}>
        <Icon name="check" size={12} color="#7FF0BD" strokeWidth={2.6} />
      </span>
    );
  if (state === "fail")
    return (
      <span aria-hidden className={`${base} border border-[rgba(255,92,122,0.55)] bg-[rgba(255,92,122,0.14)]`}>
        <Icon name="close" size={12} color="#FF9BB0" strokeWidth={2.6} />
      </span>
    );
  return <span aria-hidden className={`${base} border border-white/20`} />;
}
