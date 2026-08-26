import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Briefcase, CircleUser, LogOut, Trophy } from "lucide-react";
import { GlowBackdrop } from "@/components/GlowBackdrop";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { COURSES } from "@/lib/courses";
import { getCheckoutUrl } from "@/lib/courses";
import { summarizeProgress } from "@/lib/course-progress-math";
import { getService, SERVICE_STATUSES, SERVICE_STATUS_LABELS } from "@/lib/services";

/* The Next.js Server Component entry point after sign-in — the role
   courses/ai-engineering/dashboard.html can't safely fill, since a static
   file can't read an HttpOnly session cookie or query Postgres. "Continue"
   drops the student into the guarded in-course dashboard, which keeps
   working exactly as it always has. Styling matches /lab's card/pill/glow
   language so this reads as the same product, not a bolted-on admin page. */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=%2Flab%2Fdashboard");

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
    <div className="min-h-screen bg-[#05060a] text-white overflow-x-hidden">
      <GlowBackdrop />

      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-10 pt-4">
        <div className="mx-auto max-w-6xl rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(52,211,153,0.10)]">
          <div className="flex items-center justify-between px-5 sm:px-7 py-4">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/icon.webp"
                alt="Zenith Studio"
                className="h-9 w-9 rounded-2xl shadow-[0_0_30px_rgba(110,95,255,0.55)]"
              />
              <div>
                <div className="text-sm tracking-[0.35em] text-white/60 uppercase">Zenith</div>
                <div className="text-base font-semibold -mt-0.5">Lab</div>
              </div>
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/profile"
                className="hidden items-center gap-1.5 text-sm text-white/70 transition hover:text-white sm:flex"
              >
                <CircleUser className="h-4 w-4" aria-hidden />
                Profile
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-emerald-200/90 backdrop-blur-xl">
          Zenith Lab · Dashboard
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Welcome back{session.user.name ? `, ${session.user.name}` : ""}
        </h1>
        {session.user.email && <p className="mt-2 text-sm text-white/50">{session.user.email}</p>}

        <section className="mt-12">
          <div className="mb-5 text-xs uppercase tracking-[0.3em] text-emerald-200/70">My courses</div>
          {owned.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
              <p className="text-sm text-white/60">
                You don&apos;t own any courses yet. Browse what&apos;s available below.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {owned.map((course) => {
                const progress = progressByCourse.get(course.id) ?? { completed: 0, total: 8, pct: 0 };
                return (
                  <div
                    key={course.id}
                    className="rounded-[28px] border border-emerald-300/30 bg-emerald-400/[0.05] p-7 backdrop-blur-xl shadow-[0_0_50px_rgba(52,211,153,0.08)]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300/30 via-teal-500/25 to-cyan-500/30 shadow-[0_0_30px_rgba(52,211,153,0.16)]">
                      <GraduationCap className="h-5 w-5 text-emerald-100" aria-hidden />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">{course.title}</h3>
                    <p className="mt-2 text-sm text-white/60">
                      {progress.completed}/{progress.total} modules · {progress.pct}% complete
                    </p>
                    <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300"
                        style={{ width: `${progress.pct}%` }}
                      />
                    </div>
                    <a
                      href={`/courses/${course.id}/${course.firstLessonPath}`}
                      className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
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
          <section className="mt-14">
            <div className="mb-5 text-xs uppercase tracking-[0.3em] text-emerald-200/70">Available courses</div>
            <div className="grid gap-5 md:grid-cols-2">
              {available.map((course) => {
                const { url } = getCheckoutUrl(course);
                return (
                  <div
                    key={course.id}
                    className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.06]"
                  >
                    <h3 className="text-xl font-semibold tracking-[-0.02em]">{course.title}</h3>
                    <p className="mt-2.5 text-sm leading-7 text-white/60">{course.description}</p>
                    <a
                      href={url}
                      target={url.startsWith("mailto:") ? undefined : "_blank"}
                      rel={url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                      className="mt-6 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
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
          <section className="mt-14">
            <div className="mb-5 text-xs uppercase tracking-[0.3em] text-emerald-200/70">My service requests</div>
            <div className="flex flex-col gap-5">
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
                  <div
                    key={r.id}
                    className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                          <Briefcase className="h-4 w-4 text-white/70" aria-hidden />
                        </div>
                        <h3 className="text-lg font-semibold tracking-[-0.02em]">{service?.title ?? r.serviceId}</h3>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/55">
                        Monthly: {monthlyLabel}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center gap-1.5">
                      {SERVICE_STATUSES.map((s, i) => (
                        <div key={s} className="flex flex-1 items-center gap-1.5">
                          <div
                            className={`h-1.5 flex-1 rounded-full ${
                              i <= stageIndex
                                ? "bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300"
                                : "bg-white/10"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-white/70">
                      <Trophy className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
                      Current stage:{" "}
                      <span className="font-semibold text-white">
                        {SERVICE_STATUS_LABELS[r.status as (typeof SERVICE_STATUSES)[number]] ?? r.status}
                      </span>
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
