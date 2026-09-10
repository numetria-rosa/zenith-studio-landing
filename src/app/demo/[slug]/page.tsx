import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";
import { buildDemoAssistantPayload } from "@/lib/vapi";
import { findOrCreateUserByEmail } from "@/lib/users";
import { createSessionForUser } from "@/lib/session";
import { getService, getSetupCheckoutUrl } from "@/lib/services";
import DemoCallButton from "./DemoCallButton";
import DemoBookingsFeed from "../DemoBookingsFeed";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const prospect = await db.prospect.findUnique({ where: { id: slug }, select: { businessName: true } });
  return { title: prospect ? `AI Receptionist demo for ${prospect.businessName}` : "AI Receptionist demo" };
}

const DEMO_PHONE_NUMBER = "+1 (213) 451 4165";

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prospect = await db.prospect.findUnique({
    where: { id: slug },
    select: { id: true, businessName: true, niche: true },
  });
  if (!prospect) notFound();

  const session = await auth();

  async function signUp(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const name = String(formData.get("name") || "").trim();
    if (!email) return;

    const user = await db.$transaction((tx) => findOrCreateUserByEmail(tx, email, name || null, `demo:${slug}`));
    await createSessionForUser(user.id);
    redirect(`/demo/${slug}`);
  }

  if (!session?.user?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.05] p-8 text-center backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Live demo</p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
            {prospect.businessName}&apos;s AI receptionist
          </h1>
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
          <Link href="/" className="mt-6 inline-block text-xs text-white/40 hover:text-white/70">
            &larr; Back to Zenith Studio
          </Link>
        </div>
      </div>
    );
  }

  const assistant = buildDemoAssistantPayload(
    prospect.id,
    prospect.businessName,
    prospect.niche,
    `${getSiteUrl()}/api/demo/vapi`
  );
  const receptionistService = getService("ai-receptionist");
  const checkoutUrl = receptionistService ? getSetupCheckoutUrl(receptionistService) : null;

  return (
    <div className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Live demo</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
          {prospect.businessName}&apos;s AI receptionist
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Try it two ways, then watch the booking land on the real calendar below.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href="tel:+12134514165"
            className="inline-flex flex-col items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-4 transition hover:bg-white/10"
          >
            <span className="text-sm font-semibold text-white">Call it</span>
            <span className="font-mono text-xs text-white/50">{DEMO_PHONE_NUMBER}</span>
          </a>
          <DemoCallButton assistant={assistant} />
        </div>

        <div className="mt-6">
          <DemoBookingsFeed />
        </div>

        {checkoutUrl && (
          <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-6">
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

        <Link href="/" className="mt-6 inline-block text-xs text-white/40 hover:text-white/70">
          &larr; Back to Zenith Studio
        </Link>
      </div>
    </div>
  );
}
