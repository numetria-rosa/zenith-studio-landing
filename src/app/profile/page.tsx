import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CircleUser, KeyRound, ShieldCheck } from "lucide-react";
import { GlowBackdrop } from "@/components/GlowBackdrop";
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

            <Link
              href="/lab/dashboard"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-md px-4 py-14 sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-emerald-200/90 backdrop-blur-xl">
          Zenith Lab · Profile
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">Your account</h1>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300/30 via-teal-500/25 to-cyan-500/30 shadow-[0_0_30px_rgba(52,211,153,0.16)]">
            <CircleUser className="h-5 w-5 text-emerald-100" aria-hidden />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Account</p>
          <p className="mt-2 text-sm text-white/80">{user.name || "—"}</p>
          <p className="text-sm text-white/50">{user.email}</p>
        </div>

        <div className="mt-5 rounded-[28px] border border-emerald-300/30 bg-emerald-400/[0.05] p-7 backdrop-blur-xl shadow-[0_0_50px_rgba(52,211,153,0.08)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300/30 via-teal-500/25 to-cyan-500/30 shadow-[0_0_30px_rgba(52,211,153,0.16)]">
            <KeyRound className="h-5 w-5 text-emerald-100" aria-hidden />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Your password</p>
          {currentPassword ? (
            <p className="mt-2 font-mono text-lg tracking-wide text-white select-all">{currentPassword}</p>
          ) : (
            <p className="mt-2 text-sm text-white/50">No password set yet — set one below.</p>
          )}
          <p className="mt-2 text-xs text-white/45">Use this with {user.email} to sign in.</p>
        </div>

        <div className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
            <ShieldCheck className="h-5 w-5 text-white/70" aria-hidden />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Change password</p>

          {saved && (
            <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
              Password updated.
            </p>
          )}
          {error === "too_short" && (
            <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
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
              className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-300/50"
            />
            <button
              type="submit"
              className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Update password
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
