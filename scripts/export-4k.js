// Instagram ad export: headless Chromium screenshots each insta/<folder>/
// slide-*.html at its real canvas size with deviceScaleFactor 4 (a straight
// 4x multiplier on the CSS pixel canvas, e.g. 1080x1920 -> 4320x7680 PNG).
// No config needed to add a new post: drop a new folder with slide-*.html
// files under insta/ and re-run this script. Canvas size is read from each
// slide's own <body> width/height (set explicitly in its CSS) rather than
// assumed, since different posts use different aspect ratios (4:5 feed,
// 9:16 story/reel, etc.) — a stale hardcoded size here previously clipped
// a redesigned 1080x1920 slide down to 1080x1350 silently.
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const INSTA_DIR = path.resolve(__dirname, "..", "insta");

async function main() {
  const folders = fs.readdirSync(INSTA_DIR).filter((f) =>
    fs.statSync(path.join(INSTA_DIR, f)).isDirectory()
  );

  const browser = await puppeteer.launch({ headless: "new" });
  try {
    for (const folder of folders) {
      const dir = path.join(INSTA_DIR, folder);
      const slides = fs.readdirSync(dir).filter((f) => /^slide-.*\.html$/.test(f));
      for (const slide of slides) {
        const htmlPath = path.join(dir, slide);
        const pngPath = htmlPath.replace(/\.html$/, ".png");
        const page = await browser.newPage();
        // A generous first viewport just to load the page and read its
        // real declared canvas size before setting the final viewport.
        await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 4 });
        await page.goto("file://" + htmlPath, { waitUntil: "networkidle0" });
        const canvas = await page.evaluate(() => {
          const style = getComputedStyle(document.body);
          return { width: parseInt(style.width, 10), height: parseInt(style.height, 10) };
        });
        await page.setViewport({ ...canvas, deviceScaleFactor: 4 });
        await page.evaluate(() => document.fonts.ready);
        await new Promise((r) => setTimeout(r, 400));
        await page.screenshot({
          path: pngPath,
          clip: { x: 0, y: 0, width: canvas.width, height: canvas.height },
          // Safe to always set: a slide with an opaque body still exports
          // solid (there's nothing transparent for this to reveal), but a
          // slide whose body is deliberately transparent — like the
          // rounded-corner .canvas wrapper — needs this or the four
          // corners outside the radius come out as opaque white/black
          // instead of true alpha transparency.
          omitBackground: true,
        });
        await page.close();
        console.log("exported", pngPath, `${canvas.width}x${canvas.height}`);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
