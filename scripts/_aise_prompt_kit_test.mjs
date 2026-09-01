/** Unit checks for prompt-kit graders. Does not launch a browser. */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "courses", "ai-assisted-software-engineering");
const src = fs.readFileSync(path.join(root, "prompt-kit.js"), "utf8");
const sandbox = { window: {}, console };
sandbox.window = sandbox;
sandbox.global = sandbox;
vm.runInNewContext(src, sandbox);
const PK = sandbox.PromptKit;
const fails = [];

function expect(cond, msg) {
  if (!cond) fails.push(msg);
}

const stuffing = PK.gradeText("tests tests tests constraints constraints context context task task tests tests tests tests", PK.LABS.repair);
expect(!stuffing.passed, "stuffing should fail");

const copied = PK.gradeText("Investigate the login failure in the authentication flow. First inspect the request payload, authentication response, and session creation path. Identify the root cause before editing code. Preserve the existing authentication API.", PK.LABS.repair);
expect(!copied.passed, "login example copy should fail");

const vague = PK.gradeText("Fix the dashboard. Add tests.", PK.LABS.repair);
expect(!vague.passed, "vague + tests keyword should fail");

const good = PK.gradeText(
  "Context: huddle dashboard in dashboard.js using appointments.json. Priya needs today, still open, and no-shows in the last 7 days.\nTask: Investigate why huddle numbers look wrong before changing code.\nConstraints: Do not modify booking.js, the authentication API, or package dependencies. Only change dashboard.js if a cause is found.\nAcceptance: Given the list for 2026-08-30, when the huddle loads, then today/open/no-show match the seven-day rule including the 6-day-back boundary.\nVerify: Add a regression test for a no-show 6 days ago vs 7 days ago. Do not claim it is fixed until that test fails on the bug and passes after.",
  PK.LABS.repair
);
expect(good.passed, "engineered huddle prompt should pass (hits=" + good.hits + "/" + good.need + " veto=" + (good.veto || []).join("; ") + ")");

const chBad = PK.gradeChallenge({
  context: "tests", objective: "tests", constraints: "tests",
  acceptance: "tests", tests: "tests", verify: "tests", stop: "tests",
});
expect(!chBad.passed, "challenge keyword-only should fail");

const chGood = PK.gradeChallenge({
  context: "orders.js, invoice.js, totals.test.js. Line total is quantity times unit price. Existing test only covers a new order, not an edit.",
  objective: "Investigate why invoice totals are wrong after editing an order. Identify the cause in lineTotal before rewriting orders.js.",
  constraints: "Do not change the payments API, the database schema, or unrelated files. Do not rewrite orders.js from scratch.",
  acceptance: "Given an order with two gauze packs at $3, when quantity is edited to 2, then the invoice total is $6. Empty line items do not change the total.",
  tests: "Add a regression test for editing quantity, an empty line item, and the original new-order case. The test must fail if quantity is ignored.",
  verify: "Run totals.test.js. Do not claim the bug is fixed until the quantity-edit regression fails before the fix and passes after.",
  stop: "Stop if the required behaviour conflicts with the payments API or the business rule is still missing from Dan.",
});
expect(chGood.passed, "challenge genuine fields should pass (hits=" + chGood.hits + " veto=" + (chGood.veto || []).join("; ") + ")");

if (fails.length) {
  console.log("PROMPT KIT FAILS:");
  fails.forEach((f) => console.log(" -", f));
  process.exit(1);
}
console.log("Prompt kit unit checks passed.");
