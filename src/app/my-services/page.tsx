import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserEntitlements } from "@/lib/entitlements";
import { loadOwnedServices, type OwnedService } from "@/lib/account/services";
import { BrandMark } from "@/components/site/BrandMark";
import { signOutAction } from "@/app/account/actions";

export const metadata: Metadata = { title: "Your services", robots: { index: false, follow: false } };

const sans = Geist({ subsets: ["latin"], weight: ["400", "500", "600"] });
const mono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"] });

/* The client home: one card per service they bought, each opening that service's own dashboard. Courses are
   for students and live in the separate student space (/account); a client who also studies gets one link
   across, nothing more. */
export default async function MyServicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=%2Fmy-services");
  const userId = session.user.id;
  const [services, courses, user] = await Promise.all([
    loadOwnedServices(userId),
    getUserEntitlements(userId),
    db.user.findUnique({ where: { id: userId }, select: { name: true, displayName: true, email: true, _count: { select: { proposals: true, paidAudits: true } } } }),
  ]);
  if (services.length === 0) redirect("/account");
  const first = (user?.displayName || user?.name || user?.email || "").split(/[\s@]/)[0];
  const hasPaperwork = (user?._count.proposals ?? 0) + (user?._count.paidAudits ?? 0) > 0;

  return (
    <div className={`${sans.className} min-h-screen bg-[#05070b] text-white`}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(50%_40%_at_15%_0%,rgba(48,72,220,0.22),transparent_70%),radial-gradient(40%_35%_at_90%_100%,rgba(30,190,130,0.10),transparent_70%)]" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-8">
        <BrandMark />
        <nav className="flex items-center gap-5 text-[14px] text-white/60" aria-label="Account">
          <Link href="/account/profile" className="hover:text-white">
            Account settings
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="hover:text-white">
              Sign out
            </button>
          </form>
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-8">
        <span className={`${mono.className} text-[12.5px] uppercase tracking-[0.28em] text-[#4fd8a8]`}>Your services</span>
        <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">Welcome back{first ? `, ${first}` : ""}.</h1>
        <p className="mt-3 max-w-xl text-[16.5px] leading-7 text-white/60">Pick a service to open its dashboard. Each one has its own agents, approvals and settings.</p>

        <ul className="mt-10 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <li key={s.key}>
              <ServiceCard service={s} />
            </li>
          ))}
          <li>
            <Link
              href="/services"
              className="flex h-full min-h-[190px] flex-col items-center justify-center gap-2 rounded-3xl border-[1.5px] border-dashed border-white/[0.14] p-6 text-center text-white/60 no-underline transition hover:border-white/30 hover:text-white"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-[22px] leading-none">+</span>
              <b className="text-[16px] font-medium">Add a service</b>
              <span className="text-[13.5px]">Browse what else we can set up for you</span>
            </Link>
          </li>
        </ul>

        {hasPaperwork && (
          <p className="mt-8 text-[14.5px] text-white/55">
            Looking for a proposal, an audit call or an invoice?{" "}
            <Link href="/lab/dashboard" className="text-white underline-offset-4 hover:underline">
              Proposals and audits
            </Link>
          </p>
        )}

        {courses.length > 0 && (
          <Link
            href="/account"
            className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[rgba(199,176,255,0.28)] bg-[linear-gradient(135deg,rgba(139,92,246,0.14),rgba(255,255,255,0.02))] px-6 py-5 text-white no-underline transition hover:bg-[rgba(139,92,246,0.18)]"
          >
            <span className="flex flex-col gap-1">
              <span className={`${mono.className} text-[11.5px] uppercase tracking-[0.2em] text-[#c7b0ff]`}>Zenith Lab</span>
              <b className="text-[17px] font-medium">You&apos;re also a student. Go to your courses</b>
            </span>
            <Arrow />
          </Link>
        )}
      </main>
    </div>
  );
}

const TONE: Record<OwnedService["status"]["tone"], string> = {
  live: "border-[#3ddc97]/40 bg-[#3ddc97]/10 text-[#7ff0bd]",
  setup: "border-[#5cc8ff]/40 bg-[#5cc8ff]/10 text-[#9bddff]",
  paused: "border-[#f5b83d]/40 bg-[#f5b83d]/10 text-[#ffd27a]",
  ended: "border-white/15 bg-white/[0.04] text-white/55",
};

function ServiceCard({ service: s }: { service: OwnedService }) {
  return (
    <Link
      href={s.href}
      className="group flex h-full min-h-[190px] flex-col gap-4 rounded-3xl border border-white/10 bg-[#0b0f17]/80 p-6 text-white no-underline transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-[#0e131d]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#5cc8ff]/30 bg-[#5cc8ff]/[0.08] text-[#9bddff]">
          <ServiceIcon serviceId={s.serviceId} />
        </span>
        <span className={`${mono.className} inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] uppercase tracking-[0.08em] ${TONE[s.status.tone]}`}>
          {s.status.label}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <b className="text-[19px] font-semibold tracking-[-0.02em]">{s.title}</b>
        {s.subtitle && <span className="text-[14.5px] text-white/55">{s.subtitle}</span>}
      </div>
      <span className="mt-auto inline-flex items-center gap-2 text-[14.5px] font-medium text-white/80 group-hover:text-white">
        Open dashboard <Arrow />
      </span>
    </Link>
  );
}

const ICONS: Record<string, string> = {
  "whatsapp-umrah": "M21 11.5a8.5 8.5 0 01-12.5 7.5L4 20l1-4.5A8.5 8.5 0 1121 11.5z",
  "ai-inbox-manager": "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
  "ai-lead-capture": "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  "ai-receptionist": "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z",
  "accounting-document-chaser": "M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h4",
  "law-firms": "M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 006 0zM18 7l-3 7a3 3 0 006 0z",
  brokerages: "M3 11l9-7 9 7M5 10v10h14V10",
  "insurance-ai-team": "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

function ServiceIcon({ serviceId }: { serviceId: string | null }) {
  const d = (serviceId && ICONS[serviceId]) || "M12 3l9 4.5v9L12 21l-9-4.5v-9z";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
