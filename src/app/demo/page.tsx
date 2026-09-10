import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";
import { buildDemoAssistantPayload } from "@/lib/vapi";
import DemoCallButton from "./[slug]/DemoCallButton";

export const metadata: Metadata = { title: "Live AI Receptionist Demo" };

/* Public, generic demo, not tied to any real Prospect row (that's what
   /demo/[slug] is for, personalized links sent in outreach). This is the
   one anyone lands on from the marketing site itself: the homepage and the
   Receptionist service page both link here. Same safe demo assistant
   config (/api/demo/vapi, no real booking, no secret) as the personalized
   version, just generic "Bright Smile Dental" framing instead of a real
   prospect's name. */
export default function PublicDemoPage() {
  const assistant = buildDemoAssistantPayload(
    "public-demo",
    "Bright Smile Dental",
    "Dental clinics",
    `${getSiteUrl()}/api/demo/vapi`
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.05] p-8 text-center backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Live demo</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Talk to the AI Receptionist</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          This is a live call in your browser, no phone number needed. Ask it a question or try booking an
          appointment the way one of your own callers would.
        </p>
        <div className="mt-8">
          <DemoCallButton assistant={assistant} />
        </div>
        <Link href="/" className="mt-6 inline-block text-xs text-white/40 hover:text-white/70">
          &larr; Back to Zenith Studio
        </Link>
      </div>
    </div>
  );
}
