/* Course UI helpers: icons, copy-on-code, hero metadata, sticky context.
   Loaded after the rail shell exists. Safe if CourseProgress is missing. */
(function (global) {
  const SVG = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V8z"/><path d="M12 6v12"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><path d="m14 4-4 16"/></svg>',
    layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>',
    branch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M8.5 7c4 0 5 3 5 5s-1 5-5 5"/><path d="M8.5 17H6"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3z"/><path d="m9 12 2 2 4-4"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg>',
    hands: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13v-3a2 2 0 1 1 4 0v3M12 13V8a2 2 0 1 1 4 0v5M16 13V9a2 2 0 1 1 4 0v8a4 4 0 0 1-4 4H9a5 5 0 0 1-5-5v-1a2 2 0 1 1 4 0"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    circle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/></svg>',
  };

  function icon(name) {
    return '<span class="ico" aria-hidden="true">' + (SVG[name] || SVG.spark) + "</span>";
  }

  function hydrateIcons(root) {
    (root || document).querySelectorAll("[data-ico]").forEach(function (el) {
      if (el.getAttribute("data-hydrated")) return;
      const name = el.getAttribute("data-ico");
      el.innerHTML = SVG[name] || SVG.spark;
      el.setAttribute("data-hydrated", "1");
    });
  }

  function inferLang(code) {
    const s = String(code || "");
    if (/^\s*</.test(s)) return "html";
    if (/\b(def |except:|import |None|True|False)\b/.test(s)) return "python";
    if (/^\s*[.#@]/.test(s) || (/{\s*$/m.test(s) && /:\s*[^;\n]+;/m.test(s) && !/\b(function|const|let|return)\b/.test(s))) return "css";
    return "js";
  }

  function escapeHtml(str) {
    if (global.CourseProgress && CourseProgress.escapeHtml) return CourseProgress.escapeHtml(str);
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function highlight(code, lang) {
    let out = escapeHtml(code);
    if (lang === "js" || lang === "python") {
      out = out.replace(/(&#39;[^&\n]*?&#39;|&quot;[^&\n]*?&quot;|`[^`\n]*?`)/g, '<span class="tk-str">$1</span>');
      out = out.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="tk-com">$1</span>');
      out = out.replace(/\b(function|return|const|let|var|if|else|for|while|new|try|catch|throw|async|await|class|def|import|from|True|False|None|null|undefined|true|false|except|pass)\b/g,
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

  function markOverflow(el) {
    if (!el) return;
    const scroller = el.querySelector("pre.detsrc, pre") || el;
    if (scroller.scrollWidth > scroller.clientWidth + 8) el.classList.add("has-overflow");
  }

  function enhancePre(pre) {
    if (pre.getAttribute("data-hl")) return;
    const raw = pre.textContent || "";
    if (!raw.trim()) return;
    const lang = inferLang(raw);
    const lines = raw.replace(/\s+$/, "").split("\n");
    const inBa = !!pre.closest(".ba-col");
    const alreadyDet = !!pre.closest(".detcode");
    if (!alreadyDet && !inBa && lines.length >= 4) {
      const wrap = pre.closest(".codeblock") || pre.parentNode;
      const det = document.createElement("div");
      det.className = "detcode";
      det.innerHTML = '<pre class="detgutter" aria-hidden="true">' +
        lines.map(function (_, i) { return i + 1; }).join("\n") + "</pre>" +
        '<pre class="detsrc"><code>' + highlight(lines.join("\n"), lang) + "</code></pre>";
      pre.replaceWith(det);
      markOverflow(wrap);
      return;
    }
    pre.innerHTML = highlight(raw, lang);
    pre.setAttribute("data-hl", "1");
    markOverflow(pre.closest(".codeblock, .ba-col, .detcode") || pre);
  }

  function wrapCodeBlocks() {
    document.querySelectorAll("pre").forEach(function (pre) {
      if (pre.classList.contains("detgutter") || pre.classList.contains("detsrc") || pre.classList.contains("prdiff")) return;
      if (pre.closest(".detcode") || pre.closest(".elab") || pre.closest(".conflict")) return;
      if (pre.closest(".ba-col")) {
        enhancePre(pre);
        return;
      }
      if (pre.closest(".codeblock")) return;
      const wrap = document.createElement("div");
      wrap.className = "codeblock";
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copybtn";
      btn.setAttribute("aria-label", "Copy code");
      btn.innerHTML = icon("copy") + " Copy";
      btn.addEventListener("click", function () {
        const src = wrap.querySelector(".detsrc") || pre;
        const text = src.innerText || src.textContent || "";
        const done = function () {
          btn.textContent = "Copied";
          setTimeout(function () { btn.innerHTML = icon("copy") + " Copy"; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {
            btn.textContent = "Select to copy";
          });
        } else {
          done();
        }
      });
      wrap.appendChild(btn);
      enhancePre(pre);
    });
  }

  function fileName() {
    return (location.pathname.split("/").pop() || "").split("?")[0];
  }

  function currentModule() {
    if (!global.CourseProgress) return null;
    const file = fileName();
    return CourseProgress.MODULES.find(function (m) { return m.file === file; }) || null;
  }

  function renderHeroMeta() {
    const hero = document.querySelector(".hero");
    if (!hero || hero.querySelector(".herometa")) return;
    const m = currentModule();
    const chips = [];
    if (m) {
      const t = CourseProgress.ticketFor ? CourseProgress.ticketFor(m.id) : null;
      const stage = CourseProgress.stageOf ? CourseProgress.stageOf(m.id) : null;
      chips.push({ ico: "clock", text: "~" + m.minutes + " min" });
      if (t && t.kind) chips.push({ ico: kindIcon(t.kind), text: t.kind });
      if (t) chips.push({ ico: "ticket", text: t.id });
      chips.push({ ico: "hands", text: "Hands-on" });
      if (stage) chips.push({ ico: "spark", text: stage.label });
    } else if (hero.querySelector(".eyebrow")) {
      return;
    }
    if (!chips.length) return;
    const row = document.createElement("div");
    row.className = "herometa";
    row.innerHTML = chips.map(function (c) {
      return '<span class="herochip">' + icon(c.ico) + c.text + "</span>";
    }).join("");
    const sub = hero.querySelector(".sub");
    if (sub && sub.nextSibling) hero.insertBefore(row, sub.nextSibling);
    else hero.appendChild(row);

    if (m && CourseProgress.completionRequirements) {
      const reqs = CourseProgress.completionRequirements(m.id);
      const done = reqs.filter(function (r) { return r.satisfied; }).length;
      const pct = reqs.length ? Math.round((done / reqs.length) * 100) : 0;
      const bar = document.createElement("div");
      bar.className = "heroprogress";
      bar.innerHTML = '<div class="track"><div class="fill" style="width:' + pct + '%"></div></div>' +
        '<span class="pct">' + done + " / " + reqs.length + "</span>";
      row.after(bar);
    }
  }

  function kindIcon(kind) {
    const k = String(kind || "").toLowerCase();
    if (k.indexOf("css") !== -1 || k.indexOf("front") !== -1) return "layout";
    if (k.indexOf("html") !== -1) return "code";
    if (k.indexOf("js") !== -1 || k.indexOf("script") !== -1) return "code";
    if (k.indexOf("git") !== -1 || k.indexOf("review") !== -1) return "branch";
    if (k.indexOf("test") !== -1 || k.indexOf("bug") !== -1) return "shield";
    if (k.indexOf("python") !== -1) return "code";
    if (k.indexOf("spec") !== -1) return "ticket";
    if (k.indexOf("release") !== -1) return "folder";
    return "spark";
  }

  function renderContextBar() {
    if (document.querySelector(".ctxbar")) return;
    const m = currentModule();
    if (!m || !global.CourseProgress) return;
    const t = CourseProgress.ticketFor ? CourseProgress.ticketFor(m.id) : null;
    const reqs = CourseProgress.completionRequirements ? CourseProgress.completionRequirements(m.id) : [];
    const done = reqs.filter(function (r) { return r.satisfied; }).length;
    const bar = document.createElement("div");
    bar.className = "ctxbar";
    bar.innerHTML = '<div class="in">' +
      "<strong>Module " + m.id + "</strong>" +
      (t ? '<span class="sep">·</span><span>' + t.id + "</span>" : "") +
      '<span class="sep">·</span><span>' + done + " / " + reqs.length + " checks</span>" +
      '<span class="ctx-title">' + m.title + "</span>" +
      '<span class="ctxfill"><i style="width:' + (reqs.length ? Math.round((done / reqs.length) * 100) : 0) + '%"></i></span>' +
      "</div>";
    const host = document.querySelector(".coursemain") || document.body;
    const top = host.querySelector(".bar");
    if (top && top.nextSibling) host.insertBefore(bar, top.nextSibling);
    else host.insertBefore(bar, host.firstChild);
    function show() {
      bar.style.display = window.scrollY > 280 ? "block" : "none";
    }
    show();
    window.addEventListener("scroll", show, { passive: true });
  }

  function polishHero() {
    const m = currentModule();
    if (!m || !global.CourseProgress) return;
    const t = CourseProgress.ticketFor ? CourseProgress.ticketFor(m.id) : null;
    const hero = document.querySelector(".hero");
    const eye = hero && hero.querySelector(".eyebrow");
    if (!eye) return;
    const stage = CourseProgress.stageOf ? CourseProgress.stageOf(m.id) : null;
    eye.textContent = (stage ? stage.label + " · " : "") + "Module " + m.id;
    if (t && !hero.querySelector(".heroticket")) {
      const lab = document.createElement("div");
      lab.className = "heroticket";
      lab.textContent = "Ticket #" + String(t.id).replace(/^NL-/, "");
      eye.after(lab);
    }
  }

  function init() {
    polishHero();
    hydrateIcons(document);
    wrapCodeBlocks();
    renderHeroMeta();
    renderContextBar();
    hydrateIcons(document);
  }

  global.CourseUI = { icon: icon, hydrateIcons: hydrateIcons, init: init, SVG: SVG };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
