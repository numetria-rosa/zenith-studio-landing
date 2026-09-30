import Link from "next/link";
import { PageHeader } from "@/components/account/AccountShell";
import { Button } from "@/components/obsidian/Button";
import { Icon, type IconName } from "@/components/obsidian/Icon";
import { ProgressBar } from "@/components/obsidian/ProgressBar";
import { loadStudentSpace, type OwnedCourse } from "@/lib/account/data";
import { type ActivityKind, timeAgo } from "@/lib/account/stats";
import { auth } from "@/lib/auth";
import { getCourse, launchLabel } from "@/lib/courses";

const MONO = "font-mono uppercase tracking-[0.14em]";
const CATALOGUE = "/lab";

const STATUS = {
  owned: { label: "OWNED", color: "#C9CCD4", box: "border-white/[0.18] bg-white/[0.06]" },
  locked: { label: "LOCKED", color: "#FFD27A", box: "border-[rgba(245,184,61,0.4)] bg-[rgba(245,184,61,0.10)]" },
  "in-progress": { label: "IN PROGRESS", color: "#5CC8FF", box: "border-[rgba(92,200,255,0.4)] bg-[rgba(92,200,255,0.10)]" },
  "not-started": { label: "NOT STARTED", color: "#C9CCD4", box: "border-white/[0.18] bg-white/[0.06]" },
  completed: { label: "COMPLETED", color: "#7FF0BD", box: "border-[rgba(61,220,151,0.5)] bg-[rgba(61,220,151,0.10)]" },
} as const;

const ACTIVITY_ICON: Record<ActivityKind, { icon: IconName; color: string }> = {
  lesson: { icon: "check", color: "#7FF0BD" },
  quiz: { icon: "check", color: "#7FF0BD" },
  exercise: { icon: "code", color: "#5CC8FF" },
};

