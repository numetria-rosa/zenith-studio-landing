(function (global) {
  function renderQuiz(moduleId, questions, onPass) {
    const root = document.getElementById("quizRoot");
    if (!root) return;
    let score = 0, answered = 0;
    root.innerHTML = "";
    questions.forEach((q, qi) => {
      const card = document.createElement("div");
      card.className = "qcard";
      card.innerHTML = '<div class="qtext">' + CourseProgress.escapeHtml(q.text) + "</div>";
      q.opts.forEach((opt) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "qopt";
        b.textContent = opt.t;
        b.onclick = function () {
          if (b.dataset.done) return;
          b.dataset.done = "1";
          answered += 1;
          const ok = !!opt.correct;
          if (ok) score += 1;
          b.classList.add(ok ? "correct" : "incorrect");
          CourseProgress.setAnswer(moduleId, q.id, opt.t);
          const fb = document.createElement("div");
          fb.className = "feedback " + (ok ? "ok" : "bad");
          fb.textContent = ok ? "Yes." : (opt.why || "Not that one.");
          card.appendChild(fb);
          document.getElementById("scoreDisplay").textContent = "Checkpoint score: " + score + " / " + questions.length;
          if (answered === questions.length) {
            CourseProgress.markComplete(moduleId, score, questions.length);
            if (score / questions.length >= CourseProgress.PASS_THRESHOLD && onPass) onPass();
            const next = document.getElementById("btnNext");
            if (next && CourseProgress.isModuleComplete(moduleId)) next.disabled = false;
          }
        };
        card.appendChild(b);
      });
      root.appendChild(card);
    });
  }
  global.ModuleKit = { renderQuiz };
})(window);
