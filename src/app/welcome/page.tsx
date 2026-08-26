import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { GlowBackdrop } from "@/components/GlowBackdrop";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptPassword } from "@/lib/password";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false, follow: false },
};

/* Landing spot right after /api/auth/claim signs the buyer in. The password
   itself lives encrypted on User.passwordEnc (see src/lib/password.ts) and
   is also always viewable later from /profile — this page just surfaces it
   the first time, right when it's most useful. */
export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const password = user.passwordEnc ? decryptPassword(user.passwordEnc) : null;

  return (
    <div className="relative min-h-screen bg-[#05060a] text-white flex items-center justify-center overflow-x-hidden px-4">
      <GlowBackdrop />

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-[30px] border border-emerald-300/30 bg-emerald-400/[0.05] p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(52,211,153,0.08)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300/30 via-teal-500/25 to-cyan-500/30 shadow-[0_0_30px_rgba(52,211,153,0.16)]">
            <Sparkles className="h-5 w-5 text-emerald-100" aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
            Welcome{session.user.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="mt-2 text-sm text-white/60">Your account is ready and you&apos;re signed in.</p>

          {password && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Your password</p>
              <p className="mt-2 font-mono text-lg tracking-wide text-white select-all">{password}</p>
              <p className="mt-3 text-xs text-white/50">
                Use it with {session.user.email} to sign in next time. You can view or change it anytime from your
                profile.
              </p>
            </div>
          )}

          <Link
            href="/lab/dashboard"
            className="mt-6 block rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            Continue to dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
