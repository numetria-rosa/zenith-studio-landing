import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getService } from "@/lib/services";
import { getSiteUrl } from "@/lib/site";
import {
  approveAndSend,
  classifyReply,
  prepareOutreach,
  sendTestCopy,
  stopSequence,
} from "@/lib/outreach-admin";
import type { ReplyClass } from "@prisma/client";

const REPLY_OPTIONS: { id: ReplyClass; label: string }[] = [
  { id: "INTERESTED", label: "Interested" },
  { id: "WANTS_INFO", label: "Wants info" },
  { id: "WANTS_AUDIT", label: "Wants audit" },
  { id: "WANTS_PRICING", label: "Wants pricing" },
  { id: "WANTS_CALL", label: "Wants call" },
  { id: "NOT_INTERESTED", label: "Not interested" },
  { id: "UNSUBSCRIBE", label: "Unsubscribe" },
  { id: "WRONG_CONTACT", label: "Wrong contact" },
  { id: "OUT_OF_OFFICE", label: "Out of office" },
  { id: "OTHER", label: "Other" },
];

export default async function AdminOutreachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const { id } = await params;

  const prospect = await db.prospect.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" }, take: 30 },
      proposal: { select: { id: true, accessToken: true, status: true, setupPaidAt: true } },
    },
  });
  if (!prospect) notFound();

  const latest = prospect.messages[0] ?? null;
  const service = getService(prospect.recommendedServiceId);
  const site = getSiteUrl();
  const research = prospect.researchData as { verified?: { observedSignals?: string[] }; inferences?: string[] };

  async function prepare() {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    await prepareOutreach(id);
    redirect(`/admin/outreach/${id}`);
  }

  async function sendLive(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const messageId = String(formData.get("messageId") || "");
    if (!messageId) return;
    await approveAndSend(messageId);
    redirect(`/admin/outreach/${id}`);
  }

  async function sendTest(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session?.user?.email) return;
    const messageId = String(formData.get("messageId") || "");
    if (!messageId) return;
    await sendTestCopy(messageId, session.user.email);
    redirect(`/admin/outreach/${id}`);
  }

  async function stop(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    await stopSequence(id, String(formData.get("reason") || "manual"));
    redirect(`/admin/outreach/${id}`);
  }

  async function classify(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    await classifyReply(id, String(formData.get("replyClass") || "OTHER") as ReplyClass, String(formData.get("note") || ""));
    redirect(`/admin/outreach/${id}`);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/outreach" className="text-sm text-white/50 hover:text-white">
        ← Outreach
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{prospect.businessName}</h1>
      <p className="mt-1 text-sm text-white/50">
        {prospect.city}, {prospect.country} · {prospect.niche} · score {prospect.prospectScore} · {prospect.priority} ·{" "}
        {prospect.status.replaceAll("_", " ")}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-xs uppercase tracking-wide text-white/40">Contact</h2>
          <p className="mt-2 text-sm">{prospect.email ?? "Not publicly found"}</p>
          <p className="text-sm text-white/60">{prospect.phone ?? "Not publicly found"}</p>
          {prospect.website ? (
            <a href={prospect.website} className="mt-2 block text-sm text-cyan-300 underline" target="_blank" rel="noreferrer">
              {prospect.website}
            </a>
          ) : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-xs uppercase tracking-wide text-white/40">Recommendation</h2>
          <p className="mt-2 text-sm">{service?.title}</p>
          <p className="text-sm text-white/60">{prospect.recommendedOffer.replaceAll("_", " ")}</p>
          <p className="mt-2 text-sm text-white/70">{prospect.opportunity}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-xs uppercase tracking-wide text-white/40">Verified observations (only these may appear in email)</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-white/70">
          {(research.verified?.observedSignals ?? [prospect.personalizationSignal]).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {(research.inferences?.length ?? 0) > 0 && (
          <p className="mt-3 text-xs text-amber-200/80">Inference (not emailed as fact): {research.inferences?.join(" ")}</p>
        )}
      </div>

      {latest ? (
        <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-5">
          <h2 className="text-sm font-semibold">Email preview: {latest.emailType.replaceAll("_", " ")}</h2>
          <p className="mt-1 text-xs text-white/50">
            Quality {latest.qualityScore}/100 · fact check {latest.factCheckPassed ? "passed" : "failed"} · {latest.status}
          </p>
          <p className="mt-4 text-sm">
            <span className="text-white/40">To:</span> {prospect.email ?? "-"}
          </p>
          <p className="text-sm">
            <span className="text-white/40">Subject:</span> {latest.subject}
          </p>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-6 text-white/80">{latest.bodyText}</pre>
          <p className="mt-4 text-xs text-white/40">
            Service page: {site}
            {latest.servicePagePath}
          </p>
          {latest.proposalPath ? (
            <p className="text-xs text-white/40">
              Proposal: {site}
              {latest.proposalPath}
            </p>
          ) : (
            <p className="text-xs text-white/40">No proposal in this email (audit-first path).</p>
          )}
          {service ? (
            <p className="mt-2 text-xs text-white/40">
              Price: {service.setupPriceDisplay || "no setup"} + {service.monthlyPriceDisplay}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <form action={sendTest}>
              <input type="hidden" name="messageId" value={latest.id} />
              <button className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10">
                Send test to me
              </button>
            </form>
            <form action={sendLive}>
              <input type="hidden" name="messageId" value={latest.id} />
              <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
                Approve &amp; send
              </button>
            </form>
          </div>
        </div>
      ) : (
        <form action={prepare} className="mt-6">
          <button className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            Generate outreach draft
          </button>
        </form>
      )}

      {latest && latest.status !== "SENT" && latest.status !== "DELIVERED" && (
        <form action={prepare} className="mt-3">
          <button className="text-sm text-white/50 underline">Regenerate draft</button>
        </form>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <form action={classify} className="rounded-2xl border border-white/10 p-5">
          <h2 className="text-sm font-semibold">Log a reply</h2>
          <p className="mt-1 text-xs text-white/40">There is no inbox sync. Paste classification when you see a reply.</p>
          <select name="replyClass" className="mt-3 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm">
            {REPLY_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <textarea name="note" rows={2} className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm" placeholder="Optional note" />
          <button className="mt-3 rounded-full border border-white/15 px-4 py-2 text-sm">Save classification</button>
        </form>
        <form action={stop} className="rounded-2xl border border-white/10 p-5">
          <h2 className="text-sm font-semibold">Stop sequence</h2>
          <input type="hidden" name="reason" value="manual" />
          <button className="mt-4 rounded-full border border-red-400/30 px-4 py-2 text-sm text-red-200">Do not contact</button>
        </form>
      </div>

      {prospect.proposal ? (
        <p className="mt-6 text-sm">
          Linked proposal:{" "}
          <Link href={`/admin/proposals/${prospect.proposal.id}`} className="text-cyan-300 underline">
            {prospect.proposal.status}
          </Link>
          {prospect.proposal.accessToken ? (
            <>
              {" "}
              ·{" "}
              <a href={`/proposal/${prospect.proposal.accessToken}`} className="text-cyan-300 underline">
                public link
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      <h2 className="mt-10 text-sm font-semibold">Activity</h2>
      <ul className="mt-3 space-y-2 text-xs text-white/50">
        {prospect.events.map((e) => (
          <li key={e.id}>
            {e.createdAt.toISOString().slice(0, 16).replace("T", " ")} · {e.type}
          </li>
        ))}
      </ul>
    </div>
  );
}
