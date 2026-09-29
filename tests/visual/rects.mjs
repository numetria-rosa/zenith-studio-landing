import { chromium } from "@playwright/test";
const [sel] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:3000/lab/ai-engineering", { waitUntil: "networkidle", timeout: 120000 });
await p.evaluate(() => document.fonts.ready);
const out = await p.evaluate((sel) => [...document.querySelectorAll(sel)].map(e => { const r = e.getBoundingClientRect(); return `${e.tagName} ${(e.textContent||'').slice(0,28).replace(/\s+/g,' ')} x=${r.x.toFixed(1)} y=${(r.y+scrollY).toFixed(1)} w=${r.width.toFixed(1)} h=${r.height.toFixed(1)}`; }), sel);
console.log(out.join("\n")); await b.close();
