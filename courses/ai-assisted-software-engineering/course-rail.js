/* Shared chrome: course rail, mobile drawer, skip link.
   Visual language lives in course.css. The sidebar shell (.courseshell/
   .courserail/.coursemain, nav links, module list, active-page state) is now
   server-rendered by src/lib/course-rail-template.ts into the HTML itself —
   see src/app/courses/[courseId]/[...path]/route.ts. This script no longer
   builds or replaces that DOM; it only hydrates the parts that can only be
   known client-side (completion/lock state lives in localStorage) by
   patching classes onto the elements that already exist, and wires up the
   mobile drawer. CourseUI (course-ui.js) hydrates icons, copy buttons, and
   hero metadata after that. */
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
    const ov = cp.overall();
    const ovEl = rail.querySelector("[data-rail-ov]");
    if (ovEl) {
      const bar = ovEl.querySelector(".barline i");
      if (bar) bar.style.width = ov.pct + "%";
      const count = ovEl.querySelector("[data-rail-ov-count]");
      if (count) count.textContent = ov.completed + " / " + ov.total + " modules";
    }
    cp.STAGES.forEach((stage) => {
      stage.modules.forEach((id) => {
        const m = cp.MODULES.find((x) => x.id === id);
        if (!m) return;
        const el = rail.querySelector('[data-mod="' + id + '"]');
        if (!el) return;
        const status = cp.statusOf(m.id);
        const unlocked = cp.isUnlocked(m.id);
        const isCurrent = el.classList.contains("active");
        const mark = statusMark(unlocked, status, isCurrent);
        el.classList.remove("rmdot-upcoming");
        el.classList.add(mark.cls);
        if (unlocked) return;
        let title = "Locked";
        if (m.id === cp.CAPSTONE_ID) title = "Needs Module 12, the practice bar, and both Desktop Labs";
        else {
          const prev = cp.prevInSequence ? cp.prevInSequence(m.id) : null;
          title = prev ? ("Unlocks after Module " + prev.id + " (" + prev.title + ")") : "Locked";
        }
        const tick = el.querySelector(".rmtick");
        if (tick) tick.remove();
        const span = document.createElement("span");
        span.className = el.className;
        span.setAttribute("data-mod", String(id));
        span.setAttribute("aria-disabled", "true");
        span.title = title;
        span.innerHTML = el.innerHTML +
          '<span class="rmlock" title="Locked"><span class="ico" data-ico="lock"></span></span>';
        el.replaceWith(span);
      });
    });
  }

  function closeRail() {
    document.body.classList.remove("rail-open");
    const btn = document.querySelector(".rail-toggle");
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open course navigation");
    }
  }
  function openRail() {
    document.body.classList.add("rail-open");
    const btn = document.querySelector(".rail-toggle");
    if (btn) {
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Close course navigation");
    }
    const first = document.querySelector("#course-rail a, #course-rail summary");
    if (first) first.focus();
  }
  function toggleRail() {
    if (document.body.classList.contains("rail-open")) closeRail();
    else openRail();
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

  function init() {
    // Kick off course-ui.js's fetch immediately, in parallel with the (now
    // much smaller) progress hydration below — the rail DOM it hydrates
    // icons into is already present server-side by the time this script
    // even starts running.
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

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeRail();
      if (e.key !== "Tab" || !document.body.classList.contains("rail-open") || !rail) return;
      const toggle = document.querySelector(".rail-toggle");
      const nodes = [];
      if (toggle) nodes.push(toggle);
      rail.querySelectorAll("a, button, summary").forEach(function (el) { nodes.push(el); });
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    document.querySelectorAll('[id$="Results"], [id^="results_"], .feedback').forEach((el) => {
      if (!el.getAttribute("aria-live")) el.setAttribute("aria-live", "polite");
    });
  }
  init();
})();
