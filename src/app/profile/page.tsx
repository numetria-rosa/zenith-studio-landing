import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CircleUser, KeyRound } from "lucide-react";
import { CourseBar } from "@/components/CourseBar";
import { courseFontVars } from "@/lib/fonts";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptPassword, encryptPassword } from "@/lib/password";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=%2Fprofile");

  const { error, saved } = await searchParams;
  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const currentPassword = user.passwordEnc ? decryptPassword(user.passwordEnc) : null;

  async function handleChangePassword(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect("/sign-in");

    const next = String(formData.get("next") || "");
    if (next.length < 8) redirect("/profile?error=too_short");

    await db.user.update({ where: { id: s.user.id }, data: { passwordEnc: encryptPassword(next) } });
    redirect("/profile?saved=1");
  }

  return (
    <div
      className={`${courseFontVars} min-h-screen bg-[#0d0f14] font-[family-name:var(--font-course-sans)] text-[#eeeee7]`}
    >
      <CourseBar
        tag="Profile"
        right={
          <Link
            href="/lab/dashboard"
            className="rounded-lg border border-[#333a4c] bg-[#191d26] px-3 py-1.5 text-xs font-semibold text-[#eeeee7] transition hover:border-[#f0b429] hover:text-[#f0b429]"
          >
            ← Dashboard
          </Link>
        }
      />

      <main className="mx-auto max-w-[520px] px-6 pb-20 pt-12">
        <div className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#f0b429]">
          Zenith Lab · Profile
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-course-serif)] text-3xl font-semibold tracking-[-0.02em]">
          Your account
        </h1>

        <div className="mt-8 rounded-xl border border-[#232838] bg-[#151920] p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#333a4c] bg-[#191d26]">
            <CircleUser className="h-5 w-5 text-[#f0b429]" aria-hidden />
          </div>
          <p className="mt-4 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#676e7d]">
            Account
          </p>
          <p className="mt-2 text-sm text-[#eeeee7]">{user.name || "-"}</p>
          <p className="text-sm text-[#9aa0ae]">{user.email}</p>
        </div>

        <div className="mt-4 rounded-xl border border-[#f0b429]/40 bg-[#151920] p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#333a4c] bg-[#191d26]">
            <KeyRound className="h-5 w-5 text-[#f0b429]" aria-hidden />
          </div>
          <p className="mt-4 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#676e7d]">
            Your password
          </p>
          {currentPassword ? (
            <p className="mt-2 font-[family-name:var(--font-course-mono)] text-lg tracking-wide text-[#eeeee7] select-all">
              {currentPassword}
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#9aa0ae]">No password set yet. Set one below.</p>
          )}
          <p className="mt-2 text-xs text-[#676e7d]">Use this with {user.email} to sign in.</p>
        </div>

        <div className="mt-4 rounded-xl border border-[#232838] bg-[#151920] p-6">
          <p className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#676e7d]">
            Change password
          </p>

          {saved && (
            <p className="mt-3 rounded-lg border border-[#4ade95]/30 bg-[#4ade95]/10 px-3 py-2 text-xs text-[#4ade95]">
              Password updated.
            </p>
          )}
          {error === "too_short" && (
            <p className="mt-3 rounded-lg border border-[#ff8585]/30 bg-[#ff8585]/10 px-3 py-2 text-xs text-[#ff8585]">
              New password must be at least 8 characters.
            </p>
          )}

          <form action={handleChangePassword} className="mt-4 flex flex-col gap-3">
            <input
              type="text"
              name="next"
              required
              minLength={8}
              placeholder="New password (min. 8 characters)"
              className="rounded-lg border border-[#333a4c] bg-[#0a0c10] px-4 py-2.5 text-sm text-[#eeeee7] placeholder:text-[#676e7d] focus:outline-none focus:border-[#f0b429]"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#f0b429] px-4 py-2.5 text-sm font-bold text-[#1a1200] transition hover:brightness-110"
            >
              Update password
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
