// Same DcY4uiyE2sO DNA (cream bg, corner blobs, black headline + accent
// dots, icon-tile card) but filled in per feedback: the card read as too
// empty and everything too small. This pass adds real decoration instead of
// just more padding — a floating rotated tag badge, a hand-drawn curved
// arrow with a note, sparkle marks, a header strip + numbered badges inside
// the card, and a small comic-style callout bubble — and pushes every font
// size up a step.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("insta/exact-recreations");
mkdirSync(OUT_DIR, { recursive: true });

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;700;800&family=Caveat:wght@600;700&display=swap">`;
const RESET = `<style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{width:1080px;height:1350px;overflow:hidden}</style>`;

function icon(pathD, w = 26) { return `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${pathD}</svg>`; }
const ICONS = {
  spark: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19"/><circle cx="12" cy="12" r="3"/>',
  map: '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z"/><path d="M9 4v13"/><path d="M15 6.5v13"/>',
  bot: '<rect x="5" y="9" width="14" height="10" rx="2"/><circle cx="9" cy="14" r="1.3"/><circle cx="15" cy="14" r="1.3"/><path d="M12 9V5M8 5h8"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3Z"/>',
  phone: '<path d="M6.5 3h4l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v4a2 2 0 0 1-2 2C11.5 19.5 4.5 12.5 4.5 5a2 2 0 0 1 2-2Z"/>',
  receipt: '<path d="M6 2h12v20l-2-1.3L14 22l-2-1.3L10 22l-2-1.3L6 22V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
};
function sparkle(size, color) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="M12 1c.6 4.2 2 6.8 6 8-4 1.2-5.4 3.8-6 8-.6-4.2-2-6.8-6-8 4-1.2 5.4-3.8 6-8Z"/></svg>`;
}

function render(ad) {
  const items = ad.items.map((it, i) => `
    <div class="col" style="--rot:${i % 2 === 0 ? "-2deg" : "2deg"}">
      <div class="tile" style="--bg:${it.bg}"><span class="num">${i + 1}</span>${icon(ICONS[it.icon], 30)}</div>
      <div class="dot"></div>
      <div class="lbl">${it.t}</div>
      <div class="cap">${it.d}</div>
    </div>`).join("");
  const carousel = Array.from({ length: 7 }).map((_, i) => `<span class="cdot${i === 0 ? " on" : ""}"></span>`).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>gradient</title>${FONTS}${RESET}<style>
  body{ font-family:'IBM Plex Sans',sans-serif; color:#141018; }
  .canvas{ position:relative; width:1080px; height:1350px; overflow:hidden; background:#f8f6fa; }
  .blob{ position:absolute; border-radius:50%; filter:blur(60px); }
  .blob.b1{ width:560px; height:560px; left:-180px; bottom:-140px; background:${ad.blob1}; }
  .blob.b2{ width:420px; height:420px; right:-120px; top:-90px; background:${ad.blob2}; }
  .spark{ position:absolute; }
  .frame{ position:relative; z-index:1; height:100%; padding:76px 66px 40px; display:flex; flex-direction:column; }

  .tagbadge{ position:absolute; top:70px; right:64px; transform:rotate(7deg); background:#fff; border:2px dashed ${ad.accent}; color:${ad.accent}; font-weight:800; font-size:15px; letter-spacing:.04em; padding:9px 16px; border-radius:999px; box-shadow:0 10px 20px -10px rgba(0,0,0,.25); }

  .eyebrow{ font-size:26px; font-weight:400; color:#3a3450; }
  .h{ font-weight:800; font-size:88px; line-height:1.04; letter-spacing:-.02em; color:#141018; }
  .dotsrow{ display:flex; align-items:center; gap:11px; margin:10px 0 4px; }
  .dotsrow .d{ width:11px; height:11px; border-radius:50%; background:${ad.accent}; }
  .h2{ font-weight:800; font-size:68px; letter-spacing:-.015em; color:#141018; }
  .subline{ margin-top:26px; font-size:28px; color:#3a3450; }
  .subline b{ color:${ad.accent}; font-weight:800; }

  .arrowwrap{ position:relative; height:70px; margin-top:6px; }
  .arrownote{ position:absolute; left:8px; top:0; font-family:'Caveat'; font-weight:700; font-size:30px; color:${ad.accent}; transform:rotate(-3deg); }
  .arrowsvg{ position:absolute; left:150px; top:6px; }

  .card{ position:relative; margin-top:10px; background:#fff; border-radius:28px; padding:0 0 30px; box-shadow:0 26px 55px -26px rgba(58,52,80,.4); overflow:visible; }
  .cardhead{ background:${ad.accent}; color:#fff; border-radius:28px 28px 0 0; padding:16px 26px; font-weight:800; font-size:16px; letter-spacing:.08em; }
  .row{ display:flex; justify-content:space-between; gap:12px; padding:30px 24px 6px; }
  .col{ flex:1; display:flex; flex-direction:column; align-items:center; text-align:center; transform:rotate(var(--rot)); }
  .tile{ position:relative; width:88px; height:88px; border-radius:20px; background:var(--bg); color:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 14px 22px -10px rgba(0,0,0,.3); }
  .num{ position:absolute; top:-8px; left:-8px; width:24px; height:24px; border-radius:50%; background:#fff; color:#141018; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 8px rgba(0,0,0,.2); }
  .dot{ width:6px; height:6px; border-radius:50%; background:${ad.accent}; margin-top:16px; }
  .lbl{ margin-top:8px; font-weight:800; font-size:19px; }
  .cap{ margin-top:5px; font-size:13.5px; color:#8a8296; line-height:1.4; max-width:150px; }

  .bubble{ position:absolute; right:-18px; bottom:-26px; background:#141018; color:#fff; font-family:'Caveat'; font-weight:700; font-size:24px; padding:12px 20px; border-radius:20px 20px 20px 4px; transform:rotate(4deg); box-shadow:0 14px 26px -12px rgba(0,0,0,.4); }

  .carousel{ margin-top:auto; padding-top:34px; display:flex; justify-content:center; gap:8px; }
  .cdot{ width:7px; height:7px; border-radius:50%; background:#d8d3e0; }
  .cdot.on{ background:${ad.accent}; width:20px; border-radius:4px; }
  </style></head><body><div class="canvas">
    <div class="blob b1"></div><div class="blob b2"></div>
    <div class="spark" style="left:60px;top:210px">${sparkle(34, ad.accent)}</div>
    <div class="spark" style="right:90px;top:340px;opacity:.6">${sparkle(20, ad.accent)}</div>
    <div class="spark" style="left:40px;bottom:180px;opacity:.5">${sparkle(24, ad.accent)}</div>
    <div class="tagbadge">${ad.tag}</div>
    <div class="frame">
      <div class="eyebrow">If you're</div>
      <div class="h">${ad.line1}</div>
      <div class="h">${ad.line2}</div>
      <div class="dotsrow"><span class="d"></span><span class="d"></span><span class="d"></span><span class="h2" style="margin-left:8px">${ad.line3}</span></div>
      <div class="subline">${ad.sub1} <b>${ad.subAccent}</b> ${ad.sub2}</div>
      <div class="arrowwrap">
        <div class="arrownote">${ad.arrowNote}</div>
        <svg class="arrowsvg" width="140" height="60" viewBox="0 0 140 60" fill="none"><path d="M5 5c40 0 60 10 90 35" stroke="${ad.accent}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 10"/><path d="M85 32l14 10-2-17" stroke="${ad.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
      </div>
      <div class="card">
        <div class="cardhead">${ad.cardLabel}</div>
        <div class="row">${items}</div>
        <div class="bubble">${ad.bubble}</div>
      </div>
      <div class="carousel">${carousel}</div>
    </div>
  </div></body></html>`;
}

