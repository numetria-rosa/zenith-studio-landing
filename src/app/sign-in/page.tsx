import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { decryptPassword } from "@/lib/password";
import { createSessionForUser } from "@/lib/session";
import { courseFontVars } from "@/lib/fonts";
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
    <div
      className={`${courseFontVars} min-h-screen bg-[#0d0f14] font-[family-name:var(--font-course-sans)] text-[#eeeee7] flex items-center justify-center px-4`}
    >
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2">
          <span className="font-[family-name:var(--font-course-serif)] text-lg font-extrabold tracking-[-0.02em]">
            ZENITH STUDIO
          </span>
        </Link>

        <div className="rounded-xl border border-[#232838] bg-[#151920] p-8">
          <h1 className="font-[family-name:var(--font-course-serif)] text-xl font-semibold tracking-[-0.01em]">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-[#9aa0ae]">
            For Zenith Lab courses and AI Systems service requests. Use the password from your welcome page. It&apos;s also always on your profile.
          </p>

          {error === "invalid_password" && (
            <p className="mt-4 rounded-lg border border-[#ff8585]/30 bg-[#ff8585]/10 px-4 py-3 text-sm text-[#ff8585]">
              That email/password combination didn&apos;t match.
            </p>
          )}
          {error === "claim_expired" && (
            <p className="mt-4 rounded-lg border border-[#ff8585]/30 bg-[#ff8585]/10 px-4 py-3 text-sm text-[#ff8585]">
              That sign-in link expired. Use your password below instead.
            </p>
          )}
          {error === "payment" && (
            <p className="mt-4 rounded-lg border border-[#ff8585]/30 bg-[#ff8585]/10 px-4 py-3 text-sm text-[#ff8585]">
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
        className="rounded-lg border border-[#333a4c] bg-[#0a0c10] px-4 py-2.5 text-sm text-[#eeeee7] placeholder:text-[#676e7d] focus:outline-none focus:border-[#f0b429]"
      />
      <input
        type="password"
        name="password"
        required
        placeholder="Password"
        className="rounded-lg border border-[#333a4c] bg-[#0a0c10] px-4 py-2.5 text-sm text-[#eeeee7] placeholder:text-[#676e7d] focus:outline-none focus:border-[#f0b429]"
      />
      <button
        type="submit"
        className="rounded-lg bg-[#f0b429] px-4 py-2.5 text-sm font-bold text-[#1a1200] transition hover:brightness-110"
      >
        Sign in
      </button>
    </form>
  );
}
