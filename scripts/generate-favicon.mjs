// One-off script: rebuilds the favicon set as a "glass orb" bubble around
// the existing Z mark — dark glass core, a cyan → blue → fuchsia neon rim
// (the same gradient the site already uses throughout page.tsx), and a soft
// glossy highlight. Re-run any time the source mark or bubble design changes.
//
// Usage: node scripts/generate-favicon.mjs
//
// Regenerates every file under public/favicon/ from the existing
// public/favicon/android-chrome-512x512.png (highest-res source with a
// transparent background) — does not touch public/icon.webp (the in-app
// header logo), which is a separate, unbubbled asset by design for now.

import sharp from "sharp";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FAVICON_DIR = join(process.cwd(), "public", "favicon");
const SOURCE_MARK = join(FAVICON_DIR, "android-chrome-512x512.png");
const MASTER_SIZE = 1024;

// Bubble background: dark glass core, cyan/blue/fuchsia neon rim (matches
// the gradient used throughout src/app/page.tsx), soft glossy highlight.
const bubbleSvg = `
<svg width="${MASTER_SIZE}" height="${MASTER_SIZE}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="core" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#1b2340"/>
      <stop offset="55%" stop-color="#0d1120"/>
      <stop offset="100%" stop-color="#05060a"/>
    </radialGradient>
    <linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#67e8f9"/>
      <stop offset="45%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#e879f9"/>
    </linearGradient>
    <radialGradient id="highlight" cx="32%" cy="26%" r="30%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="20" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <circle cx="512" cy="512" r="468" fill="none" stroke="url(#rim)" stroke-width="12" opacity="0.85" filter="url(#glow)"/>
  <circle cx="512" cy="512" r="450" fill="url(#core)"/>
  <circle cx="512" cy="512" r="450" fill="none" stroke="url(#rim)" stroke-width="5" opacity="0.9"/>
  <ellipse cx="380" cy="330" rx="230" ry="170" fill="url(#highlight)"/>
</svg>
`;

// Small-size variant: no outer glow blur (it just eats into the canvas and
// goes mushy under 32px), circle fills almost the whole frame, and the Z is
// sized a little larger so its silhouette/color still reads as a Z rather
// than a blob once downscaled to 16px.
const bubbleSvgSmall = `
<svg width="${MASTER_SIZE}" height="${MASTER_SIZE}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="core" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#1b2340"/>
      <stop offset="55%" stop-color="#0d1120"/>
      <stop offset="100%" stop-color="#05060a"/>
    </radialGradient>
    <linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#67e8f9"/>
      <stop offset="45%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#e879f9"/>
    </linearGradient>
    <radialGradient id="highlight" cx="32%" cy="26%" r="30%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <circle cx="512" cy="512" r="504" fill="url(#core)"/>
  <circle cx="512" cy="512" r="492" fill="none" stroke="url(#rim)" stroke-width="26"/>
  <ellipse cx="380" cy="330" rx="230" ry="170" fill="url(#highlight)"/>
</svg>
`;

async function compositeMark(bubbleSvgSource, markRatio) {
  const bubble = await sharp(Buffer.from(bubbleSvgSource)).png().toBuffer();

  const markSize = Math.round(MASTER_SIZE * markRatio);
  const mark = await sharp(SOURCE_MARK)
    .resize(markSize, markSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const offset = Math.round((MASTER_SIZE - markSize) / 2);

  return sharp(bubble)
    .composite([{ input: mark, left: offset, top: offset }])
    .png()
    .toBuffer();
}

async function buildMaster() {
  return compositeMark(bubbleSvg, 0.62);
}

async function buildSmallMaster() {
  return compositeMark(bubbleSvgSmall, 0.68);
}

function buildIco(pngBuffers) {
  // Minimal PNG-in-ICO writer (Vista+ format, supported everywhere modern).
  // No new dependency needed — sharp already gives us the PNG bytes per size.
  const count = pngBuffers.length;
  const header = Buffer.alloc(6); // ICONDIR is exactly 6 bytes — was
  // over-allocated to 6 + count*16 before, leaving zero-padding between the
  // header and the directory entries and corrupting the whole file.
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16; // header + all ICONDIRENTRYs, before image data starts
  const entries = [];
  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256)
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(buffer.length, 8); // bytes in resource
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    offset += buffer.length;
  }

  const parts = [header, ...entries, ...pngBuffers.map((p) => p.buffer)];
  return Buffer.concat(parts);
}

async function main() {
  console.log("Building master bubble icons (glossy + small-size variant)...");
  const master = await buildMaster();
  const smallMaster = await buildSmallMaster();

  // Sizes at or under 48px use the flat, no-blur small variant; everything
  // larger uses the full glossy version with the glow ring.
  const targets = [
    { file: "favicon-16x16.png", size: 16, small: true },
    { file: "favicon-32x32.png", size: 32, small: true },
    { file: "favicon-48x48.png", size: 48, small: true },
    { file: "apple-touch-icon.png", size: 180, small: false },
    { file: "android-chrome-192x192.png", size: 192, small: false },
    { file: "android-chrome-512x512.png", size: 512, small: false },
  ];

  const icoSizes = [16, 32, 48];
  const icoBuffers = [];

  for (const { file, size, small } of targets) {
    const source = small ? smallMaster : master;
    const buf = await sharp(source).resize(size, size).png().toBuffer();
    writeFileSync(join(FAVICON_DIR, file), buf);
    console.log(`Wrote ${file} (${size}x${size}, ${small ? "small" : "glossy"} variant)`);
    if (icoSizes.includes(size)) icoBuffers.push({ size, buffer: buf });
  }

  const ico = buildIco(icoBuffers);
  writeFileSync(join(FAVICON_DIR, "favicon.ico"), ico);
  console.log("Wrote favicon.ico (16/32/48 combined)");

  // Next.js App Router auto-serves src/app/favicon.ico as the site's actual
  // favicon (a file-convention route, separate from public/favicon/ and
  // from the metadata.icons config in layout.tsx) — this is the one the
  // browser tab really uses, so it has to be written too or the bubble
  // redesign silently doesn't show up.
  const appFaviconPath = join(process.cwd(), "src", "app", "favicon.ico");
  writeFileSync(appFaviconPath, ico);
  console.log("Wrote src/app/favicon.ico (the one Next.js actually serves)");

  // Also drop a high-res standalone copy for reference / future re-edits.
  writeFileSync(join(FAVICON_DIR, "favicon-master-1024.png"), master);
  console.log("Wrote favicon-master-1024.png (reference copy)");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
