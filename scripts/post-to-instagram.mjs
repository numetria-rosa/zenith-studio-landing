// Post an already-hosted image to Instagram via Buffer's API.
// Run every command with --env-file=.env so it picks up BUFFER_ACCESS_TOKEN
// and BUFFER_IG_PROFILE_ID from the project .env (already gitignored).
//
// Setup once:
//   1. node --env-file=.env scripts/post-to-instagram.mjs --list-profiles
//      copy the Instagram profile id it prints into .env as BUFFER_IG_PROFILE_ID
//   2. node --env-file=.env scripts/post-to-instagram.mjs "<public-image-url>" "<caption>"

const token = process.env.BUFFER_ACCESS_TOKEN;
if (!token) {
  console.error("Set BUFFER_ACCESS_TOKEN first.");
  process.exit(1);
}

const api = (path) => `https://api.bufferapp.com/1/${path}?access_token=${token}`;

if (process.argv[2] === "--list-profiles") {
  const profiles = await fetch(api("profiles.json")).then((r) => r.json());
  for (const p of profiles) console.log(`${p.service} — ${p.formatted_username} — id: ${p.id}`);
  process.exit(0);
}

const [imageUrl, caption] = process.argv.slice(2);
const profileId = process.env.BUFFER_IG_PROFILE_ID;

if (!imageUrl || !caption || !profileId) {
  console.error('Usage: node --env-file=.env scripts/post-to-instagram.mjs "<public-image-url>" "<caption>"');
  console.error("Requires BUFFER_IG_PROFILE_ID env var (run --list-profiles to find it).");
  process.exit(1);
}

const body = new URLSearchParams({
  text: caption,
  "profile_ids[]": profileId,
  "media[picture]": imageUrl,
  now: "true",
});

const res = await fetch(api("updates/create.json"), { method: "POST", body });
const result = await res.json();

if (!res.ok || result.success === false) {
  console.error("Post failed:", result);
  process.exit(1);
}

console.log("Posted:", result.updates?.[0]?.id ?? result);
