// One-off generator: writes insta/course-ads/<courseId>.html for each Zenith
// Lab course. Canvas is 1080x1920 (IG Reels/Story ratio) rather than the
// 4:5 feed size — this version lists every stage/module and a per-topic
// task breakdown, which doesn't fit legibly in 4:5. Every fact quoted
// (module titles, stage groupings, task counts, minutes) is pulled from the
// real course-progress.js / practice-*.js / dashboard.html content for each
// course — nothing here is invented. Tool "logos" are original glyphs (not
// reproductions of any trademarked mark) so the ad doesn't imply an
// affiliation with Microsoft/Tableau/the PSF/etc. that doesn't exist.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const TARGETS = [
  { key: "916", outDir: path.resolve("insta/course-ads"), height: 1920, radius: 48 },
  { key: "45", outDir: path.resolve("insta/course-ads-4x5"), height: 1350, radius: 40 },
];
for (const t of TARGETS) mkdirSync(t.outDir, { recursive: true });

const ICONS = {
  book: '<path d="M4 5.5C4 4.67 4.67 4 5.5 4H13v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5C20 4.67 19.33 4 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"/>',
  map: '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z"/><path d="M9 4v13"/><path d="M15 6.5v13"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.7" fill="currentColor"/>',
  sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  desktop: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
  path: '<path d="M4 18a4 4 0 0 0 5.4-5.4L14 8l3 3 2-2"/><circle cx="19" cy="7" r="2"/><circle cx="6" cy="18" r="2"/>',
  bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>',
  // Tool glyphs — original shapes, not reproductions of any brand's mark.
  sql: '<path d="M4 6c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2Z"/><path d="M4 6v6c0 1.1 3.6 2 8 2s8-.9 8-2V6"/><path d="M4 12v6c0 1.1 3.6 2 8 2s8-.9 8-2v-6"/>',
  excel: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16"/>',
  python: '<path d="M12 3c-3 0-4 1-4 3v2h4v1H6c-2 0-3 1.4-3 4s1 4 3 4h2v-2.6c0-1.6 1-2.9 3-2.9h4c1.8 0 3-1.3 3-3V6c0-2-1-3-4-3h-2Z"/><path d="M12 21c3 0 4-1 4-3v-2h-4v-1h6c2 0 3-1.4 3-4s-1-4-3-4h-2v2.6c0 1.6-1 2.9-3 2.9H9c-1.8 0-3 1.3-3 3v2c0 2 1 3 4 3h2Z"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v7M22 20V13" transform="translate(-2,0)"/><path d="M3 20h18"/>',
  tableau: '<path d="M12 3v18M4 8h16M4 16h16M7 4v4M17 4v4M7 16v4M17 16v4"/>',
  powerbi: '<path d="M6 20V10M12 20V4M18 20v9"/><path d="M3 20h18"/>',
  automation: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
  integrated: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  html: '<path d="m8 4-4 8 4 8M16 4l4 8-4 8M13 3l-2 18"/>',
  css: '<path d="M4 3h16l-1.5 15L12 21l-6.5-3L4 3Z"/><path d="M7 7h10l-.4 4H8.7l.2 2.2L12 14l3-.9.2-2.1"/>',
  js: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 16.5c.3.5.9 1 1.7 1s1.3-.5 1.3-1.3V9.5"/><path d="M14 15c.3.5 1 1 1.8 1 1 0 1.7-.5 1.7-1.3 0-.9-.7-1.3-1.7-1.6-1-.3-1.8-.7-1.8-1.6 0-.8.7-1.3 1.6-1.3.8 0 1.4.4 1.7.9"/>',
  git: '<circle cx="6" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="17" cy="12" r="2.2"/><path d="M6 8.2V18M6 8.2c0 5 5 5.8 8.8 5.8"/>',
  testing: '<path d="M9 3h6M10 3v5.2L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 8.2V3"/><path d="M8 15h8"/>',
  specs: '<path d="M6 3h9l5 5v13H6V3Z"/><path d="M15 3v5h5"/><path d="M9 12h6M9 15.5h6M9 8.5h3"/>',
  review: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m19 19-3.8-3.8"/>',
  workflow: '<circle cx="5" cy="6" r="2.3"/><circle cx="19" cy="6" r="2.3"/><circle cx="12" cy="18" r="2.3"/><path d="M5 8.3v3.2a3 3 0 0 0 3 3h1M19 8.3v3.2a3 3 0 0 1-3 3h-1"/>',
  api: '<path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/><rect x="7" y="7" width="10" height="10" rx="2"/>',
  reliability: '<path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3Z"/><path d="M9 12.5l2 2 4-4.5"/>',
  spark: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19"/><circle cx="12" cy="12" r="3"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2z"/>',
  bot: '<rect x="5" y="9" width="14" height="10" rx="2"/><circle cx="9" cy="14" r="1.3"/><circle cx="15" cy="14" r="1.3"/><path d="M12 9V5M8 5h8"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3Z"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M10 16h4v2h-4zM8 21h8l-1-3H9l-1 3Z"/>',
};

