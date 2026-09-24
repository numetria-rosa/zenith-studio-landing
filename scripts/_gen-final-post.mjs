// Exact recreation of lior's DcJcw48kYEU carousel structure — black bg,
// brand header, huge monospace headline, underlined accent parenthetical,
// numbered content rows, CTA slide. Content is centered vertically between
// the pinned brand header and carousel dots.
//
// AI Engineering slide content is pulled from the real course data in
// scripts/_gen-insta-course-ads.mjs (same accent color #c6f432, same stage/
// module names, same stats) — not invented facts. Stages are grouped two at
// a time per content slide, and there's a dedicated career-path slide
// (portfolio + real projects + guidance) before the CTA.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("insta/final");
mkdirSync(OUT_DIR, { recursive: true });

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500&display=swap">`;
const RESET = `<style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{width:1080px;height:1350px;overflow:hidden}</style>`;
const BASE_CSS = (accent) => `
  body{ background:#0c0c0c; color:#f2f2f0; font-family:'IBM Plex Mono',monospace; }
  .canvas{ position:relative; width:1080px; height:1350px; padding:64px 72px; display:flex; flex-direction:column; }
  .brand{ position:absolute; top:64px; left:72px; display:flex; align-items:center; }
  .wm{ font-family:'Fraunces'; font-weight:700; font-size:24px; letter-spacing:-.01em; color:#f2f2f0; }
  .wm b{ font-style:normal; padding:3px 11px; margin-left:6px; border-radius:6px; font-size:16px; }
  .middle{ flex:1; display:flex; flex-direction:column; justify-content:center; }
  .carousel{ position:absolute; left:72px; bottom:40px; display:flex; gap:9px; }
  .cdot{ width:8px; height:8px; border-radius:50%; background:#3a3a38; }
  .cdot.on{ background:${accent}; }
`;

// Real course/site wordmark: "ZENITH" (Fraunces) + "LAB" in a pill badge
// using that course's own accent color (see scripts/_gen-insta-course-ads.mjs
// .logo/.logo b) — not a generic mark, the actual brand treatment.
function wordmark(accent, accentDark) {
  return `<span class="wm">ZENITH<b style="background:${accent};color:${accentDark}">LAB</b></span>`;
}

function dots(activeIdx, total) {
  return Array.from({ length: total }).map((_, i) => `<span class="cdot${i === activeIdx ? " on" : ""}"></span>`).join("");
}

// Absolute file:// URL so the puppeteer export (which loads via file://) can
// resolve the image regardless of where the HTML file itself sits.
function fileUrl(relPath) {
  return "file:///" + path.resolve(relPath).replace(/\\/g, "/");
}

// Real official logos (public/logos/, sourced directly from python.org,
// Google's branding CDN, and Wikimedia Commons) for Python, Google Sheets,
// Power BI, Tableau. Excel and SQL have no single official/downloadable
// mark that resolved cleanly (SQL is a language, not a branded product), so
// those two are clean custom glyphs in their real brand colors instead of a
// scraped clipart-site logo.
const TOOL_LOGOS = [
  { name: "python", type: "img", src: fileUrl("public/logos/python.png") },
  { name: "sheets", type: "img", src: fileUrl("public/logos/google-sheets.png") },
  { name: "powerbi", type: "img", src: fileUrl("public/logos/power-bi.svg") },
  { name: "tableau", type: "img", src: fileUrl("public/logos/tableau.png") },
  // No background rect on these two — the white tile itself is now the
  // card, so the glyph sits directly on it like the real logo images do.
  { name: "excel", type: "svg", svg: `<svg viewBox="0 0 48 48"><path d="M13 13l8 11-8 11h5l5.5-7.7L29 35h5l-8-11 8-11h-5l-5.5 7.7L18 13z" fill="#217346"/></svg>` },
  { name: "sql", type: "svg", svg: `<svg viewBox="0 0 48 48"><ellipse cx="24" cy="11" rx="16" ry="6" fill="#336791"/><path d="M8 11v13c0 3.3 7.2 6 16 6s16-2.7 16-6V11" fill="none" stroke="#336791" stroke-width="3"/><path d="M8 24v13c0 3.3 7.2 6 16 6s16-2.7 16-6V24" fill="none" stroke="#336791" stroke-width="3"/></svg>` },
];

