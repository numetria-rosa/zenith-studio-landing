// Dev server for the visual tests: sample content, auth skipped, progress in the local test database (lessons 1.1 to 1.3 done for the dev user).
// Never used in production (the env switches are ignored when NODE_ENV=production).
import { spawn } from "node:child_process";
import path from "node:path";

// `node tests/visual/dev-server.mjs real` serves the real /content instead of the sample fixtures (for functional checks).
const real = process.argv[2] === "real";
const env = {
  ...process.env,
  ...(real ? {} : { AIE_CONTENT_DIR: path.resolve("tests/visual/fixtures") }),
  AIE_DEV_USER: "[Student name]",
  // Throwaway local Postgres holding only the AIE tables (never the real database).
  DATABASE_URL: process.env.AIE_TEST_DATABASE_URL ?? "postgresql://postgres@127.0.0.1:54329/aie_test",
};
spawn("npx", ["next", "dev", "-p", "3100"], { env, stdio: "inherit", shell: true });
