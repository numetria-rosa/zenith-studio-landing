// Same course (AI Engineering), rendered in every distinct design style
// catalogued in insta/research/competitor-analysis.md section 7 — one HTML
// per style, so they can be compared side by side rather than committing to
// a single look.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("insta/style-gallery");
mkdirSync(OUT_DIR, { recursive: true });

const C = {
  eyebrow: "AI ENGINEERING · 8-WEEK PROGRAM",
  title: "AI Engineering",
  headline: "Become an AI engineer with a",
  headlineAccent: "shipped product.",
  sub: "8 modules · ~10 hrs/week · 8 portfolio projects",
  ctaKeyword: "AI",
  accent: "#c6592e",
};

const ICON_SPARK = '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19"/><circle cx="12" cy="12" r="3"/>';
const ICON_BOOK = '<path d="M4 5.5C4 4.67 4.67 4 5.5 4H13v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5C20 4.67 19.33 4 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"/>';
const ICON_MAP = '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z"/><path d="M9 4v13"/><path d="M15 6.5v13"/>';
const ICON_PATH = '<path d="M4 18a4 4 0 0 0 5.4-5.4L14 8l3 3 2-2"/><circle cx="19" cy="7" r="2"/><circle cx="6" cy="18" r="2"/>';
function svg(d, w = 24) {
  return `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
}

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,900&family=IBM+Plex+Mono:wght@500;600;700&family=IBM+Plex+Sans:wght@400;600;700;800&display=swap">`;
const RESET = `<style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{width:1080px;height:1350px;overflow:hidden}</style>`;

// ---------- badge: artem.novitckii illustrated circular badge poster ----------
function badge() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>badge</title>${FONTS}${RESET}<style>
  body{ background:#f2ece0; color:#18140f; font-family:'IBM Plex Mono',monospace; }
  .canvas{ position:relative; width:1080px; height:1350px; padding:50px; }
  .crop{ position:absolute; width:24px; height:24px; opacity:.6; }
  .crop::before,.crop::after{ content:""; position:absolute; background:#18140f; }
  .crop::before{ width:100%; height:2px; top:50%; } .crop::after{ width:2px; height:100%; left:50%; }
  .crop.tl{ top:26px; left:26px; } .crop.tr{ top:26px; right:26px; }
  .crop.bl{ bottom:26px; left:26px; } .crop.br{ bottom:26px; right:26px; }
  .frame{ height:100%; display:flex; flex-direction:column; align-items:center; text-align:center; padding:20px 30px; }
  .eyebrow{ font-size:15px; font-weight:700; letter-spacing:.14em; color:#6b6255; }
  h1{ font-family:'Fraunces'; font-optical-sizing:none; font-variation-settings:"opsz" 144; font-weight:700; font-size:58px; line-height:1.06; letter-spacing:-.015em; margin-top:18px; }
  .accentbox{ display:block; margin:6px auto 0; background:${C.accent}; color:#f2ece0; padding:2px 18px; border-radius:8px; }
  .badgewrap{ position:relative; width:520px; height:520px; margin:38px auto 0; }
  .ring{ position:absolute; inset:0; border:3px dashed ${C.accent}; border-radius:50%; opacity:.55; }
  .ring2{ position:absolute; inset:50px; border:2px solid ${C.accent}; border-radius:50%; opacity:.35; }
  .core{ position:absolute; inset:110px; background:#18140f; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 30px 50px -20px rgba(24,20,15,.45); }
  .coreicon{ color:${C.accent}; }
  .ray{ position:absolute; width:3px; height:46px; background:${C.accent}; border-radius:2px; left:50%; top:-30px; transform-origin:50% 285px; }
  .ctabox{ margin-top:auto; border:2.5px solid #18140f; border-radius:16px; padding:20px 30px; max-width:640px; }
  .ctabox .line1{ font-family:'Fraunces'; font-weight:700; font-size:24px; }
  .ctabox .line1 b{ background:${C.accent}; color:#f2ece0; padding:1px 10px; border-radius:5px; }
  .ctabox .line2{ margin-top:6px; font-size:14px; color:#6b6255; }
  .site{ margin-top:16px; font-size:13px; color:#6b6255; letter-spacing:.06em; }
  </style></head><body><div class="canvas">
    <span class="crop tl"></span><span class="crop tr"></span><span class="crop bl"></span><span class="crop br"></span>
    <div class="frame">
      <div class="eyebrow">${C.eyebrow}</div>
      <h1>${C.headline}<span class="accentbox">${C.headlineAccent}</span></h1>
      <div class="badgewrap">
        <div class="ring"></div><div class="ring2"></div>
        ${Array.from({ length: 12 }).map((_, i) => `<div class="ray" style="transform:rotate(${i * 30}deg)"></div>`).join("")}
        <div class="core"><span class="coreicon">${svg(ICON_SPARK, 150)}</span></div>
      </div>
      <div class="ctabox"><div class="line1">Comment "<b>${C.ctaKeyword}</b>" and I'll send you the syllabus.</div><div class="line2">${C.sub}</div></div>
      <div class="site">zenith-studio.site</div>
    </div>
  </div></body></html>`;
}

// ---------- photo: sociyell cinematic full-bleed + bold stacked overlay ----------
function photo() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>photo</title>${FONTS}${RESET}<style>
  body{ color:#fff; font-family:'IBM Plex Sans',sans-serif; }
  .canvas{ position:relative; width:1080px; height:1350px; overflow:hidden;
    background:
      radial-gradient(ellipse 90% 60% at 30% 0%, #3a2a1c 0%, transparent 55%),
      radial-gradient(ellipse 100% 70% at 80% 100%, #1a2f2a 0%, transparent 60%),
      linear-gradient(160deg, #12100e, #221c17 55%, #17201c);
  }
  .topbar{ position:absolute; top:36px; left:44px; right:44px; display:flex; justify-content:space-between; font-family:'IBM Plex Mono'; font-size:13px; letter-spacing:.1em; opacity:.85; }
  .stack{ position:absolute; left:50px; right:50px; bottom:120px; }
  .eyebrow{ font-family:'IBM Plex Mono'; font-size:15px; font-weight:600; letter-spacing:.14em; color:${C.accent}; }
  h1{ font-family:'Fraunces'; font-weight:800; font-size:76px; line-height:1.0; letter-spacing:-.02em; margin-top:14px; }
  h1 em{ font-style:italic; font-weight:600; color:${C.accent}; }
  .sub{ margin-top:20px; font-size:20px; max-width:820px; opacity:.85; font-weight:500; }
  .cta{ position:absolute; left:50px; right:50px; bottom:50px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,.25); padding-top:18px; font-family:'IBM Plex Mono'; font-size:15px; }
  .cta b{ background:${C.accent}; color:#12100e; padding:2px 10px; border-radius:5px; }
  </style></head><body><div class="canvas">
    <div class="topbar"><span>ZENITH LAB</span><span>AI ENGINEERING</span></div>
    <div class="stack">
      <div class="eyebrow">${C.eyebrow}</div>
      <h1>Become an <em>AI engineer</em><br>with a shipped product.</h1>
      <div class="sub">${C.sub}</div>
    </div>
    <div class="cta"><span>Comment "<b>${C.ctaKeyword}</b>" for the syllabus</span><span>zenith-studio.site</span></div>
  </div></body></html>`;
}

// ---------- editorial: lior minimalist cream terminal ----------
function editorial() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>editorial</title>${FONTS}${RESET}<style>
  body{ background:#f4f1ea; color:#141414; font-family:'IBM Plex Mono',monospace; }
  .canvas{ width:1080px; height:1350px; padding:80px 76px; display:flex; flex-direction:column; }
  .byline{ font-size:15px; font-weight:600; letter-spacing:.06em; color:#555; }
  .icon{ margin-top:56px; color:${C.accent}; }
  h1{ font-size:56px; font-weight:700; line-height:1.18; letter-spacing:-.01em; margin-top:28px; max-width:880px; }
  .underline{ margin-top:20px; width:120px; height:4px; background:${C.accent}; }
  .sub{ margin-top:26px; font-size:19px; color:#555; max-width:700px; line-height:1.5; }
  .cta{ margin-top:auto; font-size:20px; font-weight:600; }
  .cta b{ color:${C.accent}; }
  .site{ margin-top:14px; font-size:13px; color:#888; }
  </style></head><body><div class="canvas">
    <div class="byline">ZENITH LAB</div>
    <div class="icon">${svg(ICON_PATH, 40)}</div>
    <h1>${C.headline} ${C.headlineAccent}</h1>
    <div class="underline"></div>
    <div class="sub">${C.sub}. The clearest way into AI engineering right now. Steal the seat.</div>
    <div class="cta">Comment "<b>${C.ctaKeyword}</b>" and I'll send you the syllabus.</div>
    <div class="site">zenith-studio.site</div>
  </div></body></html>`;
}

// ---------- pipeline: seb.ai capsule row on a shelf ----------
function pipeline() {
  const items = [
    { icon: ICON_BOOK, label: "Syllabus" },
    { icon: ICON_MAP, label: "Roadmap" },
    { icon: ICON_PATH, label: "Career Path" },
  ];
  const capsules = items.map((p) => `
    <div class="capsule"><span class="cicon">${svg(p.icon, 56)}</span><div class="clabel">${p.label}</div></div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>pipeline</title>${FONTS}${RESET}<style>
  body{ background:#f2ece0; color:#18140f; font-family:'IBM Plex Mono',monospace; }
  .canvas{ position:relative; width:1080px; height:1350px; padding:52px 56px; display:flex; flex-direction:column; }
  .metarow{ display:flex; justify-content:space-between; }
  .metacol{ font-size:13px; font-weight:700; letter-spacing:.08em; line-height:1.9; color:#443d33; }
  .metacol.r{ text-align:right; }
  h1{ font-family:'Fraunces'; font-optical-sizing:none; font-variation-settings:"opsz" 144; font-weight:700; font-size:52px; line-height:1.08; letter-spacing:-.015em; margin-top:26px; max-width:820px; }
  h1 .accent{ color:${C.accent}; }
  .statline{ margin-top:16px; display:flex; align-items:center; gap:10px; font-size:16px; font-weight:600; color:#332e26; }
  .dot{ width:9px; height:9px; border-radius:50%; background:${C.accent}; }
  .stage{ position:relative; flex:1; margin-top:42px; display:flex; align-items:flex-end; justify-content:center; gap:26px; padding-bottom:70px; }
  .stage::after{ content:""; position:absolute; left:20px; right:20px; bottom:56px; height:14px; background:#e4dbc9; border-radius:8px; box-shadow:0 18px 30px -12px rgba(24,20,15,.35); }
  .capsule{ position:relative; z-index:1; width:220px; height:300px; background:#fbf8f1; border:2px solid #18140f; border-radius:26px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; box-shadow:0 22px 26px -14px rgba(24,20,15,.3); }
  .cicon{ color:${C.accent}; }
  .clabel{ font-family:'Fraunces'; font-weight:700; font-size:22px; letter-spacing:-.01em; }
  .footer{ margin-top:auto; padding-top:22px; border-top:2px solid #18140f; display:flex; justify-content:space-between; align-items:flex-end; }
  .footcol{ font-size:14px; font-weight:700; letter-spacing:.04em; max-width:380px; line-height:1.5; }
  .footcol.r{ text-align:right; }
  .cta{ font-family:'Fraunces'; font-weight:700; font-size:23px; margin-top:4px; }
  .cta b{ background:${C.accent}; color:#f2ece0; padding:1px 10px; border-radius:5px; }
  </style></head><body><div class="canvas">
    <div class="metarow"><div class="metacol">LEARN<br>BUILD<br>SHIP</div><div class="metacol r">8 WEEKS<br>8 MODULES<br>8 PROJECTS</div></div>
    <h1>${C.headline} <span class="accent">${C.headlineAccent}</span></h1>
    <div class="statline"><span class="dot"></span>${C.sub}</div>
    <div class="stage">${capsules}</div>
    <div class="footer"><div class="footcol">REAL SKILLS.<br>REAL PORTFOLIO.</div><div class="footcol r"><div class="cta">Comment "<b>${C.ctaKeyword}</b>" for the syllabus.</div></div></div>
  </div></body></html>`;
}

// ---------- roadmap: the.natasha.ai dotted waypoint path ----------
function roadmap() {
  const steps = 8;
  const dots = Array.from({ length: steps }).map((_, i) => {
    const x = 60 + (i * (860 / (steps - 1)));
    return `<circle cx="${x}" cy="60" r="${i === 0 ? 10 : 7}" fill="${i === 0 ? C.accent : "#fff"}" stroke="${C.accent}" stroke-width="3"/>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>roadmap</title>${FONTS}${RESET}<style>
  body{ background:#f5efe3; color:#18140f; font-family:'IBM Plex Sans',sans-serif; }
  .canvas{ width:1080px; height:1350px; padding:70px 64px; display:flex; flex-direction:column; }
  .pill{ align-self:flex-start; border:1.5px solid ${C.accent}; color:${C.accent}; font-family:'IBM Plex Mono'; font-size:14px; font-weight:700; letter-spacing:.08em; padding:8px 18px; border-radius:999px; }
  h1{ font-family:'Fraunces'; font-weight:700; font-size:64px; line-height:1.08; margin-top:26px; max-width:820px; letter-spacing:-.015em; }
  h1 .accent{ color:${C.accent}; }
  .roadwrap{ margin-top:70px; }
  .steplabel{ margin-top:14px; font-family:'IBM Plex Mono'; font-size:15px; color:#6b6255; }
  .cards{ margin-top:48px; display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
  .card{ background:#fff; border:1.5px solid rgba(24,20,15,.14); border-radius:16px; padding:18px 20px; }
  .card b{ font-family:'Fraunces'; font-size:18px; }
  .card div{ margin-top:4px; font-size:13px; color:#6b6255; }
  .footer{ margin-top:auto; padding-top:22px; border-top:2px solid #18140f; display:flex; justify-content:space-between; align-items:center; font-family:'IBM Plex Mono'; font-size:15px; }
  .footer b{ background:${C.accent}; color:#fff; padding:2px 10px; border-radius:5px; }
  </style></head><body><div class="canvas">
    <div class="pill">${C.eyebrow}</div>
    <h1>${C.headline} <span class="accent">${C.headlineAccent}</span></h1>
    <div class="roadwrap">
      <svg width="980" height="80" viewBox="0 0 980 80"><line x1="60" y1="60" x2="920" y2="60" stroke="${C.accent}" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>${dots}
      <path d="M940 40 v40 M940 40 h28 l-10 10 l10 10 h-28" fill="none" stroke="${C.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="steplabel">${steps} steps · from zero to shipped product</div>
    </div>
    <div class="cards">
      <div class="card"><b>Modules</b><div>8, self-contained</div></div>
      <div class="card"><b>Pace</b><div>~10 hrs/week</div></div>
      <div class="card"><b>Projects</b><div>8 portfolio pieces</div></div>
      <div class="card"><b>Capstone</b><div>A production AI agent</div></div>
    </div>
    <div class="footer"><span>Comment "<b>${C.ctaKeyword}</b>" for the syllabus</span><span>zenith-studio.site</span></div>
  </div></body></html>`;
}

// ---------- tutorial: aiwithanushka SaaS tip-card style ----------
function tutorial() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>tutorial</title>${FONTS}${RESET}<style>
  body{ background:#f5efe3; color:#18140f; font-family:'IBM Plex Sans',sans-serif; }
  .canvas{ width:1080px; height:1350px; padding:70px 64px; display:flex; flex-direction:column; position:relative; }
  .eyebrow{ font-family:'IBM Plex Mono'; font-size:15px; font-weight:700; letter-spacing:.14em; color:${C.accent}; }
  h1{ font-family:'IBM Plex Sans'; font-weight:800; font-size:52px; line-height:1.12; letter-spacing:-.01em; margin-top:16px; max-width:800px; }
  h1 .accent{ color:${C.accent}; }
  .underline{ margin-top:18px; width:110px; height:4px; background:${C.accent}; }
  .sub{ margin-top:22px; font-size:19px; color:#5a5346; max-width:680px; }
  .mock{ margin-top:40px; background:#fff; border:1.5px solid rgba(24,20,15,.14); border-radius:14px; padding:26px 28px; box-shadow:0 20px 40px -20px rgba(24,20,15,.25); }
  .mockhead{ font-family:'IBM Plex Mono'; font-size:13px; color:#8a8272; }
  .mockrow{ display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid rgba(24,20,15,.08); font-size:16px; }
  .mockrow:last-child{ border-bottom:none; }
  .mockrow b{ color:${C.accent}; font-family:'IBM Plex Mono'; font-size:15px; }
  .swipe{ margin-top:auto; align-self:flex-start; background:${C.accent}; color:#fff; font-weight:700; font-size:18px; padding:14px 28px; border-radius:10px; }
  .site{ position:absolute; right:64px; bottom:36px; font-size:13px; color:#8a8272; }
  </style></head><body><div class="canvas">
    <div class="eyebrow">${C.eyebrow}</div>
    <h1>${C.headline} <span class="accent">${C.headlineAccent}</span></h1>
    <div class="underline"></div>
    <div class="sub">${C.sub}</div>
    <div class="mock">
      <div class="mockhead">WHAT'S INSIDE</div>
      <div class="mockrow">Prompting & structured outputs<b>Module 1</b></div>
      <div class="mockrow">Retrieval-augmented generation<b>Module 3</b></div>
      <div class="mockrow">Agent architectures<b>Module 5</b></div>
      <div class="mockrow">Capstone: a production AI agent<b>Module 8</b></div>
    </div>
    <div class="swipe">Comment "${C.ctaKeyword}" &rarr;</div>
    <div class="site">zenith-studio.site</div>
  </div></body></html>`;
}

// ---------- callout: theblackfemaleengineer maroon color-block ----------
function callout() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>callout</title>${FONTS}${RESET}<style>
  body{ background:#f1ede4; color:#1c1712; font-family:'IBM Plex Sans',sans-serif; }
  .canvas{ width:1080px; height:1350px; padding:74px 64px; display:flex; flex-direction:column; }
  .block{ display:inline-flex; align-self:flex-start; background:#5c1a24; color:#f6ece2; font-family:'Fraunces'; font-weight:700; font-size:34px; padding:14px 26px; border-radius:4px; }
  h1{ font-family:'Fraunces'; font-weight:700; font-size:58px; line-height:1.12; margin-top:22px; letter-spacing:-.015em; max-width:820px; }
  .bubble{ margin-top:40px; align-self:flex-start; background:#fff; border-radius:22px 22px 22px 4px; padding:20px 26px; font-size:18px; max-width:640px; box-shadow:0 12px 30px -14px rgba(28,23,18,.25); }
  .list{ margin-top:38px; display:flex; flex-direction:column; gap:14px; }
  .litem{ display:flex; gap:14px; align-items:baseline; font-size:19px; }
  .litem b{ font-family:'Fraunces'; color:#5c1a24; font-size:22px; }
  .cta{ margin-top:auto; padding-top:24px; border-top:2px solid #1c1712; display:flex; justify-content:space-between; align-items:center; font-size:16px; font-weight:600; }
  .cta b{ background:#5c1a24; color:#f6ece2; padding:2px 10px; border-radius:5px; }
  </style></head><body><div class="canvas">
    <div class="block">${C.title}</div>
    <h1>${C.headline} ${C.headlineAccent}</h1>
    <div class="bubble">"I don't have a coding background. I have a syllabus."</div>
    <div class="list">
      <div class="litem"><b>1.</b> Prompting &amp; structured outputs</div>
      <div class="litem"><b>2.</b> Retrieval-augmented generation</div>
      <div class="litem"><b>3.</b> Agent architectures &amp; reliability</div>
      <div class="litem"><b>4.</b> Capstone: a production AI agent</div>
    </div>
    <div class="cta"><span>Comment "<b>${C.ctaKeyword}</b>" and I'll send you the syllabus</span><span>zenith-studio.site</span></div>
  </div></body></html>`;
}

// ---------- bignum: lifeofarjav dark huge-numeral hook ----------
function bignum() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>bignum</title>${FONTS}${RESET}<style>
  body{ background:#141210; color:#fff; font-family:'IBM Plex Sans',sans-serif; }
  .canvas{ width:1080px; height:1350px; padding:64px; display:flex; flex-direction:column; }
  .top{ font-family:'IBM Plex Mono'; font-size:14px; letter-spacing:.12em; color:#a9a196; border-bottom:1px solid rgba(255,255,255,.15); padding-bottom:16px; }
  .num{ font-family:'Fraunces'; font-weight:900; font-size:220px; line-height:1; color:${C.accent}; margin-top:20px; }
  h1{ font-family:'IBM Plex Sans'; font-weight:800; font-size:56px; line-height:1.14; margin-top:8px; max-width:920px; }
  .sub{ margin-top:26px; font-size:19px; color:#c9c2b6; max-width:760px; }
  .cta{ margin-top:auto; padding-top:22px; border-top:1px solid rgba(255,255,255,.15); display:flex; justify-content:space-between; align-items:center; font-family:'IBM Plex Mono'; font-size:15px; }
  .cta b{ background:${C.accent}; color:#141210; padding:2px 10px; border-radius:5px; }
  </style></head><body><div class="canvas">
    <div class="top">ZENITH LAB · ${C.eyebrow}</div>
    <div class="num">8</div>
    <h1>weeks to become an AI engineer with a shipped product.</h1>
    <div class="sub">${C.sub}</div>
    <div class="cta"><span>Comment "<b>${C.ctaKeyword}</b>" and I'll send you the syllabus</span><span>zenith-studio.site</span></div>
  </div></body></html>`;
}

const STYLES = { badge, photo, editorial, pipeline, roadmap, tutorial, callout, bignum };
for (const [key, fn] of Object.entries(STYLES)) {
  const out = path.join(OUT_DIR, `slide-ai-engineering-${key}.html`);
  writeFileSync(out, fn(), "utf-8");
  console.log("wrote", out);
}