function toolLogoRow() {
  const items = TOOL_LOGOS.map((l) =>
    l.type === "img" ? `<div class="tlogo"><img src="${l.src}" alt="${l.name}"></div>` : `<div class="tlogo">${l.svg}</div>`
  ).join("");
  return `<div class="tlogorow">${items}</div>`;
}

function cover(ad, idx, total) {
  const lines = ad.headline.map((l) => `<div class="hline">${l}</div>`).join("");
  // subParen can be a single string or an array of lines — each line gets
  // its own underline (block-level, not one inline span wrapping mid-word).
  const subLines = Array.isArray(ad.subParen) ? ad.subParen : [ad.subParen];
  const subHtml = subLines.map((l) => `<div class="sub-line">${l}</div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>cover</title>${FONTS}${RESET}<style>${BASE_CSS(ad.accent)}
  .headline{ font-weight:700; font-size:76px; line-height:1.12; letter-spacing:-.01em; }
  .sub{ margin-top:8px; }
  .sub-line{ display:block; font-weight:700; font-size:76px; line-height:1.12; letter-spacing:-.01em; color:${ad.accent}; border-bottom:4px solid ${ad.accent}; padding-bottom:5px; width:max-content; }
  .desc{ margin-top:38px; font-size:26px; color:#a8a59c; max-width:720px; line-height:1.5; font-family:'IBM Plex Sans'; }
  .prompt{ margin-top:24px; font-size:30px; color:#f2f2f0; letter-spacing:.06em; }
  .tlogorow{ margin-top:44px; display:flex; align-items:center; justify-content:center; gap:24px; flex-wrap:wrap; }
  .tlogo{ width:112px; height:112px; border-radius:24px; background:#fff; display:flex; align-items:center; justify-content:center; padding:26px; box-shadow:0 20px 40px -12px rgba(0,0,0,.5), 0 4px 10px -4px rgba(0,0,0,.3); }
  .tlogo img, .tlogo svg{ width:100%; height:100%; object-fit:contain; }
  </style></head><body><div class="canvas">
    <div class="brand">${wordmark(ad.accent, ad.accentDark)}</div>
    <div class="middle">
      <div class="headline">${lines}<div class="sub">${subHtml}</div></div>
      <div class="desc">${ad.desc}</div>
      ${ad.showToolLogos ? toolLogoRow() : `<div class="prompt">&gt;&gt;&gt;</div>`}
    </div>
    <div class="carousel">${dots(idx, total)}</div>
  </div></body></html>`;
}

function stageSlide(ad, idx, total, stageLabel, modules) {
  // modules: [{ title, week, minutes }] or a gate item { title, badgeText,
  // detail }. Week/minutes are real course data (_gen-insta-course-ads.mjs
  // topics array); quiz/challenge/capstone details are from the actual
  // course files (courses/ai-engineering/quiz-data.js, challenges.html).
  const items = modules.map((m, i) => {
    const badge = m.badgeText ? m.badgeText : `WK<br>${m.week}`;
    const detail = m.detail
      ? m.detail
      : m.week === 8
        ? `${m.minutes} min &middot; build-graded capstone, not a quiz`
        : `${m.minutes} min core module &middot; 8-question quiz pool`;
    return `
    ${i > 0 ? '<div class="divider"></div>' : ""}
    <div class="item">
      <span class="badge">${badge}</span>
      <div class="itext">
        <div class="ititle">${m.title}</div>
        <div class="idesc">${detail}</div>
      </div>
    </div>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>stages</title>${FONTS}${RESET}<style>${BASE_CSS(ad.accent)}
  .stagelbl{ font-weight:700; font-size:22px; color:${ad.accent}; letter-spacing:.05em; margin-bottom:36px; }
  .list{ display:flex; flex-direction:column; }
  .item{ display:flex; align-items:flex-start; gap:28px; padding:24px 0; }
  .badge{ flex-shrink:0; width:64px; height:64px; background:#f2f2f0; color:#0c0c0c; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-weight:700; font-size:15px; line-height:1.2; text-align:center; }
  .ititle{ font-weight:700; font-size:32px; line-height:1.22; }
  .idesc{ margin-top:8px; font-size:18px; color:#a8a59c; font-family:'IBM Plex Sans'; }
  .divider{ height:1px; background:rgba(255,255,255,.12); }
  </style></head><body><div class="canvas">
    <div class="brand">${wordmark(ad.accent, ad.accentDark)}</div>
    <div class="middle">
      <div class="stagelbl">${stageLabel}</div>
      <div class="list">${items}</div>
    </div>
    <div class="carousel">${dots(idx, total)}</div>
  </div></body></html>`;
}

function statsSlide(ad, idx, total, { label, headline, desc, stats, cols }) {
  const statHtml = stats.map((s) => `<div class="stat"><div class="snum">${s.n}</div><div class="slbl">${s.l}</div></div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>stats</title>${FONTS}${RESET}<style>${BASE_CSS(ad.accent)}
  .stagelbl{ font-weight:700; font-size:22px; color:${ad.accent}; letter-spacing:.05em; margin-bottom:20px; }
  .headline{ font-weight:700; font-size:52px; line-height:1.16; max-width:820px; }
  .desc{ margin-top:22px; font-size:24px; color:#a8a59c; max-width:720px; line-height:1.5; font-family:'IBM Plex Sans'; }
  .stats{ margin-top:48px; display:grid; grid-template-columns:repeat(${cols || 2},1fr); gap:26px 36px; }
  .snum{ font-weight:700; font-size:${cols === 4 ? 36 : 44}px; color:${ad.accent}; }
  .slbl{ margin-top:6px; font-size:17px; color:#a8a59c; font-family:'IBM Plex Sans'; }
  </style></head><body><div class="canvas">
    <div class="brand">${wordmark(ad.accent, ad.accentDark)}</div>
    <div class="middle">
      <div class="stagelbl">${label}</div>
      <div class="headline">${headline}</div>
      <div class="desc">${desc}</div>
      <div class="stats">${statHtml}</div>
    </div>
    <div class="carousel">${dots(idx, total)}</div>
  </div></body></html>`;
}

// Real UI mockup of the course's own mastery-profile page (courses/data-
// science/mastery-profile.html: .skillcard/.tierpill/.scbar/.subskillrow) —
// tier pill, progress bar, and sub-skill pass counts, not an abstract stat.
function skillTrack(ad, idx, total, { headline, desc, cards }) {
  const cardsHtml = cards.map((c) => `
    <div class="skillcard">
      <div class="sctop">
        <span class="sctitle">${c.title}</span>
        <span class="tierpill">${c.tier}</span>
      </div>
      <div class="scbar"><div class="fill" style="width:${c.pct}%"></div></div>
      ${c.subskills.map((s) => `<div class="subskillrow"><span class="sslbl">${s.label}</span><span class="ssval">${s.val}</span></div>`).join("")}
    </div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>skilltrack</title>${FONTS}${RESET}<style>${BASE_CSS(ad.accent)}
  .stagelbl{ font-weight:700; font-size:22px; color:${ad.accent}; letter-spacing:.05em; margin-bottom:20px; }
  .headline{ font-weight:700; font-size:44px; line-height:1.2; max-width:820px; }
  .desc{ margin-top:16px; font-size:21px; color:#a8a59c; max-width:720px; line-height:1.5; font-family:'IBM Plex Sans'; }
  .cards{ margin-top:36px; display:flex; flex-direction:column; gap:20px; }
  .skillcard{ background:#161613; border:1px solid rgba(255,255,255,.1); border-radius:16px; padding:24px 26px; font-family:'IBM Plex Sans'; }
  .sctop{ display:flex; align-items:center; gap:14px; }
  .sctitle{ font-weight:700; font-size:22px; flex:1; }
  .tierpill{ font-family:'IBM Plex Mono'; font-size:13px; text-transform:uppercase; letter-spacing:.04em; padding:5px 14px; border-radius:99px; font-weight:700; background:${ad.accent}; color:${ad.accentDark}; }
  .scbar{ height:10px; background:#2a2a26; border-radius:99px; overflow:hidden; margin-top:16px; }
  .fill{ height:100%; background:${ad.accent}; }
  .subskillrow{ display:flex; align-items:center; gap:10px; font-size:16px; padding:8px 0 0; color:#a8a59c; }
  .sslbl{ flex:1; }
  .ssval{ font-family:'IBM Plex Mono'; color:#f2f2f0; flex-shrink:0; font-size:15px; }
  </style></head><body><div class="canvas">
    <div class="brand">${wordmark(ad.accent, ad.accentDark)}</div>
    <div class="middle">
      <div class="stagelbl">SKILL TRACKING</div>
      <div class="headline">${headline}</div>
      <div class="desc">${desc}</div>
      <div class="cards">${cardsHtml}</div>
    </div>
    <div class="carousel">${dots(idx, total)}</div>
  </div></body></html>`;
}

// Blur+lock project grid, styled after a third-party reference the user
// shared (not our own page — verified no match for this pattern anywhere in
// courses/) — recreated with our own real 10 projects from course-progress.js
// PROJECTS array: first N shown clearly, the rest blurred with a lock overlay.
function blurredProjects(ad, idx, total, { eyebrowHighlight, eyebrowRest, headline, projects, unlockedCount }) {
  const cards = projects.map((p, i) => {
    const locked = i >= unlockedCount;
    return `
    <div class="pcard${locked ? " locked" : ""}">
      <div class="pctitle">${p.title}</div>
      <div class="pctag">${p.tag}</div>
      ${locked ? `<div class="lockover"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><span>UNLOCK IN THE COURSE</span></div>` : ""}
    </div>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>projects</title>${FONTS}${RESET}<style>${BASE_CSS(ad.accent)}
  .eyebrowrow{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .ebhi{ background:${ad.accent}; color:${ad.accentDark}; font-weight:700; font-size:15px; letter-spacing:.1em; padding:5px 12px; border-radius:5px; font-family:'IBM Plex Mono'; }
  .ebrest{ font-family:'IBM Plex Mono'; font-size:15px; letter-spacing:.1em; color:#9a978f; }
  .headline{ margin-top:14px; font-family:'Fraunces'; font-weight:700; font-size:44px; }
  .grid{ margin-top:32px; display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .pcard{ position:relative; background:#161613; border:1px solid rgba(255,255,255,.1); border-radius:14px; padding:22px 20px; min-height:78px; }
  .pctitle{ font-family:'IBM Plex Sans'; font-weight:700; font-size:19px; }
  .pctag{ margin-top:6px; font-size:14px; color:#8a8680; font-family:'IBM Plex Sans'; }
  .pcard.locked .pctitle, .pcard.locked .pctag{ filter:blur(5px); opacity:.5; user-select:none; }
  .lockover{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:8px; color:${ad.accent}; font-family:'IBM Plex Mono'; font-weight:700; font-size:12.5px; letter-spacing:.04em; }
  </style></head><body><div class="canvas">
    <div class="brand">${wordmark(ad.accent, ad.accentDark)}</div>
    <div class="middle">
      <div class="eyebrowrow"><span class="ebhi">${eyebrowHighlight}</span><span class="ebrest">${eyebrowRest}</span></div>
      <div class="headline">${headline}</div>
      <div class="grid">${cards}</div>
    </div>
    <div class="carousel">${dots(idx, total)}</div>
  </div></body></html>`;
}

// "Inside the course" section/page breakdown, styled after the same
// third-party reference — recreated with our own real page count. Every
// group is an actual folder of real .html pages in courses/data-science/
// (counted directly, not estimated): 10 module pages, 11 practice/quiz/
// tracking pages, 4 project/lab pages, 7 portfolio/career/reference pages.
function insideCourse(ad, idx, total, { headline, sections }) {
  const items = sections.map((s) => `
    <div class="scard">
      <div class="sicon" style="color:${ad.accent}">${s.icon}</div>
      <div class="stext">
        <div class="stop"><span class="stitle">${s.title}</span><span class="scount">${s.count} pages</span></div>
        <div class="sdesc">${s.desc}</div>
      </div>
    </div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>inside</title>${FONTS}${RESET}<style>${BASE_CSS(ad.accent)}
  .stagelbl{ font-weight:700; font-size:22px; color:${ad.accent}; letter-spacing:.05em; }
  .headline{ margin-top:12px; font-family:'Fraunces'; font-weight:700; font-size:40px; }
  .slist{ margin-top:30px; display:flex; flex-direction:column; gap:14px; }
  .scard{ display:flex; align-items:center; gap:18px; background:#161613; border:1px solid rgba(255,255,255,.1); border-radius:14px; padding:18px 22px; }
  .sicon{ width:44px; height:44px; background:rgba(255,255,255,.06); border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .stop{ display:flex; align-items:baseline; gap:10px; }
  .stitle{ font-family:'IBM Plex Sans'; font-weight:700; font-size:20px; }
  .scount{ font-family:'IBM Plex Mono'; font-size:13px; color:#8a8680; }
  .sdesc{ margin-top:4px; font-size:14.5px; color:#a8a59c; font-family:'IBM Plex Sans'; }
  </style></head><body><div class="canvas">
    <div class="brand">${wordmark(ad.accent, ad.accentDark)}</div>
    <div class="middle">
      <div class="stagelbl">INSIDE THE COURSE</div>
      <div class="headline">${headline}</div>
      <div class="slist">${items}</div>
    </div>
    <div class="carousel">${dots(idx, total)}</div>
  </div></body></html>`;
}

// Real portfolio projects from courses/data-science/course-progress.js
// (PROJECTS array) — actual project titles, industries, and one-line briefs
// from the course, not invented examples.
function projectsSlide(ad, idx, total, { headline, desc, projects }) {
  const items = projects.map((p, i) => `
    ${i > 0 ? '<div class="divider"></div>' : ""}
    <div class="pitem">
      <div class="phead"><span class="ptitle">${p.title}</span><span class="ptag">${p.tag}</span></div>
      <div class="pbrief">${p.brief}</div>
    </div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>projects</title>${FONTS}${RESET}<style>${BASE_CSS(ad.accent)}
  .stagelbl{ font-weight:700; font-size:22px; color:${ad.accent}; letter-spacing:.05em; margin-bottom:20px; }
  .headline{ font-weight:700; font-size:44px; line-height:1.2; max-width:820px; }
  .desc{ margin-top:14px; font-size:20px; color:#a8a59c; max-width:720px; line-height:1.5; font-family:'IBM Plex Sans'; }
  .plist{ margin-top:34px; display:flex; flex-direction:column; }
  .pitem{ padding:22px 0; }
  .phead{ display:flex; align-items:baseline; gap:14px; flex-wrap:wrap; }
  .ptitle{ font-weight:700; font-size:26px; font-family:'IBM Plex Sans'; }
  .ptag{ font-family:'IBM Plex Mono'; font-size:13px; color:${ad.accent}; }
  .pbrief{ margin-top:8px; font-size:17px; color:#a8a59c; line-height:1.5; font-family:'IBM Plex Sans'; max-width:820px; }
  .divider{ height:1px; background:rgba(255,255,255,.12); }
  </style></head><body><div class="canvas">
    <div class="brand">${wordmark(ad.accent, ad.accentDark)}</div>
    <div class="middle">
      <div class="stagelbl">PORTFOLIO PROJECTS</div>
      <div class="headline">${headline}</div>
      <div class="desc">${desc}</div>
      <div class="plist">${items}</div>
    </div>
    <div class="carousel">${dots(idx, total)}</div>
  </div></body></html>`;
}

function cta(ad, idx, total) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>cta</title>${FONTS}${RESET}<style>${BASE_CSS(ad.accent)}
  .headline{ font-weight:700; font-size:64px; letter-spacing:-.01em; }
  .headline .kw{ color:${ad.accent}; border-bottom:4px solid ${ad.accent}; padding-bottom:3px; }
  .desc{ margin-top:16px; font-size:26px; color:#a8a59c; font-family:'IBM Plex Sans'; }
  .divider{ margin-top:44px; height:1px; background:rgba(255,255,255,.15); }
  .follow{ margin-top:28px; display:flex; align-items:center; gap:14px; font-weight:700; font-size:19px; letter-spacing:.03em; }
  .fmark{ width:11px; height:11px; background:#f2f2f0; }
  .handle{ position:absolute; right:72px; bottom:44px; font-size:17px; color:#9a978f; }
  </style></head><body><div class="canvas">
    <div class="brand">${wordmark(ad.accent, ad.accentDark)}</div>
    <div class="middle">
      <div class="headline">COMMENT <span class="kw">"${ad.ctaKeyword}"</span></div>
      <div class="desc">${ad.desc}</div>
      <div class="divider"></div>
      <div class="follow"><span class="fmark"></span>${ad.followText}</div>
    </div>
    <div class="handle">@${ad.handle}</div>
    <div class="carousel">${dots(idx, total)}</div>
  </div></body></html>`;
}

// ---------- AI Engineering — real course data (scripts/_gen-insta-course-ads.mjs) ----------
const AI_ENG = {
  accent: "#c6f432",
  accentDark: "#0f1405",
  headline: ["YOU CAN BECOME AN", "AI ENGINEER"],
  subParen: "(IN JUST 8 WEEKS)",
  desc: "One of the most in-demand jobs in tech, averaging $51-$70/hr, in two months.",
  // Week + minutes are real course data (scripts/_gen-insta-course-ads.mjs
  // AI Engineering `topics`, in module order) — one module per week, 8 total.
  stageGroups: [
    { label: "WEEKS 1-4 · FOUNDATIONS", modules: [
      { title: "Prompting & Structured Outputs", week: 1, minutes: 45 },
      { title: "Context Windows & Token Economics", week: 2, minutes: 40 },
      { title: "Retrieval-Augmented Generation", week: 3, minutes: 45 },
      { title: "Tool Use & Function Calling", week: 4, minutes: 45 },
    ] },
    { label: "WEEKS 5-8 · PRODUCTION", modules: [
      { title: "Agent Architectures & Control Flow", week: 5, minutes: 45 },
      { title: "Reliability for LLM Systems", week: 6, minutes: 40 },
      { title: "Evaluation, Testing & Observability", week: 7, minutes: 40 },
      { title: "Cross-Module Challenges", badgeText: "GATE", detail: "Pass both to unlock the capstone" },
      { title: "Capstone: A Production AI Agent", week: 8, minutes: 90 },
    ] },
  ],
  careerDesc: "8 portfolio projects, real cheat sheets for RAG/agents/evals, and a capstone: a production AI agent you actually ship, with guidance the whole way, not a self-study dump.",
  stats: [
    { n: "8", l: "Modules" },
    { n: "6.5h", l: "Core module time" },
    { n: "8", l: "Portfolio projects" },
    { n: "8wk", l: "~10 hrs/week" },
  ],
  ctaKeyword: "AI",
  followText: "FOLLOW FOR MORE AI ENGINEERING BREAKDOWNS",
  handle: "zenithlab",
};

const total1 = 5;
writeFileSync(path.join(OUT_DIR, "slide-ai-engineering-1-cover.html"), cover(AI_ENG, 0, total1), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-ai-engineering-2-stages01.html"), stageSlide(AI_ENG, 1, total1, AI_ENG.stageGroups[0].label, AI_ENG.stageGroups[0].modules), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-ai-engineering-3-stages23.html"), stageSlide(AI_ENG, 2, total1, AI_ENG.stageGroups[1].label, AI_ENG.stageGroups[1].modules), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-ai-engineering-4-career.html"), statsSlide(AI_ENG, 3, total1, {
  label: "CAREER PATH",
  headline: "A portfolio of real projects, not just a certificate.",
  desc: AI_ENG.careerDesc,
  stats: AI_ENG.stats,
  cols: 2,
}), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-ai-engineering-5-cta.html"), cta(AI_ENG, 4, total1), "utf-8");

// ---------- Data Science & Analysis — real course data ----------
// Stages/topics from scripts/_gen-insta-course-ads.mjs; per-module minutes
// and capstone project titles from courses/data-science/course-progress.js
// (MODULES / PROJECTS arrays) — real lesson lengths and real case-study
// names, not a quiz-pool count. Self-paced (not week-scheduled like AI
// Engineering), so modules are numbered M1-M9 instead of assigned fake weeks.
const DATA_SCI = {
  accent: "#f0b429",
  accentDark: "#1a1200",
  headline: ["YOU CAN BECOME A", "DATA ANALYST"],
  subParen: ["(IN 12 WEEKS,", "SELF-PACED)"],
  desc: "One of the most in-demand roles in tech, averaging $40-$47/hr.",
  stageGroups: [
    { label: "STAGE 0-2 · FOUNDATIONS", modules: [
      { title: "Spreadsheet & Data Literacy Foundations", badgeText: "M1", detail: "40 min core lesson" },
      { title: "Python Foundations for Data", badgeText: "M2", detail: "45 min core lesson" },
      { title: "Pandas & NumPy Fundamentals", badgeText: "M3", detail: "50 min core lesson" },
      { title: "Data Cleaning & Validation", badgeText: "M4", detail: "55 min core lesson" },
      { title: "Exploratory Data Analysis & Statistics", badgeText: "M5", detail: "50 min core lesson" },
    ] },
    { label: "STAGE 3-4 · QUERYING & CAPSTONE", modules: [
      { title: "SQL for Analysts", badgeText: "M6", detail: "45 min core lesson" },
      { title: "Data Visualization & Storytelling", badgeText: "M7", detail: "45 min core lesson" },
      { title: "Dashboards & Business Communication", badgeText: "M8", detail: "50 min core lesson" },
      { title: "Capstone: pick your case", badgeText: "M9", detail: '"The Leaky Funnel," "The Churn Cliff," "The Slow Season"' },
    ] },
  ],
  practiceDesc: "315+ graded practice tasks across 8 tools, plus real Tableau and Power BI desktop labs, not just video.",
  practiceStats: [
    { n: "60", l: "SQL" },
    { n: "50", l: "Python" },
    { n: "40", l: "Statistics" },
    { n: "40", l: "Tableau" },
    { n: "40", l: "Power BI" },
    { n: "35", l: "Excel" },
    { n: "30", l: "Automation" },
    { n: "20", l: "Integrated" },
  ],
  ctaKeyword: "DATA",
  followText: "FOLLOW FOR MORE DATA ANALYST BREAKDOWNS",
  handle: "zenithlab",
};

const total3 = 8;
writeFileSync(path.join(OUT_DIR, "slide-data-science-1-cover.html"), cover(DATA_SCI, 0, total3), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-data-science-2-stages02.html"), stageSlide(DATA_SCI, 1, total3, DATA_SCI.stageGroups[0].label, DATA_SCI.stageGroups[0].modules), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-data-science-3-stages34.html"), stageSlide(DATA_SCI, 2, total3, DATA_SCI.stageGroups[1].label, DATA_SCI.stageGroups[1].modules), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-data-science-4-practice.html"), statsSlide(DATA_SCI, 3, total3, {
  label: "GRADED PRACTICE, BY TOOL",
  headline: "315+ real tasks, graded. Not just watched.",
  desc: DATA_SCI.practiceDesc,
  stats: DATA_SCI.practiceStats,
  cols: 4,
}), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-data-science-5-skilltrack.html"), skillTrack(DATA_SCI, 4, total3, {
  headline: "See exactly where you stand, not a vague percent.",
  desc: "Every skill tracks a real tier, sub-skill pass rates, and simulation-based evidence.",
  cards: [
    { title: "SQL for Analysts", tier: "Proficient", pct: 72, subskills: [
      { label: "Joins & subqueries", val: "8/10 passed" },
      { label: "Window functions", val: "5/6 passed" },
    ] },
    { title: "Data Visualization & Storytelling", tier: "Developing", pct: 45, subskills: [
      { label: "Dashboard design", val: "3/6 passed" },
    ] },
  ],
}), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-data-science-6-projects.html"), blurredProjects(DATA_SCI, 5, total3, {
  eyebrowHighlight: "PORTFOLIO",
  eyebrowRest: "PROJECTS YOU'LL BUILD",
  headline: "10 real projects",
  unlockedCount: 3,
  // All 10 titles/industries are real, from course-progress.js PROJECTS.
  projects: [
    { title: '"The Leaky Funnel"', tag: "E-commerce & Retail" },
    { title: '"The Understaffed Quarter"', tag: "People & HR" },
    { title: '"The Campaign That Didn’t Work"', tag: "Marketing & Agency" },
    { title: '"The Slow Season"', tag: "Finance & Small Business" },
    { title: '"The Phantom Stock"', tag: "Retail" },
    { title: '"The Churn Cliff"', tag: "SaaS" },
    { title: '"The Overpriced Listing"', tag: "Real Estate" },
    { title: '"The Wait Time Problem"', tag: "Healthcare Operations" },
    { title: '"The Empty Rooms"', tag: "Travel & Hospitality" },
    { title: '"The Monthly Scorecard"', tag: "Executive & BI, multi-tool" },
  ],
}), "utf-8");
// Real page count, counted directly from courses/data-science/*.html (not
// estimated, not copied from any reference) — 32 pages across 4 groups.
writeFileSync(path.join(OUT_DIR, "slide-data-science-7-inside.html"), insideCourse(DATA_SCI, 6, total3, {
  headline: "4 sections, 32 real pages",
  sections: [
    { title: "Learn", count: 10, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5C4 4.67 4.67 4 5.5 4H13v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5C20 4.67 19.33 4 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"/></svg>', desc: "Every core module, spreadsheets through the capstone" },
    { title: "Practice", count: 11, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.7" fill="currentColor"/></svg>', desc: "8 tools, quiz center, and skill tracking" },
    { title: "Build", count: 4, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2z"/></svg>', desc: "The real projects, desktop labs, and deploy guide" },
    { title: "Evidence", count: 7, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M10 16h4v2h-4zM8 21h8l-1-3H9l-1 3Z"/></svg>', desc: "Portfolio, career path, and proof you can show" },
  ],
}), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-data-science-8-cta.html"), cta(DATA_SCI, 7, total3), "utf-8");

// ---------- Law Firm AI Team — real service data (src/lib/services.ts) ----------
const LAW_FIRM = {
  accent: "#8a2432",
  accentDark: "#f2ece0",
  headline: ["YOUR FIRM WORKS 49", "HOURS, BILLS 37"],
  subParen: "(HERE'S THE OTHER 12)",
  desc: "An AI Intake Coordinator, Follow-Up Clerk, and Billing Clerk as one team.",
  items: [
    { t: "AI INTAKE COORDINATOR", d: "Answers and qualifies every enquiry, day or night." },
    { t: "AI FOLLOW-UP CLERK", d: "Works the leads that didn't retain." },
    { t: "AI BILLING CLERK", d: "Reconstructs billable time before the write-down window closes." },
  ],
  ctaKeyword: "LAW",
  followText: "FOLLOW FOR MORE AI SYSTEMS FOR LAW FIRMS",
  handle: "zenithlab",
};

function lawContentSlide(ad, idx, total) {
  const items = ad.items.map((it, i) => `
    ${i > 0 ? '<div class="divider"></div>' : ""}
    <div class="item">
      <span class="badge">${String(i + 1).padStart(2, "0")}</span>
      <div class="itext">
        <div class="ititle">${it.t}</div>
        <div class="idesc">${it.d}</div>
      </div>
    </div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>content</title>${FONTS}${RESET}<style>${BASE_CSS(ad.accent)}
  .list{ display:flex; flex-direction:column; }
  .item{ display:flex; align-items:flex-start; gap:28px; padding:30px 0; }
  .badge{ flex-shrink:0; width:60px; height:60px; background:#f2f2f0; color:#0c0c0c; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:24px; }
  .ititle{ font-weight:700; font-size:32px; }
  .idesc{ margin-top:12px; font-size:22px; color:#a8a59c; line-height:1.5; font-family:'IBM Plex Sans'; max-width:760px; }
  .divider{ height:1px; background:rgba(255,255,255,.12); }
  </style></head><body><div class="canvas">
    <div class="brand">${wordmark(ad.accent, ad.accentDark)}</div>
    <div class="middle"><div class="list">${items}</div></div>
    <div class="carousel">${dots(idx, total)}</div>
  </div></body></html>`;
}

const total2 = 3;
writeFileSync(path.join(OUT_DIR, "slide-law-firm-1-cover.html"), cover(LAW_FIRM, 0, total2), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-law-firm-2-content.html"), lawContentSlide(LAW_FIRM, 1, total2), "utf-8");
writeFileSync(path.join(OUT_DIR, "slide-law-firm-3-cta.html"), cta(LAW_FIRM, 2, total2), "utf-8");

console.log("wrote 8 final carousel slides");
