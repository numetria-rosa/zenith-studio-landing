import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { decideCourseAccess } from "@/lib/course-access";
import { getCourse } from "@/lib/courses";
import { hasCourseAccess } from "@/lib/entitlements";

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

  return new NextResponse(fileBuffer as unknown as BodyInit, {
    status: 200,
    headers: { "content-type": contentType },
  });
}
