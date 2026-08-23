/* Zenith Lab, real interactive-chart Python sandbox, Module 7 only.
   Same Worker-thread architecture as pyodide-sandbox-runner.js (a real
   separate thread is the only way to forcibly kill runaway synchronous
   code), plus micropip-installing plotly so a student's own px.bar(),
   px.line(), px.histogram() etc. calls produce a REAL Plotly figure,
   not a canned picture. The harness reads fig.data directly to grade
   correctness and chart-type choice, then serializes the actual figure
   to self-contained HTML (plotly.js from CDN) for the page to render in
   a sandboxed iframe, so the chart on screen is provably the one the
   student's code built. */
(function (global) {
  const WORKER_SRC = `
    self.importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");
    let pyodideReady = null;
    async function getPyodide() {
      if (!pyodideReady) {
        pyodideReady = (async () => {
          const pyodide = await loadPyodide();
          await pyodide.loadPackage(["pandas", "numpy", "micropip"]);
          const micropip = pyodide.pyimport("micropip");
          await micropip.install(["plotly", "openpyxl"]);
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

  function run(harnessSource, harnessName, studentCode, timeoutMs, loadTimeoutMs) {
    timeoutMs = timeoutMs || 10000;
    loadTimeoutMs = loadTimeoutMs || 90000;
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
        error: "The chart sandbox took too long to load (over " + (loadTimeoutMs / 1000) + "s, it installs plotly on first use). Check your connection and try again."
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
        resolve({ ok: false, timedOut: false, error: ev.message || "The chart sandbox crashed unexpectedly." });
      };

      try {
        worker.postMessage({ harnessSource, harnessName, studentCode });
      } catch (e) {
        if (settled) return;
        settled = true;
        cleanup();
        resolve({ ok: false, timedOut: false, error: "Could not start the chart sandbox: " + e.message });
      }
    });
  }

  global.PlotlySandboxRunner = { run };
})(window);
