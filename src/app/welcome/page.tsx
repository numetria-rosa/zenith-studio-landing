import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen bg-[#05060a] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
          <h1 className="text-xl font-semibold">
            Welcome{session.user.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="mt-2 text-sm text-white/60">Your account is ready and you&apos;re signed in.</p>

          {password && (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Your password</p>
              <p className="mt-2 font-mono text-lg tracking-wide text-emerald-100 select-all">{password}</p>
              <p className="mt-3 text-xs text-white/50">
                Use it with {session.user.email} to sign in next time. You can view or change it anytime from your
                profile.
              </p>
            </div>
          )}

          <Link
            href="/dashboard"
            className="mt-6 block rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            Continue to dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
