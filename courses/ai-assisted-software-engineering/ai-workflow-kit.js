/* Grading real AI work without faking an agent in the browser.

   This course refuses to ship a pretend Cursor. So the student does the
   work in the real editor, then brings three artifacts back:

     1) the spec they gave the agent      -> checked structurally
     2) the code the agent produced       -> executed against hidden tests
     3) their review notes                -> checked for a named, specific check

   Artifact 2 is the load-bearing one. We do not ask "did it work?" and
   trust the answer; we run our own tests against whatever they pasted. A
   student who pastes the agent's first broken draft fails and has to go
   back and iterate, which is exactly the loop we are selling.

   We also ask whether the first attempt passed. Almost nobody's does, and
   seeing that recorded is the lesson: the agent's confidence is unrelated
   to whether the code is right. */
(function (global) {
  const esc = (s) => (global.CourseProgress ? CourseProgress.escapeHtml(s) : String(s || ""));

  function runSpecChecks(checks, text) {
    return (checks || []).map(function (c) {
      let ok = false;
      try { ok = !!c.test(text); } catch (e) { ok = false; }
      return { name: c.name, pass: ok };
    });
  }

  function render(mountId, cfg, onChange) {
    const mount = document.getElementById(mountId);
    if (!mount) return null;
    const state = { spec: false, code: false, review: false, firstTry: null };
    const hasCode = !!(cfg.code && cfg.code.functionName);

    mount.innerHTML =
      '<div class="aiwf">' +
        '<ol class="aiwfsteps">' +
          "<li>Open the project in Cursor (or VS Code with an assistant).</li>" +
          "<li>Write the spec below <b>before</b> you prompt. Paste it in as your prompt.</li>" +
          "<li>Read the diff line by line. Run it. Then bring the result back here.</li>" +
        "</ol>" +

        '<div class="aiwfstep"><span class="aiwfnum">1</span><h4>The spec you gave it</h4></div>' +
        '<textarea class="aiwfspec" placeholder="' + esc(cfg.specPlaceholder || "Given ... When ... Then ...") + '"></textarea>' +
        '<button type="button" class="primary aiwfspecbtn" style="margin-top:10px">Check spec</button>' +
        '<div class="feedback aiwffb1"></div>' +

        (hasCode
          ? '<div class="aiwfstep"><span class="aiwfnum">2</span><h4>The code it produced</h4></div>' +
            '<p class="mut aiwfhint">Paste the function the agent wrote, exactly as it wrote it. Our tests run against this, not against your description of it. If the agent\u2019s version fails, go back, tell it what broke, and bring the fixed version.</p>' +
            '<textarea class="student aiwfcode" spellcheck="false">' + esc(cfg.code.starter || "") + "</textarea>" +
            '<button type="button" class="primary aiwfcodebtn" style="margin-top:10px">Run hidden tests</button>' +
            '<div class="feedback aiwffb2"></div>' +
            '<div class="aiwffirst"><span class="aiwfq">Did the agent\u2019s <i>first</i> attempt pass these tests?</span>' +
              '<button type="button" class="qopt aiwffirstbtn" data-v="yes">Yes, first try</button>' +
              '<button type="button" class="qopt aiwffirstbtn" data-v="no">No, I had to iterate</button>' +
            "</div>"
          : "") +

        '<div class="aiwfstep"><span class="aiwfnum">' + (hasCode ? "3" : "2") + '</span><h4>Your review notes</h4></div>' +
        '<p class="mut aiwfhint">' + esc(cfg.reviewHint || "Name one specific thing you checked and one specific thing you changed or rejected. \u201cLooks good\u201d is not a review.") + "</p>" +
        '<textarea class="aiwfreview" placeholder="I checked... I rejected... I verified by..."></textarea>' +
        '<button type="button" class="primary aiwfreviewbtn" style="margin-top:10px">Check notes</button>' +
        '<div class="feedback aiwffb3"></div>' +
      "</div>";

    const fb1 = mount.querySelector(".aiwffb1");
    const fb2 = mount.querySelector(".aiwffb2");
    const fb3 = mount.querySelector(".aiwffb3");

    function report() {
      if (onChange) {
        onChange({
          spec: state.spec, code: state.code, review: state.review, firstTry: state.firstTry,
          passed: state.spec && state.review && (!hasCode || (state.code && state.firstTry !== null)),
        });
      }
    }

    mount.querySelector(".aiwfspecbtn").onclick = function () {
      const text = mount.querySelector(".aiwfspec").value;
      const results = runSpecChecks(cfg.specChecks, text);
      state.spec = results.length > 0 && results.every((r) => r.pass);
      fb1.className = "feedback " + (state.spec ? "ok" : "bad");
      fb1.innerHTML = results.map((r) => '<span class="i ' + (r.pass ? "i-check" : "i-x") + '"></span> ' + esc(r.name)).join("<br>");
      report();
    };

    if (hasCode) {
      mount.querySelector(".aiwfcodebtn").onclick = function () {
        if (!global.PracticeKit) {
          fb2.className = "feedback bad";
          fb2.textContent = "Grader missing from this page.";
          return;
        }
        const src = mount.querySelector(".aiwfcode").value;
        const out = PracticeKit.gradeJs({ functionName: cfg.code.functionName, testCases: cfg.code.testCases || [] }, src);
        state.code = out.passed;
        fb2.className = "feedback " + (out.passed ? "ok" : "bad");
        fb2.innerHTML = out.results.map((r) => '<span class="i ' + (r.pass ? "i-check" : "i-x") + '"></span> ' + esc(r.pass ? r.name : r.hint)).join("<br>") +
          (out.passed ? "<br><b>That is the loop.</b> You specified it, the agent wrote it, and an independent test agreed." : "");
        report();
      };
      mount.querySelectorAll(".aiwffirstbtn").forEach(function (btn) {
        btn.onclick = function () {
          state.firstTry = btn.getAttribute("data-v") === "yes";
          mount.querySelectorAll(".aiwffirstbtn").forEach((b) => b.classList.remove("chosen"));
          btn.classList.add("chosen");
          report();
        };
      });
    }

    mount.querySelector(".aiwfreviewbtn").onclick = function () {
      const text = mount.querySelector(".aiwfreview").value.trim();
      const results = [
        { name: "at least 140 characters", pass: text.length >= 140 },
        { name: "names something you checked", pass: /\b(checked|verified|ran|opened|tested|inspected|confirmed)\b/i.test(text) },
        { name: "names something you changed or rejected", pass: /\b(changed|rejected|removed|renamed|reverted|rewrote|refused|deleted|replaced)\b/i.test(text) },
        { name: "is specific \u2014 mentions a file, function, value, or case", pass: /(\.html|\.css|\.js|\.json|\(\)|function|const |case|empty|null|undefined|zero|negative)/i.test(text) },
      ];
      state.review = results.every((r) => r.pass);
      fb3.className = "feedback " + (state.review ? "ok" : "bad");
      fb3.innerHTML = results.map((r) => '<span class="i ' + (r.pass ? "i-check" : "i-x") + '"></span> ' + esc(r.name)).join("<br>");
      report();
    };

    report();
    return state;
  }

  global.AIWorkflowKit = { render };
})(window);
