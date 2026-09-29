import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const w of [1024, 1100, 1180, 1280, 1366, 1440, 1600]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto("http://localhost:3100/lab/ai-engineering", { waitUntil: "networkidle", timeout: 120000 });
  const r = await p.evaluate(() => {
    const h1 = document.querySelector("#overview h1"), card = document.querySelector("#overview [class*='rounded-[30px]']");
    const l = h1.parentElement.getBoundingClientRect(), c = card.getBoundingClientRect();
    const t = document.querySelector("#overview h1 span").getBoundingClientRect();
    return { gap: Math.round(c.left - l.right), leftW: Math.round(l.width), cardW: Math.round(c.width), h1Overflow: Math.round(t.right - l.right), sw: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  console.log(w, JSON.stringify(r));
  await p.close();
}
await b.close();
