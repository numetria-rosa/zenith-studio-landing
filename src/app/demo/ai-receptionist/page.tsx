import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";
import { buildDemoAssistantPayload } from "@/lib/vapi";
import { findOrCreateUserByEmail } from "@/lib/users";
import { createSessionForUser } from "@/lib/session";
import { getService, getSetupCheckoutUrl } from "@/lib/services";
import DemoCallButton from "../[slug]/DemoCallButton";
import DemoBookingsFeed from "../DemoBookingsFeed";

export const metadata: Metadata = { title: "Live AI Receptionist Demo" };

const DEMO_PHONE_NUMBER = "+1 (213) 451 4165";

/* Public demo, gated behind a lightweight signup (name + email, no
   password), so a visitor becomes an identifiable lead before they get
   phone/calendar access, not an anonymous drive-by. Reuses the same
   passwordless session-creation already used for the post-checkout
   auto-claim flow (src/lib/session.ts), no new auth mechanism needed. */
export default async function AiReceptionistDemoPage() {
  const session = await auth();

  async function signUp(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const name = String(formData.get("name") || "").trim();
    if (!email) return;

    const user = await db.$transaction((tx) => findOrCreateUserByEmail(tx, email, name || null, "demo"));
    await createSessionForUser(user.id);
    redirect("/demo/ai-receptionist");
  }

  if (!session?.user?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.05] p-8 text-center backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Live demo</p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Talk to the AI Receptionist</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Leave your name and email and you&apos;re straight in, no password, no obligation. You&apos;ll get the
            demo phone number and a live view of the booking calendar.
          </p>
          <form action={signUp} className="mt-6 flex flex-col gap-3 text-left">
            <input
              name="name"
              placeholder="Name (optional)"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="you@business.com"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30"
            />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Start the demo
            </button>
          </form>
          <Link href="/demo" className="mt-6 inline-block text-xs text-white/40 hover:text-white/70">
            &larr; All demos
          </Link>
        </div>
      </div>
    );
  }

  const assistant = buildDemoAssistantPayload(
    "public-demo",
    "Bright Smile Dental",
    "Dental clinics",
    `${getSiteUrl()}/api/demo/vapi`
  );
  const receptionistService = getService("ai-receptionist");
  const checkoutUrl = receptionistService ? getSetupCheckoutUrl(receptionistService) : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/70">Live demo &middot; real phone line</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Talk to the AI Receptionist.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
            Call the real demo number or use the browser call button below. It answers as a dental clinic
            receptionist, books straight onto a real calendar, and every booking shows up live beneath the call
            widget while you watch.
          </p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/35">What happens on the call</p>
            <div className="mt-3">
              <AgentDiagram />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-sm">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-2xl font-extrabold text-emerald-300">24/7</p>
              <p className="mt-1 text-xs text-white/45">picks up every call, every time</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-2xl font-extrabold text-emerald-300">0</p>
              <p className="mt-1 text-xs text-white/45">missed bookings while you're busy</p>
            </div>
          </div>

          {checkoutUrl && (
            <div className="mt-10 rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-6 sm:max-w-md">
              <p className="text-sm font-semibold text-white">Ready for your own business?</p>
              <p className="mt-1 text-xs leading-5 text-white/55">
                Set up in 2 to 7 days, your own number, your own calendar, your own FAQ.
              </p>
              <a
                href={checkoutUrl}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Get the AI Receptionist
              </a>
            </div>
          )}

          <Link href="/demo" className="mt-6 inline-block text-xs text-white/40 hover:text-white/70">
            &larr; All demos
          </Link>
        </div>

        <div className="lg:sticky lg:top-16">
          <div className="rounded-2xl border border-white/10 bg-[#060a0d] p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-300/70">Try it now</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href="tel:+12134514165"
                className="inline-flex flex-col items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-4 transition hover:bg-white/10"
              >
                <span className="text-sm font-semibold text-white">Call it</span>
                <span className="font-mono text-xs text-white/50">{DEMO_PHONE_NUMBER}</span>
              </a>
              <DemoCallButton assistant={assistant} />
            </div>
          </div>

          <div className="mt-4">
            <DemoBookingsFeed />
          </div>
          <p className="mt-3 text-center text-[11px] text-white/30 lg:text-left">
            Real Vapi call &middot; real Cal.com calendar &middot; bookings land here live
          </p>
        </div>
      </div>
    </div>
  );
}

function AgentDiagram() {
  return (
    <svg viewBox="0 0 340 190" className="w-full" role="img" aria-label="A call comes in, the AI answers and qualifies, then books onto the real calendar">
      <defs>
        <linearGradient id="ar-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="6" y="14" width="90" height="36" rx="9" fill="#0a1216" stroke="#1c3540" />
      <text x="51" y="37" textAnchor="middle" fontSize="10.5" fill="#bbf7d0">
        Call rings in
      </text>
      <line x1="51" y1="50" x2="51" y2="76" stroke="#1c3540" strokeWidth="1.5" />
      <circle cx="51" cy="100" r="30" fill="url(#ar-glow)" />
      <circle cx="51" cy="100" r="26" fill="#0a1216" stroke="#6ee7b7" strokeWidth="1.5" />
      <text x="51" y="96" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#6ee7b7">
        AI answers
      </text>
      <text x="51" y="108" textAnchor="middle" fontSize="8" fill="#6ee7b7" opacity="0.8">
        &amp; qualifies
      </text>
      <line x1="77" y1="100" x2="120" y2="100" stroke="#1c3540" strokeWidth="1.5" />
      <rect x="122" y="82" width="100" height="36" rx="9" fill="#0a1216" stroke="#1c3540" />
      <text x="172" y="104" textAnchor="middle" fontSize="10" fill="#bbf7d0">
        Checks calendar
      </text>
      <line x1="222" y1="100" x2="256" y2="100" stroke="#1c3540" strokeWidth="1.5" />
      <line x1="256" y1="100" x2="256" y2="46" stroke="#1c3540" strokeWidth="1.5" />
      <line x1="256" y1="100" x2="256" y2="154" stroke="#1c3540" strokeWidth="1.5" />
      <rect x="258" y="28" width="76" height="36" rx="9" fill="#0f1b14" stroke="#1e3a2a" />
      <text x="296" y="50" textAnchor="middle" fontSize="10" fill="#6ee7b7">
        Booked
      </text>
      <rect x="258" y="136" width="76" height="36" rx="9" fill="#0a1216" stroke="#1c3540" />
      <text x="296" y="155" textAnchor="middle" fontSize="9.5" fill="#bbf7d0">
        Takes a
      </text>
      <text x="296" y="166" textAnchor="middle" fontSize="9.5" fill="#bbf7d0">
        message
      </text>
    </svg>
  );
}
