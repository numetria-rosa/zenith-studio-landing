// Runs `prisma migrate deploy` for the build, but only where it should run, and survives a stuck lock.
//
// 1. Vercel builds every branch push (a preview) and every main push (production) at the same time, and all of them
//    share one database. Two migrate runs then fight over Postgres's advisory lock and one dies with P1002
//    ("Timed out trying to acquire a postgres advisory lock"). Only production migrates; previews skip it.
//    Locally (no VERCEL_ENV) it migrates as before.
// 2. The lock can also be left held by an earlier build that was killed mid-run, so a production build can hit P1002
//    with nothing else running. If migrate deploy fails that way, `prisma migrate status` (which takes no lock) says
//    whether anything is actually pending: nothing pending means the lock timeout cost us nothing and the build
//    carries on; something pending still fails the build, so code never ships ahead of its columns.
import { spawnSync } from "node:child_process";

const run = (args) => {
  const r = spawnSync("npx", ["prisma", ...args], { encoding: "utf8", shell: true });
  process.stdout.write(r.stdout ?? "");
  process.stderr.write(r.stderr ?? "");
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};

const env = process.env.VERCEL_ENV;
if (env && env !== "production") {
  console.log(`[migrate-deploy] skipped for a ${env} build (only production runs migrations)`);
  process.exit(0);
}

const deploy = run(["migrate", "deploy"]);
if (deploy.code === 0) process.exit(0);

if (/P1002|advisory lock/i.test(deploy.out)) {
  console.log("[migrate-deploy] could not get the migration lock; checking whether anything is pending");
  const status = run(["migrate", "status"]);
  if (status.code === 0) {
    console.log("[migrate-deploy] database is up to date, continuing without migrating");
    process.exit(0);
  }
}
process.exit(deploy.code);
