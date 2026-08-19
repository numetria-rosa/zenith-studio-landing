import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasCourseAccess } from "@/lib/entitlements";
import { validateProgressPayload } from "@/lib/progress-shape";
import { getCourse } from "@/lib/courses";

/* One-time import of a student's pre-existing localStorage progress
   (Phase 19). Only ever writes if no server row exists yet for this
   user+course — a malicious or stale client payload can never overwrite
   real server-side progress, it can only fill an empty slot. */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("unauthorized", { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("invalid JSON", { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("courseId" in body) || !("data" in body)) {
    return new Response("expected { courseId, data }", { status: 400 });
  }
  const { courseId, data } = body as { courseId: unknown; data: unknown };
  if (typeof courseId !== "string" || !getCourse(courseId)) {
    return new Response("unknown course", { status: 400 });
  }

  if (!(await hasCourseAccess(session.user.id, courseId))) {
    return new Response("forbidden", { status: 403 });
  }

  const validated = validateProgressPayload(data);
  if (!validated.ok) return new Response(validated.error, { status: 422 });

  const existing = await db.courseProgress.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (existing) {
    return Response.json({ migrated: false, reason: "server progress already exists, import skipped" });
  }

  await db.courseProgress.create({
    data: { userId: session.user.id, courseId, data: validated.data as Prisma.InputJsonValue },
  });

  return Response.json({ migrated: true });
}
