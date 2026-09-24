// Bolder 4:5 variant, same brand (logo, dark bg, Fraunces/IBM Plex, real
// per-course data) as _gen-insta-course-ads.mjs, but styled after the
// colorful numbered-badge layout competitors in this niche use. Reuses
// COURSES/svg from the original generator rather than redefining them —
// original ads are untouched, this writes to its own folder.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { COURSES, svg } from "./_gen-insta-course-ads.mjs";

const OUT_DIR = path.resolve("insta/course-ads-bold");
mkdirSync(OUT_DIR, { recursive: true });

// Fixed per-tool colors (not the course's single accent) — that's the
// specific "bold" look being asked for: each tool badge in its own color,
// like the competitor screenshots.
const TOOL_COLORS = {
  sql: "#4f9dff", python: "#3776ab", tableau: "#8b5cf6", powerbi: "#f2c811",
  excel: "#22a565", stats: "#22c3a6", automation: "#ec4899", integrated: "#94a3b8",
  js: "#f0db4f", html: "#e34c26", css: "#06b6d4", testing: "#f59e0b",
  git: "#fb7185", api: "#0ea5e9", reliability: "#a3e635", spark: "#fbbf24",
  workflow: "#c084fc", wrench: "#38bdf8", review: "#34d399", specs: "#f472b6",
  bot: "#818cf8", shield: "#4ade80", target: "#fb923c", trophy: "#fde047",
};

function render(c) {
  const subHtml = c.desc.replace(c.job, `<span class="job">${c.job}</span>`);

  const headline = c.topics.slice(0, 5).map((t) =>
    `<span style="color:${TOOL_COLORS[t.i] ?? c.accent}">${t.t.toUpperCase()}</span>`
  ).join(' <span class="plus">+</span> ');

  const badgeCols = c.topics.length <= 4 ? 2 : 3;
  const badges = c.topics.slice(0, 6).map((t, i) => `
    <div class="badge">
      <div class="bnum" style="background:${TOOL_COLORS[t.i] ?? c.accent}">${String(i + 1).padStart(2, "0")}</div>
      <div class="brow">
        <div class="bicon" style="color:${TOOL_COLORS[t.i] ?? c.accent}">${svg(t.i)}</div>
        <div class="btool">${t.t}</div>
      </div>
      <div class="btasks">${t.n} tasks</div>
    </div>`).join("");

  const statPills = c.stats.map((s) => `
    <div class="spill"><span class="snum">${s.n}</span><span class="slbl">${s.l}</span></div>`).join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${c.tag}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=IBM+Plex+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@600;700&family=Caveat:wght@700&display=swap">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{ --bg:#070b14; --card2:#141b2c; --bd:rgba(148,163,184,.18); --tx:#eef2ff; --mut:#9aa6c2; --accent:${c.accent}; --accentd:${c.accentd}; }
  html,body{width:1080px;height:1350px;overflow:hidden}
  body{ background:var(--bg); color:var(--tx); font-family:'IBM Plex Sans',sans-serif; }
  .frame{ padding:46px 50px; height:100%; display:flex; flex-direction:column; }
  .topbar{ display:flex; align-items:center; justify-content:space-between; }
  .logo{ font-family:'Fraunces'; font-weight:700; font-size:22px; }
  .logo b{ background:var(--accent); color:var(--accentd); padding:3px 10px; margin-left:4px; border-radius:6px; font-size:14px; }
  .pricebox{ background:var(--accent); color:var(--accentd); border-radius:12px; padding:10px 18px; font-family:'Fraunces'; font-weight:900; font-size:28px; }
  .pricebox s{ font-family:'IBM Plex Mono'; font-size:14px; opacity:.6; margin-right:6px; font-weight:600; }
  .headline{ font-family:'Fraunces'; font-weight:900; font-size:72px; line-height:1.05; letter-spacing:-.01em; text-transform:uppercase; margin-top:36px; }
  .plus{ color:var(--mut); font-size:52px; }
  .sub{ margin-top:20px; font-size:28px; color:var(--mut); font-weight:600; }
  .sub .job{ color:var(--accent); text-decoration:underline; text-underline-offset:5px; font-weight:700; }
  .badges{ margin-top:44px; display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .badge{ background:var(--card2); border:1px solid var(--bd); border-radius:20px; padding:22px 24px; }
  .bnum{ display:inline-block; font-family:'IBM Plex Mono'; font-weight:700; font-size:14px; color:#04101f; padding:4px 10px; border-radius:7px; }
  .brow{ display:flex; align-items:center; gap:12px; margin-top:16px; }
  .bicon{ width:32px; height:32px; flex-shrink:0; }
  .bicon svg{ width:100%; height:100% }
  .btool{ font-weight:700; font-size:22px; }
  .btasks{ margin-top:8px; font-size:16px; color:var(--mut); }
  .urgency{ margin-top:56px; }
  .pills{ display:flex; gap:10px; }
  .spill{ flex:1; background:var(--card2); border:1px solid var(--bd); border-radius:16px; padding:20px 10px; text-align:center; }
  .snum{ display:block; font-family:'Fraunces'; font-weight:900; font-size:32px; color:var(--accent); }
  .slbl{ display:block; margin-top:4px; font-size:14px; color:var(--mut); }
  .deadline{ margin-top:18px; text-align:center; font-family:'IBM Plex Mono'; font-weight:700; font-size:18px; letter-spacing:.06em; color:var(--accent); background:color-mix(in srgb, var(--accent) 16%, transparent); border:1.5px solid var(--accent); border-radius:12px; padding:14px; }
  .footer{ margin-top:28px; padding-top:20px; border-top:1px solid var(--bd); display:flex; align-items:center; justify-content:space-between; }
  .cta{ font-family:'Caveat'; font-weight:700; font-size:36px; color:var(--accent); }
  .site{ font-family:'IBM Plex Mono'; font-size:13px; color:var(--mut); }
</style></head>
<body><div class="frame">
  <div class="topbar">
    <div class="logo">ZENITH<b>LAB</b></div>
    <div class="pricebox"><s>${c.originalPrice}</s>${c.price}</div>
  </div>
  <div class="headline">${headline}</div>
  <div class="sub">${subHtml}</div>
  <div class="badges" style="grid-template-columns:repeat(${badgeCols},1fr)">${badges}</div>
  <div class="urgency">
    <div class="pills">${statPills}</div>
    <div class="deadline">-${c.discountPercent}% &middot; ${c.saleUntil}</div>
  </div>
  <div class="footer">
    <div class="cta">link in bio &#8599;</div>
    <div class="site">zenith-studio.site</div>
  </div>
</div></body></html>`;
}

for (const c of COURSES) {
  const out = path.join(OUT_DIR, `slide-${c.id}.html`);
  writeFileSync(out, render(c), "utf-8");
  console.log("wrote", out);
}
