import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { decideCourseAccess } from "@/lib/course-access";
import { getCourse } from "@/lib/courses";
import { hasCourseAccess } from "@/lib/entitlements";
import { fileNameFromPath, wrapCoursePage } from "@/lib/course-rail-template";

/* THE GUARD (Phase 9). Every request for course content — module pages, the
   in-course dashboard, course-progress.js, quiz-data.js, everything — comes
   through here instead of a static file Vercel would serve unconditionally.
   No session -> sign in. Session but not entitled -> the course landing
   page, never the content. Only once both checks pass does a byte of the
   actual file get read off disk. This is what makes typing
   /courses/ai-engineering/module-03.html directly not work (Scenario D). */

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; path: string[] }> }
) {
  const { courseId, path: pathSegments } = await params;

  const course = getCourse(courseId);
  if (!course || !course.published) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Strip .html before auth so a bookmark like /dashboard.html signs the
  // student back into /dashboard, not a callback that still carries .html.
  const lastSegment = pathSegments[pathSegments.length - 1] ?? "";
  if (lastSegment.toLowerCase().endsWith(".html")) {
    const canonicalSegments = [...pathSegments.slice(0, -1), lastSegment.slice(0, -".html".length)];
    const canonicalUrl = new URL(`/courses/${courseId}/${canonicalSegments.join("/")}`, request.url);
    canonicalUrl.search = request.nextUrl.search;
    return NextResponse.redirect(canonicalUrl, 308);
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const entitled = userId ? await hasCourseAccess(userId, courseId) : false;
  const decision = decideCourseAccess({
    coursePublished: true,
    userId,
    entitled,
  });
  if (decision.action === "redirect-sign-in") {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/sign-in?callbackUrl=${callbackUrl}`, request.url));
  }
  if (decision.action === "redirect-landing") {
    return NextResponse.redirect(new URL(`/courses/${courseId}`, request.url));
  }
  if (decision.action !== "serve") {
    return new NextResponse("Not found", { status: 404 });
  }

  // Path-traversal guard: the resolved path must stay inside contentDir no
  // matter what the URL segments say (e.g. "..", encoded separators).
  const baseDir = path.resolve(process.cwd(), course.contentDir);
  let resolved = path.resolve(baseDir, ...pathSegments);
  if (resolved !== baseDir && !resolved.startsWith(baseDir + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  // A page request has no extension on disk — every actual asset (.js,
  // .css, .json, images, datasets) is already requested with its real
  // extension and skips this.
  if (!path.extname(resolved)) {
    resolved = `${resolved}.html`;
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = await readFile(resolved);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(resolved).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  // Server-render the sidebar shell into the page itself instead of letting
  // client JS tear down and rebuild the whole DOM on every navigation (the
  // root cause of the old sidebar flicker). The rail's static parts — nav
  // links, module list, which one is "active" — are fully knowable here:
  // the URL is already resolved. Only completion/lock state (localStorage)
  // still needs client hydration, patching classes onto elements that
  // already exist rather than constructing them.
  let responseBody: Buffer | string = fileBuffer;
  if (ext === ".html") {
    const dirName = path.basename(course.contentDir);
    const currentFile = fileNameFromPath(resolved);
    responseBody = wrapCoursePage(fileBuffer.toString("utf-8"), dirName, currentFile);
  }

  // The shared "lab chrome" (course-progress.js, course-rail.js,
  // course-ui.js, zenith-lab.css, theme.css, datasets, images) is byte-
  // identical across every page of a course, but with no cache header at
  // all every single page navigation re-ran this route's full session +
  // DB entitlement check AND re-downloaded all of it from scratch — a real
  // contributor to page-to-page transitions feeling slow, on top of the
  // sidebar itself being torn down and rebuilt by JS on every load (this is
  // a static multi-page course, not a client-side-routed SPA, so a full
  // reload is inherent; this at least removes the redundant re-fetching).
  // "private" (never a shared/CDN cache, only the entitled student's own
  // browser) since this route is auth-gated — a shared cache serving this
  // response to a different, unauthenticated request would leak paid
  // content. HTML/JSON stay effectively uncached since they're the actual
  // lesson content, which changes as the course is edited.
  const isSharedAsset = ext === ".js" || ext === ".css" || ext === ".svg" || ext === ".webp" || ext === ".png";
  const cacheControl = isSharedAsset
    ? "private, max-age=3600"
    : "private, max-age=0, must-revalidate";

  return new NextResponse(responseBody as unknown as BodyInit, {
    status: 200,
    headers: { "content-type": contentType, "cache-control": cacheControl },
  });
}
