// Editorial-poster ad style, closely mirroring two specific reference posts
// from insta/research/competitor-analysis.md rather than a loose blend:
//   - Service ad copies seb.ai's Dc4wfCAGOxc layout: top corner micro-labels,
//     bold headline, a big capsule/pedestal icon-row illustration filling
//     most of the canvas, bottom corner captions.
//   - Course ad copies artem.novitckii's Dbx1P3FlED4 layout: crop-mark
//     corners, centered headline with a colored highlight box, one big
//     circular badge illustration dominating the middle, a bordered CTA
//     box at the bottom.
// Both previously left the bottom half empty — this version fills the
// canvas with an actual graphic instead of just headline + a thin list.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("insta/new-style-ads");
mkdirSync(OUT_DIR, { recursive: true });

const ICONS = {
  phone: '<path d="M6.5 3h4l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v4a2 2 0 0 1-2 2C11.5 19.5 4.5 12.5 4.5 5a2 2 0 0 1 2-2Z"/>',
  bot: '<rect x="5" y="9" width="14" height="10" rx="2"/><circle cx="9" cy="14" r="1.3"/><circle cx="15" cy="14" r="1.3"/><path d="M12 9V5M8 5h8"/>',
  receipt: '<path d="M6 2h12v20l-2-1.3L14 22l-2-1.3L10 22l-2-1.3L6 22V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  spark: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19"/><circle cx="12" cy="12" r="3"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V16h6v-1.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 2Z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.7" fill="currentColor"/>',
};
function svg(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}

const SHARED_HEAD = (accent, extraFonts = "") => `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,900&family=IBM+Plex+Mono:wght@500;600;700${extraFonts}&display=swap">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1080px;height:1350px;overflow:hidden}
  body{ background:#f2ece0; color:#18140f; font-family:'IBM Plex Mono',monospace; }
</style>`;