writeFileSync(path.join(OUT_DIR, "slide-ai-engineering-gradient.html"), render({
  accent: "#6d4fd6",
  blob1: "rgba(180,150,255,.4)",
  blob2: "rgba(255,180,210,.35)",
  tag: "8-WEEK PROGRAM",
  line1: "highly",
  line2: "motivated",
  line3: "but stuck",
  sub1: "get this",
  subAccent: "AI engineer roadmap",
  sub2: "ASAP",
  arrowNote: "steal this ↴",
  cardLabel: "THE 4-MODULE STACK",
  bubble: "start here!",
  items: [
    { bg: "#18140f", icon: "spark", t: "Prompting", d: "Structured outputs" },
    { bg: "#6d4fd6", icon: "map", t: "RAG", d: "Finds the truth" },
    { bg: "#c6592e", icon: "bot", t: "Agents", d: "Ship on their own" },
    { bg: "#2f6f5e", icon: "shield", t: "Evals", d: "Reliability built in" },
  ],
}), "utf-8");

writeFileSync(path.join(OUT_DIR, "slide-law-firm-gradient.html"), render({
  accent: "#8a2432",
  blob1: "rgba(200,140,160,.4)",
  blob2: "rgba(180,160,255,.3)",
  tag: "24/7 AI TEAM",
  line1: "highly",
  line2: "billable",
  line3: "but slow",
  sub1: "get this",
  subAccent: "AI intake team",
  sub2: "today",
  arrowNote: "the fix ↴",
  cardLabel: "THE 3-ROLE TEAM",
  bubble: "no hires!",
  items: [
    { bg: "#8a2432", icon: "phone", t: "Intake", d: "Answers every call" },
    { bg: "#3d3733", icon: "bot", t: "Follow-Up", d: "Works cold leads" },
    { bg: "#8a2432", icon: "receipt", t: "Billing", d: "Recovers lost time" },
  ],
}), "utf-8");

console.log("wrote 2 gradient-style slides");
