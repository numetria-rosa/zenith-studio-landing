import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const w of [390, 768, 1024, 1280, 1440, 1920]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text()));
  await p.goto("http://localhost:3000/lab/ai-engineering", { waitUntil: "networkidle", timeout: 120000 });
  const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, small: [...document.querySelectorAll("a,button")].filter(e => { const r = e.getBoundingClientRect(); return r.height > 0 && r.height < 44 && !e.closest("nav"); }).map(e => e.textContent.trim().slice(0, 20) + ":" + Math.round(e.getBoundingClientRect().height)) }));
  console.log(w, r.sw > r.cw ? `OVERFLOW ${r.sw}>${r.cw}` : "ok", r.small.join("|"), errs.join("; "));
  if (w === 390) await p.screenshot({ path: "tests/visual/out/mobile-top.png" });
  await p.close();
}
await b.close();
