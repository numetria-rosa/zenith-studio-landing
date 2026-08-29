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

  function renderLibrary(title, tasks) {
    const list = document.getElementById("taskList");
    const ids = tasks.map(function (t) { return t.id; });
    const passed = PracticeProgress.passedCount(ids);
    const tier = PracticeProgress.skillTier(passed, tasks.length);
    document.getElementById("skillMeta").textContent = passed + " / " + tasks.length + " passed · " + tier;

    list.innerHTML = "";
    tasks.forEach(function (task) {
      const rec = PracticeProgress.getTask(task.id);
      const card = document.createElement("div");
      card.className = "taskcard";
      const head = document.createElement("button");
      head.type = "button";
      head.className = "taskhead";
      head.innerHTML = '<span class="statusdot' + (rec.passed ? " passed" : "") + '"></span><span class="mono" style="font-size:11px;color:var(--mut2);width:52px">' +
        CourseProgress.escapeHtml(task.id) + '</span><span style="flex:1;font-weight:600;text-align:left">' +
        CourseProgress.escapeHtml(task.title) + '</span><span class="levelpill ' + task.level + '">' + task.level + "</span>";
      const body = document.createElement("div");
      body.className = "taskbody";
      body.innerHTML = '<p class="objective"><b>Objective.</b> ' + CourseProgress.escapeHtml(task.objective) + "</p>";
      const opts = document.createElement("div");
      shuffle(task.opts).forEach(function (opt) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "wf-chip";
        b.style.marginTop = "6px";
        b.textContent = opt.t;
        b.onclick = function () {
          const fb = body.querySelector(".feedback");
          const ok = !!opt.correct;
          PracticeProgress.mark(task.id, ok);
          fb.className = "feedback " + (ok ? "ok" : "bad");
          fb.textContent = ok ? (task.whyOk || opt.whyOk || "That is the rule this library is teaching.") : (opt.why || task.whyBad || "Not quite.");
          if (ok) head.querySelector(".statusdot").classList.add("passed");
          document.getElementById("skillMeta").textContent =
            PracticeProgress.passedCount(ids) + " / " + tasks.length + " passed · " +
            PracticeProgress.skillTier(PracticeProgress.passedCount(ids), tasks.length);
        };
        opts.appendChild(b);
      });
      body.appendChild(opts);
      const fb = document.createElement("div");
      fb.className = "feedback";
      body.appendChild(fb);
      head.onclick = function () { body.classList.toggle("open"); };
      card.appendChild(head);
      card.appendChild(body);
      list.appendChild(card);
    });
  }
  global.PracticeKit = { renderLibrary: renderLibrary, shuffle: shuffle };
})(window);
