import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasCourseAccess } from "@/lib/entitlements";
import { validateProgressPayload } from "@/lib/progress-shape";
import { getCourse } from "@/lib/courses";

/* Server-authoritative progress storage (Phase 10/11). The client's
   course-progress.js talks to this instead of localStorage directly once
   authenticated. Never trusts a client-supplied userId — always derives it
   from the session. */

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("unauthorized", { status: 401 });

  const courseId = new URL(request.url).searchParams.get("courseId");
  if (!courseId || !getCourse(courseId)) return new Response("unknown course", { status: 400 });

  if (!(await hasCourseAccess(session.user.id, courseId))) {
    return new Response("forbidden", { status: 403 });
  }

  const row = await db.courseProgress.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });

  return Response.json({ data: row?.data ?? { modules: {}, extra: {} } });
}

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

  const jsonData = validated.data as Prisma.InputJsonValue;
  await db.courseProgress.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    create: { userId: session.user.id, courseId, data: jsonData },
    update: { data: jsonData },
  });

  return new Response("OK", { status: 200 });
}