export function svg(name, cls = "") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}

export const COURSES = [
  {
    id: "data-science",
    zoom916: 1.388,
    zoom45: 1.17,
    accent: "#f0b429",
    accentd: "#1a1200",
    price: "$30",
    originalPrice: "$120",
    discountPercent: 75,
    saleUntil: "UNTIL SEPT 7TH",
    tag: "DATA SCIENCE & ANALYSIS",
    eyebrow: "12-WEEK PROGRAM",
    title: "Data Science &amp; Analysis",
    desc: "Become a data analyst in 12 weeks, with real skills and a portfolio to prove it.",
    job: "data analyst",
    features: [
      { i: "book", t: "Syllabus", d: "Full outline & tracks" },
      { i: "map", t: "Roadmap", d: "The whole journey" },
      { i: "target", t: "Quiz Center", d: "Module & cumulative" },
      { i: "sheet", t: "Cheat Sheets", d: "Excel, SQL, Python" },
      { i: "desktop", t: "Desktop Labs", d: "Tableau & Power BI" },
      { i: "path", t: "Career Path", d: "Portfolio + 10 projects" },
    ],
    topicLabel: "GRADED PRACTICE, BY TOOL",
    topics: [
      { i: "sql", t: "SQL", n: 60 },
      { i: "python", t: "Python", n: 50 },
      { i: "stats", t: "Statistics", n: 40 },
      { i: "tableau", t: "Tableau", n: 40 },
      { i: "powerbi", t: "Power BI", n: 40 },
      { i: "excel", t: "Excel", n: 35 },
      { i: "automation", t: "Automation", n: 30 },
      { i: "integrated", t: "Integrated", n: 20 },
    ],
    stages: [
      { label: "Stage 0 · Spreadsheets before code", modules: ["Spreadsheet & Data Literacy Foundations"] },
      { label: "Stage 1 · Python foundations for data", modules: ["Python Foundations for Data", "Pandas & NumPy Fundamentals"] },
      { label: "Stage 2 · Real-world data skills", modules: ["Data Cleaning & Validation", "Exploratory Data Analysis & Statistics"] },
      { label: "Stage 3 · Querying and communicating", modules: ["SQL for Analysts", "Data Visualization & Storytelling", "Dashboards & Business Communication"] },
      { label: "Stage 4 · Capstone", modules: ["Capstone Analysis Project"] },
    ],
    stats: [
      { n: "9", l: "Modules" },
      { n: "315+", l: "Practice tasks" },
      { n: "10", l: "Portfolio projects" },
      { n: "12wk", l: "Self-paced" },
    ],
  },
  {
    id: "ai-engineering",
    zoom916: 1.42,
    zoom45: 1.15,
    accent: "#c6f432",
    accentd: "#0f1405",
    price: "$28.75",
    originalPrice: "$115",
    discountPercent: 75,
    saleUntil: "UNTIL SEPT 7TH",
    tag: "AI ENGINEERING",
    eyebrow: "8-WEEK ACCELERATED PROGRAM",
    title: "AI Engineering",
    desc: "Become an AI engineer in 8 weeks, with real skills and a shipped product to prove it.",
    job: "AI engineer",
    features: [
      { i: "book", t: "Syllabus", d: "Full outline & tracks" },
      { i: "map", t: "Roadmap", d: "The whole journey" },
      { i: "target", t: "Quiz Center", d: "Module & cumulative" },
      { i: "sheet", t: "Cheat Sheets", d: "RAG, agents, evals" },
      { i: "bolt", t: "Challenges", d: "Scenario practice" },
      { i: "path", t: "Career Path", d: "Portfolio + 8 projects" },
    ],
    topicLabel: "EVERY MODULE, TIMED",
    topics: [
      { i: "spark", t: "Prompting", n: 45, unit: "min" },
      { i: "book", t: "Context windows", n: 40, unit: "min" },
      { i: "map", t: "Retrieval (RAG)", n: 45, unit: "min" },
      { i: "wrench", t: "Tool use", n: 45, unit: "min" },
      { i: "bot", t: "Agents", n: 45, unit: "min" },
      { i: "shield", t: "Reliability", n: 40, unit: "min" },
      { i: "target", t: "Evaluation", n: 40, unit: "min" },
      { i: "trophy", t: "Capstone", n: 90, unit: "min" },
    ],
    stages: [
      { label: "Stage 0 · Prompting foundations", modules: ["Prompting & Structured Outputs", "Context Windows & Token Economics"] },
      { label: "Stage 1 · Retrieval and tools", modules: ["Retrieval-Augmented Generation", "Tool Use & Function Calling"] },
      { label: "Stage 2 · Agents in production", modules: ["Agent Architectures & Control Flow", "Reliability for LLM Systems", "Evaluation, Testing & Observability"] },
      { label: "Stage 3 · Capstone", modules: ["Capstone: A Production AI Agent"] },
    ],
    stats: [
      { n: "8", l: "Modules" },
      { n: "6.5h", l: "Core module time" },
      { n: "8", l: "Portfolio projects" },
      { n: "8wk", l: "~10 hrs/week" },
    ],
  },
  {
    id: "automation-engineering",
    zoom916: 1.45,
    zoom45: 1.182,
    accent: "#22d3ee",
    accentd: "#04272b",
    price: "$37.25",
    originalPrice: "$149",
    discountPercent: 75,
    saleUntil: "UNTIL SEPT 7TH",
    tag: "AI AUTOMATION",
    eyebrow: "SELF-PACED · NO CODE REQUIRED",
    title: "AI Automation",
    desc: "Become an AI automation specialist in 3-5 weeks, with a portfolio to prove it.",
    job: "AI automation specialist",
    features: [
      { i: "book", t: "Syllabus", d: "Honest scope" },
      { i: "map", t: "Roadmap", d: "The whole journey" },
      { i: "target", t: "Quiz Center", d: "Extra reps, shuffled" },
      { i: "sheet", t: "Cheat Sheets", d: "One page per skill" },
      { i: "bolt", t: "Practice", d: "80 graded scenarios" },
      { i: "path", t: "Career Path", d: "Portfolio + 8 client briefs" },
    ],
    topicLabel: "GRADED PRACTICE, BY TOPIC",
    topics: [
      { i: "workflow", t: "Workflow design", n: 20 },
      { i: "api", t: "APIs & webhooks", n: 20 },
      { i: "reliability", t: "Retries & idempotency", n: 20 },
      { i: "spark", t: "AI steps & guardrails", n: 20 },
    ],
    stages: [
      { label: "Stage 0 · Workflow foundations", modules: ["Your First Client Workflow", "Data That Moves"] },
      { label: "Stage 1 · Real integrations", modules: ["APIs, Webhooks & Auth", "When Things Fail"] },
      { label: "Stage 2 · Production discipline", modules: ["Do It Once", "AI as a Step, Not a Brain", "Agents That Can't Run Away"] },
      { label: "Stage 3 · Capstone", modules: ["Capstone: A Client-Ready Lead Pipeline"] },
    ],
    stats: [
      { n: "8", l: "Modules" },
      { n: "80", l: "Graded scenarios" },
      { n: "8", l: "Client briefs" },
      { n: "0", l: "Code required" },
    ],
  },
  {
    id: "ai-assisted-software-engineering",
    zoom916: 1.335,
    zoom45: 1.067,
    accent: "#60a5fa",
    accentd: "#0b1220",
    price: "$24.75",
    originalPrice: "$99",
    discountPercent: 75,
    saleUntil: "UNTIL SEPT 7TH",
    tag: "AI-ASSISTED SOFTWARE ENGINEERING",
    eyebrow: "14 REAL TICKETS · CURSOR + GITHUB",
    title: "AI-Assisted Software Engineering",
    desc: "Become a junior developer in 12 weeks, with real projects and a live product to prove it.",
    job: "junior developer",
    features: [
      { i: "book", t: "Syllabus", d: "Full outline & tracks" },
      { i: "map", t: "Roadmap", d: "The whole journey" },
      { i: "target", t: "Quiz Center", d: "Extra reps, not the course" },
      { i: "sheet", t: "Cheat Sheets", d: "One page per skill" },
      { i: "desktop", t: "Desktop Labs", d: "Cursor + GitHub" },
      { i: "path", t: "Career Path", d: "Portfolio + 8 projects" },
    ],
    topicLabel: "GRADED PRACTICE, BY SKILL",
    topics: [
      { i: "js", t: "JavaScript", n: 40 },
      { i: "python", t: "Python", n: 25 },
      { i: "html", t: "HTML", n: 20 },
      { i: "css", t: "CSS", n: 20 },
      { i: "testing", t: "Testing", n: 20 },
      { i: "git", t: "Git", n: 20 },
      { i: "specs", t: "Specs", n: 20 },
      { i: "review", t: "PR Review", n: 20 },
      { i: "integrated", t: "Integrated", n: 15 },
    ],
    stages: [
      { label: "Stage 0 · Welcome to AI-assisted dev", modules: ["Your first shipped change"] },
      { label: "Stage 1 · Think like an engineer", modules: ["Requirements: turning “make it better” into work"] },
      { label: "Stage 2 · Understand the web", modules: ["HTML: the structure under every page", "CSS: layout that survives a phone", "JavaScript: logic you can defend", "The DOM, events & data that arrives late"] },
      { label: "Stage 3 · AI as your pair programmer", modules: ["Prompt Engineering for Software Engineers", "AI as your pair programmer", "AI Code Detective"] },
      { label: "Stage 4 · Engineering discipline", modules: ["Testing and debugging under pressure", "Git, GitHub, and code review", "Refactoring, security, and maintenance"] },
      { label: "Stage 5 · Release and ship", modules: ["Python for scripts and small tools", "Release: ship the application"] },
    ],
    stats: [
      { n: "14", l: "Modules" },
      { n: "200", l: "Practice tasks" },
      { n: "8", l: "Portfolio briefs" },
      { n: "1", l: "Live product" },
    ],
  },
];

