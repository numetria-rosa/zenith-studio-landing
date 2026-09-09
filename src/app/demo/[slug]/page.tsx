import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";
import { buildDemoAssistantPayload } from "@/lib/vapi";
import DemoCallButton from "./DemoCallButton";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const prospect = await db.prospect.findUnique({ where: { id: slug }, select: { businessName: true } });
  return { title: prospect ? `AI Receptionist demo for ${prospect.businessName}` : "AI Receptionist demo" };
}

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prospect = await db.prospect.findUnique({
    where: { id: slug },
    select: { id: true, businessName: true, niche: true },
  });
  if (!prospect) notFound();

  const assistant = buildDemoAssistantPayload(
    prospect.id,
    prospect.businessName,
    prospect.niche,
    `${getSiteUrl()}/api/demo/vapi`
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.05] p-8 text-center backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Live demo</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
          {prospect.businessName}&apos;s AI receptionist
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          This is a live call in your browser, no phone number needed. Ask it a question or try booking an
          appointment the way one of your own callers would.
        </p>
        <div className="mt-8">
          <DemoCallButton assistant={assistant} />
        </div>
      </div>
    </div>
  );
}
