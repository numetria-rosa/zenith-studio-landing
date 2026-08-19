/* Zenith Lab — Web Worker sandbox for student code exercises.

   Why a Worker at all: JS is single-threaded. A main-thread timeout (setTimeout/
   Promise.race) CANNOT interrupt a synchronous infinite loop, the timeout
   callback itself can't fire until the loop yields, which it never does. A
   Worker runs on a genuinely separate thread, so it can be forcibly terminated
   from the main thread regardless of what the worker's code is doing. That's
   the only mechanism in a browser that actually stops arbitrary synchronous
   student code without freezing the page.

   Design: each exercise defines its test harness as a normal async function
   (mocks + test cases + calling the student's new Function(...)-constructed
   code). We take that function's source via .toString(), ship the source
   string to a worker, the worker reconstructs and runs it, and posts back an
   array of {name, pass, hint} results. If nothing comes back within the
   timeout, we terminate the worker and report a timeout, the UI recovers
   either way, nothing about course progress is touched until we have a real
   result. */
(function (global) {
  const WORKER_SRC = `
    self.onmessage = async function(e) {
      const { harnessSource, harnessName, args } = e.data;
      try {
        const factory = new Function(harnessSource + "\\nreturn " + harnessName + ";");
        const harnessFn = factory();
        const result = await harnessFn.apply(null, args);
        self.postMessage({ ok: true, result: result });
      } catch (err) {
        self.postMessage({ ok: false, error: (err && err.message) ? err.message : String(err) });
      }
    };
  `;

  function run(harnessSource, harnessName, args, timeoutMs) {
    timeoutMs = timeoutMs || 3000;
    return new Promise((resolve) => {
      let settled = false;
      let worker, url;
      try {
        const blob = new Blob([WORKER_SRC], { type: "application/javascript" });
        url = URL.createObjectURL(blob);
        worker = new Worker(url);
      } catch (e) {
        resolve({ ok: false, timedOut: false, error: "Sandbox unavailable in this browser: " + e.message });
        return;
      }

      function cleanup() {
        clearTimeout(timer);
        try { worker.terminate(); } catch (e) {}
        try { URL.revokeObjectURL(url); } catch (e) {}
      }

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve({ ok: false, timedOut: true, error: "Execution timed out after " + (timeoutMs / 1000) + "s. This usually means an infinite loop or a call that never resolves." });
      }, timeoutMs);

      worker.onmessage = (ev) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(Object.assign({ timedOut: false }, ev.data));
      };
      worker.onerror = (ev) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve({ ok: false, timedOut: false, error: ev.message || "The sandbox crashed unexpectedly." });
      };

      try {
        worker.postMessage({ harnessSource, harnessName, args });
      } catch (e) {
        if (settled) return;
        settled = true;
        cleanup();
        resolve({ ok: false, timedOut: false, error: "Could not start the sandbox: " + e.message });
      }
    });
  }

  global.SandboxRunner = { run };
})(window);
