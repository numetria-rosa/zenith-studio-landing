import { AGENT_NAME } from "@/lib/whatsapp-umrah/agent-name";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency, getUsageSummary } from "@/lib/whatsapp-umrah/dashboard-data";
import { buyExtraRepliesAction, cancelSubscriptionAction } from "../actions";
import { extraPackOffer, formatPackPrice } from "@/lib/whatsapp-umrah/extra-replies";
import { PageHeader } from "@/components/wa/ui";
import type { BusinessHours } from "@/lib/whatsapp-umrah/hours";
import { resolveTimezone } from "@/lib/whatsapp-umrah/timezone";
import { marketForWhopPlanId } from "@/lib/whatsapp-umrah/whop-plans";
import { SettingsForm, type SettingsState } from "./SettingsForm";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default async function SettingsPage({ params, searchParams }: { params: Promise<{ agencyId: string }>; searchParams: Promise<{ extra?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const { extra } = await searchParams;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const s = agency.agentSettings;
  const usage = await getUsageSummary(agencyId);
  const offer = await extraPackOffer(agencyId);
  const hours = (s?.businessHours ?? null) as BusinessHours | null;

  const initial: SettingsState = {
    agencyName: agency.name,
    tone: s?.tone === "FORMAL" ? "FORMAL" : "WARM",
    signOff: !!s?.signOff?.trim(),
    emoji: s?.emojiEnabled ?? true,
    langs: s?.languagesEnabled ?? ["en", "ar", "tr", "ur"],
    allDay: !hours, // no hours saved means open 24/7
    days: Object.fromEntries(DAY_KEYS.map((k) => [k, { on: !!hours?.[k], open: hours?.[k]?.open ?? "09:00", close: hours?.[k]?.close ?? "17:00" }])) as SettingsState["days"],
    tzSaved: !!s?.timezone,
    timezone: resolveTimezone(s?.timezone, marketForWhopPlanId(agency.subscription?.whopPlanId)?.market),
    outside: s?.awayMode === "AWAY_MESSAGE_ONLY" ? "AWAY_MESSAGE_ONLY" : "AI_REPLIES",
    awayMessage: s?.awayMessage ?? "",
    resumeOn: !!s?.autoResumeIdleMinutes,
    mins: s?.autoResumeIdleMinutes ?? 30,
    limit: s?.monthlyReplyLimit ? String(s.monthlyReplyLimit) : "",
    retention: String(s?.retentionMonths ?? 12),
  };

  const sub = agency.subscription;
  const billing = sub ? { planLabel: sub.plan === "STARTER" ? "Starter" : String(sub.plan), active: sub.status === "ACTIVE", foundingOffer: !!sub.foundingOffer, canCancel: !!sub.whopMembershipId && sub.status === "ACTIVE" } : null;

  return (
    <div>
      <PageHeader title="Settings" subtitle={`How ${AGENT_NAME} sounds, which languages it replies in, and what happens outside your hours.`} />
      <SettingsForm agencyId={agencyId} initial={initial} used={usage.used} planCap={usage.planCap - usage.extraReplies} extraReplies={usage.extraReplies} extraLeft={usage.extraRemaining} pack={{ replies: offer.replies, price: formatPackPrice(offer.currency, offer.price) }} justBought={extra === "thanks"} buyAction={buyExtraRepliesAction.bind(null, agencyId)} billing={billing} cancelAction={cancelSubscriptionAction.bind(null, agencyId)} />
    </div>
  );
}
