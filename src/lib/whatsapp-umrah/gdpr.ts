import { db } from "@/lib/db";

/** Everything held on one contact, for a UK GDPR Art. 15/20 data subject
    access request (CLAUDE.md §7). The agency is the data controller and
    fields this request from their own dashboard; we're the processor. */
export async function exportContactData(agencyId: string, contactId: string) {
  const contact = await db.waContact.findFirst({
    where: { id: contactId, agencyId },
    include: {
      conversations: {
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          handoffs: true,
        },
      },
      leads: { include: { events: true } },
    },
  });
  return contact;
}

/** Right to erasure (Art. 17). Every child row cascades from WaContact's
    onDelete: Cascade (conversations -> messages -> handoffs, leads ->
    lead events), so this one delete is the whole erasure. */
export async function deleteContactData(agencyId: string, contactId: string): Promise<boolean> {
  const result = await db.waContact.deleteMany({ where: { id: contactId, agencyId } });
  return result.count > 0;
}

/** Scheduled purge (CLAUDE.md §7's "per-agency retention setting...with a
    scheduled purge job") - see src/app/api/cron/whatsapp-umrah-retention.
    A contact is purged once its most recent conversation activity is
    older than its agency's WaAgentSettings.retentionMonths (default 12).
    A contact with no conversations yet is measured from its own
    createdAt, so a stale, message-less contact still eventually purges. */
export async function purgeExpiredContacts(): Promise<{ purgedContacts: number; agenciesChecked: number }> {
  const agencies = await db.waAgency.findMany({
    select: { id: true, agentSettings: { select: { retentionMonths: true } } },
  });

  let purgedContacts = 0;
  for (const agency of agencies) {
    const retentionMonths = agency.agentSettings?.retentionMonths ?? 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - retentionMonths);

    const contacts = await db.waContact.findMany({
      where: { agencyId: agency.id, createdAt: { lt: cutoff } },
      select: {
        id: true,
        conversations: { select: { lastCustomerMessageAt: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 },
      },
    });

    const expiredIds = contacts
      .filter((c) => {
        const lastActivity = c.conversations[0]?.lastCustomerMessageAt ?? c.conversations[0]?.updatedAt ?? null;
        return !lastActivity || lastActivity < cutoff;
      })
      .map((c) => c.id);

    if (expiredIds.length > 0) {
      const result = await db.waContact.deleteMany({ where: { id: { in: expiredIds } } });
      purgedContacts += result.count;
    }
  }

  return { purgedContacts, agenciesChecked: agencies.length };
}
