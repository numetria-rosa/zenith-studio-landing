import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, button, field } from "../AuthCard";
import { resetPassword, userIdForResetToken } from "@/lib/password-reset";
import { createSessionForUser } from "@/lib/session";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false, follow: false } };

async function setNewPassword(formData: FormData) {
  "use server";
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const back = `/sign-in/reset?token=${encodeURIComponent(token)}`;
  // Same limits as the profile page's change-password form.
  if (password.length < 8) redirect(`${back}&error=short`);
  if (password.length > 200) redirect(`${back}&error=long`);
  if (password !== String(formData.get("confirm") || "")) redirect(`${back}&error=mismatch`);

  const userId = await resetPassword(token, password);
  if (!userId) redirect("/sign-in/reset?error=expired");
  await createSessionForUser(userId);
  redirect("/start");
}

const ERRORS: Record<string, string> = {
  short: "Use at least 8 characters.",
  long: "That password is too long.",
  mismatch: "The two passwords don't match.",
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token = "", error } = await searchParams;
  if (error === "expired" || !(await userIdForResetToken(token))) {
    return (
      <AuthCard title="This link has expired" intro="Reset links work once and only for 1 hour. Ask for a new one and use it straight away.">
        <Link href="/sign-in/forgot" className={`${button} mt-8 text-center no-underline`}>
          Send a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" intro="Pick a password you don't use anywhere else. You'll be signed in straight after.">
      {error && ERRORS[error] && (
        <p role="alert" className="mt-6 rounded-2xl border border-[#ff7a8a]/30 bg-[#ff7a8a]/10 px-4 py-3 text-[14px] text-[#ffb3bd]">
          {ERRORS[error]}
        </p>
      )}
      <form action={setNewPassword} className="mt-8 flex flex-col gap-5">
        <input type="hidden" name="token" value={token} />
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-medium text-white/85">New password</span>
          <input type="password" name="password" required minLength={8} maxLength={200} autoComplete="new-password" className={field} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-medium text-white/85">Type it again</span>
          <input type="password" name="confirm" required minLength={8} maxLength={200} autoComplete="new-password" className={field} />
        </label>
        <button type="submit" className={button}>
          Save and sign in
        </button>
      </form>
    </AuthCard>
  );
}
