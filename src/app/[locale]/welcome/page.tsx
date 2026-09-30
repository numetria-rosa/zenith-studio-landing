import Image from "next/image";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { CopyButton } from "@/components/learn/CopyButton";
import { Button } from "@/components/obsidian/Button";
import { Icon } from "@/components/obsidian/Icon";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasCourseAccess } from "@/lib/entitlements";
import { decryptPassword } from "@/lib/password";

export const metadata: Metadata = {
  title: "Welcome | Zenith Studio",
  robots: { index: false, follow: false },
};

/* Landing spot right after /api/auth/claim signs the buyer in. The password
   itself lives encrypted on User.passwordEnc (see src/lib/password.ts) and
   is also always viewable later from /account/profile - this page just
   surfaces it the first time, right when it's most useful. */
export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const password = user.passwordEnc ? decryptPassword(user.passwordEnc) : null;
  // Service buyers belong in their client dashboard (its popup shows the
  // password), even if they reach this page from an old link.
  const project = await db.serviceProject.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (project) redirect(`/services/dashboard/${project.id}`);
  const ownsAiEngineering = await hasCourseAccess(user.id, "ai-engineering");
  const firstName = (user.displayName || user.name || "").trim().split(/\s+/)[0];

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-5 py-12 font-sans text-frost antialiased [line-height:normal]"
      style={{ "--focus": "#5CC8FF" } as CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[260px] -top-[320px] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(92,200,255,0.16), rgba(5,6,10,0) 62%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[380px] -left-[280px] h-[800px] w-[800px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.14), rgba(5,6,10,0) 62%)" }}
      />

      <main className="relative flex w-full max-w-[520px] flex-col gap-7">
        <div className="flex items-center gap-3 self-center">
          <Image src="/course/zenith-logo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          <b className="text-[15px] font-semibold">Zenith Studio</b>
        </div>

        <section className="glass flex flex-col gap-6 rounded-[30px] p-8 sm:p-10">
          <div className="flex flex-col gap-4">
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-[rgba(61,220,151,0.5)] bg-[rgba(61,220,151,0.10)]">
              <Icon name="check" size={24} color="#7FF0BD" strokeWidth={2.4} />
            </span>
            <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-mint-text">Purchase confirmed</span>
            <h1 className="m-0 text-[40px] font-medium leading-[1.02] tracking-[-0.045em] sm:text-[46px]">
              Welcome{firstName ? `, ${firstName}` : ""}.
            </h1>
            <p className="m-0 text-[16.5px] leading-[1.6] text-mist">Your account is ready and you&apos;re signed in.</p>
          </div>

          {password && (
            <div className="flex flex-col gap-3 rounded-[20px] border border-white/10 bg-[rgba(5,6,10,0.55)] p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-amber-text">Your password</span>
                <CopyButton text={password} label="Copy" />
              </div>
              <p className="m-0 select-all break-all font-mono text-[22px] tracking-wide text-frost" aria-label="Your password">
                {password}
              </p>
              <p className="m-0 text-[13.5px] leading-[1.55] text-dim">
                Use it with <span className="text-soft">{user.email}</span> to sign in next time. You can view or change it anytime from your profile.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {ownsAiEngineering && (
              <Button href="/lab/ai-engineering/learn" size="lg" arrow>
                Start AI Engineering
              </Button>
            )}
            <Button href="/account" variant={ownsAiEngineering ? "glass" : "primary"} size="lg" arrow={!ownsAiEngineering}>
              Go to my dashboard
            </Button>
          </div>
        </section>

        <p className="m-0 text-center text-[13px] text-dim">
          Lifetime access. Everything you buy stays in your student space.
        </p>
      </main>
    </div>
  );
}