// ---------- Service ad: seb.ai pipeline-poster style ----------
function renderService(ad) {
  const capsules = ad.pills.map((p, i) => `
    <div class="capsule" style="--d:${i}">
      <span class="cicon">${svg(p.i)}</span>
      <div class="clabel">${p.t}</div>
    </div>`).join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${ad.eyebrow}</title>${SHARED_HEAD(ad.accent)}
<style>
  :root{ --accent:${ad.accent}; --mut:#6b6255; }
  .canvas{ position:relative; width:1080px; height:1350px; padding:52px 56px; display:flex; flex-direction:column; }
  .metarow{ display:flex; justify-content:space-between; }
  .metacol{ font-size:13px; font-weight:700; letter-spacing:.08em; line-height:1.9; color:#443d33; }
  .metacol.r{ text-align:right; }

  h1{ font-family:'Fraunces'; font-optical-sizing:none; font-variation-settings:"opsz" 144; font-weight:700;
      font-size:52px; line-height:1.08; letter-spacing:-.015em; margin-top:26px; max-width:820px; }
  h1 .accent{ color:var(--accent); }
  .statline{ margin-top:16px; display:flex; align-items:center; gap:10px; font-size:16px; font-weight:600; color:#332e26; }
  .dot{ width:9px; height:9px; border-radius:50%; background:var(--accent); }

  .stage{ position:relative; flex:1; margin-top:42px; display:flex; align-items:flex-end; justify-content:center; gap:26px; padding-bottom:70px; }
  .stage::after{ content:""; position:absolute; left:20px; right:20px; bottom:56px; height:14px; background:#e4dbc9; border-radius:8px; box-shadow:0 18px 30px -12px rgba(24,20,15,.35); }
  .capsule{
    position:relative; z-index:1; width:220px; height:${300 + 0}px; background:#fbf8f1; border:2px solid #18140f;
    border-radius:26px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px;
    box-shadow:0 22px 26px -14px rgba(24,20,15,.3);
  }
  .cicon{ width:56px; height:56px; color:var(--accent); }
  .cicon svg{ width:100%; height:100%; }
  .clabel{ font-family:'Fraunces'; font-weight:700; font-size:22px; letter-spacing:-.01em; }
  .tag24{ position:absolute; right:56px; bottom:26px; font-family:'Fraunces'; font-weight:700; font-size:30px; color:#332e26; }

  .footer{ margin-top:auto; padding-top:22px; border-top:2px solid #18140f; display:flex; justify-content:space-between; align-items:flex-end; }
  .footcol{ font-size:14px; font-weight:700; letter-spacing:.04em; max-width:380px; line-height:1.5; }
  .footcol.r{ text-align:right; }
  .cta{ font-family:'Fraunces'; font-weight:700; font-size:23px; margin-top:4px; }
  .cta b{ background:var(--accent); color:#f2ece0; padding:1px 10px; border-radius:5px; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="metarow">
      <div class="metacol">ANSWER<br>FOLLOW UP<br>BILL</div>
      <div class="metacol r">INTAKE<br>LEADS<br>REVENUE</div>
    </div>
    <h1>${ad.headline} <span class="accent">${ad.headlineAccent}</span></h1>
    <div class="statline"><span class="dot"></span>${ad.sub}</div>
    <div class="stage">
      ${capsules}
      <div class="tag24">24/7</div>
    </div>
    <div class="footer">
      <div class="footcol">ONE AI TEAM.<br>NO HIRES, NO TRAINING.</div>
      <div class="footcol r">
        <div class="cta">Comment "<b>${ad.ctaKeyword}</b>" for the breakdown.</div>
      </div>
    </div>
  </div>
</body></html>`;
}

// ---------- Course ad: artem.novitckii illustrated-poster style ----------
function renderCourse(ad) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${ad.eyebrow}</title>${SHARED_HEAD(ad.accent)}
<style>
  :root{ --accent:${ad.accent}; }
  .canvas{ position:relative; width:1080px; height:1350px; padding:50px; }
  .crop{ position:absolute; width:24px; height:24px; opacity:.6; }
  .crop::before,.crop::after{ content:""; position:absolute; background:#18140f; }
  .crop::before{ width:100%; height:2px; top:50%; } .crop::after{ width:2px; height:100%; left:50%; }
  .crop.tl{ top:26px; left:26px; } .crop.tr{ top:26px; right:26px; }
  .crop.bl{ bottom:26px; left:26px; } .crop.br{ bottom:26px; right:26px; }

  .frame{ height:100%; display:flex; flex-direction:column; align-items:center; text-align:center; padding:20px 30px; }
  .eyebrow{ font-size:15px; font-weight:700; letter-spacing:.14em; color:#6b6255; }
  h1{ font-family:'Fraunces'; font-optical-sizing:none; font-variation-settings:"opsz" 144; font-weight:700;
      font-size:58px; line-height:1.06; letter-spacing:-.015em; margin-top:18px; }
  .accentbox{ display:block; margin:6px auto 0; background:var(--accent); color:#f2ece0; padding:2px 18px; border-radius:8px; }

  .badge{ position:relative; width:520px; height:520px; margin:38px auto 0; }
  .ring{ position:absolute; inset:0; border:3px dashed var(--accent); border-radius:50%; opacity:.55; }
  .ring2{ position:absolute; inset:50px; border:2px solid var(--accent); border-radius:50%; opacity:.35; }
  .core{ position:absolute; inset:110px; background:#18140f; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 30px 50px -20px rgba(24,20,15,.45); }
  .coreicon{ width:150px; height:150px; color:var(--accent); }
  .coreicon svg{ width:100%; height:100%; }
  .ray{ position:absolute; width:3px; height:46px; background:var(--accent); border-radius:2px; left:50%; top:-30px; transform-origin:50% 285px; }

  .ctabox{ margin-top:auto; border:2.5px solid #18140f; border-radius:16px; padding:20px 30px; max-width:640px; }
  .ctabox .line1{ font-family:'Fraunces'; font-weight:700; font-size:24px; }
  .ctabox .line1 b{ background:var(--accent); color:#f2ece0; padding:1px 10px; border-radius:5px; }
  .ctabox .line2{ margin-top:6px; font-size:14px; color:#6b6255; }
  .site{ margin-top:16px; font-size:13px; color:#6b6255; letter-spacing:.06em; }
</style>
</head>
<body>
  <div class="canvas">
    <span class="crop tl"></span><span class="crop tr"></span><span class="crop bl"></span><span class="crop br"></span>
    <div class="frame">
      <div class="eyebrow">${ad.eyebrow}</div>
      <h1>${ad.headline}<span class="accentbox">${ad.headlineAccent}</span></h1>
      <div class="badge">
        <div class="ring"></div><div class="ring2"></div>
        ${Array.from({ length: 12 }).map((_, i) => `<div class="ray" style="transform:rotate(${i * 30}deg) translateY(0)"></div>`).join("")}
        <div class="core"><span class="coreicon">${svg(ad.badgeIcon)}</span></div>
      </div>
      <div class="ctabox">
        <div class="line1">Comment "<b>${ad.ctaKeyword}</b>" and I'll send you the syllabus.</div>
        <div class="line2">${ad.sub}</div>
      </div>
      <div class="site">zenith-studio.site</div>
    </div>
  </div>
</body></html>`;
}

const SERVICE_ADS = [
  {
    id: "law-firm-ai-team",
    accent: "#8a2432",
    eyebrow: "LAW FIRM AI TEAM",
    headline: "Your firm works 49 hours a week and bills",
    headlineAccent: "37.",
    sub: "One AI team closes the other 12 hours.",
    pills: [
      { i: "phone", t: "Intake" },
      { i: "bot", t: "Follow-Up" },
      { i: "receipt", t: "Billing" },
    ],
    ctaKeyword: "LAW",
  },
];

const COURSE_ADS = [
  {
    id: "ai-engineering",
    accent: "#c6592e",
    badgeIcon: "spark",
    eyebrow: "AI ENGINEERING · 8-WEEK PROGRAM",
    headline: "Become an AI engineer with a ",
    headlineAccent: "shipped product.",
    sub: "8 modules · ~10 hrs/week · 8 portfolio projects",
    ctaKeyword: "AI",
  },
];

for (const ad of SERVICE_ADS) {
  const out = path.join(OUT_DIR, `slide-${ad.id}.html`);
  writeFileSync(out, renderService(ad), "utf-8");
  console.log("wrote", out);
}
for (const ad of COURSE_ADS) {
  const out = path.join(OUT_DIR, `slide-${ad.id}.html`);
  writeFileSync(out, renderCourse(ad), "utf-8");
  console.log("wrote", out);
}
