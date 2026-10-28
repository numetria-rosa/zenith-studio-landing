import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, button, field } from "../AuthCard";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/mail";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false, follow: false } };

async function requestReset(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const created = email ? await createPasswordResetToken(email) : null;
  if (created) {
    const sent = await sendPasswordResetEmail(email, `${getSiteUrl()}/sign-in/reset?token=${created.token}`);
    if (!sent.ok) console.error("[password-reset] email failed:", sent.error);
  }
  // Same answer whether or not the account exists, so this form can't be used to find out who's a client.
  redirect("/sign-in/forgot?sent=1");
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <AuthCard title="Reset your password" intro={sent ? undefined : "Enter the email you signed up with and we'll send you a link to set a new password."}>
      {sent ? (
        <p role="status" className="mt-6 rounded-2xl border border-[#3ddc97]/25 bg-[#3ddc97]/[0.06] px-4 py-3 text-[15px] leading-6 text-white/80">
          If that email has a Zenith Studio account, a reset link is on its way. It expires in 1 hour. Check your spam folder if it
          doesn&apos;t arrive in a few minutes.
        </p>
      ) : (
        <form action={requestReset} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-[15px] font-medium text-white/85">Email</span>
            <input type="email" name="email" required autoComplete="email" placeholder="you@yourcompany.com" className={field} />
          </label>
          <button type="submit" className={button}>
            Send reset link
          </button>
        </form>
      )}
    </AuthCard>
  );
}
