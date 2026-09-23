import { db } from "@/lib/db";

/* CRM & Logging Agent: every lead touch gets written to our own DB (so the
   test page always has something to show, Make.com configured or not) and
   best-effort forwarded to a Make.com scenario that mirrors it into a Make
   Data Store - the "connects to whatever CRM the agency already uses" story
   without us building a per-CRM integration before anyone's paid for one.
   Forwarding failure never blocks the log from being saved. */

export type LogCrmEntryInput = {
  agencyName: string;
  leadName: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
};

export async function logCrmEntry(input: LogCrmEntryInput) {
  const entry = await db.insuranceCrmLogEntry.create({
    data: {
      agencyName: input.agencyName,
      leadName: input.leadName,
      phone: input.phone || null,
      email: input.email || null,
      notes: input.notes || null,
    },
  });

  const webhookUrl = process.env.MAKE_INSURANCE_CRM_WEBHOOK_URL;
  let forwardedToMake = false;
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
      forwardedToMake = res.ok;
    } catch {
      forwardedToMake = false;
    }
  }

  if (forwardedToMake) {
    await db.insuranceCrmLogEntry.update({ where: { id: entry.id }, data: { forwardedToMake: true } });
  }

  return { ...entry, forwardedToMake };
}

export async function listRecentCrmEntries(limit = 25) {
  return db.insuranceCrmLogEntry.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
