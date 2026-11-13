import { AGENT_NAME } from "@/lib/whatsapp-umrah/agent-name";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency, listConversations, getConversationThread } from "@/lib/whatsapp-umrah/dashboard-data";
import { takeOverConversationAction, resumeAiAction, sendHumanReplyAction, deleteContactAction, flagReplyAction } from "../actions";
import { isWaitingOnPerson } from "@/lib/whatsapp-umrah/handoff-alerts";
import { guessLanguage } from "@/lib/whatsapp-umrah/agent/language";
import { LANGUAGE_NAMES } from "@/lib/whatsapp-umrah/agent/persona";
import { PageHeader } from "@/components/wa/ui";
import { shortTime } from "@/components/wa/format";
import { InboxView, type ListItem, type ThreadView, type TimelineItem } from "./InboxView";
import { getT } from "@/lib/whatsapp-umrah/ui-lang-server";

const hhmm = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export default async function InboxPage({ params, searchParams }: { params: Promise<{ agencyId: string }>; searchParams: Promise<{ c?: string }> }) {
  const t = await getT();
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const { c: selectedId } = await searchParams;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();
  const agentName = AGENT_NAME;

  const conversations = await listConversations(agencyId);
  const activeId = selectedId || conversations[0]?.id || null;
  const thread = activeId ? await getConversationThread(agencyId, activeId) : null;

  const list: ListItem[] = conversations.map((c) => ({
    id: c.id,
    name: c.contact.name || c.contact.phone,
    phone: c.contact.phone,
    preview: c.lastMessage?.body ?? "",
    time: c.lastMessage ? shortTime(c.lastMessage.createdAt) : "",
    status: c.status,
    waiting: isWaitingOnPerson({ status: c.status, lastCustomerMessageAt: c.lastCustomerMessageAt, lastHumanReplyAt: c.messages[0]?.createdAt ?? null }),
    leadStatus: c.leads[0]?.status ?? null,
  }));

  let view: ThreadView | null = null;
  if (thread) {
    // The chat is the messages in order, with a divider wherever control changed hands.
    const events = thread.handoffs.flatMap((h) => [
      { at: h.startedAt, label: `${h.triggeredBy === "MANUAL" ? t("YOUR TEAM TOOK OVER") : t("{agent} HANDED THIS TO YOUR TEAM", { agent: agentName.toUpperCase() })} · ${hhmm(h.startedAt)}`, id: `${h.id}-start`, note: h.triggeredBy === "AUTO" ? h.reason : undefined },
      ...(h.resolvedAt ? [{ at: h.resolvedAt, label: `${t("{agent} IS BACK ON THIS CHAT", { agent: agentName.toUpperCase() })} · ${hhmm(h.resolvedAt)}`, id: `${h.id}-end` }] : []),
    ]);
    const entries = [
      ...thread.messages.map((m) => ({ at: m.createdAt, item: { kind: "msg", id: m.id, who: m.sender === "CUSTOMER" ? "customer" : m.sender === "HUMAN" ? "team" : "ai", body: m.body ?? "", time: hhmm(m.createdAt), flagged: !!m.flaggedAt } as TimelineItem })),
      ...events.map((e) => ({ at: e.at, item: { kind: "divider", id: e.id, label: e.label, note: "note" in e ? e.note : undefined } as TimelineItem })),
    ].sort((a, b) => a.at.getTime() - b.at.getTime());
    const first = thread.messages[0]?.createdAt;
    const items: TimelineItem[] = [...(first ? [{ kind: "divider", id: "day", label: first.toDateString() === new Date().toDateString() ? "TODAY" : first.toLocaleDateString("en-GB", { day: "numeric", month: "long" }).toUpperCase() } as TimelineItem] : []), ...entries.map((e) => e.item)];
    const lead = thread.leads[0];
    const languages = [...new Set(thread.messages.filter((m) => m.sender === "CUSTOMER" && m.body).map((m) => LANGUAGE_NAMES[guessLanguage(m.body!)]))].join(", ");
    view = {
      id: thread.id,
      contactId: thread.contactId,
      name: thread.contact.name || thread.contact.phone,
      phone: thread.contact.phone,
      status: thread.status,
      messageCount: thread.messages.length,
      items,
      lead: lead ? { status: lead.status, travelDates: lead.travelDates, travelers: lead.travelers, budgetGbp: lead.budgetGbp, packagePreference: lead.packagePreference } : null,
      languages: languages || t("English"),
      exportHref: `/api/whatsapp-umrah/${agencyId}/contacts/${thread.contactId}/export`,
    };
  }

  return (
    <div>
      <PageHeader title={t("Inbox")} subtitle={t("Every conversation, live. Take over any chat, or let {agentName} keep going.", { agentName })} />
      <InboxView
        agencyId={agencyId}
        agencyName={agency.name}
        agentName={agentName}
        list={list}
        activeId={activeId}
        thread={view}
        actions={
          activeId && thread
            ? {
                takeOver: takeOverConversationAction.bind(null, agencyId, activeId),
                resume: resumeAiAction.bind(null, agencyId, activeId),
                send: sendHumanReplyAction.bind(null, agencyId, activeId),
                deleteContact: deleteContactAction.bind(null, agencyId, thread.contactId),
                flag: flagReplyAction.bind(null, agencyId),
              }
            : null
        }
      />
    </div>
  );
}
