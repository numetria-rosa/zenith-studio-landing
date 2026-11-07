// Runs `prisma migrate deploy` for the build, but only where it should run.
// Vercel builds every branch push (a preview) and every main push (production) at the same time, and all of them
// share one database. Two migrate runs then fight over Postgres's advisory lock and one dies with P1002
// ("Timed out trying to acquire a postgres advisory lock"), failing a build that never reached `next build`.
// Only production migrates; previews skip it. Locally (no VERCEL_ENV) it migrates as before.
import { spawnSync } from "node:child_process";

const env = process.env.VERCEL_ENV;
if (env && env !== "production") {
  console.log(`[migrate-deploy] skipped for a ${env} build (only production runs migrations)`);
  process.exit(0);
}
const r = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", shell: true });
process.exit(r.status ?? 1);
