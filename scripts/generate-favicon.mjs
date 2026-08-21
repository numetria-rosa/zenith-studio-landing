// One-off script: rebuilds the favicon set directly from
// public/favicon/zenith_logo_main.png — the real logo file, cropped to just
// the Z icon (dropping the "ZENITH STUDIO" wordmark below it, which isn't
// legible at favicon sizes), padded to a square canvas, and resized to
// every required size.
//
// History, worth keeping — four earlier attempts:
//   v1: dark "glass orb" bubble with a thin neon rim. Disappeared into a
//   near-black blob in a real dark browser tab — not saturated enough.
//   v2: fixed contrast with a vivid disc, but used a white silhouette cut
//   from the mark's alpha channel, which read as a plain donut, not a Z.
//   v3: dropped the real mark for a bold hand-drawn Z glyph. Legible, but
//   not "our icon."
//   v4: real mark (public/icon.webp) on a vivid disc, sized to dominate —
//   closer, but still a redesign, not literally the provided asset.
// v5 (this version): no bubble, no disc, no recoloring — literally the
// user-provided zenith_logo_main.png, cropped to the icon and sized
// correctly for every favicon slot. Nothing else.
//
// Usage: node scripts/generate-favicon.mjs
//
// Regenerates every file under public/favicon/ and src/app/favicon.ico.
// Reads from public/favicon/zenith_logo_main.png, does not modify it.

import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const FAVICON_DIR = join(process.cwd(), "public", "favicon");
const SOURCE_LOGO = join(FAVICON_DIR, "zenith_logo_main.png");
const MASTER_SIZE = 1024;

// Crop region isolating just the Z icon from the full logo lockup (source
// is 1024x1024 with the icon roughly in the top half and "ZENITH STUDIO"
// text below it) — tuned by hand to include the full icon plus its
// sparkle accents with a little breathing room, without clipping into the
// wordmark. Re-tune these four numbers if the source logo file changes.
const ICON_CROP = { left: 140, top: 90, width: 740, height: 520 };

// Sampled from the source file's own corner pixel, so the padding used to
// square up the crop is invisible against the icon's existing background.
const BG_COLOR = { r: 14, g: 14, b: 25 };

async function buildMaster() {
  const cropped = await sharp(SOURCE_LOGO).extract(ICON_CROP).toBuffer();

  // Pad to a square canvas (the crop itself is wider than tall) using the
  // source's own background color, then upscale to the working master size.
  return sharp(cropped)
    .resize(MASTER_SIZE, MASTER_SIZE, {
      fit: "contain",
      background: BG_COLOR,
    })
    .png()
    .toBuffer();
}

function buildIco(pngBuffers) {
  // Minimal PNG-in-ICO writer (Vista+ format, supported everywhere modern).
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
  console.log("Cropping and squaring the real logo icon...");
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
    // ensureAlpha(): the source logo has no alpha channel (plain RGB), but
    // Turbopack's ICO decoder requires RGBA PNGs inside the .ico container
    // or the production build fails with "The PNG is not in RGBA format!".
    const buf = await sharp(master).resize(size, size).ensureAlpha().png().toBuffer();
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
