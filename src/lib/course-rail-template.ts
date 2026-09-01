import { COURSE_RAIL_DATA } from "./course-rail-data";

const HTML_ESCAPE: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c]);
}

/* Server-rendered rail content for one course page. Everything here is
   knowable at request time: nav structure, module list, the current page's
   active/open state (the URL is already known server-side — no client-side
   currentFile() guess needed). Completion/lock state lives in localStorage
   only, so it can't be rendered here; course-rail.js hydrates those classes
   onto the elements this produces (by data-mod id) after load, patching
   existing DOM instead of building it — a much smaller, non-layout-shifting
   step than the old full client-side construction. */
export function buildRailInnerHtml(courseId: string, currentFile: string): string | null {
  const data = COURSE_RAIL_DATA[courseId];
  if (!data) return null;

  const navHtml = data.navGroups.map((g) => {
    const open = g.items.some(([file]) => file === currentFile);
    const links = g.items.map(([file, label]) => {
      const isCur = file === currentFile;
      const cls = isCur ? ' class="active"' : "";
      const curAttr = isCur ? ' aria-current="page"' : "";
      return `<a href="${esc(file)}"${cls}${curAttr}>${esc(label)}</a>`;
    }).join("");
    return `<details class="rail-g"${open ? " open" : ""}><summary>${esc(g.label)}</summary>${links}</details>`;
  }).join("");

  let modsHtml = "";
  if (data.hasModuleZero) {
    const isCur = currentFile === "module-00.html";
    const cls = ["rail-mod", "rmdot-upcoming"];
    if (isCur) cls.push("active", "progress");
    modsHtml += `<a href="module-00.html" class="${cls.join(" ")}" title="Orientation" data-mod="0">` +
      `<span class="rmnum">0</span><span class="rmdot" aria-hidden="true"></span><span>Orientation</span></a>`;
  }
  data.stages.forEach((stage) => {
    modsHtml += `<div class="rail-stage">${esc(stage.label)} · ${esc(stage.title)}</div>`;
    stage.modules.forEach((id) => {
      const m = data.modules.find((x) => x.id === id);
      if (!m) return;
      const isCur = currentFile === m.file;
      const cls = ["rail-mod", "rmdot-upcoming"];
      if (isCur) cls.push("active");
      const ticket = data.tickets?.[id];
      const tick = ticket ? `<span class="rmtick">${esc(ticket.id.replace("NL-", "#"))}</span>` : "";
      const inner = `<span class="rmnum">${m.id}</span><span class="rmdot" aria-hidden="true"></span>` +
        `<span class="rmtitle">${esc(m.title)}</span>${tick}`;
      // Lock/completion state is client-only (localStorage); render as a plain,
      // clickable link by default and let hydration correct it (add locked/
      // done/progress classes and swap the tick badge for a lock icon) — a
      // subtler patch than reconstructing the whole element.
      modsHtml += `<a href="${esc(m.file)}" class="${cls.join(" ")}" title="${esc(m.title)}" data-mod="${m.id}">${inner}</a>`;
    });
  });

  const accountHtml = `<div class="rail-account">` +
    `<a href="/lab/dashboard">&larr; Zenith Lab Dashboard</a>` +
    `<a href="/profile">My Profile</a></div>`;

  const ovHtml = `<div class="rail-ov" data-rail-ov><div class="lbl">Course progress</div>` +
    `<div class="barline"><i style="width:0%"></i></div>` +
    `<div class="lbl" style="margin-top:6px" data-rail-ov-count>&nbsp;</div></div>`;

  return `<div class="rail-brand">Zenith Lab</div><div class="rail-title">${esc(data.title)}</div>` +
    accountHtml + ovHtml + `<nav class="rail-nav">${navHtml}</nav>` +
    `<div class="rail-modlbl">Modules</div><div class="rail-mods">${modsHtml}</div>`;
}

/* Splice the shell (skip link, scrim, courserail, coursemain wrapper) into a
   raw course HTML page around its existing <body>...</body> content, so the
   sidebar exists in the very first byte stream instead of being assembled by
   client JS after load. Returns the original html unchanged if it doesn't
   look like a full page (no <body> tag) or already carries a shell (a page
   still under local static-file testing that includes course-rail.js's own
   full DOM-building path would otherwise get double-wrapped). */
export function wrapCoursePage(html: string, courseId: string, currentFile: string): string {
  if (html.indexOf('class="courseshell"') !== -1) return html;
  const bodyOpenMatch = html.match(/<body[^>]*>/i);
  const bodyCloseIdx = html.lastIndexOf("</body>");
  if (!bodyOpenMatch || bodyCloseIdx === -1) return html;

  const railInner = buildRailInnerHtml(courseId, currentFile);
  if (railInner === null) return html;

  const bodyOpenEnd = (bodyOpenMatch.index ?? 0) + bodyOpenMatch[0].length;
  const head =
    `<a class="skip-to-content" href="#main-content">Skip to content</a>` +
    `<button type="button" class="railscrim" aria-label="Close course navigation"></button>` +
    `<div class="courseshell"><aside class="courserail" id="course-rail" aria-label="Course navigation">${railInner}</aside>` +
    `<div class="coursemain" id="main-content" role="main" tabindex="-1">`;
  const tail = `</div></div>`;

  return html.slice(0, bodyOpenEnd) + head + html.slice(bodyOpenEnd, bodyCloseIdx) + tail + html.slice(bodyCloseIdx);
}

/* Best-effort "which nav/module entry is this" derivation from the resolved
   file path — same normalization rule course-rail.js's old currentFile()
   used, now run server-side where the URL is already authoritative. */
export function fileNameFromPath(resolvedPath: string): string {
  const last = resolvedPath.split(/[\\/]/).pop() || "";
  return last.toLowerCase().endsWith(".html") ? last : `${last}.html`;
}
