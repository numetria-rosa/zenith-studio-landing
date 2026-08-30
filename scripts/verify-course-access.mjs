/* Asserts the four course-file guard outcomes and the live anonymous
   production redirects. A paying-user click-through still needs a real
   session; this script does not invent one. */

const fs = await import("node:fs/promises");
const path = await import("node:path");
const { fileURLToPath } = await import("node:url");

function decideCourseAccess(input) {
  if (!input.coursePublished) return { action: "not-found" };
  if (!input.userId) return { action: "redirect-sign-in" };
  if (!input.entitled) return { action: "redirect-landing" };
  return { action: "serve" };
}

const cases = [
  [{ coursePublished: false, userId: null, entitled: false }, "not-found"],
  [{ coursePublished: true, userId: null, entitled: false }, "redirect-sign-in"],
  [{ coursePublished: true, userId: "user_1", entitled: false }, "redirect-landing"],
  [{ coursePublished: true, userId: "user_1", entitled: true }, "serve"],
];

let failed = 0;
for (const [input, expected] of cases) {
  const got = decideCourseAccess(input).action;
  if (got !== expected) {
    console.error("decision mismatch", input, "expected", expected, "got", got);
    failed += 1;
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const accessSrc = await fs.readFile(path.join(root, "src/lib/course-access.ts"), "utf8");
const routeSrc = await fs.readFile(path.join(root, "src/app/courses/[courseId]/[...path]/route.ts"), "utf8");
if (!accessSrc.includes("export function decideCourseAccess")) {
  console.error("src/lib/course-access.ts is missing decideCourseAccess");
  failed += 1;
}
if (!routeSrc.includes("decideCourseAccess")) {
  console.error("course file route does not call decideCourseAccess");
  failed += 1;
}

const origin = "https://www.zenith-studio.site";
async function probe(urlPath, expectStatus, expectLocationPart) {
  const res = await fetch(origin + urlPath, { redirect: "manual" });
  if (res.status !== expectStatus) {
    console.error(urlPath, "status", res.status, "expected", expectStatus);
    failed += 1;
    return;
  }
  if (expectLocationPart) {
    const loc = res.headers.get("location") || "";
    if (!loc.includes(expectLocationPart)) {
      console.error(urlPath, "location", loc, "expected to include", expectLocationPart);
      failed += 1;
    }
  }
  console.log("OK", res.status, urlPath, res.headers.get("location") || "");
}

try {
  await probe("/courses/data-science/dashboard", 307, "/sign-in");
  await probe("/courses/data-science", 200);
  await probe("/courses/this-course-is-not-published/module-01", 404);
  // Published locally 2026-08-30. Until this commit is on Vercel, production
  // still 404s; after deploy, anonymous hits must redirect to sign-in.
  await probe("/courses/ai-assisted-software-engineering/module-00", 307, "/sign-in");
} catch (err) {
  console.error("production probe failed:", err.message);
  failed += 1;
}

if (failed) {
  console.error(`${failed} check(s) failed.`);
  process.exit(1);
}
console.log("Course access decision table + anonymous production probes passed.");
console.log("UNVERIFIED: entitled paying-user session click-through (needs a real login).");
