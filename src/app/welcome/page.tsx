import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { courseFontVars } from "@/lib/fonts";
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
    <div
      className={`${courseFontVars} min-h-screen bg-[#0d0f14] font-[family-name:var(--font-course-sans)] text-[#eeeee7] flex items-center justify-center px-4`}
    >
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-[#f0b429]/40 bg-[#151920] p-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#333a4c] bg-[#191d26]">
            <Sparkles className="h-5 w-5 text-[#f0b429]" aria-hidden />
          </div>
          <h1 className="mt-5 font-[family-name:var(--font-course-serif)] text-2xl font-semibold tracking-[-0.01em]">
            Welcome{session.user.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="mt-2 text-sm text-[#9aa0ae]">Your account is ready and you&apos;re signed in.</p>

          {password && (
            <div className="mt-6 rounded-lg border border-[#232838] bg-[#0a0c10] p-5">
              <p className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#f0b429]">
                Your password
              </p>
              <p className="mt-2 font-[family-name:var(--font-course-mono)] text-lg tracking-wide text-[#eeeee7] select-all">
                {password}
              </p>
              <p className="mt-3 text-xs text-[#676e7d]">
                Use it with {session.user.email} to sign in next time. You can view or change it anytime from your
                profile.
              </p>
            </div>
          )}

          <a
            href="/lab/dashboard"
            className="mt-6 block rounded-lg bg-[#f0b429] px-4 py-2.5 text-center text-sm font-bold text-[#1a1200] transition hover:brightness-110"
          >
            Continue to dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}
