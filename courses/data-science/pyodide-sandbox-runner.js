/* Zenith Lab — Web Worker Python sandbox for student code exercises, powered by Pyodide
   (CPython compiled to WebAssembly, running entirely client-side, no backend).

   Same safety architecture as the AI Engineering course's sandbox: a genuinely
   separate thread (Worker) is the only mechanism that can forcibly terminate
   arbitrary synchronous code, Python's `while True: pass` included. A main-thread
   timeout cannot interrupt a synchronous loop; only killing the thread it runs
   on can.

   Difference from that course's runner: this one also loads pandas and NumPy
   (Pyodide's pure-Python-wheel builds of both) before running any harness,
   since Modules 3+ need real DataFrame exercises, not just stdlib Python.
   Loading happens once per worker and is cached, exactly like Pyodide itself.

   Contract: a harness is a PYTHON function, given as source text, that accepts
   the student's code (as a string), builds the student's function via exec()
   in an isolated namespace, runs real test cases against it, and returns a
   JSON-serializable dict of results. The worker calls the harness, json.dumps()s
   the result, and posts that string back, so this side of the bridge never
   needs Pyodide's JS<->Python proxy machinery, just JSON. */
(function (global) {
  const WORKER_SRC = `
    self.importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");
    let pyodideReady = null;
    async function getPyodide() {
      if (!pyodideReady) {
        pyodideReady = (async () => {
          const pyodide = await loadPyodide();
          await pyodide.loadPackage(["pandas", "numpy"]);
          return pyodide;
        })();
      }
      return pyodideReady;
    }
    self.onmessage = async function(e) {
      const { harnessSource, harnessName, studentCode } = e.data;
      try {
        const pyodide = await getPyodide();
        self.postMessage({ phase: "loaded" });
        pyodide.globals.set("__student_code__", studentCode);
        const fullSource = harnessSource +
          "\\nimport json, asyncio" +
          "\\n__harness_result__ = " + harnessName + "(__student_code__)" +
          "\\nif asyncio.iscoroutine(__harness_result__):" +
          "\\n    __harness_result__ = await __harness_result__" +
          "\\n__result_json__ = json.dumps(__harness_result__)\\n";
        await pyodide.runPythonAsync(fullSource);
        const resultJson = pyodide.globals.get("__result_json__");
        self.postMessage({ ok: true, result: JSON.parse(resultJson) });
      } catch (err) {
        self.postMessage({ ok: false, error: (err && err.message) ? err.message : String(err) });
      }
    };
  `;

  /* Two-phase timeout: loading Pyodide + pandas/NumPy (network-dependent, can
     legitimately take 15-60s+ on a slow connection) gets a generous budget.
     Only once the interpreter has actually loaded does the tight,
     infinite-loop-detecting timeout start, so a slow network is never mistaken
     for student code hanging. */
  function run(harnessSource, harnessName, studentCode, timeoutMs, loadTimeoutMs) {
    timeoutMs = timeoutMs || 8000;
    loadTimeoutMs = loadTimeoutMs || 60000;
    return new Promise((resolve) => {
      let settled = false;
      let worker, url;
      try {
        const blob = new Blob([WORKER_SRC], { type: "application/javascript" });
        url = URL.createObjectURL(blob);
        worker = new Worker(url);
      } catch (e) {
        resolve({ ok: false, timedOut: false, error: "Python sandbox unavailable in this browser: " + e.message });
        return;
      }

      let timer;
      function cleanup() {
        clearTimeout(timer);
        try { worker.terminate(); } catch (e) {}
        try { URL.revokeObjectURL(url); } catch (e) {}
      }

      function startTimer(ms, timeoutResult) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(timeoutResult);
        }, ms);
      }

      startTimer(loadTimeoutMs, {
        ok: false, timedOut: true,
        error: "The Python sandbox took too long to load (over " + (loadTimeoutMs / 1000) + "s). Check your connection and try again."
      });

      worker.onmessage = (ev) => {
        if (settled) return;
        if (ev.data && ev.data.phase === "loaded") {
          startTimer(timeoutMs, {
            ok: false, timedOut: true,
            error: "Execution timed out after " + (timeoutMs / 1000) + "s. This usually means an infinite loop or code that never returns."
          });
          return;
        }
        settled = true;
        cleanup();
        resolve(Object.assign({ timedOut: false }, ev.data));
      };
      worker.onerror = (ev) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve({ ok: false, timedOut: false, error: ev.message || "The Python sandbox crashed unexpectedly." });
      };

      try {
        worker.postMessage({ harnessSource, harnessName, studentCode });
      } catch (e) {
        if (settled) return;
        settled = true;
        cleanup();
        resolve({ ok: false, timedOut: false, error: "Could not start the Python sandbox: " + e.message });
      }
    });
  }

  global.PySandboxRunner = { run };
})(window);
