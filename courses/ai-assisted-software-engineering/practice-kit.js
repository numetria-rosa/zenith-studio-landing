/* Shared practice-library renderer and graders for AI-Assisted SWE. */
(function (global) {
  const esc = (s) => (window.CourseProgress ? CourseProgress.escapeHtml(s) : String(s || ""));

  function parseHtml(html) {
    return new DOMParser().parseFromString(String(html || ""), "text/html");
  }

  function gradeHtml(task, studentHtml) {
    const doc = parseHtml(studentHtml);
    const results = [];
    (task.checks || []).forEach(function (c) {
      let ok = false;
      try { ok = !!c.test(doc, studentHtml); } catch (e) { ok = false; }
      results.push({ name: c.name, pass: ok, hint: c.hint || "" });
    });
    return { passed: results.length > 0 && results.every((r) => r.pass), results };
  }

  function gradeCss(task, studentCss) {
    const host = document.createElement("div");
    host.style.cssText = "position:absolute;left:-9999px;top:0";
    host.innerHTML = task.fixtureHtml || "<div id='root'></div>";
    const style = document.createElement("style");
    style.textContent = studentCss;
    document.body.appendChild(host);
    document.head.appendChild(style);
    const results = [];
    try {
      (task.checks || []).forEach(function (c) {
        let ok = false;
        try { ok = !!c.test(host, studentCss); } catch (e) { ok = false; }
        results.push({ name: c.name, pass: ok, hint: c.hint || "" });
      });
    } finally {
      host.remove();
      style.remove();
    }
    return { passed: results.length > 0 && results.every((r) => r.pass), results };
  }

  function gradeJs(task, studentCode) {
    const results = [];
    let fn;
    try {
      const wrapped = studentCode + "\n; return typeof " + task.functionName + " === 'function' ? " + task.functionName + " : null;";
      fn = new Function(wrapped)();
    } catch (e) {
      return { passed: false, results: [{ name: "parse", pass: false, hint: e.message }] };
    }
    if (!fn) return { passed: false, results: [{ name: task.functionName + " is defined", pass: false, hint: "Define a function named exactly " + task.functionName + "." }] };
    (task.testCases || []).forEach(function (tc) {
      let ok = false;
      let hint = tc.name;
      try {
        const got = fn.apply(null, tc.args);
        ok = JSON.stringify(got) === JSON.stringify(tc.expected);
        if (!ok) hint = tc.name + " — expected " + JSON.stringify(tc.expected) + ", got " + JSON.stringify(got);
      } catch (e) {
        hint = tc.name + " — " + e.message;
      }
      results.push({ name: tc.name, pass: ok, hint: hint });
    });
    return { passed: results.length > 0 && results.every((r) => r.pass), results };
  }

  function gradeChoice(task, selected) {
    const correct = task.correct;
    const ok = String(selected) === String(correct);
    return { passed: ok, results: [{ name: "choice", pass: ok, hint: ok ? (task.whyOk || "Correct.") : (task.whyBad || "Not that one.") }] };
  }

  function gradeTesting(task, studentCode) {
    /* Student writes a function test_fn(impl) that returns true if impl is correct.
       We run it against a good impl and a planted bad impl. */
    let tester;
    try {
      const wrapped = studentCode + "\n; return typeof " + task.functionName + " === 'function' ? " + task.functionName + " : null;";
      tester = new Function(wrapped)();
    } catch (e) {
      return { passed: false, results: [{ name: "parse", pass: false, hint: e.message }] };
    }
    if (!tester) return { passed: false, results: [{ name: "defined", pass: false, hint: "Define " + task.functionName }] };
    const results = [];
    try {
      const good = tester(task.goodImpl);
      results.push({ name: "passes on a correct implementation", pass: good === true, hint: "Your test should return true for a correct function." });
    } catch (e) {
      results.push({ name: "passes on a correct implementation", pass: false, hint: e.message });
    }
    try {
      const bad = tester(task.badImpl);
      results.push({ name: "fails on the planted bug", pass: bad === false, hint: task.bugHint || "Return false when the implementation is wrong." });
    } catch (e) {
      results.push({ name: "fails on the planted bug", pass: true, hint: "Threw on the bug — that counts as catching it." });
    }
    return { passed: results.length > 0 && results.every((r) => r.pass), results };
  }

  function gradePython(task, studentCode, done) {
    if (!window.PySandboxRunner) {
      done({ passed: false, results: [{ name: "sandbox", pass: false, hint: "Pyodide runner is missing from this page." }] });
      return;
    }
    const casesJson = JSON.stringify(task.testCases || []);
    const fname = JSON.stringify(task.functionName);
    const harness = [
      "import json",
      "CASES = json.loads(" + JSON.stringify(casesJson) + ")",
      "FNAME = " + fname,
      "def grade_fn(student_code):",
      "    ns = {}",
      "    try:",
      "        exec(student_code, ns)",
      "    except Exception as e:",
      "        return {'passed': False, 'results': [{'name': 'parse', 'pass': False, 'hint': str(e)}]}",
      "    fn = ns.get(FNAME)",
      "    if not callable(fn):",
      "        return {'passed': False, 'results': [{'name': FNAME + ' is defined', 'pass': False, 'hint': 'Define ' + FNAME}]}",
      "    results = []",
      "    all_ok = True",
      "    for tc in CASES:",
      "        try:",
      "            got = fn(*tc.get('args', []))",
      "            ok = got == tc.get('expected')",
      "            hint = tc.get('name') if ok else (str(tc.get('name')) + ' — expected ' + repr(tc.get('expected')) + ', got ' + repr(got))",
      "        except Exception as e:",
      "            ok = False",
      "            hint = str(tc.get('name')) + ' — ' + str(e)",
      "        results.append({'name': tc.get('name'), 'pass': bool(ok), 'hint': hint})",
      "        if not ok: all_ok = False",
      "    return {'passed': bool(all_ok and results), 'results': results}",
    ].join("\n");
    PySandboxRunner.run(harness, "grade_fn", studentCode).then(function (res) {
      if (!res || !res.ok) {
        done({ passed: false, results: [{ name: "sandbox", pass: false, hint: (res && res.error) || "Python sandbox failed." }] });
        return;
      }
      const out = res.result || {};
      done({ passed: !!out.passed, results: out.results || [] });
    });
  }

  function renderLibrary(tasks) {
    const list = document.getElementById("taskList");
    if (!list) return;
    const ids = tasks.map((t) => t.id);
    function refreshMeta() {
      const passed = tasks.filter((t) => PracticeProgress.getTaskState(t.id).passed).length;
      const el = document.getElementById("skillMeta");
      if (el) el.textContent = passed + " / " + tasks.length + " passed";
    }
    refreshMeta();
    list.innerHTML = "";
    tasks.forEach(function (task) {
      const rec = PracticeProgress.getTaskState(task.id);
      const card = document.createElement("div");
      card.className = "taskcard";
      const head = document.createElement("button");
      head.type = "button";
      head.className = "taskhead";
      head.innerHTML = '<span class="statusdot' + (rec.passed ? " passed" : "") + '"></span><span class="mono" style="font-size:11px;color:var(--mut2);width:72px">' +
        esc(task.id) + '</span><span style="flex:1;font-weight:600;text-align:left">' + esc(task.title) +
        '</span><span class="levelpill">' + esc(task.level) + "</span>";
      const body = document.createElement("div");
      body.className = "taskbody";
      let editor = "";
      if (task.kind === "choice") {
        editor = (task.options || []).map(function (opt, i) {
          return '<button type="button" class="qopt" data-val="' + esc(opt.value) + '">' + esc(opt.label) + "</button>";
        }).join("");
      } else {
        editor = '<textarea class="student" spellcheck="false">' + esc(task.starter || "") + "</textarea><button type='button' class='primary gradebtn' style='margin-top:10px'>Check</button>";
      }
      body.innerHTML = '<p class="mut" style="margin-bottom:10px">' + esc(task.prompt || task.objective || "") + "</p>" + editor + '<div class="feedback"></div>';
      head.onclick = function () { body.classList.toggle("open"); };
      body.querySelectorAll(".qopt").forEach(function (btn) {
        btn.onclick = function () {
          const out = gradeChoice(task, btn.getAttribute("data-val"));
          finish(out);
        };
      });
      const gradeBtn = body.querySelector(".gradebtn");
      if (gradeBtn) {
        gradeBtn.onclick = function () {
          const src = body.querySelector(".student").value;
          if (task.kind === "python") {
            gradePython(task, src, finish);
            return;
          }
          let out;
          if (task.kind === "html") out = gradeHtml(task, src);
          else if (task.kind === "css") out = gradeCss(task, src);
          else if (task.kind === "js") out = gradeJs(task, src);
          else if (task.kind === "testing") out = gradeTesting(task, src);
          else out = { passed: false, results: [{ name: "unsupported", pass: false, hint: "This task type is not wired." }] };
          finish(out);
        };
      }
      function finish(out) {
        PracticeProgress.recordAttempt(task.id, out.passed);
        const fb = body.querySelector(".feedback");
        fb.className = "feedback " + (out.passed ? "ok" : "bad");
        fb.innerHTML = out.results.map((r) => (r.pass ? "✓ " : "✗ ") + esc(r.name) + (r.pass ? "" : " — " + esc(r.hint))).join("<br>");
        if (out.passed) head.querySelector(".statusdot").classList.add("passed");
        refreshMeta();
      }
      card.appendChild(head);
      card.appendChild(body);
      list.appendChild(card);
    });
  }

  global.PracticeKit = { parseHtml, gradeHtml, gradeCss, gradeJs, gradeChoice, gradeTesting, gradePython, renderLibrary };
})(window);
