import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { decryptPassword } from "@/lib/password";
import { createSessionForUser } from "@/lib/session";
import { GlowBackdrop } from "@/components/GlowBackdrop";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  // Only ever redirect within this site — an absolute or protocol-relative
  // callbackUrl (e.g. "https://evil.example") must never be honored here.
  const redirectTo = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/lab/dashboard";

  return (
    <div className="relative min-h-screen bg-[#05060a] text-white flex items-center justify-center overflow-x-hidden px-4">
      <GlowBackdrop />

      <div className="relative z-10 w-full max-w-sm">
        <Link href="/" className="flex items-center gap-3 justify-center mb-10">
          <img
            src="/icon.webp"
            alt="Zenith Studio"
            className="h-9 w-9 rounded-2xl shadow-[0_0_30px_rgba(110,95,255,0.55)]"
          />
          <div className="text-left">
            <div className="text-xs tracking-[0.35em] text-white/60 uppercase">Zenith</div>
            <div className="text-base font-semibold -mt-0.5">Lab</div>
          </div>
        </Link>

        <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
          <h1 className="text-xl font-semibold">Sign in to Zenith Lab</h1>
          <p className="mt-2 text-sm text-white/60">
            Use the password from your welcome page — it&apos;s also always on your profile.
          </p>

          {error === "invalid_password" && (
            <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              That email/password combination didn&apos;t match.
            </p>
          )}
          {error === "claim_expired" && (
            <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              That sign-in link expired. Use your password below instead.
            </p>
          )}
          {error === "payment" && (
            <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              We couldn&apos;t confirm that payment. If you were charged, sign in below and it&apos;ll be there shortly.
            </p>
          )}

          <PasswordSignInForm redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}

function PasswordSignInForm({ redirectTo }: { redirectTo: string }) {
  async function handlePasswordSignIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") || "");
    const rawDest = String(formData.get("redirectTo") || "/lab/dashboard");
    const dest = rawDest.startsWith("/") ? rawDest : "/lab/dashboard";

    const user = email ? await db.user.findUnique({ where: { email } }) : null;
    const ok = user?.passwordEnc ? decryptPassword(user.passwordEnc) === password : false;
    if (!ok || !user) {
      redirect(`/sign-in?error=invalid_password&callbackUrl=${encodeURIComponent(dest)}`);
    }

    await createSessionForUser(user.id);
    redirect(dest);
  }

  return (
    <form action={handlePasswordSignIn} className="mt-6 flex flex-col gap-3">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input
        type="email"
        name="email"
        required
        placeholder="you@example.com"
        className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-300/50"
      />
      <input
        type="password"
        name="password"
        required
        placeholder="Password"
        className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-300/50"
      />
      <button
        type="submit"
        className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
      >
        Sign in
      </button>
    </form>
  );
}
