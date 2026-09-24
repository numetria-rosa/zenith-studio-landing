import { db } from "@/lib/db";

/* CRM & Logging Agent: every lead touch gets written to our own DB (so the
   admin test page and the client's own dashboard always have something to
   show) and forwarded to the client's own CRM webhook URL - the "connects
   to whatever CRM the agency already uses" story, without us building a
   per-CRM integration before we know which CRMs real clients actually run
   (see the Integration provider "crm" self-serve form in the dashboard's
   Integrations tab). Forwarding failure never blocks the log from being
   saved. projectId is optional only because the internal admin sandbox
   page (see the crm-log API route) still calls this unscoped. */

export type LogCrmEntryInput = {
  projectId?: string | null;
  agencyName: string;
  leadName: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
};

export async function logCrmEntry(input: LogCrmEntryInput) {
  const entry = await db.insuranceCrmLogEntry.create({
    data: {
      projectId: input.projectId || null,
      agencyName: input.agencyName,
      leadName: input.leadName,
      phone: input.phone || null,
      email: input.email || null,
      notes: input.notes || null,
    },
  });

  let forwarded = false;
  if (input.projectId) {
    const integration = await db.integration.findFirst({
      where: { projectId: input.projectId, provider: "crm", status: "CONNECTED" },
      select: { config: true },
    });
    const webhookUrl = (integration?.config as { webhookUrl?: string } | null)?.webhookUrl;
    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agencyName: input.agencyName,
            leadName: input.leadName,
            phone: input.phone || "",
            email: input.email || "",
            notes: input.notes || "",
          }),
        });
        forwarded = res.ok;
      } catch {
        forwarded = false;
      }
    }
  }

  if (forwarded) {
    await db.insuranceCrmLogEntry.update({ where: { id: entry.id }, data: { forwarded: true } });
  }

  return { ...entry, forwarded };
}

export async function listRecentCrmEntries(limit = 25) {
  return db.insuranceCrmLogEntry.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

export async function listRecentCrmEntriesForProject(projectId: string, limit = 25) {
  return db.insuranceCrmLogEntry.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: limit });
}
