import type { Metadata } from "next";
import { signIn } from "@/lib/auth";
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
  const redirectTo = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

  return (
    <div className="min-h-screen bg-[#05060a] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-3 justify-center mb-10">
          <img src="/icon.webp" alt="Zenith Studio" className="h-9 w-9 rounded-2xl" />
          <div className="text-left">
            <div className="text-xs tracking-[0.35em] text-white/60 uppercase">Zenith</div>
            <div className="text-base font-semibold -mt-0.5">Lab</div>
          </div>
        </Link>

        <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
          <h1 className="text-xl font-semibold">Sign in to Zenith Lab</h1>
          <p className="mt-2 text-sm text-white/60">
            We&apos;ll email you a one-time link. No password to remember.
          </p>

          {error && (
            <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              That sign-in link didn&apos;t work — it may have expired. Enter your email to get a new one.
            </p>
          )}

          <SignInForm redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}

async function SignInForm({ redirectTo }: { redirectTo: string }) {
  async function handleSignIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "");
    // Re-validated here, not just trusted from the hidden field — form
    // data is client-controllable at submit time, and this value drives an
    // actual post-auth redirect.
    const rawDest = String(formData.get("redirectTo") || "/dashboard");
    const dest = rawDest.startsWith("/") ? rawDest : "/dashboard";
    await signIn("resend", { email, redirectTo: dest });
  }

  return (
    <form action={handleSignIn} className="mt-6 flex flex-col gap-3">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input
        type="email"
        name="email"
        required
        placeholder="you@example.com"
        className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-300/50"
      />
      <button
        type="submit"
        className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
      >
        Send sign-in link
      </button>
    </form>
  );
}
