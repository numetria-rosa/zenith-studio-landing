import { chromium } from "@playwright/test";
const url = "http://localhost:3100/lab/ai-engineering/learn/modules/1";
const b = await chromium.launch();
for (const w of [390, 768, 1023, 1024, 1280, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text()));
  await p.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    small: [...document.querySelectorAll("a,button")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 40; }).map(e => e.textContent.trim().slice(0, 18) + ":" + Math.round(e.getBoundingClientRect().height)) }));
  console.log(w, r.sw > r.cw ? `OVERFLOW ${r.sw}>${r.cw}` : "ok", "small:", r.small.join("|"), errs.join("; "));
  if (w === 390) {
    await p.screenshot({ path: "tests/visual/out/app-mobile.png" });
    await p.getByRole("button", { name: "Open course menu" }).click();
    await p.waitForSelector("[role=dialog]");
    await p.screenshot({ path: "tests/visual/out/app-mobile-drawer.png" });
  }
  await p.close();
}
await b.close();
