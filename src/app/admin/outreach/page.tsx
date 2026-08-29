import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getService } from "@/lib/services";
import {
  getCampaignStats,
  importDallasDentalProspects,
  prepareEligibleProspects,
  setAutoSendEnabled,
} from "@/lib/outreach-admin";
import { runOutreachSelfTest } from "@/lib/outreach";

function money(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default async function AdminOutreachPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const { status } = await searchParams;

  const [stats, prospects] = await Promise.all([
    getCampaignStats(),
    db.prospect.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: [{ prospectScore: "desc" }, { businessName: "asc" }],
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, qualityScore: true } },
      },
    }),
  ]);

  async function importResearch() {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    await importDallasDentalProspects();
    redirect("/admin/outreach");
  }

  async function prepareAll() {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    await prepareEligibleProspects();
    redirect("/admin/outreach");
  }

  async function toggleAuto(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    await setAutoSendEnabled(formData.get("enabled") === "1");
    redirect("/admin/outreach");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">Outreach</h1>
      <p className="mt-1 text-sm text-white/50">
        Quality over volume. Nothing goes to a real prospect until you click Approve &amp; send. Auto-send is off
        unless you enable it below, and even then only follow-ups with quality ≥ 85.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Prospects" value={String(stats.prospects)} />
        <Stat label="Ready / needs review" value={String(stats.readyToSend)} />
        <Stat label="Emails sent" value={String(stats.emails.sent)} />
        <Stat label="Replies" value={String(stats.emails.replied)} />
        <Stat label="Delivered" value={String(stats.emails.delivered)} />
        <Stat label="Bounced" value={String(stats.emails.bounced)} />
        <Stat label="Proposals viewed" value={String(stats.proposals.viewed)} />
        <Stat label="Paid" value={String(stats.proposals.paid)} />
        <Stat label="Setup won" value={money(stats.revenue.setupWon)} />
        <Stat label="MRR won" value={`${money(stats.revenue.monthlyWon)}/mo`} />
        <Stat label="Setup pipeline" value={money(stats.revenue.setupPotential)} />
        <Stat label="MRR pipeline" value={`${money(stats.revenue.monthlyPotential)}/mo`} />
      </div>

      <SelfTest />

      <div className="mt-6 flex flex-wrap gap-3">
        <form action={importResearch}>
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10">
            Load Dallas dental research
          </button>
        </form>
        <form action={prepareAll}>
          <button className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-400/20">
            Prepare eligible emails
          </button>
        </form>
        <form action={toggleAuto}>
          <input type="hidden" name="enabled" value={stats.settings.autoSendEnabled ? "0" : "1"} />
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10">
            Auto-send follow-ups: {stats.settings.autoSendEnabled ? "ON" : "OFF"}
          </button>
        </form>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {prospects.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-white/40">
                  No prospects yet. Load the Dallas dental research to start.
                </td>
              </tr>
            )}
            {prospects.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <Link href={`/admin/outreach/${p.id}`} className="font-medium hover:underline">
                    {p.businessName}
                  </Link>
                  <p className="text-xs text-white/40">{p.niche}</p>
                </td>
                <td className="px-4 py-3 text-white/70">
                  {p.city}, {p.country}
                </td>
                <td className="px-4 py-3 text-white/70">{p.email ?? "-"}</td>
                <td className="px-4 py-3">
                  {p.prospectScore} · {p.priority}
                </td>
                <td className="px-4 py-3 text-white/70">{getService(p.recommendedServiceId)?.title ?? p.recommendedServiceId}</td>
                <td className="px-4 py-3 text-xs text-white/60">{p.status.replaceAll("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SelfTest() {
  const results = runOutreachSelfTest();
  const failed = results.filter((r) => !r.ok);
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs">
      <p className="uppercase tracking-wide text-white/40">Engine self-test (no email sent)</p>
      <p className={`mt-1 ${failed.length ? "text-red-300" : "text-emerald-300"}`}>
        {results.filter((r) => r.ok).length}/{results.length} checks passed
      </p>
      {failed.map((f) => (
        <p key={f.name} className="mt-1 text-red-300">
          {f.name}
          {f.detail ? ` · ${f.detail}` : ""}
        </p>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