export default async function MyCourses() {
  const session = await auth();
  const s = await loadStudentSpace(session!.user!.id!);
  const first = s.user.name.split(/\s+/)[0]!;

  return (
    <>
      <PageHeader
        eyebrow="Student space"
        title={`Welcome back, ${first}.`}
        subtitle="Pick up where you left off, or open any course you own. Everything you bought stays here, for good."
        action={<Button href={CATALOGUE} variant="glass" size="md" arrow>Browse courses</Button>}
      />

      <Hero hero={s.hero} />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Stat icon="grid" color="#C7B0FF" value={s.stats.coursesOwned} label={s.stats.coursesOwned === 1 ? "course owned" : "courses owned"} />
        <Stat icon="check" color="#7FF0BD" value={s.stats.lessonsDone} label="lessons completed" />
        <Stat icon="quiz" color="#5CC8FF" value={s.stats.quizzesPassed} label="quizzes passed" />
        <Stat icon="flame" color="#FFD27A" value={`${s.stats.streak} ${s.stats.streak === 1 ? "day" : "days"}`} label="learning streak" />
      </div>

      <div className="flex flex-col items-stretch gap-7 xl:flex-row xl:items-start">
        <section aria-labelledby="my-courses" className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 id="my-courses" className="m-0 text-[28px] font-medium tracking-[-0.025em]">My courses</h2>
            <span className="text-[14px] text-mist">{s.courses.length} owned</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
            {s.courses.map((c) => <CourseCard key={c.id} course={c} />)}
            <Link
              href={CATALOGUE}
              className="col-span-full flex items-center gap-[18px] rounded-[22px] border-[1.5px] border-dashed border-white/[0.16] px-6 py-[22px] text-frost no-underline hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
            >
              <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.05]">
                <Icon name="plus" size={22} strokeWidth={2} />
              </span>
              <span className="flex flex-col gap-0.5">
                <b className="text-[17px] font-medium">Explore more courses</b>
                <span className="text-[14px] leading-normal text-mist">New courses from Zenith Studio show up here.</span>
              </span>
            </Link>
          </div>
        </section>

        <aside className="flex w-full shrink-0 flex-col gap-4 xl:w-[340px]">
          <div className="glass rounded-3xl p-[22px]">
            <span className={`${MONO} text-[11.5px] text-dim`}>Recent activity</span>
            {s.activity.length === 0 ? (
              <p className="m-0 pt-3.5 text-[14.5px] text-mist">Your activity will show up here.</p>
            ) : (
              s.activity.map((a, i) => (
                <div key={i} className={`flex items-center gap-3.5 py-3.5 ${i > 0 ? "border-t border-white/[0.06]" : ""}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-white/10 bg-white/[0.04]">
                    <Icon name={ACTIVITY_ICON[a.kind].icon} size={17} color={ACTIVITY_ICON[a.kind].color} />
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[14.5px]">{a.title}</span>
                    <span className="text-[12.5px] text-mist">{[a.detail, timeAgo(a.at)].filter(Boolean).join(" · ")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex flex-col gap-3 rounded-3xl border border-[rgba(245,184,61,0.30)] bg-[linear-gradient(135deg,rgba(245,184,61,0.08),rgba(255,255,255,0.02))] p-[22px]">
            <div className="flex items-center justify-between">
              <span className={`${MONO} text-[11.5px] text-amber-text`}>Certificate</span>
              <Icon name="shield" size={18} color="#FFD27A" />
            </div>
            <b className="text-[18px] font-medium tracking-[-0.01em]">AI Engineering certificate</b>
            <span className="text-[14px] leading-[1.55] text-mist">Unlocks when you pass the capstone. It goes straight into your portfolio.</span>
            <ProgressBar percent={s.capstonePercent} color="#FFD27A" label="Progress toward the capstone" />
          </div>
        </aside>
      </div>
    </>
  );
}

function Hero({ hero }: { hero: Awaited<ReturnType<typeof loadStudentSpace>>["hero"] }) {
  if (!hero) {
    return (
      <section className="relative overflow-hidden rounded-[30px] border border-[rgba(199,176,255,0.30)] bg-[linear-gradient(135deg,rgba(139,92,246,0.16),rgba(59,107,255,0.08)_60%,rgba(255,255,255,0.02))] p-8 lg:px-10 lg:py-9">
        <span className={`${MONO} text-[12.5px] text-violet-text`}>Get started</span>
        <h2 className="m-0 mt-4 text-[32px] font-medium leading-[1.08] tracking-[-0.035em] lg:text-[38px]">Start your first course</h2>
        <p className="mt-4 max-w-[520px] text-[16px] leading-[1.6] text-soft">Courses you buy appear here with your progress, ready to resume.</p>
        <div className="mt-5"><Button href={CATALOGUE} size="md" arrow>Browse courses</Button></div>
      </section>
    );
  }
  return (
    <section className="relative grid items-center gap-8 overflow-hidden rounded-[30px] border border-[rgba(199,176,255,0.30)] bg-[linear-gradient(135deg,rgba(139,92,246,0.16),rgba(59,107,255,0.08)_60%,rgba(255,255,255,0.02))] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10 lg:px-10 lg:py-9">
      <div aria-hidden className="pointer-events-none absolute -right-[120px] -top-[200px] h-[560px] w-[560px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.35), rgba(139,92,246,0) 62%)" }} />
      <div className="relative flex flex-col gap-4">
        <span className={`${MONO} text-[12.5px] text-violet-text`}>Continue learning · {hero.courseTitle}</span>
        <h2 className="m-0 text-[32px] font-medium leading-[1.08] tracking-[-0.035em] lg:text-[38px]">Module {hero.moduleNumber} · {hero.moduleTitle}</h2>
        <p className="m-0 text-[16px] leading-[1.6] text-soft">Up next: lesson {hero.lessonNumber} · {hero.lessonMinutes} min.</p>
        <div className="flex max-w-[520px] items-center gap-3.5">
          <div className="flex-1"><ProgressBar percent={hero.percent} color="linear-gradient(90deg,#8B5CF6,#5CC8FF)" label={`${hero.courseTitle} progress`} /></div>
          <span className="font-mono text-[13px] text-soft">{hero.percent}%</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-3">
          <Button href={hero.resumeHref} size="md" arrow>Resume lesson {hero.lessonNumber}</Button>
          <Button href={hero.courseHref} variant="glass" size="md">Open course</Button>
        </div>
      </div>
      <div className="relative flex flex-col gap-3 rounded-[22px] border border-white/10 bg-[rgba(5,6,10,0.55)] p-5">
        <span className={`${MONO} text-[11px] text-dim`}>This module</span>
        {hero.lessons.map((l) => (
          <div key={l.number} className={`flex items-center gap-3 text-[14.5px] ${l.state === "next" ? "text-mist" : "text-frost"}`}>
            {l.state === "done" ? (
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[rgba(61,220,151,0.5)] bg-[rgba(61,220,151,0.14)]"><Icon name="check" size={11} color="#7FF0BD" strokeWidth={2.8} /></span>
            ) : l.state === "current" ? (
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] border-cyan shadow-[0_0_10px_rgba(92,200,255,0.5)]"><span className="h-1.5 w-1.5 rounded-full bg-cyan" /></span>
            ) : (
              <span className="h-[22px] w-[22px] rounded-full border border-white/[0.18]" />
            )}
            <span className="min-w-0 flex-1 truncate">{l.number} {l.title}</span>
            <span className="font-mono text-[12px] text-mist">{l.minutes}m</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ icon, color, value, label }: { icon: IconName; color: string; value: string | number; label: string }) {
  return (
    <div className="glass flex items-center gap-4 rounded-[22px] px-[22px] py-5">
      <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-white/[0.04]" style={{ border: `1px solid ${color}` }}>
        <Icon name={icon} size={21} color={color} />
      </span>
      <div className="flex flex-col gap-0.5">
        <b className="text-[28px] font-medium leading-[1.1] tracking-[-0.03em]">{value}</b>
        <span className="text-[13.5px] text-mist">{label}</span>
      </div>
    </div>
  );
}

function CourseCard({ course: c }: { course: OwnedCourse }) {
  const st = STATUS[c.status];
  const locked = c.status === "locked";
  const cta = c.status === "not-started" ? "Start course" : c.status === "owned" ? "Open course" : "Continue";
  const launch = locked ? launchLabel(getCourse(c.id) ?? {}) : "";
  return (
    <div className={`glass flex h-full min-w-0 flex-col gap-[18px] rounded-[26px] p-5 sm:p-6 ${locked ? "opacity-90" : ""}`}>
      <div className="relative h-36 shrink-0 overflow-hidden rounded-[18px] border border-white/[0.08]" style={{ background: `linear-gradient(135deg, ${c.cover}, rgba(10,11,16,0.9))`, filter: locked ? "saturate(0.45)" : undefined }}>
        <div aria-hidden className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px]" />
        <span aria-hidden className="absolute bottom-4 left-5 right-5 line-clamp-3 text-[22px] font-medium leading-[1.15] tracking-[-0.03em]">{c.title}</span>
        <span className={`absolute right-3.5 top-3.5 inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border px-3 py-[5px] font-mono text-[12px] tracking-[0.08em] ${st.box}`} style={{ color: st.color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
          {st.label}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {c.edition && <span className={`${MONO} text-[11.5px]`} style={{ color: c.accent }}>{c.edition}</span>}
        <b className="text-[21px] font-medium tracking-[-0.02em]">{c.title}</b>
        <span className="text-[14px] text-mist">{c.meta}</span>
      </div>
      {c.percent !== null && (
        <div className="flex items-center gap-3">
          <div className="flex-1"><ProgressBar percent={c.percent} color={c.accent} label={`${c.title} progress`} /></div>
          <span className="font-mono text-[12.5px] text-soft">{c.percent}%</span>
        </div>
      )}
      <div className="mt-auto flex flex-col gap-3 pt-1">
        <span className="text-[13px] text-dim">
          {c.lastOpened ? `Last opened ${timeAgo(c.lastOpened)}` : `Purchased ${c.purchasedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
        </span>
        {locked ? (
          <span aria-disabled className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-full border border-[rgba(245,184,61,0.35)] bg-[rgba(245,184,61,0.08)] px-[22px] text-[15px] font-medium text-amber-text">
            <Icon name="lock" size={16} />
            Launches {launch}
          </span>
        ) : (
        <div className="[&>a]:w-full [&>a]:whitespace-nowrap"><Button href={c.href} variant={c.status === "not-started" || c.status === "owned" ? "glass" : "primary"} size="md" arrow>{cta}</Button></div>
        )}
      </div>
    </div>
  );
}
