import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false, follow: false },
};

/* Landing spot right after /api/auth/claim signs the buyer in. Shows the
   auto-generated password exactly once — the claim row's tempPassword is
   nulled out in the same request that reads it, so a refresh, a shared
   link, or a second visit never shows it again. That one-time read is a
   deliberate trade against storing it in the DB long-term: readable-forever
   in "profile details" would mean anyone with DB access (or a future SQL
   injection) gets every buyer's real login password, exactly what hashing
   exists to prevent. From here on the hash is the only copy that exists. */
export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const claim = await db.purchaseClaim.findFirst({
    where: { userId: session.user.id, tempPassword: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  const password = claim?.tempPassword ?? null;
  if (claim && password) {
    await db.purchaseClaim.update({ where: { id: claim.id }, data: { tempPassword: null } });
  }

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
                Shown once — it won&apos;t appear again. Use it with {session.user.email} to sign in next time, or
                set your own from your profile.
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
