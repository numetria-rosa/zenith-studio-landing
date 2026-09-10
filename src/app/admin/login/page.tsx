import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { decryptPassword } from "@/lib/password";
import { createSessionForUser } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

/* Dedicated admin entry point, separate from /sign-in (which is for
   course/service clients and redirects to /lab/dashboard). Same
   password-sign-in mechanism as /sign-in, but additionally checks the
   account is actually an admin (role=ADMIN or ADMIN_EMAILS) before
   granting a session here, so a client who happens to know their own
   password can't get confused about what this page is for. requireAdmin()
   on /admin still enforces the real gate either way. */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function handleAdminSignIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") || "");

    const user = email ? await db.user.findUnique({ where: { email } }) : null;
    const passwordOk = user?.passwordEnc ? decryptPassword(user.passwordEnc) === password : false;
    const isAdmin = !!user && (user.role === "ADMIN" || isAdminEmail(user.email));

    if (!passwordOk || !user || !isAdmin) {
      redirect("/admin/login?error=invalid");
    }

    await createSessionForUser(user.id);
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05060a] px-4 text-white">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/40">
          Zenith Studio Admin
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">
          <h1 className="text-xl font-semibold">Sign in</h1>

          {error === "invalid" && (
            <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              That email/password combination isn&apos;t a valid admin account.
            </p>
          )}

          <form action={handleAdminSignIn} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              name="email"
              required
              placeholder="you@zenith-studio.site"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
            />
            <input
              type="password"
              name="password"
              required
              placeholder="Password"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
            />
            <button
              type="submit"
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.01]"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
