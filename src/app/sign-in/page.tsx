import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { db } from "@/lib/db";
import { decryptPassword } from "@/lib/password";
import { createSessionForUser } from "@/lib/session";
import { wordmark } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const sans = Geist({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const mono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"] });

const ERRORS: Record<string, string> = {
  invalid_password: "That email and password don't match.",
  claim_expired: "That sign-in link expired. Use your password instead.",
  payment: "We couldn't confirm that payment yet. If you were charged, sign in and it'll be there shortly.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl, error } = await searchParams;
  // Only ever redirect within this site - an absolute or protocol-relative
  // callbackUrl (e.g. "https://evil.example") must never be honored here.
  const redirectTo = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/start";
  const errorText = error ? ERRORS[error] : undefined;

  return (
    <div className={`${sans.className} grid min-h-screen bg-[#05070b] text-white lg:grid-cols-[1.12fr_1fr]`}>
      <Showcase />

      <main className="relative flex flex-col px-4 py-10 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_70%_15%,rgba(40,90,140,0.12),transparent_70%)]" />
        <div className="relative lg:hidden">
          <Brand />
        </div>

        <div className="relative mx-auto flex w-full max-w-[520px] flex-1 2xl:max-w-[640px] flex-col justify-center py-12">
          <Eyebrow>Client console</Eyebrow>
          <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[clamp(44px,3.1vw,56px)]">Sign in to your console.</h1>
          <p className="mt-3 text-[17px] text-white/60">Your agents, approvals and setup status. Course students sign in here too.</p>

          {errorText && (
            <p role="alert" className="mt-6 rounded-2xl border border-[#ff7a8a]/30 bg-[#ff7a8a]/10 px-4 py-3 text-[14px] text-[#ffb3bd]">
              {errorText}
            </p>
          )}

          <PasswordSignInForm redirectTo={redirectTo} />

          <div className="mt-8 flex gap-3 rounded-2xl border border-[#3ddc97]/15 bg-[#3ddc97]/[0.04] p-4 text-[14.5px] leading-6 text-white/75">
            <ShieldIcon />
            <p className="m-0">
              First time here? Use the email you paid with; your password was shown right after checkout and is always on your profile.
              Can&apos;t get in?{" "}
              <a href="mailto:hello@zenith-studio.site" className="text-[#5ee6a8] underline-offset-4 hover:underline">
                Contact the Zenith Studio team.
              </a>
            </p>
          </div>

          <p className="mt-8 text-center text-[15px] text-white/55">
            Not a client yet?{" "}
            <a href="/services" className="font-semibold text-white underline-offset-4 hover:underline">
              Discover our services
            </a>
          </p>
        </div>

        <nav aria-label="Legal" className="relative flex justify-center gap-6 text-[14px] text-white/45">
          <Link href="/terms" className="hover:text-white/80">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-white/80">
            Privacy
          </Link>
          <a href="mailto:hello@zenith-studio.site" className="hover:text-white/80">
            Support
          </a>
        </nav>
      </main>
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
    const rawDest = String(formData.get("redirectTo") || "/start");
    const dest = rawDest.startsWith("/") ? rawDest : "/start";

    const user = email ? await db.user.findUnique({ where: { email } }) : null;
    const ok = user?.passwordEnc ? decryptPassword(user.passwordEnc) === password : false;
    if (!ok || !user) {
      redirect(`/sign-in?error=invalid_password&callbackUrl=${encodeURIComponent(dest)}`);
    }

    await createSessionForUser(user.id);
    redirect(dest);
  }

  const field =
    "w-full rounded-2xl border border-white/10 bg-white/[0.03] py-4 pl-12 pr-4 text-[16px] text-white placeholder:text-white/35 outline-none transition focus:border-[#3ddc97]/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-[#3ddc97]/10";

  return (
    <form action={handlePasswordSignIn} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <label className="flex flex-col gap-2">
        <span className="text-[15px] font-medium text-white/85">Email</span>
        <span className="relative">
          <MailIcon />
          <input type="email" name="email" required autoComplete="email" placeholder="you@yourcompany.com" className={field} />
        </span>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-[15px] font-medium text-white/85">Password</span>
        <span className="relative">
          <LockIcon />
          <input type="password" name="password" required autoComplete="current-password" placeholder="Your password" className={field} />
        </span>
      </label>
      <button
        type="submit"
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#3ddc97] px-6 py-4 text-[17px] font-semibold text-[#04150d] shadow-[0_10px_40px_-10px_rgba(61,220,151,0.6)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3ddc97]"
      >
        Sign in
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}

/* Left half: what the console looks like. Purely illustrative sample data, hidden from screen readers. */
function Showcase() {
  return (
    <aside className="relative hidden flex-col overflow-hidden border-r border-white/[0.06] px-16 py-14 lg:flex xl:px-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_15%_20%,rgba(48,72,220,0.32),transparent_70%),radial-gradient(50%_40%_at_45%_95%,rgba(30,190,130,0.16),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(45%_35%_at_35%_62%,black,transparent)]" />

      <div className="relative">
        <Brand />
      </div>

      <div className="relative mt-20 xl:mt-24">
        <Eyebrow>Client console</Eyebrow>
        <h2 className="mt-5 text-[clamp(40px,3.9vw,74px)] font-semibold leading-[1.04] tracking-[-0.045em]">
          <span className="whitespace-nowrap bg-gradient-to-r from-white to-[#cfe3ff] bg-clip-text text-transparent">Your AI team, working</span>
          <br />
          <span className="bg-gradient-to-r from-[#8fd0ff] via-[#7fe0d0] to-[#5ee6a8] bg-clip-text text-transparent">while you&apos;re away.</span>
        </h2>
        <p className="mt-6 max-w-[540px] text-[18px] leading-8 text-white/60">
          See what your agents did, approve what goes out in your name, and track your setup, all in one console.
        </p>
      </div>

      <div className="relative mt-14 h-[505px] w-full max-w-[680px]" aria-hidden="true">
        <div className="absolute left-0 top-0 w-[61%] rounded-3xl border border-white/10 bg-[#0b0f17]/80 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <Eyebrow tone="blue">Your agents</Eyebrow>
            <span className="flex items-center gap-2 text-[14px] text-white/70">
              <i className="h-2 w-2 rounded-full bg-[#4fa8ff]" /> Live
            </span>
          </div>
<div className="mt-3">
          <AgentRow icon={<InboxIcon />} name="Inbox Manager" state="Running" tone="blue" />
          <AgentRow icon={<SendIcon />} name="Lead follow-up" state="Running" tone="green" />
          <AgentRow icon={<CalendarIcon />} name="Booking agent" state="Paused" tone="dim" last />
          </div>
        </div>

        <div className="absolute right-0 top-5 flex items-center gap-4 whitespace-nowrap rounded-2xl border border-white/10 bg-[#0c1119]/90 px-5 py-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#3ddc97]/30 bg-[#3ddc97]/10 text-[#5ee6a8]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
            </svg>
          </span>
          <span className="flex flex-col">
            <b className="text-[17px] font-semibold">42 emails handled</b>
            <span className="text-[14px] text-white/55">Overnight · 0 need you</span>
          </span>
        </div>

        <div className="absolute right-[4%] top-[285px] w-[56%] rounded-3xl border border-white/10 bg-[#0b0f17]/95 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur">
          <div className="flex items-center justify-between">
            <Eyebrow>Waiting for you</Eyebrow>
            <span className="grid h-7 w-7 place-items-center rounded-full border border-[#3ddc97]/30 bg-[#3ddc97]/10 text-[13px] text-[#5ee6a8]">3</span>
          </div>
          <p className="mt-4 text-[15.5px] leading-6 text-white/80">Reply to Harbor Dental: &ldquo;Yes, Thursday at 10 works...&rdquo;</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <span className="rounded-full bg-[#3ddc97] py-2.5 text-center text-[15px] font-semibold text-[#04150d]">Approve</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] py-2.5 text-center text-[15px] text-white/85">Edit</span>
          </div>
        </div>
      </div>

      <p className="relative mt-auto pt-10 text-[14px] text-white/40">© Zenith Studio · zenith-studio.site</p>
    </aside>
  );
}

function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-3 text-white no-underline" aria-label="Zenith Studio, home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/zenith-mark.png" alt="" width={44} height={44} className="h-11 w-11" />
      <span className={`${wordmark.className} text-[18px] font-semibold tracking-[-0.01em]`}>Zenith Studio</span>
    </Link>
  );
}

