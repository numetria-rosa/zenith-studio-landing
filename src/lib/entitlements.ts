import { db } from "@/lib/db";

/** The one place "does user X own course Y" gets answered. Every guard/API
    route asking this question goes through here — never re-derives it from
    a client-supplied flag. */
export async function hasCourseAccess(userId: string, courseId: string): Promise<boolean> {
  const entitlement = await db.courseEntitlement.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  return !!entitlement && entitlement.status === "active";
}

export async function getUserEntitlements(userId: string) {
  return db.courseEntitlement.findMany({
    where: { userId, status: "active" },
    orderBy: { grantedAt: "asc" },
  });
}
