// Upload a local image to Vercel Blob (exact bytes, no recompression) and
// post it to Instagram via Buffer, in one step.
// Usage: node --env-file=.env scripts/publish-instagram.mjs <local-image-path> "<caption>"

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { put } from "@vercel/blob";

const [imagePath, caption] = process.argv.slice(2);
const buffToken = process.env.BUFFER_ACCESS_TOKEN;
const profileId = process.env.BUFFER_IG_PROFILE_ID;

if (!imagePath || !caption) {
  console.error('Usage: node --env-file=.env scripts/publish-instagram.mjs <local-image-path> "<caption>"');
  process.exit(1);
}
if (!buffToken || !profileId) {
  console.error("Set BUFFER_ACCESS_TOKEN and BUFFER_IG_PROFILE_ID in .env first.");
  process.exit(1);
}

const file = await readFile(imagePath);
const blob = await put(basename(imagePath), file, {
  access: "public",
  addRandomSuffix: true,
});
console.log("Uploaded:", blob.url);

const body = new URLSearchParams({
  text: caption,
  "profile_ids[]": profileId,
  "media[picture]": blob.url,
  now: "true",
});

const res = await fetch(`https://api.bufferapp.com/1/updates/create.json?access_token=${buffToken}`, {
  method: "POST",
  body,
});
const result = await res.json();

if (!res.ok || result.success === false) {
  console.error("Post failed:", result);
  process.exit(1);
}

console.log("Posted:", result.updates?.[0]?.id ?? result);
