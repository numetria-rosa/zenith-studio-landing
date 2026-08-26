import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { COURSES } from "@/lib/courses";
import { getCheckoutUrl } from "@/lib/courses";
import { summarizeProgress } from "@/lib/course-progress-math";
import { getService, SERVICE_STATUSES, SERVICE_STATUS_LABELS } from "@/lib/services";

/* Phase 8 dashboard, as a real Next.js Server Component — the role
   courses/ai-engineering/dashboard.html can't safely fill, since a static
   file can't read an HttpOnly session cookie or query Postgres. This is the
   entry point after sign-in; "Continue" drops the student into the guarded
   in-course dashboard, which keeps working exactly as it always has. */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=%2Fdashboard");

  const entitlements = await db.courseEntitlement.findMany({
    where: { userId: session.user.id, status: "active" },
  });
  const ownedIds = new Set(entitlements.map((e) => e.courseId));

  const progressRows = await db.courseProgress.findMany({
    where: { userId: session.user.id, courseId: { in: Array.from(ownedIds) } },
  });
  const progressByCourse = new Map(progressRows.map((r) => [r.courseId, summarizeProgress(r.data)]));

  const owned = COURSES.filter((c) => ownedIds.has(c.id));
  const available = COURSES.filter((c) => c.published && !ownedIds.has(c.id));

  const serviceRequests = await db.serviceRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <header className="border-b border-white/10 px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/icon.webp" alt="Zenith Studio" className="h-8 w-8 rounded-xl" />
          <span className="text-sm font-semibold tracking-wide">ZENITH LAB</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/profile" className="text-sm text-white/60 hover:text-white transition">
            Profile
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="text-sm text-white/60 hover:text-white transition">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back{session.user.email ? `, ${session.user.email}` : ""}
        </h1>

        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">My courses</h2>
          {owned.length === 0 ? (
            <p className="text-white/50 text-sm">
              You don&apos;t own any courses yet. Browse what&apos;s available below.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {owned.map((course) => {
                const progress = progressByCourse.get(course.id) ?? { completed: 0, total: 8, pct: 0 };
                return (
                  <div key={course.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                    <h3 className="text-lg font-semibold">{course.title}</h3>
                    <p className="mt-1 text-sm text-white/50">
                      Progress: {progress.completed}/{progress.total} modules — {progress.pct}%
                    </p>
                    <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${progress.pct}%` }} />
                    </div>
                    <a
                      href={`/courses/${course.id}/${course.firstLessonPath}`}
                      className="mt-5 inline-block rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
                    >
                      Continue course →
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {available.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">Available courses</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {available.map((course) => {
                const { url } = getCheckoutUrl(course);
                return (
                  <div key={course.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <h3 className="text-lg font-semibold">{course.title}</h3>
                    <p className="mt-1 text-sm text-white/50">{course.description}</p>
                    <a
                      href={url}
                      target={url.startsWith("mailto:") ? undefined : "_blank"}
                      rel={url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                      className="mt-5 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Get access →
                    </a>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {serviceRequests.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">My service requests</h2>
            <div className="flex flex-col gap-4">
              {serviceRequests.map((r) => {
                const service = getService(r.serviceId);
                const stageIndex = SERVICE_STATUSES.indexOf(r.status as (typeof SERVICE_STATUSES)[number]);
                const monthlyLabel =
                  r.monthlyStatus === "active"
                    ? "Active"
                    : r.monthlyStatus === "canceled"
                      ? "Payment lapsed"
                      : "Not subscribed yet";
                return (
                  <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-lg font-semibold">{service?.title ?? r.serviceId}</h3>
                      <span className="text-xs text-white/40">Monthly: {monthlyLabel}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-1">
                      {SERVICE_STATUSES.map((s, i) => (
                        <div key={s} className="flex flex-1 items-center gap-1">
                          <div
                            className={`h-1.5 flex-1 rounded-full ${i <= stageIndex ? "bg-emerald-400" : "bg-white/10"}`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-white/70">
                      Current stage: <span className="font-semibold">{SERVICE_STATUS_LABELS[r.status as (typeof SERVICE_STATUSES)[number]] ?? r.status}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
