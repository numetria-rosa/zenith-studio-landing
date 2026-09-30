import { COURSES, courseHomeUrl, isLaunched, launchLabel } from "@/lib/courses";
import { db } from "@/lib/db";
import { getUserEntitlements } from "@/lib/entitlements";
import { LEARN_BASE } from "@/components/learn/nav";
import { getAllModules } from "@/lib/aie/content";
import { courseProgress, getCompletedLessons, nextLesson } from "@/lib/aie/progress";
import { type Activity, learningStreak, recentActivity } from "./stats";

const AIE = "ai-engineering";
const FALLBACK_TZ = "Europe/London";
// [text accent, cover gradient colour]; the design gives AI Engineering violet and the next course mint.
const ACCENTS: [string, string][] = [["#C7B0FF", "rgba(139,92,246,0.45)"], ["#7FF0BD", "rgba(61,220,151,0.35)"], ["#5CC8FF", "rgba(92,200,255,0.35)"], ["#FFD27A", "rgba(245,184,61,0.35)"]];

export type OwnedCourse = {
  id: string;
  title: string;
  edition: string | null;
  meta: string;
  href: string;
  purchasedAt: Date;
  /** null when we don't track lesson progress for this course. */
  percent: number | null;
  status: "owned" | "locked" | "not-started" | "in-progress" | "completed";
  lastOpened: Date | null;
  accent: string;
  cover: string;
};

export type Hero = {
  courseTitle: string;
  moduleNumber: number;
  moduleTitle: string;
  lessonNumber: string;
  lessonMinutes: number;
  percent: number;
  resumeHref: string;
  courseHref: string;
  lessons: { number: string; title: string; minutes: number; state: "done" | "current" | "next" }[];
};

export type StudentSpace = {
  user: { id: string; name: string; email: string; initials: string; memberSince: Date };
  courses: OwnedCourse[];
  hero: Hero | null;
  stats: { coursesOwned: number; lessonsDone: number; quizzesPassed: number; streak: number };
  activity: Activity[];
  capstonePercent: number;
};

export function initialsOf(name: string): string {
  return name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
}

export async function loadStudentSpace(userId: string): Promise<StudentSpace> {
  const [user, entitlements, modules, done] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    getUserEntitlements(userId),
    getAllModules(),
    getCompletedLessons(userId),
  ]);
  const tz = user.timezone || FALLBACK_TZ;
  const [lessons, quizzes, exercises, capstone] = await Promise.all([
    db.aieLessonProgress.findMany({ where: { userId }, select: { lessonId: true, completedAt: true } }),
    db.aieQuizAttempt.findMany({ where: { userId }, select: { module: true, mixedId: true, score: true, total: true, passed: true, createdAt: true } }),
    db.aieExerciseProgress.findMany({ where: { userId }, select: { module: true, passed: true, total: true, updatedAt: true } }),
    db.aieCapstone.findUnique({ where: { userId }, select: { designScore: true, implScore: true, debugScore: true } }),
  ]);

  const lastActivityAt = [...lessons.map((l) => l.completedAt), ...quizzes.map((q) => q.createdAt), ...exercises.map((e) => e.updatedAt)];
  const lastOpened = lastActivityAt.length ? new Date(Math.max(...lastActivityAt.map((d) => d.getTime()))) : null;
  const aie = courseProgress(modules, done);

  const courses: OwnedCourse[] = entitlements.flatMap((e, i) => {
    const course = COURSES.find((c) => c.id === e.courseId);
    if (!course) return [];
    const isAie = course.id === AIE;
    const hours = isAie ? Math.round((modules.flatMap((m) => m.lessons).reduce((n, l) => n + l.minutes, 0) / 60) * 10) / 10 : null;
    return [{
      id: course.id,
      title: course.title,
      edition: isAie ? "Career Path Edition" : null,
      meta: isAie ? `${modules.length} modules · ${hours}h · Lifetime access` : isLaunched(course) ? "Lifetime access" : `Launches ${launchLabel(course)} · Lifetime access`,
      href: courseHomeUrl(course),
      purchasedAt: e.grantedAt,
      percent: isAie ? aie.percent : null,
      status: !isAie ? (isLaunched(course) ? "owned" : "locked") : aie.percent >= 100 ? "completed" : aie.complete > 0 ? "in-progress" : "not-started",
      lastOpened: isAie ? lastOpened : null,
      accent: ACCENTS[i % ACCENTS.length]![0],
      cover: ACCENTS[i % ACCENTS.length]![1],
    }];
  });

  let hero: Hero | null = null;
  if (courses.some((c) => c.id === AIE) && modules.length) {
    const mod = modules.find((m) => m.lessons.some((l) => !done.has(l.number))) ?? modules[modules.length - 1]!;
    const next = nextLesson(mod, done);
    if (next) {
      const currentIdx = mod.lessons.findIndex((l) => l.number === next.number);
      hero = {
        courseTitle: "AI Engineering",
        moduleNumber: mod.number,
        moduleTitle: mod.title,
        lessonNumber: next.number,
        lessonMinutes: next.minutes,
        percent: aie.percent,
        resumeHref: `${LEARN_BASE}/modules/${mod.number}/lessons/${next.number}`,
        courseHref: LEARN_BASE,
        lessons: mod.lessons.slice(Math.max(0, Math.min(currentIdx - 1, mod.lessons.length - 4)), Math.max(0, Math.min(currentIdx - 1, mod.lessons.length - 4)) + 4).map((l) => ({
          number: l.number, title: l.title, minutes: l.minutes,
          state: done.has(l.number) ? "done" : l.number === next.number ? "current" : "next",
        })),
      };
    }
  }

  const passedModules = new Set(quizzes.filter((q) => q.passed && !q.mixedId).map((q) => q.module));
  const events: Activity[] = [
    ...lessons.map((l) => ({ kind: "lesson" as const, title: `Finished lesson ${l.lessonId}`, detail: "", at: l.completedAt })),
    ...quizzes.filter((q) => q.passed).map((q) => ({ kind: "quiz" as const, title: q.mixedId ? "Passed a mixed quiz" : `Passed the Module ${q.module} quiz`, detail: `${q.score} / ${q.total}`, at: q.createdAt })),
    ...exercises.filter((x) => x.total > 0 && x.passed === x.total).map((x) => ({ kind: "exercise" as const, title: `Completed the Module ${x.module} exercise`, detail: `${x.passed} / ${x.total} tests`, at: x.updatedAt })),
  ];
  const scores = [capstone?.designScore, capstone?.implScore, capstone?.debugScore].filter((s): s is number => typeof s === "number");
  const name = user.displayName || user.name || user.email;

  return {
    user: { id: user.id, name, email: user.email, initials: initialsOf(name), memberSince: user.createdAt },
    courses,
    hero,
    stats: {
      coursesOwned: courses.length,
      lessonsDone: done.size,
      quizzesPassed: passedModules.size,
      streak: learningStreak(events.map((e) => e.at), tz),
    },
    activity: recentActivity(events, 4),
    capstonePercent: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / 3) : 0,
  };
}
