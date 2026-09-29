// Dev server for the visual tests: sample content, auth skipped, fixed progress (3 of 6 lessons done).
// Never used in production (the env switches are ignored when NODE_ENV=production).
import { spawn } from "node:child_process";
import path from "node:path";

const env = {
  ...process.env,
  AIE_CONTENT_DIR: path.resolve("tests/visual/fixtures"),
  AIE_DEV_USER: "[Student name]",
  AIE_FIXTURE_DONE: "1.1,1.2,1.3",
  // Throwaway local Postgres holding only the AIE tables (never the real database).
  DATABASE_URL: process.env.AIE_TEST_DATABASE_URL ?? "postgresql://postgres@127.0.0.1:54329/aie_test",
};
spawn("npx", ["next", "dev", "-p", "3100"], { env, stdio: "inherit", shell: true });