function render(c, target) {
  const featureCards = c.features.map((f) => `
    <div class="fcard">
      <span class="ficon">${svg(f.i)}</span>
      <span class="ftitle">${f.t}</span>
    </div>`).join("");

  // Cap the visible chips so each one can be sized legibly on a phone
  // screen; anything beyond that folds into a "+N more" chip rather than
  // shrinking every chip's text to fit them all.
  const MAX_TOPICS = 6;
  const shownTopics = c.topics.slice(0, MAX_TOPICS);
  const hiddenCount = c.topics.length - shownTopics.length;
  const topicChips = shownTopics.map((t) => `
    <div class="tchip">
      <span class="tichip">${svg(t.i)}</span>
      <span class="tname">${t.t}:</span>
      <span class="tnum">${t.unit === "min" ? `${t.n}<i>m</i>` : `${t.n} tasks`}</span>
    </div>`).join("") + (hiddenCount > 0 ? `<div class="tchip"><span class="tmore">+${hiddenCount} more</span></div>` : "");

  // Split stages into two columns, left-heavier when odd, to keep the full
  // module list (every stage, every module) compact and side by side
  // instead of one very tall single column.
  const left = [];
  const right = [];
  let li = 0, ri = 0;
  c.stages.forEach((s, idx) => {
    (idx % 2 === 0 ? left : right).push(s);
  });

  function stageCol(stages) {
    return stages.map((s) => `
      <div class="stagelbl">${s.label}</div>
      ${s.modules.map((m, i) => `
        <div class="mrow">
          <span class="mdot"></span>
          <span class="mtitle">${m}</span>
        </div>`).join("")}
    `).join("");
  }

  const statTiles = c.stats.map((s) => `
    <div class="stile">
      <div class="snum">${s.n}</div>
      <div class="slbl">${s.l}</div>
    </div>`).join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${c.tag}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Caveat:wght@600;700&display=swap">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#070b14; --card2:#141b2c; --bd:rgba(148,163,184,.16); --bd2:rgba(148,163,184,.26);
    --tx:#eef2ff; --mut:#9aa6c2; --mut2:#6b7690;
    --accent:${c.accent}; --accentd:${c.accentd};
    --good:#4ade95;
  }
  html,body{width:1080px;height:${target.height}px;overflow:hidden}
  /* body matches .canvas's own background so the four corners outside its
     border-radius are solid dark, not transparent — Instagram flattens PNG
     transparency onto white on upload, which showed as white corner
     triangles on the posted image instead of blending into anything. */
  body{ background:var(--bg); color:var(--tx); font-family:'IBM Plex Sans',sans-serif; }
  .canvas{
    position:relative; width:100%; height:100%; overflow:hidden;
    border-radius:${target.radius}px; background:var(--bg);
  }
  .canvas::before{
    content:""; position:absolute; inset:0; z-index:0; pointer-events:none;
    background:
      radial-gradient(ellipse 70% 34% at 10% -4%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 55%),
      radial-gradient(ellipse 55% 28% at 100% 6%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 50%),
      radial-gradient(ellipse 50% 30% at 80% 100%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 55%);
  }
  .frame{ position:relative; z-index:1; padding:52px 58px 36px; height:100%; display:flex; flex-direction:column; zoom:${target.key === "916" ? c.zoom916 : c.zoom45}; }

  .topbar{ display:flex; align-items:flex-start; justify-content:space-between; }
  .logo{ font-family:'Fraunces'; font-weight:700; font-size:21px; letter-spacing:-.01em; }
  .logo b{ background:var(--accent); color:var(--accentd); padding:3px 10px; margin-left:4px; border-radius:6px; font-size:14px; }
  .topright{ display:flex; flex-direction:column; align-items:flex-end; gap:9px; }
  .tag{ font-family:'IBM Plex Mono'; font-size:13.5px; font-weight:600; color:var(--mut2); text-transform:uppercase; letter-spacing:.08em; max-width:360px; text-align:right; }
  .pricerow{ display:flex; align-items:center; gap:8px; }
  .offpill{ background:var(--accentd); border:1.5px solid var(--accent); color:var(--accent); font-family:'IBM Plex Mono'; font-weight:800; font-size:14px; letter-spacing:.03em; padding:5px 10px; border-radius:8px; }
  .pricebox{ background:var(--accent); color:var(--accentd); border-radius:12px; padding:9px 16px 8px; display:flex; align-items:baseline; gap:9px; }
  .pb-old{ font-family:'IBM Plex Mono'; font-size:15px; font-weight:600; text-decoration:line-through; opacity:.6; }
  .pb-new{ font-family:'Fraunces'; font-weight:700; font-size:23px; letter-spacing:-.01em; }
  .priceuntil{ font-family:'IBM Plex Mono'; font-size:15px; font-weight:800; letter-spacing:.06em; color:var(--accent); background:color-mix(in srgb, var(--accent) 16%, transparent); border:1.5px solid var(--accent); padding:6px 14px; border-radius:8px; }

  .hero{ margin-top:30px; }
  .eyebrow{ font-family:'IBM Plex Mono'; font-size:15px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); }
  h1{ font-family:'Fraunces'; font-optical-sizing:none; font-variation-settings:"opsz" 144; font-weight:600;
      font-size:52px; line-height:1.06; letter-spacing:-.02em; margin-top:12px; max-width:920px; }
  .desc{ margin-top:14px; max-width:880px; font-size:19px; line-height:1.5; color:var(--mut); }

  .sectlbl{ font-family:'IBM Plex Mono'; font-size:14px; font-weight:700; letter-spacing:.1em; color:var(--mut2); text-transform:uppercase; }

  .fgrid{ margin-top:26px; display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .fcard{
    background:var(--card2); border:1px solid var(--bd); border-radius:15px; padding:16px;
    display:flex; align-items:center; gap:10px;
  }
  .ficon{ width:22px; height:22px; color:var(--accent); flex-shrink:0; }
  .ficon svg{ width:100%; height:100%; }
  .ftitle{ font-weight:700; font-size:16.5px; }

  .topicwrap{ margin-top:26px; }
  .tgrid{ margin-top:12px; display:flex; flex-wrap:wrap; gap:10px; }
  .tchip{
    background:var(--card2); border:1px solid var(--bd); border-radius:12px;
    padding:11px 15px; display:flex; align-items:center; gap:10px;
  }
  .tichip{ width:21px; height:21px; color:var(--accent); flex-shrink:0; }
  .tichip svg{ width:100%; height:100%; }
  .tname{ font-size:15.5px; font-weight:600; }
  .tnum{ font-family:'IBM Plex Mono'; font-size:14.5px; font-weight:700; color:var(--accent); margin-left:2px; }
  .tnum i{ font-style:normal; font-size:11px; }
  .tmore{ font-size:14px; font-weight:600; color:var(--mut); align-self:center; }

  .modpanel{
    margin-top:26px; background:var(--card2); border:1px solid var(--bd); border-radius:18px; padding:22px 24px 18px;
  }
  .modhead{ margin-bottom:14px; display:flex; align-items:center; justify-content:space-between; }
  .modcols{ display:grid; grid-template-columns:1fr 1fr; gap:0 26px; }
  .stagelbl{ font-family:'IBM Plex Mono'; font-size:12.5px; font-weight:600; letter-spacing:.05em; color:var(--accent); text-transform:uppercase; margin:14px 0 7px; }
  .stagelbl:first-child{ margin-top:0; }
  .mrow{ display:flex; align-items:flex-start; gap:10px; padding:5px 0; }
  .mdot{ width:7px; height:7px; border-radius:50%; background:var(--mut2); flex-shrink:0; margin-top:8px; }
  .mtitle{ font-size:16px; font-weight:500; line-height:1.35; }
  .careerrow{ margin-top:8px; padding-top:14px; border-top:1px solid var(--bd); }
  .careerrow .stagelbl{ margin-top:0; }
  .careerrow .mtitle{ font-weight:700; }

  .stats{ margin-top:22px; display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
  .stile{ background:var(--card2); border:1px solid var(--bd); border-radius:14px; padding:16px 10px 14px; text-align:center; }
  .snum{ font-family:'Fraunces'; font-weight:700; font-size:30px; color:var(--accent); letter-spacing:-.02em; }
  .slbl{ margin-top:4px; font-size:13px; color:var(--mut); line-height:1.25; }

  .footer{ margin-top:20px; padding-top:18px; display:flex; align-items:center; justify-content:space-between; border-top:1px solid var(--bd); }
  .cta{ font-family:'Caveat'; font-weight:700; font-size:34px; color:var(--accent); transform:rotate(-2deg); }
  .site{ font-family:'IBM Plex Mono'; font-size:14px; color:var(--mut2); letter-spacing:.04em; }

  /* 4:5's shorter canvas (1350px vs 9:16's 1920px, same 1080px width) means
     its zoom is already much lower than 9:16's for the same content, so
     text renders visibly smaller in absolute terms even though the CSS is
     byte-for-byte identical. Bumping zoom45 itself to compensate would just
     reintroduce the footer-clipping bug (those values are already tuned to
     a razor-thin margin) — so instead this raises font-sizes ~10-15% and
     claws the vertical room back from spacing/padding, not from content,
     specifically for the 4:5 target only. */
  .f45 h1{ font-size:58px; }
  .f45 .desc{ font-size:21px; margin-top:9px; }
  .f45 .eyebrow{ font-size:16.5px; }
  .f45 .tag{ font-size:14.5px; }
  .f45 .hero{ margin-top:20px; }
  .f45 .ftitle{ font-size:18px; }
  .f45 .fgrid{ margin-top:18px; }
  .f45 .fcard{ padding:13px 14px; }
  .f45 .tname{ font-size:17px; }
  .f45 .tnum{ font-size:16px; }
  .f45 .topicwrap{ margin-top:16px; }
  .f45 .tgrid{ margin-top:8px; }
  .f45 .tchip{ padding:9px 13px; }
  .f45 .modpanel{ margin-top:16px; padding:16px 18px 14px; }
  .f45 .modhead{ margin-bottom:10px; }
  .f45 .stagelbl{ font-size:13.5px; }
  .f45 .mtitle{ font-size:17px; }
  .f45 .mrow{ padding:3px 0; }
  .f45 .stats{ margin-top:14px; }
  .f45 .stile{ padding:13px 8px 11px; }
  .f45 .snum{ font-size:33px; }
  .f45 .slbl{ font-size:14px; }
  .f45 .pb-old{ font-size:16px; }
  .f45 .pb-new{ font-size:25px; }
  .f45 .offpill{ font-size:15px; }
  .f45 .priceuntil{ font-size:16px; }
  .f45 .footer{ margin-top:14px; padding-top:12px; }
  .f45 .site{ font-size:15px; }
</style>
</head>
<body class="${target.key === "45" ? "f45" : ""}">
  <div class="canvas">
    <div class="frame">
      <div class="topbar">
        <div class="logo">ZENITH<b>LAB</b></div>
        <div class="topright">
          <div class="tag">${c.tag}</div>
          <div class="pricerow">
            <div class="pricebox">
              <span class="pb-old">${c.originalPrice}</span>
              <span class="pb-new">${c.price}</span>
            </div>
            <div class="offpill">-${c.discountPercent}%</div>
          </div>
          <div class="priceuntil">${c.saleUntil}</div>
        </div>
      </div>

      <div class="hero">
        <div class="eyebrow">${c.eyebrow}</div>
        <h1>${c.title}</h1>
        <div class="desc">${c.desc}</div>
      </div>

      <div class="fgrid">${featureCards}</div>

      <div class="topicwrap">
        <div class="sectlbl">${c.topicLabel}</div>
        <div class="tgrid">${topicChips}</div>
      </div>

      <div class="modpanel">
        <div class="modhead"><span class="sectlbl">Every module, every stage</span></div>
        <div class="modcols">
          <div class="modcol">${stageCol(left)}</div>
          <div class="modcol">${stageCol(right)}</div>
        </div>
        <div class="careerrow">
          <div class="stagelbl">Stage ${c.stages.length} &middot; Career path</div>
          <div class="mrow"><span class="mdot"></span><span class="mtitle">Career Path Edition</span></div>
        </div>
      </div>

      <div class="stats">${statTiles}</div>

      <div class="footer">
        <div class="cta">link in bio &#8599;</div>
        <div class="site">zenith-studio.site</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

for (const target of TARGETS) {
  for (const c of COURSES) {
    const out = path.join(target.outDir, `slide-${c.id}.html`);
    writeFileSync(out, render(c, target), "utf-8");
    console.log("wrote", out);
  }
}
