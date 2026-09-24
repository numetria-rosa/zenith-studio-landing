// One-off: generates a 1280x720 (Whop's own recommended 16:9) product cover
// image per Whop product, then screenshots each to PNG. Two brand variants,
// matching each product's actual existing identity rather than a single
// generic template: Zenith Lab (lime #c6f432, "ZENITHLAB" wordmark - same
// system as insta/course-ads/*.html) for courses/bundles, Zenith Studio
// (amber #f0b429) for the done-for-you AI services. No price baked into the
// image on purpose - prices already live on the Whop plan/product itself
// and change over time (sale windows etc.); baking in a number here would
// just go stale.
//
// Usage: node scripts/gen-whop-product-images.mjs
// Output: whop-product-images/<file>.html + .png (gitignored scratch dir,
// same idea as whop-created-products.json - not meant to be committed).
import puppeteer from "puppeteer";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("whop-product-images");
mkdirSync(OUT_DIR, { recursive: true });

const LAB = { logo: "ZENITH<b>LAB</b>", accent: "#c6f432", accentd: "#0f1405", bg: "#070b14" };
const STUDIO = { logo: "ZENITH STUDIO", accent: "#f0b429", accentd: "#1a1200", bg: "#0d0f14" };

const PRODUCTS = [
  // Courses (Zenith Lab)
  { file: "ai-engineering", brand: LAB, tag: "8-WEEK ACCELERATED PROGRAM", title: "AI Engineering", pitch: "Build real products with language models: prompting, retrieval, agents, tool use, evaluation.", chips: ["Prompting & RAG", "Agents in production", "Portfolio capstone"] },
  { file: "data-science", brand: LAB, tag: "12-WEEK PROGRAM, 3 ENTRY TRACKS", title: "Data Science & Analysis", pitch: "Spreadsheets through a full capstone analysis, real messy data, real dashboards.", chips: ["Python + SQL", "Tableau / Power BI", "Career Path Edition"] },
  { file: "ai-automation", brand: LAB, tag: "NO CODING REQUIRED", title: "AI Automation", pitch: "Build client-ready workflow judgment: process mapping, webhooks, retries, bounded AI steps.", chips: ["Process mapping", "API & webhook labs", "8 real projects"] },
  { file: "ai-assisted-software-engineering", brand: LAB, tag: "12-WEEK PROGRAM", title: "AI-Assisted Software Engineering", pitch: "Zero coding to a live URL, with Cursor and GitHub as your pair programmer.", chips: ["14 real tickets", "Cursor + GitHub", "A live shipped URL"] },
  { file: "math-for-ml", brand: LAB, tag: "INTERACTIVE COMPUTATIONAL LAB", title: "Mathematics for Machine Learning", pitch: "The math behind modern machine learning, actually explained: vectors to attention.", chips: ["Linear algebra", "Calculus & optimization", "Probability & info theory"] },
  // Bundles (Zenith Lab)
  { file: "bundle-ai-engineering-automation", brand: LAB, tag: "COURSE BUNDLE", title: "AI Engineering + AI Automation", pitch: "Build LLM products, then automate the real-world workflows around them.", chips: ["2 full programs", "One bundled price", "Lifetime access"] },
  { file: "bundle-aise-ai-engineering", brand: LAB, tag: "COURSE BUNDLE", title: "AI-Assisted SWE + AI Engineering", pitch: "From zero code to shipping real AI products, one continuous path.", chips: ["2 full programs", "One bundled price", "Lifetime access"] },
  // Services (Zenith Studio)
  { file: "ai-inbox-manager", brand: STUDIO, tag: "DONE-FOR-YOU AUTOMATION", title: "AI Inbox Manager", pitch: "Wake up to an inbox that is already handled.", chips: ["Sorts & prioritizes", "Drafts routine replies", "Gmail, Yahoo, Zoho"] },
  { file: "ai-lead-capture", brand: STUDIO, tag: "DONE-FOR-YOU AUTOMATION", title: "AI Lead Capture & Follow-Up", pitch: "Never lose a lead to a slow reply again.", chips: ["Captures every enquiry", "Qualifies automatically", "Follows up by email + SMS"] },
  { file: "ai-receptionist", brand: STUDIO, tag: "DONE-FOR-YOU AUTOMATION", title: "AI Receptionist & Booking", pitch: "Answers and books while you are on the job.", chips: ["24/7 call answering", "Books straight to calendar", "Cuts no-shows"] },
  { file: "law-firm-ai-team", brand: STUDIO, tag: "AI TEAM FOR LAW FIRMS", title: "Law Firm AI Team", pitch: "Your firm works 49 hours a week and bills 37.", chips: ["Missed-call text-back", "Follow-up clerk", "Billing recovery"] },
  { file: "brokerage-ai-team", brand: STUDIO, tag: "AI TEAM FOR BROKERAGES", title: "Brokerage AI Team", pitch: "Your agents are not leaving for a better split.", chips: ["Inside sales agent", "Transaction coordination", "Database manager"] },
];

