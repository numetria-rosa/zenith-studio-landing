import { redirect } from "next/navigation";
import { GraduationCap, Briefcase, LogOut, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { CourseBar } from "@/components/CourseBar";
import { courseFontVars } from "@/lib/fonts";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { COURSES } from "@/lib/courses";
import { getCheckoutUrl } from "@/lib/courses";
import { summarizeProgress } from "@/lib/course-progress-math";
import { getService, SERVICE_STATUSES, SERVICE_STATUS_LABELS } from "@/lib/services";
import { FolderKanban, PhoneCall } from "lucide-react";
import { listPaidAuditsForUser, PAID_AUDIT_STATUS_LABELS } from "@/lib/paid-audit";
import { computeApprovedTotals, whopCheckoutUrl } from "@/lib/proposal-payments";

/* The Next.js Server Component entry point after sign-in — the role
   courses/ai-engineering/dashboard.html can't safely fill, since a static
   file can't read an HttpOnly session cookie or query Postgres. "Continue"
   drops the student into the guarded in-course dashboard. Styling matches
   the static course pages (Fraunces/IBM Plex, amber accent, card language)
   rather than /lab's own marketing-page look — this is the page a paying
   student actually lands on, so it should feel like the course product. */
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

  // Slice 6 (2026-08-28) — minimal client-facing visibility for
  // ServiceProject. Scoped to the signed-in user only, never a
  // client-supplied id. A full per-project detail page (tabs, requirements
  // detail, messages, etc.) is Slice 7 — this just proves the project is
  // visible to the client who now owns it.
  const serviceProjects = await db.serviceProject.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { requirements: { where: { status: "MISSING" } } } },
      // Payment surfacing (2026-08-28 addition) — same fields
      // /proposals/view/[accessToken] uses to show "Complete your
      // payment", so a client sees the exact same deferred-monthly
      // checkout here without having to dig up their original proposal
      // link once an admin has marked the project LIVE.
      proposal: {
        select: {
          whopMonthlyPlanId: true,
          monthlyPaidAt: true,
          paymentMode: true,
          selectedAddOnItemIds: true,
          items: { select: { id: true, amountCents: true, isOptionalAddOn: true, kind: true } },
        },
      },
    },
  });

  // Client-facing visibility for their own $35 paid audit call bookings
  // (manually tracked by an admin — see src/lib/paid-audit.ts). Scoped to
  // the signed-in user only, never a client-supplied id.
  const paidAudits = await listPaidAuditsForUser(session.user.id);

  // A signed-in user who owns no course but has bought an AI Systems service
  // shouldn't land on a page that brands itself "Zenith Lab" — see CourseBar's
  // own comment. Course owners (with or without services too) keep the Lab brand.
  const brand = owned.length > 0 ? "lab" : "studio";

  return (
    <div
      className={`${courseFontVars} min-h-screen bg-[#0d0f14] font-[family-name:var(--font-course-sans)] text-[#eeeee7]`}
    >
      <CourseBar
        tag="Dashboard"
        brand={brand}
        right={
          <>
            <Link
              href="/profile"
              className="hidden font-[family-name:var(--font-course-mono)] text-xs uppercase tracking-[0.08em] text-[#9aa0ae] transition hover:text-[#eeeee7] sm:inline"
            >
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
                className="flex items-center gap-1.5 rounded-lg border border-[#333a4c] bg-[#191d26] px-3 py-1.5 font-[family-name:var(--font-course-sans)] text-xs font-semibold text-[#eeeee7] transition hover:border-[#f0b429] hover:text-[#f0b429]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Sign out
              </button>
            </form>
          </>
        }
      />

      <main className="mx-auto max-w-[980px] px-6 pb-20 pt-12">
        <div className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#f0b429]">
          {brand === "lab" ? "Zenith Lab · Dashboard" : "Zenith Studio · Dashboard"}
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-course-serif)] text-[clamp(28px,4.5vw,40px)] font-semibold leading-[1.1] tracking-[-0.02em]">
          Welcome back{session.user.name ? `, ${session.user.name}` : ""}
        </h1>
        {session.user.email && <p className="mt-3 max-w-[640px] text-[15.5px] text-[#9aa0ae]">{session.user.email}</p>}

        {serviceRequests.length > 0 && brand === "studio" && (
          <section className="mt-9">
            <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
              My service requests
            </div>
            <div className="mt-3 flex flex-col gap-3.5">
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
                  <div key={r.id} className="rounded-xl border border-[#232838] bg-[#151920] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#333a4c] bg-[#191d26]">
                          <Briefcase className="h-4 w-4 text-[#9aa0ae]" aria-hidden />
                        </div>
                        <span className="text-[15.5px] font-bold">{service?.title ?? r.serviceId}</span>
                      </div>
                      <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                        Monthly: {monthlyLabel}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5">
                      {SERVICE_STATUSES.map((s, i) => (
                        <div
                          key={s}
                          className={`h-1.5 flex-1 rounded-full ${i <= stageIndex ? "bg-[#f0b429]" : "border border-[#232838] bg-[#0a0c10]"}`}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-[13px] text-[#9aa0ae]">
                      Current stage:{" "}
                      <span className="font-semibold text-[#eeeee7]">
                        {SERVICE_STATUS_LABELS[r.status as (typeof SERVICE_STATUSES)[number]] ?? r.status}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {paidAudits.length > 0 && (
          <section className="mt-9">
            <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
              My paid audit calls
            </div>
            <div className="mt-3 flex flex-col gap-3.5">
              {paidAudits.map((a) => (
                <div key={a.id} className="rounded-xl border border-[#232838] bg-[#151920] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#333a4c] bg-[#191d26]">
                        <PhoneCall className="h-4 w-4 text-[#9aa0ae]" aria-hidden />
                      </div>
                      <span className="text-[15.5px] font-bold">20-Minute Automation Audit Call</span>
                    </div>
                    <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                      {PAID_AUDIT_STATUS_LABELS[a.status]}
                    </span>
                  </div>
                  {a.scheduledAt && (
                    <p className="mt-3 text-[13px] text-[#9aa0ae]">
                      Scheduled for{" "}
                      <span className="font-semibold text-[#eeeee7]">
                        {a.scheduledAt.toISOString().slice(0, 16).replace("T", " ")}
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-9">
          <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
            My courses
          </div>
          {owned.length === 0 ? (
            <div className="mt-3 rounded-xl border border-[#232838] bg-[#151920] p-5">
              <p className="text-sm text-[#9aa0ae]">
                You don&apos;t own any courses yet. Browse what&apos;s available below.
              </p>
            </div>
          ) : (
            <div className="mt-3 grid gap-3.5">
              {owned.map((course) => {
                const progress = progressByCourse.get(course.id) ?? { completed: 0, total: 8, pct: 0 };
                return (
                  <div
                    key={course.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-[#232838] bg-[#151920] p-5 transition hover:border-[#333a4c] sm:flex-nowrap"
                  >
                    <div className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[10px] border border-[#333a4c] bg-[#191d26]">
                      <GraduationCap className="h-5 w-5 text-[#f0b429]" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15.5px] font-bold">{course.title}</div>
                      <div className="mt-1 text-[13px] text-[#9aa0ae]">
                        {progress.completed}/{progress.total} modules · {progress.pct}% complete
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full border border-[#232838] bg-[#0a0c10]">
                        <div
                          className={`h-full rounded-full ${progress.pct >= 100 ? "bg-[#4ade95]" : "bg-[#f0b429]"}`}
                          style={{ width: `${progress.pct}%` }}
                        />
                      </div>
                    </div>
                    <a
                      href={`/courses/${course.id}/${course.firstLessonPath}`}
                      className="inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#f0b429] px-4 py-2 text-[13px] font-bold text-[#1a1200] transition hover:brightness-110"
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
          <section className="mt-11">
            <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
              Available courses
            </div>
            <div className="mt-3 grid gap-3.5 md:grid-cols-2">
              {available.map((course) => {
                const { url } = getCheckoutUrl(course);
                return (
                  <div
                    key={course.id}
                    className="rounded-xl border border-[#232838] bg-[#151920] p-5 transition hover:border-[#333a4c]"
                  >
                    <div className="text-[15.5px] font-bold">{course.title}</div>
                    <p className="mt-2 text-[13px] leading-6 text-[#9aa0ae]">{course.description}</p>
                    <a
                      href={url}
                      target={url.startsWith("mailto:") ? undefined : "_blank"}
                      rel={url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#333a4c] bg-[#191d26] px-4 py-2 text-[13px] font-semibold text-[#eeeee7] transition hover:border-[#f0b429] hover:text-[#f0b429]"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
                      Get access
                    </a>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {serviceProjects.length > 0 && (
          <section className="mt-11">
            <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
              My projects
            </div>
            <div className="mt-3 flex flex-col gap-3.5">
              {serviceProjects.map((p) => {
                const missingCount = p._count.requirements;

                // SPLIT-mode deferred monthly checkout: only ever exists
                // once an admin has moved this project to LIVE (see
                // updateProjectStage in service-projects-admin.ts). Same
                // computeApprovedTotals call the proposal page itself
                // uses, so the amount shown here can't drift from what
                // was actually quoted and approved.
                const proposal = p.proposal;
                const selectedAddOnIds = Array.isArray(proposal?.selectedAddOnItemIds)
                  ? (proposal.selectedAddOnItemIds as string[])
                  : [];
                const monthlyCents = proposal ? computeApprovedTotals(proposal.items, selectedAddOnIds).monthlyCents : 0;
                const showMonthlyPay = !!(proposal?.whopMonthlyPlanId && !proposal.monthlyPaidAt && monthlyCents > 0);

                return (
                  <div key={p.id} className="rounded-xl border border-[#232838] bg-[#151920] p-5 transition hover:border-[#333a4c]">
                    <Link href={`/lab/dashboard/services/${p.id}`} className="block">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#333a4c] bg-[#191d26]">
                            <FolderKanban className="h-4 w-4 text-[#9aa0ae]" aria-hidden />
                          </div>
                          <span className="text-[15.5px] font-bold">{p.title}</span>
                        </div>
                        <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                          Stage: {p.stage.replace(/_/g, " ")}
                        </span>
                      </div>
                      {missingCount > 0 && (
                        <p className="mt-3 text-[13px] text-[#9aa0ae]">
                          <span className="font-semibold text-[#f0b429]">{missingCount}</span>{" "}
                          {missingCount === 1 ? "item" : "items"} still needed from you
                        </p>
                      )}
                    </Link>
                    {showMonthlyPay && (
                      <a
                        href={whopCheckoutUrl(proposal!.whopMonthlyPlanId!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-[#f0b429]/40 bg-[#f0b429]/10 px-4 py-2 text-xs font-semibold text-[#f0b429] transition hover:bg-[#f0b429]/20"
                      >
                        Pay ${(monthlyCents / 100).toFixed(0)}/mo. Your build is live
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {serviceRequests.length > 0 && brand === "lab" && (
          <section className="mt-11">
            <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
              My service requests
            </div>
            <div className="mt-3 flex flex-col gap-3.5">
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
                  <div key={r.id} className="rounded-xl border border-[#232838] bg-[#151920] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#333a4c] bg-[#191d26]">
                          <Briefcase className="h-4 w-4 text-[#9aa0ae]" aria-hidden />
                        </div>
                        <span className="text-[15.5px] font-bold">{service?.title ?? r.serviceId}</span>
                      </div>
                      <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                        Monthly: {monthlyLabel}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5">
                      {SERVICE_STATUSES.map((s, i) => (
                        <div
                          key={s}
                          className={`h-1.5 flex-1 rounded-full ${i <= stageIndex ? "bg-[#f0b429]" : "border border-[#232838] bg-[#0a0c10]"}`}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-[13px] text-[#9aa0ae]">
                      Current stage:{" "}
                      <span className="font-semibold text-[#eeeee7]">
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
