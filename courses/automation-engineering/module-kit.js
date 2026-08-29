/* Shared checkpoint quiz + next-button wiring for AI Automation modules. */
(function (global) {
  function shuffle(arr) {
    const x = arr.slice();
    for (let i = x.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = x[i];
      x[i] = x[j];
      x[j] = t;
    }
    return x;
  }

  function wireNext(moduleId) {
    const next = document.getElementById("btnNext");
    if (!next) return;
    const done = CourseProgress.isModuleComplete(moduleId);
    next.disabled = !done;
    next.setAttribute("aria-disabled", done ? "false" : "true");
    next.textContent = done ? "Continue →" : "Complete the lab and quiz (80%+) to continue";
    if (!next.dataset.gate) {
      next.dataset.gate = "1";
      next.addEventListener("click", function (e) {
        if (!CourseProgress.isModuleComplete(moduleId)) e.preventDefault();
      });
    }
  }

  function renderQuiz(rootId, questions, moduleId) {
    const root = document.getElementById(rootId);
    if (!root) return;
    const esc = CourseProgress.escapeHtml;
    const rec = CourseProgress.getModule(moduleId);
    root.innerHTML = "";
    questions.forEach(function (q, qi) {
      const card = document.createElement("div");
      card.className = "qcard";
      card.innerHTML = '<div class="qn">Question ' + (qi + 1) + " of " + questions.length + '</div><div class="qtext">' + esc(q.text) + '</div><div id="opts_' + qi + '"></div><div class="qexplain" id="ex_' + qi + '"></div>';
      root.appendChild(card);
      const box = card.querySelector("#opts_" + qi);
      const display = shuffle(q.opts.map(function (opt, orig) { return { opt: opt, orig: orig }; }));
      const saved = rec.answers["q" + qi];
      function paint(chosenOrig) {
        card.dataset.done = "1";
        const inputs = box.querySelectorAll(".qopt");
        display.forEach(function (row, idx) {
          if (row.opt.correct) inputs[idx].classList.add("correct");
          else if (row.orig === chosenOrig) inputs[idx].classList.add("incorrect");
        });
        const picked = q.opts[chosenOrig];
        const ex = card.querySelector("#ex_" + qi);
        ex.style.display = "block";
        ex.textContent = picked.correct
          ? (picked.whyOk || q.whyOk || "That is the rule this module is teaching.")
          : (picked.why || q.whyBad || "Not quite.");
      }
      display.forEach(function (item) {
        const lab = document.createElement("label");
        lab.className = "qopt";
        lab.innerHTML = '<input type="radio" name="q' + qi + '"' + (saved === item.orig ? " checked" : "") + '> <span>' + esc(item.opt.t) + "</span>";
        lab.addEventListener("click", function () {
          if (card.dataset.done) return;
          CourseProgress.setAnswer(moduleId, "q" + qi, item.orig);
          paint(item.orig);
          refresh(moduleId, questions);
        });
        box.appendChild(lab);
      });
      if (saved !== undefined) paint(saved);
    });
    refresh(moduleId, questions);
  }

  function refresh(moduleId, questions) {
    const rec = CourseProgress.getModule(moduleId);
    let score = 0;
    questions.forEach(function (q, qi) {
      const ans = rec.answers["q" + qi];
      if (ans !== undefined && q.opts[ans] && q.opts[ans].correct) score += 1;
    });
    const answered = Object.keys(rec.answers).filter(function (k) { return k.indexOf("q") === 0; }).length;
    if (answered >= questions.length) CourseProgress.markComplete(moduleId, score, questions.length);
    const sc = document.getElementById("scoreLabel");
    if (sc) sc.textContent = score + " / " + questions.length;
    wireNext(moduleId);
    const gate = document.getElementById("reqList");
    if (gate) {
      gate.innerHTML = CourseProgress.completionRequirements(moduleId).map(function (r) {
        return '<div class="assume">' + (r.satisfied ? "✓" : "○") + " " + CourseProgress.escapeHtml(r.label) + "</div>";
      }).join("");
    }
  }

  function passSection(moduleId, key) {
    CourseProgress.setSection(moduleId, key, true);
    const rec = CourseProgress.getModule(moduleId);
    if (rec.total > 0) CourseProgress.markComplete(moduleId, rec.score, rec.total);
    wireNext(moduleId);
    const gate = document.getElementById("reqList");
    if (gate) {
      gate.innerHTML = CourseProgress.completionRequirements(moduleId).map(function (r) {
        return '<div class="assume">' + (r.satisfied ? "✓" : "○") + " " + CourseProgress.escapeHtml(r.label) + "</div>";
      }).join("");
    }
  }

  function renderLogs(el, logs) {
    el.innerHTML = (logs || []).map(function (l) {
      return '<div class="logline ' + (l.level === "ok" ? "ok" : l.level === "err" ? "err" : l.level === "warn" ? "warn" : "") + '">' + CourseProgress.escapeHtml(l.text) + "</div>";
    }).join("");
  }

  global.ModuleKit = { renderQuiz: renderQuiz, refresh: refresh, passSection: passSection, renderLogs: renderLogs, shuffle: shuffle };
})(window);
