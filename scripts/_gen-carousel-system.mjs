// Reusable, config-driven carousel/post design system — replaces the loose
// "headline + evenly-spaced floating cards" layout with a bounded, absolutely
// positioned content-cluster where cards overlap, vary in size, rotate, and
// sit close together (matching the density of growthwithhardik's DcQk9QjjY98,
// not a presentation-slide layout with cards scattered in corners).
//
// Class names and config shape follow the spec exactly:
//   .post-canvas .post-header .eyebrow .post-title .content-cluster
//   .social-card .social-card--primary/--secondary/--accent .post-footer
//   config: { eyebrow, title (array of lines), subtitle, accentColor, cards[] }
//
// Only "Template A" (large headline + tightly overlapping card cluster) is
// implemented — it's the one that actually matches the reference. Adding a
// Template B/C/D/E later means adding another renderClusterA-style function
// and pointing a config at it; no framework needed for that.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("insta/carousel-system");
mkdirSync(OUT_DIR, { recursive: true });

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=IBM+Plex+Sans:wght@500;700;800&display=swap">`;
const RESET = `<style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{width:1080px;height:1350px;overflow:hidden}</style>`;

function heart() { return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.2 2.3 4.5 6 4.5c2 0 3.5 1 4 2.3.5-1.3 2-2.3 4-2.3 3.7 0 5.6 3.7 4 7.2C19.5 16.4 12 21 12 21Z"/></svg>`; }
function comment() { return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.5 8.5 0 0 1-8.9 8.49 9 9 0 0 1-3.8-.83L3 20l1.2-4.6A8.5 8.5 0 1 1 21 11.5Z"/></svg>`; }
function share() { return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/></svg>`; }
function bookmark() { return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>`; }
function icon(pathD, w = 26) { return `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${pathD}</svg>`; }

function socialCard(c) {
  // c: { variant, x, y, w, h, rot, z, bg, fg, badgeIcon, headline, sub }
  return `
  <div class="social-card social-card--${c.variant}" style="
      left:${c.x}px; top:${c.y}px; width:${c.w}px; height:${c.h}px;
      transform:rotate(${c.rot}deg); z-index:${c.z}; background:${c.bg}; color:${c.fg};">
    <div class="sc-head">
      <span class="sc-badge">${icon(c.badgeIcon, 22)}</span>
      <span class="sc-dots">•••</span>
    </div>
    <div class="sc-headline">${c.headline}</div>
    <div class="sc-rule"></div>
    <div class="sc-sub">${c.sub}</div>
    <div class="sc-footer">
      <span class="sc-icons">${heart()}${comment()}${share()}</span>
      <span class="sc-bookmark">${bookmark()}</span>
    </div>
  </div>`;
}

function renderClusterA(cfg) {
  const cards = cfg.cards.map(socialCard).join("");
  const titleLines = cfg.title.map((l, i) =>
    `<div class="post-title-line${i === cfg.title.length - 1 ? " post-title-accent" : ""}">${l}</div>`
  ).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>${cfg.eyebrow}</title>${FONTS}${RESET}<style>
  :root{ --accent:${cfg.accentColor}; --bg:${cfg.bgColor || "#f5f3ee"}; --dark:${cfg.darkColor || "#171717"}; }
  body{ font-family:'IBM Plex Sans',sans-serif; color:var(--dark); }
  .post-canvas{ position:relative; width:1080px; height:1350px; background:var(--bg); overflow:hidden; }
  .post-header{ position:relative; z-index:5; padding:64px 64px 0; text-align:center; }
  .eyebrow{ font-family:'IBM Plex Sans'; font-weight:700; font-size:30px; letter-spacing:-.01em; color:var(--dark); }
  .post-title-line{ font-family:'IBM Plex Sans'; font-weight:800; font-size:98px; line-height:.98; letter-spacing:-.02em; text-transform:uppercase; color:var(--accent); }
  .content-cluster{ position:relative; width:100%; height:900px; margin-top:10px; }
  .social-card{ position:absolute; border-radius:26px; padding:26px 28px 20px; box-shadow:0 30px 44px -20px rgba(0,0,0,.4); display:flex; flex-direction:column; }
  .sc-head{ display:flex; justify-content:space-between; align-items:center; }
  .sc-badge{ width:44px; height:44px; border-radius:50%; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 14px -6px rgba(0,0,0,.4); }
  .sc-dots{ font-weight:800; letter-spacing:2px; opacity:.7; }
  .sc-headline{ margin-top:22px; font-family:'Fraunces'; font-weight:900; font-size:38px; line-height:1.08; flex:1; }
  .sc-rule{ width:70px; height:4px; background:var(--accent); border-radius:2px; margin-top:14px; }
  .sc-sub{ margin-top:12px; font-size:16px; line-height:1.4; opacity:.8; }
  .sc-footer{ margin-top:16px; display:flex; align-items:center; justify-content:space-between; opacity:.85; }
  .sc-icons{ display:flex; gap:14px; }
  .post-footer{ position:absolute; left:56px; right:56px; bottom:44px; z-index:5; padding-top:18px; border-top:2px solid var(--dark); display:flex; justify-content:space-between; align-items:center; font-size:16px; font-weight:700; }
  .post-footer b{ background:var(--accent); color:#fff; padding:2px 10px; border-radius:5px; }
  </style></head><body>
    <div class="post-canvas">
      <div class="post-header">
        <div class="eyebrow">${cfg.eyebrow}</div>
        ${titleLines}
      </div>
      <div class="content-cluster">${cards}</div>
      <div class="post-footer"><span>${cfg.ctaText}</span><span>zenith-studio.site</span></div>
    </div>
  </body></html>`;
}

const ICON_SPARK = '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19"/><circle cx="12" cy="12" r="3"/>';
const ICON_MAP = '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z"/><path d="M9 4v13"/><path d="M15 6.5v13"/>';
const ICON_BOT = '<rect x="5" y="9" width="14" height="10" rx="2"/><circle cx="9" cy="14" r="1.3"/><circle cx="15" cy="14" r="1.3"/><path d="M12 9V5M8 5h8"/>';
const ICON_PHONE = '<path d="M6.5 3h4l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v4a2 2 0 0 1-2 2C11.5 19.5 4.5 12.5 4.5 5a2 2 0 0 1 2-2Z"/>';
const ICON_RECEIPT = '<path d="M6 2h12v20l-2-1.3L14 22l-2-1.3L10 22l-2-1.3L6 22V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/>';

const AI_ENGINEERING = {
  eyebrow: "TUTORIALS VS",
  title: ["SHIPPED", "PRODUCT"],
  accentColor: "#c6592e",
  bgColor: "#f5f3ee",
  darkColor: "#171717",
  ctaText: 'Comment "AI" and I\'ll send you the syllabus',
  cards: [
    { variant: "primary", x: 40, y: 60, w: 400, h: 500, rot: -6, z: 2, bg: "#171717", fg: "#f5f3ee", badgeIcon: ICON_SPARK, headline: "Prompting that actually works.", sub: "Structured outputs, not vibes." },
    { variant: "secondary", x: 610, y: 20, w: 400, h: 480, rot: 5, z: 1, bg: "#f5f3ee", fg: "#171717", badgeIcon: ICON_MAP, headline: "RAG that finds the truth.", sub: "Retrieval, done right." },
    { variant: "accent", x: 320, y: 380, w: 400, h: 500, rot: -3, z: 3, bg: "#c6592e", fg: "#fff", badgeIcon: ICON_BOT, headline: "Agents that ship on their own.", sub: "Reliability + evals included." },
  ],
};

const LAW_FIRM = {
  eyebrow: "SLOW INTAKE VS",
  title: ["CLOSED", "CASES"],
  accentColor: "#8a2432",
  bgColor: "#f5f3ee",
  darkColor: "#171717",
  ctaText: 'Comment "LAW" and I\'ll send you the breakdown',
  cards: [
    { variant: "primary", x: 40, y: 60, w: 400, h: 500, rot: -6, z: 2, bg: "#171717", fg: "#f5f3ee", badgeIcon: ICON_PHONE, headline: "Answers every enquiry, day or night.", sub: "No missed intake, ever." },
    { variant: "secondary", x: 610, y: 20, w: 400, h: 480, rot: 5, z: 1, bg: "#f5f3ee", fg: "#171717", badgeIcon: ICON_BOT, headline: "Works the leads that didn't retain.", sub: "Nobody falls through." },
    { variant: "accent", x: 320, y: 380, w: 400, h: 500, rot: -3, z: 3, bg: "#8a2432", fg: "#fff", badgeIcon: ICON_RECEIPT, headline: "Recovers billable time.", sub: "Before the write-down window closes." },
  ],
};

writeFileSync(path.join(OUT_DIR, "slide-ai-engineering.html"), renderClusterA(AI_ENGINEERING), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-law-firm.html"), renderClusterA(LAW_FIRM), "utf-8");
console.log("wrote 2 carousel-system slides");
