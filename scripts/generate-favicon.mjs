// One-off script: rebuilds the favicon set from the real brand mark
// (public/icon.webp — the same illustrated Z used in-app headers), sized
// large/dominant on a vivid gradient disc.
//
// History, worth keeping — three earlier attempts, each fixing the last
// one's problem and (until this version) introducing a new one:
//   v1: dark "glass orb" with a thin neon rim. Fine at 512px, disappeared
//   into a near-black blob in a real dark browser tab — not saturated
//   enough at actual favicon size.
//   v2: fixed contrast with a vivid disc, but used a white silhouette cut
//   from the illustrated mark's alpha channel. Flattened to solid white,
//   the swoosh/ring linework reads as a plain donut, not a Z — the
//   letterform depended on internal color shading a silhouette discards.
//   v3: dropped the real mark entirely for a bold hand-drawn Z glyph.
//   Legible at every size, but user feedback: this isn't "our icon" —
//   wanted the actual illustrated brand mark back, just sized to dominate
//   the circle instead of looking small inside it.
// v4 (this version): the real mark from public/icon.webp, sized to ~88% of
// the disc diameter — most of what's visible at any size is the icon
// itself, with just a thin ring of the vivid disc showing as a frame.
//
// Usage: node scripts/generate-favicon.mjs
//
// Regenerates every file under public/favicon/ and src/app/favicon.ico.
// Reads from public/icon.webp but does not modify it.

import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const FAVICON_DIR = join(process.cwd(), "public", "favicon");
const SOURCE_MARK = join(process.cwd(), "public", "icon.webp");
const MASTER_SIZE = 1024;

// Fully saturated gradient disc, edge to edge — no dark base, no glass, no
// glow blur. This is what actually stays visible against a dark browser UI.
const discSvg = `
<svg width="${MASTER_SIZE}" height="${MASTER_SIZE}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fill" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#67e8f9"/>
      <stop offset="50%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#c026d3"/>
    </linearGradient>
  </defs>
  <circle cx="512" cy="512" r="512" fill="url(#fill)"/>
</svg>
`;

async function buildMaster() {
  const disc = await sharp(Buffer.from(discSvg)).png().toBuffer();

  // Sized to dominate the circle — only a thin ring of the disc shows
  // around it, rather than the mark looking small inside a lot of empty
  // bubble margin.
  const markSize = Math.round(MASTER_SIZE * 0.88);
  const mark = await sharp(SOURCE_MARK)
    .resize(markSize, markSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const offset = Math.round((MASTER_SIZE - markSize) / 2);

  return sharp(disc)
    .composite([{ input: mark, left: offset, top: offset }])
    .png()
    .toBuffer();
}

function buildIco(pngBuffers) {
  // Minimal PNG-in-ICO writer (Vista+ format, supported everywhere modern).
  // No new dependency needed — sharp already gives us the PNG bytes per size.
  const count = pngBuffers.length;
  const header = Buffer.alloc(6); // ICONDIR is exactly 6 bytes.
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

  return Buffer.concat([header, ...entries, ...pngBuffers.map((p) => p.buffer)]);
}

async function main() {
  console.log("Building master gradient-disc icon...");
  const master = await buildMaster();

  const targets = [
    { file: "favicon-16x16.png", size: 16 },
    { file: "favicon-32x32.png", size: 32 },
    { file: "favicon-48x48.png", size: 48 },
    { file: "apple-touch-icon.png", size: 180 },
    { file: "android-chrome-192x192.png", size: 192 },
    { file: "android-chrome-512x512.png", size: 512 },
  ];

  const icoSizes = [16, 32, 48];
  const icoBuffers = [];

  for (const { file, size } of targets) {
    const buf = await sharp(master).resize(size, size).png().toBuffer();
    writeFileSync(join(FAVICON_DIR, file), buf);
    console.log(`Wrote ${file} (${size}x${size})`);
    if (icoSizes.includes(size)) icoBuffers.push({ size, buffer: buf });
  }

  const ico = buildIco(icoBuffers);
  writeFileSync(join(FAVICON_DIR, "favicon.ico"), ico);
  console.log("Wrote favicon.ico (16/32/48 combined)");

  // Next.js App Router auto-serves src/app/favicon.ico as the site's actual
  // favicon (a file-convention route, separate from public/favicon/ and
  // from the metadata.icons config in layout.tsx) — this is the one the
  // browser tab really uses, so it has to be written too.
  const appFaviconPath = join(process.cwd(), "src", "app", "favicon.ico");
  writeFileSync(appFaviconPath, ico);
  console.log("Wrote src/app/favicon.ico (the one Next.js actually serves)");

  writeFileSync(join(FAVICON_DIR, "favicon-master-1024.png"), master);
  console.log("Wrote favicon-master-1024.png (reference copy, gitignored)");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
