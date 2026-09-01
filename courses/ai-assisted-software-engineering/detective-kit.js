/* AI Code Detective.

   A detective case is plausible AI output with real defects planted in it,
   mixed with lines that merely *look* suspicious. Two phases:

     1) Charge sheet. Select every real defect and no innocent line.
        Selecting everything fails. That is the point: a reviewer who
        rejects all eleven hunks is as useless as one who approves all
        eleven, and juniors default to the first when they are nervous.

     2) Proof. Fix the code so hidden tests pass. Spotting a bug and
        being able to prove you fixed it are different skills, and only
        the second one ships.

   Phase 2 stays locked until phase 1 is clean, so students cannot brute
   force the charge sheet by watching the tests. */
(function (global) {
  const esc = (s) => (global.CourseProgress ? CourseProgress.escapeHtml(s) : String(s || ""));

  const CATEGORY_LABELS = {
    logic: "Logic bug",
    a11y: "Accessibility",
    security: "Security",
    complexity: "Needless complexity",
    duplication: "Duplication",
    naming: "Naming",
    validation: "Missing validation",
    edge: "Edge case",
    perf: "Performance",
    comment: "Misleading comment",
    assumption: "Wrong assumption",
  };

  function highlight(code, lang) {
    /* Deliberately minimal: strings, comments, keywords, numbers. A real
       tokeniser is not worth 40KB here, and over-eager highlighting on
       broken code is worse than none. */
    let out = esc(code);
    if (lang === "js" || lang === "python") {
      out = out.replace(/(&#39;[^&\n]*?&#39;|&quot;[^&\n]*?&quot;|`[^`\n]*?`)/g, '<span class="tk-str">$1</span>');
      out = out.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="tk-com">$1</span>');
      out = out.replace(/\b(function|return|const|let|var|if|else|for|while|new|try|catch|throw|async|await|class|def|import|from|True|False|None|null|undefined|true|false)\b/g,
        '<span class="tk-kw">$1</span>');
      out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tk-num">$1</span>');
    } else if (lang === "html") {
      out = out.replace(/(&lt;\/?[a-zA-Z][\w-]*)/g, '<span class="tk-kw">$1</span>');
      out = out.replace(/([\w-]+)=(&quot;[^&]*?&quot;)/g, '<span class="tk-num">$1</span>=<span class="tk-str">$2</span>');
    } else if (lang === "css") {
      out = out.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tk-com">$1</span>');
      out = out.replace(/^(\s*)([-a-z]+)(\s*:)/gm, '$1<span class="tk-kw">$2</span>$3');
    }
    return out;
  }

  function codeBlock(code, lang) {
    const lines = String(code || "").replace(/\s+$/, "").split("\n");
    const gutter = lines.map((_, i) => (i + 1)).join("\n");
    return '<div class="detcode"><pre class="detgutter" aria-hidden="true">' + gutter + "</pre>" +
      '<pre class="detsrc"><code>' + highlight(lines.join("\n"), lang || "js") + "</code></pre></div>";
  }

  /* A case is only solved when the charge sheet is clean AND the fix passes.
     Callers store { chargeSheet, proof, passed } so a half-finished case
     never satisfies a module gate. */
  function render(mountId, task, onChange) {
    const mount = document.getElementById(mountId);
    if (!mount) return null;
    const state = { chargeSheet: false, proof: !task.fix, selected: {} };

    const realIds = (task.findings || []).filter((f) => f.real).map((f) => f.id);
    const hasFix = !!(task.fix && task.fix.functionName);

    mount.innerHTML =
      '<div class="detcase">' +
        '<div class="detmeta">' +
          '<span class="detticket">' + esc(task.ticket || "Case") + "</span>" +
          '<span class="detwho">' + esc(task.author || "Written by the coding agent") + "</span>" +
        "</div>" +
        '<div class="detbanner">Potential issue detected</div>' +
        '<div class="detask"><b>The ask was:</b> ' + esc(task.ask || "") + "</div>" +
        (task.note ? '<div class="detnote">' + esc(task.note) + "</div>" : "") +
        codeBlock(task.code, task.lang) +
        '<div class="detphase"><span class="detphasenum">1</span><h4>Charge sheet</h4></div>' +
        '<p class="mut detphasehint">Select every real defect. Leave the innocent lines alone \u2014 selecting everything fails this phase, and so does missing one.</p>' +
        '<div class="detfindings" role="group" aria-label="Possible defects"></div>' +
        '<button type="button" class="primary detsubmit" style="margin-top:12px">Submit charge sheet</button>' +
        '<div class="feedback detfb1"></div>' +
        (hasFix
          ? '<div class="detproof" hidden>' +
              '<div class="detphase"><span class="detphasenum">2</span><h4>Proof</h4></div>' +
              '<p class="mut detphasehint">' + esc(task.fix.note || "Rewrite the function so it does what the ask actually said. Hidden tests decide.") + "</p>" +
              '<textarea class="student detfix" spellcheck="false"></textarea>' +
              '<button type="button" class="primary detrun" style="margin-top:10px">Run hidden tests</button>' +
              '<div class="feedback detfb2"></div>' +
            "</div>"
          : "") +
      "</div>";

    const findingsBox = mount.querySelector(".detfindings");
    (task.findings || []).forEach(function (f) {
      const row = document.createElement("label");
      row.className = "detfinding";
      row.innerHTML = '<input type="checkbox" value="' + esc(f.id) + '">' +
        '<span class="detfcat">' + esc(CATEGORY_LABELS[f.cat] || f.cat || "Issue") + "</span>" +
        '<span class="detflabel">' + esc(f.label) + "</span>";
      row.querySelector("input").onchange = function (e) { state.selected[f.id] = e.target.checked; };
      findingsBox.appendChild(row);
    });

    const fb1 = mount.querySelector(".detfb1");
    const fb2 = mount.querySelector(".detfb2");
    const proofBox = mount.querySelector(".detproof");

    function report() { if (onChange) onChange({ chargeSheet: state.chargeSheet, proof: state.proof, passed: state.chargeSheet && state.proof }); }

    mount.querySelector(".detsubmit").onclick = function () {
      const picked = Object.keys(state.selected).filter((k) => state.selected[k]);
      const missed = realIds.filter((id) => picked.indexOf(id) === -1);
      const wrongly = picked.filter((id) => realIds.indexOf(id) === -1);
      const clean = missed.length === 0 && wrongly.length === 0;
      state.chargeSheet = clean;

      const lines = [];
      (task.findings || []).forEach(function (f) {
        const chose = picked.indexOf(f.id) !== -1;
        if (f.real && chose) lines.push('<span class="detok"><span class="i i-check"></span> ' + esc(f.label) + "</span> \u2014 " + esc(f.why));
        else if (f.real && !chose) lines.push('<span class="detbad"><span class="i i-x"></span> Missed: ' + esc(f.label) + "</span> \u2014 " + esc(f.why));
        else if (!f.real && chose) lines.push('<span class="detbad"><span class="i i-x"></span> Not a defect: ' + esc(f.label) + "</span> \u2014 " + esc(f.why));
      });
      if (clean) lines.unshift("<b>Charge sheet accepted.</b> " + (hasFix ? "Phase 2 is open." : ""));
      else lines.unshift("<b>" + (missed.length ? missed.length + " missed. " : "") + (wrongly.length ? wrongly.length + " innocent line" + (wrongly.length > 1 ? "s" : "") + " charged." : "") + "</b>");
      fb1.className = "feedback detfb1 " + (clean ? "ok" : "bad");
      fb1.innerHTML = lines.join("<br>");

      if (clean && proofBox) {
        proofBox.hidden = false;
        const ta = mount.querySelector(".detfix");
        if (ta && !ta.value) ta.value = task.fix.starter || task.code;
      }
      report();
    };

    const runBtn = mount.querySelector(".detrun");
    if (runBtn) {
      runBtn.onclick = function () {
        if (!global.PracticeKit) {
          fb2.className = "feedback bad";
          fb2.textContent = "Grader missing from this page.";
          return;
        }
        const src = mount.querySelector(".detfix").value;
        const out = PracticeKit.gradeJs({ functionName: task.fix.functionName, testCases: task.fix.testCases || [] }, src);
        state.proof = out.passed;
        fb2.className = "feedback detfb2 " + (out.passed ? "ok" : "bad");
        fb2.innerHTML = out.results.map((r) =>
          '<span class="i ' + (r.pass ? "i-check" : "i-x") + '"></span>' +
          esc(r.pass ? r.name : r.hint)
        ).join("<br>");
        report();
      };
    }

    report();
    return state;
  }

  global.DetectiveKit = { render, codeBlock, CATEGORY_LABELS };
})(window);
