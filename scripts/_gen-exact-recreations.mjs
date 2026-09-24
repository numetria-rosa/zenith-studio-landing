// Faithful recreations of two specific reference posts (not loose
// approximations) — both use real UI-mockup components as the illustration,
// which is what actually fills a canvas instead of leaving empty space:
//   - "postcards": growthwithhardik's DcQk9QjjY98 — three overlapping fake
//     Instagram-post-card mockups (colored header, caption, icon row).
//   - "applist": jackroberts___'s DcjLCJ0G72h — gradient bg, radar badge
//     mascot, hand-drawn arrow annotation pointing at a real app-list UI card.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("insta/exact-recreations");
mkdirSync(OUT_DIR, { recursive: true });

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=IBM+Plex+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap">`;
const RESET = `<style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{width:1080px;height:1350px;overflow:hidden}</style>`;

function heart() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.2 2.3 4.5 6 4.5c2 0 3.5 1 4 2.3.5-1.3 2-2.3 4-2.3 3.7 0 5.6 3.7 4 7.2C19.5 16.4 12 21 12 21Z"/></svg>`; }
function comment() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.5 8.5 0 0 1-8.9 8.49 9 9 0 0 1-3.8-.83L3 20l1.2-4.6A8.5 8.5 0 1 1 21 11.5Z"/></svg>`; }
function bookmark() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>`; }
function icon(pathD, w = 24) { return `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${pathD}</svg>`; }
const ICON_SPARK = '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19"/><circle cx="12" cy="12" r="3"/>';
const ICON_MAP = '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z"/><path d="M9 4v13"/><path d="M15 6.5v13"/>';
const ICON_BOT = '<rect x="5" y="9" width="14" height="10" rx="2"/><circle cx="9" cy="14" r="1.3"/><circle cx="15" cy="14" r="1.3"/><path d="M12 9V5M8 5h8"/>';
const ICON_PHONE = '<path d="M6.5 3h4l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v4a2 2 0 0 1-2 2C11.5 19.5 4.5 12.5 4.5 5a2 2 0 0 1 2-2Z"/>';
const ICON_RECEIPT = '<path d="M6 2h12v20l-2-1.3L14 22l-2-1.3L10 22l-2-1.3L6 22V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/>';
const ICON_GAVEL = '<path d="M13 5l6 6M6 12l6 6M3 21l7-7M9 5l6 6-3 3-6-6z"/>';

// ---------- postcards: growthwithhardik style ----------
function postcards(ad) {
  const cards = ad.cards.map((c, i) => `
    <div class="card c${i}" style="--bg:${c.bg};--fg:${c.fg}">
      <div class="chead"><span class="cicon">${icon(c.icon, 20)}</span><span class="cdots">•••</span></div>
      <div class="ctext">${c.text}</div>
      <div class="csub">${c.sub}</div>
      <div class="crow"><span class="cicon2">${heart()}</span><span class="cicon2">${comment()}</span><span class="cicon2 push">${bookmark()}</span></div>
    </div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>postcards</title>${FONTS}${RESET}<style>
  body{ background:#fff; color:#0d0d0d; font-family:'IBM Plex Sans',sans-serif; }
  .canvas{ position:relative; width:1080px; height:1350px; padding:64px 60px; display:flex; flex-direction:column; }
  h1{ font-family:'IBM Plex Sans'; font-weight:800; font-size:44px; line-height:1.15; text-align:center; letter-spacing:-.01em; }
  h1 .big{ display:block; font-size:76px; color:${ad.accent}; font-weight:800; }
  .stack{ position:relative; flex:1; margin-top:56px; }
  .card{ position:absolute; width:340px; background:var(--bg); color:var(--fg); border-radius:20px; padding:22px 24px 18px; box-shadow:0 26px 40px -18px rgba(0,0,0,.35); }
  .chead{ display:flex; justify-content:space-between; align-items:center; opacity:.85; }
  .cicon{ width:34px; height:34px; background:rgba(255,255,255,.18); border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .cdots{ font-weight:700; letter-spacing:1px; }
  .ctext{ margin-top:22px; font-family:'Fraunces'; font-weight:800; font-size:30px; line-height:1.12; }
  .csub{ margin-top:10px; font-size:14px; opacity:.75; line-height:1.4; }
  .crow{ margin-top:20px; display:flex; gap:16px; align-items:center; opacity:.9; }
  .push{ margin-left:auto; }
  .c0{ left:10px; top:60px; transform:rotate(-7deg); z-index:1; }
  .c1{ right:0px; top:0px; transform:rotate(5deg); z-index:2; }
  .c2{ left:80px; bottom:20px; transform:rotate(-3deg); z-index:3; }
  .footer{ margin-top:auto; padding-top:24px; border-top:2.5px solid #0d0d0d; display:flex; justify-content:space-between; align-items:center; font-family:'IBM Plex Mono'; font-size:15px; font-weight:600; }
  .footer b{ background:${ad.accent}; color:#fff; padding:2px 10px; border-radius:5px; }
  </style></head><body><div class="canvas">
    <h1>${ad.headlineTop}<span class="big">${ad.headlineBig}</span></h1>
    <div class="stack">${cards}</div>
    <div class="footer"><span>Comment "<b>${ad.ctaKeyword}</b>" and I'll send you the syllabus</span><span>zenith-studio.site</span></div>
  </div></body></html>`;
}

// ---------- applist: jackroberts___ style ----------
function applist(ad) {
  const rows = ad.rows.map((r) => `
    <div class="row"><span class="ricon" style="--bg:${r.bg}">${icon(r.icon, 24)}</span>
      <div class="rtext"><div class="rt">${r.t}</div><div class="rd">${r.d}</div></div></div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>applist</title>${FONTS}${RESET}<style>
  body{ font-family:'IBM Plex Sans',sans-serif; color:#141110; }
  .canvas{ position:relative; width:1080px; height:1350px; padding:64px 60px; display:flex; flex-direction:column;
    background:linear-gradient(135deg,#ffffff 0%,#ffffff 55%,${ad.accent}22 100%); }
  .eyebrow{ font-family:'IBM Plex Mono'; font-size:15px; font-weight:700; letter-spacing:.14em; color:${ad.accent}; }
  h1{ font-family:'Fraunces'; font-weight:800; font-size:60px; line-height:1.06; margin-top:14px; max-width:640px; letter-spacing:-.015em; }
  .badgewrap{ position:absolute; right:60px; top:50px; width:230px; height:230px; }
  .ring{ position:absolute; inset:0; border:2.5px dashed ${ad.accent}; border-radius:50%; opacity:.5; }
  .ring2{ position:absolute; inset:26px; border:1.5px solid ${ad.accent}; border-radius:50%; opacity:.35; }
  .core{ position:absolute; inset:60px; background:${ad.accent}; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; box-shadow:0 20px 30px -14px rgba(0,0,0,.35); }
  .annot{ margin-top:18px; font-family:'Fraunces'; font-style:italic; font-size:19px; color:#5a5346; transform:rotate(-2deg); }
  .listcard{ margin-top:36px; background:#141110; border-radius:22px; padding:8px 26px; box-shadow:0 30px 50px -22px rgba(20,17,16,.5); }
  .row{ display:flex; align-items:center; gap:18px; padding:20px 0; border-bottom:1px solid rgba(255,255,255,.1); }
  .row:last-child{ border-bottom:none; }
  .ricon{ width:52px; height:52px; flex-shrink:0; background:var(--bg); border-radius:14px; display:flex; align-items:center; justify-content:center; color:#fff; }
  .rt{ font-weight:700; font-size:20px; color:#fff; }
  .rd{ margin-top:2px; font-size:14px; color:#9a938c; }
  .footer{ margin-top:auto; padding-top:24px; border-top:2px solid #141110; display:flex; justify-content:space-between; align-items:center; font-family:'IBM Plex Mono'; font-size:15px; font-weight:600; }
  .footer b{ background:${ad.accent}; color:#fff; padding:2px 10px; border-radius:5px; }
  </style></head><body><div class="canvas">
    <div class="eyebrow">${ad.eyebrow}</div>
    <h1>${ad.headline}</h1>
    <div class="badgewrap"><div class="ring"></div><div class="ring2"></div><div class="core">${icon(ad.badgeIcon, 70)}</div></div>
    <div class="annot">${ad.annotation}</div>
    <div class="listcard">${rows}</div>
    <div class="footer"><span>Comment "<b>${ad.ctaKeyword}</b>" and I'll send you the breakdown</span><span>zenith-studio.site</span></div>
  </div></body></html>`;
}

writeFileSync(path.join(OUT_DIR, "slide-ai-engineering-postcards.html"), postcards({
  accent: "#c6592e",
  headlineTop: "TUTORIALS VS",
  headlineBig: "SHIPPED PRODUCT",
  ctaKeyword: "AI",
  cards: [
    { bg: "#18140f", fg: "#f2ece0", icon: ICON_SPARK, text: "Prompting that\nactually works.", sub: "Structured outputs, not vibes.", },
    { bg: "#f2ece0", fg: "#18140f", icon: ICON_MAP, text: "RAG that\nfinds the truth.", sub: "Retrieval, done right.", },
    { bg: "#c6592e", fg: "#fff", icon: ICON_BOT, text: "Agents that\nship on their own.", sub: "Reliability + evals included.", },
  ],
}), "utf-8");

writeFileSync(path.join(OUT_DIR, "slide-law-firm-applist.html"), applist({
  accent: "#8a2432",
  eyebrow: "THE AI TEAM",
  headline: "Build your Law Firm OS",
  badgeIcon: ICON_GAVEL,
  annotation: "runs 24/7, no hires",
  ctaKeyword: "LAW",
  rows: [
    { bg: "#8a2432", icon: ICON_PHONE, t: "Intake Coordinator", d: "Answers and qualifies every enquiry" },
    { bg: "#3d3733", icon: ICON_BOT, t: "Follow-Up Clerk", d: "Works the leads that didn't retain" },
    { bg: "#8a2432", icon: ICON_RECEIPT, t: "Billing Clerk", d: "Reconstructs time before write-down" },
  ],
}), "utf-8");

console.log("wrote 2 exact-recreation slides");
