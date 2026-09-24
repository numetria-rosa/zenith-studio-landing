// Combines a LinkedIn carousel's exported PNG slides into a single PDF,
// since LinkedIn's document-post upload only accepts PDF (not raw images).
import puppeteer from "puppeteer";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2];
if (!slug) { console.error("usage: node _export-linkedin-pdf.mjs <slug>"); process.exit(1); }

const dir = path.join(scriptDir, "..", "linkedin", slug);
const pngs = fs.readdirSync(dir).filter((f) => /^slide-.*\.png$/.test(f)).sort();

const WIDTH_IN = 1080 / 96;
const HEIGHT_IN = 1350 / 96;

const pages = pngs.map((f) => {
  const dataUri = `file://${path.join(dir, f).replace(/\\/g, "/")}`;
  return `<div class="page"><img src="${dataUri}"></div>`;
}).join("\n");

const html = `<!doctype html>
<html><head><style>
  *{margin:0;padding:0}
  @page{ size:${WIDTH_IN}in ${HEIGHT_IN}in; margin:0; }
  .page{ width:${WIDTH_IN}in; height:${HEIGHT_IN}in; page-break-after:always; overflow:hidden; }
  .page img{ width:100%; height:100%; display:block; object-fit:cover; }
</style></head>
<body>${pages}</body></html>`;

const tmpHtml = path.join(dir, "_pdf-wrapper.html");
fs.writeFileSync(tmpHtml, html);

const browser = await puppeteer.launch({
  executablePath: "C:/Users/HP/.cache/puppeteer/chrome/win64-148.0.7778.97/chrome-win64/chrome.exe",
});
const page = await browser.newPage();
await page.goto(`file://${tmpHtml}`, { waitUntil: "networkidle0" });
const pdfPath = path.join(dir, `${slug}.pdf`);
await page.pdf({
  path: pdfPath,
  width: `${WIDTH_IN}in`,
  height: `${HEIGHT_IN}in`,
  printBackground: true,
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
});
await browser.close();
fs.unlinkSync(tmpHtml);
console.log("exported", pdfPath);
