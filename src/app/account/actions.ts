"use server";

import { signOut } from "@/lib/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

import { revalidatePath } from "next/cache";
import { cleanUrl, isValidTimeZone } from "@/lib/account/stats";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}

const text = (fd: FormData, key: string, max: number) => String(fd.get(key) ?? "").trim().slice(0, max);

export async function saveProfileAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const github = cleanUrl(text(fd, "githubUrl", 200));
  const linkedin = cleanUrl(text(fd, "linkedinUrl", 200));
  if (github === null) return { ok: false, error: "GitHub must be a valid link, for example github.com/yourname." };
  if (linkedin === null) return { ok: false, error: "LinkedIn must be a valid link, for example linkedin.com/in/yourname." };
  const timezone = text(fd, "timezone", 60);
  if (timezone && !isValidTimeZone(timezone)) return { ok: false, error: "Choose a valid timezone." };
  const name = text(fd, "name", 80);
  if (!name) return { ok: false, error: "Enter your full name." };
  await db.user.update({
    where: { id: userId },
    data: { name, displayName: text(fd, "displayName", 40) || null, timezone: timezone || null, githubUrl: github || null, linkedinUrl: linkedin || null },
  });
  revalidatePath("/account", "layout");
  return { ok: true };
}

export async function saveNotificationsAction(prefs: { productNews: boolean; weeklyRecap: boolean; offers: boolean }): Promise<ActionResult> {
  const userId = await requireUserId();
  await db.user.update({
    where: { id: userId },
    data: { notifyProductNews: !!prefs.productNews, notifyWeeklyRecap: !!prefs.weeklyRecap, notifyOffers: !!prefs.offers },
  });
  return { ok: true };
}

/** Removes the student's profile and progress but keeps purchase records (CourseEntitlement) for billing: the
    user row is anonymised and can no longer sign in, rather than deleted (deleting it would cascade to purchases). */
export async function deleteAccountAction(confirmEmail: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, _count: { select: { waMemberships: true, serviceProjects: true, proposals: true } } },
  });
  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) return { ok: false, error: "That email doesn't match your account." };
  const { waMemberships, serviceProjects, proposals } = user._count;
  if (waMemberships + serviceProjects + proposals > 0) {
    return { ok: false, error: "This account also has agency or service data. Email support to delete it." };
  }
  await db.$transaction([
    db.aieLessonProgress.deleteMany({ where: { userId } }),
    db.aieExerciseProgress.deleteMany({ where: { userId } }),
    db.aieQuizAttempt.deleteMany({ where: { userId } }),
    db.aieProjectProgress.deleteMany({ where: { userId } }),
    db.aieOrientation.deleteMany({ where: { userId } }),
    db.aieCapstone.deleteMany({ where: { userId } }),
    db.aieClient.deleteMany({ where: { userId } }),
    db.aieSellPlanStep.deleteMany({ where: { userId } }),
    db.courseProgress.deleteMany({ where: { userId } }),
    db.session.deleteMany({ where: { userId } }),
    db.account.deleteMany({ where: { userId } }),
    db.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.invalid`, name: null, image: null, displayName: null, timezone: null,
        githubUrl: null, linkedinUrl: null, avatarUrl: null, passwordEnc: null, whopUserId: null,
        notifyProductNews: false, notifyWeeklyRecap: false, notifyOffers: false,
      },
    }),
  ]);
  await signOut({ redirectTo: "/" });
  return { ok: true };
}
