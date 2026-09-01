/* Zenith Lab course rail — Data Science & Analysis.
   The sidebar shell (.courseshell/.courserail/.coursemain, nav links, module
   list, active-page state) is now server-rendered by
   src/lib/course-rail-template.ts into the HTML itself — see
   src/app/courses/[courseId]/[...path]/route.ts. This script no longer
   builds or replaces that DOM; it only hydrates the parts that can only be
   known client-side (completion/lock state lives in localStorage) by
   patching classes onto the elements that already exist, and wires up the
   mobile drawer. */
(function () {
  function statusMark(unlocked, status, isCurrent) {
    if (!unlocked) return { cls: "locked", title: "Locked" };
    if (status === "completed") return { cls: "done", title: "Completed" };
    if (isCurrent || status === "in-progress") return { cls: "progress", title: "Current" };
    return { cls: "upcoming", title: "Upcoming" };
  }

  function hydrateProgress(rail) {
    const cp = window.CourseProgress;
    if (!cp) return;
    const ov = cp.overall ? cp.overall() : { pct: 0, completed: 0, total: 0 };
    const ovEl = rail.querySelector("[data-rail-ov]");
    if (ovEl) {
      const bar = ovEl.querySelector(".barline i");
      if (bar) bar.style.width = (ov.pct || 0) + "%";
      const count = ovEl.querySelector("[data-rail-ov-count]");
      if (count) count.textContent = (ov.completed || 0) + " / " + (ov.total || 0) + " modules";
    }
    const m0 = rail.querySelector('[data-mod="0"]');
    if (m0) {
      const extra = (cp.getExtra && cp.getExtra("module0")) || {};
      if (extra.completed) m0.classList.add("done");
      else if (extra.visited && !m0.classList.contains("active")) m0.classList.add("progress");
    }
    rail.querySelectorAll("[data-mod]").forEach(function (el) {
      const idAttr = el.getAttribute("data-mod");
      if (idAttr === "0") return;
      const id = Number(idAttr);
      const m = (cp.MODULES || []).find(function (x) { return x.id === id; });
      if (!m) return;
      const status = cp.statusOf ? cp.statusOf(id) : "not-started";
      const unlocked = cp.isUnlocked ? cp.isUnlocked(id) : true;
      const isCurrent = el.classList.contains("active");
      const mark = statusMark(unlocked, status, isCurrent);
      el.classList.remove("rmdot-upcoming");
      el.classList.add(mark.cls);
      if (!unlocked) {
        const span = document.createElement("span");
        span.className = el.className;
        span.setAttribute("data-mod", idAttr);
        span.setAttribute("aria-disabled", "true");
        span.title = "Unlocks after the previous module";
        span.innerHTML = el.innerHTML +
          '<span class="rmlock" aria-hidden="true"><span class="i i-lock"></span></span>';
        el.replaceWith(span);
      }
    });
  }

  function closeRail() {
    document.body.classList.remove("rail-open");
    const btn = document.querySelector(".rail-toggle");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }
  function toggleRail() {
    if (document.body.classList.contains("rail-open")) closeRail();
    else {
      document.body.classList.add("rail-open");
      const btn = document.querySelector(".rail-toggle");
      if (btn) btn.setAttribute("aria-expanded", "true");
    }
  }
  function injectToggle() {
    const barIn = document.querySelector(".bar .in");
    if (!barIn || barIn.querySelector(".rail-toggle")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rail-toggle";
    btn.setAttribute("aria-controls", "course-rail");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open course navigation");
    btn.innerHTML = '<span class="i i-menu" aria-hidden="true"></span>';
    barIn.insertBefore(btn, barIn.firstChild);
    btn.addEventListener("click", toggleRail);
  }
  function ensureCss(href) {
    const links = document.querySelectorAll("link[rel=stylesheet]");
    for (let i = 0; i < links.length; i++) {
      if ((links[i].getAttribute("href") || "").indexOf(href) !== -1) return;
    }
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }

  function init() {
    ensureCss("zenith-lab.css");
    ensureCss("theme.css");
    const ui = document.createElement("script");
    ui.src = "course-ui.js";
    document.head.appendChild(ui);

    const rail = document.getElementById("course-rail");
    if (rail) {
      hydrateProgress(rail);
      rail.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeRail); });
    }
    const scrim = document.querySelector(".railscrim");
    if (scrim) scrim.addEventListener("click", closeRail);
    injectToggle();
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeRail(); });
  }
  init();
})();