function iconCheck() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
}

function renderHtml(p) {
  const { brand } = p;
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${p.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:${brand.bg};--card2:#141b2c;--bd:rgba(148,163,184,.16);--tx:#eef2ff;--mut:#9aa6c2;--mut2:#6b7690;--accent:${brand.accent};--accentd:${brand.accentd};}
html,body{width:1280px;height:720px;overflow:hidden}
body{background:var(--bg);color:var(--tx);font-family:'IBM Plex Sans',sans-serif}
.canvas{position:relative;width:100%;height:100%;overflow:hidden;background:var(--bg)}
.canvas::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 60% 50% at 8% -6%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 55%),
    radial-gradient(ellipse 50% 45% at 100% 8%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 55%),
    radial-gradient(ellipse 55% 45% at 85% 105%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 55%);
}
.frame{position:relative;z-index:1;height:100%;padding:56px 64px;display:flex;flex-direction:column;justify-content:space-between}
.topbar{display:flex;align-items:flex-start;justify-content:space-between}
.logo{font-family:'Fraunces';font-weight:700;font-size:22px;letter-spacing:-.01em}
.logo b{background:var(--accent);color:var(--accentd);padding:3px 10px;margin-left:4px;border-radius:6px;font-size:15px}
.tag{font-family:'IBM Plex Mono';font-size:14px;font-weight:700;color:var(--mut2);text-transform:uppercase;letter-spacing:.1em;text-align:right;max-width:360px}
.hero{max-width:980px}
.eyebrow{font-family:'IBM Plex Mono';font-size:15px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
h1{font-family:'Fraunces';font-optical-sizing:none;font-variation-settings:"opsz" 144;font-weight:600;font-size:64px;line-height:1.06;letter-spacing:-.02em;margin-top:16px}
.desc{margin-top:18px;font-size:23px;line-height:1.5;color:var(--mut);max-width:900px}
.chips{display:flex;gap:14px;flex-wrap:wrap}
.chip{display:flex;align-items:center;gap:10px;background:var(--card2);border:1px solid var(--bd);border-radius:14px;padding:14px 18px}
.chip svg{width:19px;height:19px;color:var(--accent);flex-shrink:0}
.chip span{font-size:16px;font-weight:600}
.footer{padding-top:22px;border-top:1px solid var(--bd)}
.site{font-family:'IBM Plex Mono';font-size:14.5px;color:var(--mut2);letter-spacing:.04em}
</style></head>
<body><div class="canvas"><div class="frame">
  <div class="topbar">
    <div class="logo">${brand.logo}</div>
  </div>
  <div class="hero">
    <div class="eyebrow">${p.tag}</div>
    <h1>${p.title}</h1>
    <div class="desc">${p.pitch}</div>
  </div>
  <div>
    <div class="chips">
      ${p.chips.map((c) => `<div class="chip">${iconCheck()}<span>${c}</span></div>`).join("\n      ")}
    </div>
    <div class="footer">
      <div class="site">zenith-studio.site</div>
    </div>
  </div>
</div></div></body></html>`;
}

async function main() {
  const browser = await puppeteer.launch({ headless: "new" });
  try {
    for (const p of PRODUCTS) {
      const htmlPath = path.join(OUT_DIR, `${p.file}.html`);
      const pngPath = path.join(OUT_DIR, `${p.file}.png`);
      writeFileSync(htmlPath, renderHtml(p));

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
      await page.goto("file://" + htmlPath, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, 400));
      await page.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: 1280, height: 720 } });
      await page.close();
      console.log("exported", pngPath);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
