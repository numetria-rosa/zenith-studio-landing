import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen bg-[#05060a] text-white">
      <header className="border-b border-white/10 px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/icon.webp" alt="Zenith Studio" className="h-8 w-8 rounded-xl" />
          <span className="text-sm font-semibold tracking-wide">ZENITH LAB</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition">
          ← Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-md px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Account</p>
          <p className="mt-2 text-sm text-white/80">{user.name || "—"}</p>
          <p className="text-sm text-white/50">{user.email}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Your password</p>
          {currentPassword ? (
            <p className="mt-2 font-mono text-lg tracking-wide text-white select-all">{currentPassword}</p>
          ) : (
            <p className="mt-2 text-sm text-white/50">No password set yet — set one below.</p>
          )}
          <p className="mt-2 text-xs text-white/40">Use this with {user.email} to sign in.</p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Change password</p>

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