function Eyebrow({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "blue" }) {
  return (
    <span className={`${mono.className} block text-[13px] uppercase tracking-[0.28em] ${tone === "blue" ? "text-[#7cc4ff]" : "text-[#4fd8a8]"}`}>{children}</span>
  );
}

function AgentRow({ icon, name, state, tone, last }: { icon: React.ReactNode; name: string; state: string; tone: "blue" | "green" | "dim"; last?: boolean }) {
  const color = tone === "blue" ? "text-[#7cc4ff]" : tone === "green" ? "text-[#5ee6a8]" : "text-white/45";
  const dot = tone === "blue" ? "bg-[#4fa8ff]" : tone === "green" ? "bg-[#3ddc97]" : "bg-white/35";
  const box = tone === "blue" ? "border-[#4fa8ff]/35 text-[#7cc4ff]" : tone === "green" ? "border-[#3ddc97]/35 text-[#5ee6a8]" : "border-[#a78bfa]/35 text-[#c4b5fd]";
  return (
    <div className={`flex items-center gap-4 py-4 ${last ? "" : "border-b border-white/[0.06]"}`}>
      <span className={`grid h-11 w-11 place-items-center rounded-xl border bg-white/[0.02] ${box}`}>{icon}</span>
      <span className="flex-1 text-[17px]">{name}</span>
      <span className={`${mono.className} flex items-center gap-2 text-[13px] uppercase tracking-[0.08em] ${color}`}>
        <i className={`h-2 w-2 rounded-full ${dot}`} />
        {state}
      </span>
    </div>
  );
}

const iconProps = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const InboxIcon = () => (
  <svg {...iconProps}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
  </svg>
);
const SendIcon = () => (
  <svg {...iconProps}>
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);
const CalendarIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const MailIcon = () => (
  <svg {...iconProps} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);
const LockIcon = () => (
  <svg {...iconProps} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 018 0v4" />
  </svg>
);
const ShieldIcon = () => (
  <svg {...iconProps} width={18} height={18} className="mt-1 shrink-0 text-[#5ee6a8]" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
