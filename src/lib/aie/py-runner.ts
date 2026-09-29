/* Runs a Python harness against the student's code in a Web Worker with Pyodide (CPython on WebAssembly).
   A Worker is the only thing that can kill `while True: pass`, so a timeout or Stop terminates the whole thread.
   Ported from courses/ai-engineering/pyodide-sandbox-runner.js: same harness contract (a Python function taking the
   student's source and returning a JSON-serialisable dict), same two-phase timeout (loading the interpreter gets a
   long budget, running the code a short one). Pyodide 0.26.2: https://pyodide.org/en/0.26.2/usage/webworker.html */

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";

const WORKER_SRC = [
  `self.importScripts(${JSON.stringify(PYODIDE_URL)});`,
  "let ready = null;",
  "const py = () => (ready = ready || loadPyodide());",
  "self.onmessage = async (e) => {",
  "  const { harnessSource, harnessName, studentCode } = e.data;",
  "  try {",
  "    const pyodide = await py();",
  '    self.postMessage({ phase: "loaded" });',
  '    pyodide.globals.set("__student_code__", studentCode);',
  "    const tail = [",
  '      "import json, asyncio",',
  '      "__harness_result__ = " + harnessName + "(__student_code__)",',
  '      "if asyncio.iscoroutine(__harness_result__):",',
  '      "    __harness_result__ = await __harness_result__",',
  '      "__result_json__ = json.dumps(__harness_result__)",',
  '    ].join("\\n");',
  '    await pyodide.runPythonAsync(harnessSource + "\\n" + tail + "\\n");',
  '    self.postMessage({ ok: true, result: JSON.parse(pyodide.globals.get("__result_json__")) });',
  "  } catch (err) {",
  "    self.postMessage({ ok: false, error: err && err.message ? err.message : String(err) });",
  "  }",
  "};",
].join("\n");

export type TestResult = { name: string; pass: boolean; hint: string; errorMessage: string | null };
export type RunOutcome =
  | { kind: "results"; results: TestResult[] }
  | { kind: "code-error"; error: string }
  | { kind: "timeout" | "stopped" | "sandbox"; error: string };

export type RunHandle = { done: Promise<RunOutcome>; stop: () => void };

export type RunOptions = { onLoaded?: () => void; timeoutMs?: number; loadTimeoutMs?: number };

export function runHarness(harnessSource: string, harnessName: string, studentCode: string, opts: RunOptions = {}): RunHandle {
  const { onLoaded, timeoutMs = 8000, loadTimeoutMs = 45000 } = opts;
  let finish: (o: RunOutcome) => void = () => {};
  const done = new Promise<RunOutcome>((resolve) => (finish = resolve));
  let settled = false;
  let timer: ReturnType<typeof setTimeout>;
  let worker: Worker | undefined;
  let url: string | undefined;

  const end = (o: RunOutcome) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    worker?.terminate();
    if (url) URL.revokeObjectURL(url);
    finish(o);
  };
  const arm = (ms: number, o: RunOutcome) => {
    clearTimeout(timer);
    timer = setTimeout(() => end(o), ms);
  };

  try {
    url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "application/javascript" }));
    worker = new Worker(url);
  } catch (e) {
    end({ kind: "sandbox", error: `The Python sandbox is unavailable in this browser: ${(e as Error).message}` });
    return { done, stop: () => {} };
  }

  arm(loadTimeoutMs, { kind: "timeout", error: `The Python sandbox took too long to load (over ${loadTimeoutMs / 1000}s). Check your connection and try again.` });

  worker.onmessage = (ev: MessageEvent) => {
    if (settled) return;
    if (ev.data?.phase === "loaded") {
      onLoaded?.();
      arm(timeoutMs, { kind: "timeout", error: `Execution timed out after ${timeoutMs / 1000}s. This usually means an infinite loop or code that never returns.` });
      return;
    }
    if (!ev.data.ok) return end({ kind: "sandbox", error: String(ev.data.error) });
    const r = ev.data.result as { ranOk: boolean; error?: string; results?: TestResult[] };
    end(r.ranOk ? { kind: "results", results: r.results ?? [] } : { kind: "code-error", error: r.error ?? "Your code did not run." });
  };
  worker.onerror = (ev) => end({ kind: "sandbox", error: ev.message || "The Python sandbox crashed unexpectedly." });
  worker.postMessage({ harnessSource, harnessName, studentCode });

  return { done, stop: () => end({ kind: "stopped", error: "Stopped." }) };
}
