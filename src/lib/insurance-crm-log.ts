import { db } from "@/lib/db";
import { groqChatCompletion } from "@/lib/groq";

/* CRM & Logging Agent: every lead touch gets written to our own DB (so the
   admin test page and the client's own dashboard always have something to
   show) and forwarded to the client's own CRM webhook URL - the "connects
   to whatever CRM the agency already uses" story, without us building a
   per-CRM integration before we know which CRMs real clients actually run
   (see the Integration provider "crm" self-serve form in the dashboard's
   Integrations tab). Forwarding failure never blocks the log from being
   saved. projectId is optional only because the internal admin sandbox
   page (see the crm-log API route) still calls this unscoped.

   Not every client's CRM webhook expects our default field names
   (agencyName/leadName/phone/email/notes) - a Zapier "Webhooks by Zapier"
   step feeding EZLynx, HawkSoft, or a generic CRM often wants its own
   field names (full_name, contact_email, etc.), and a mismatch there
   fails silently from our side (the webhook still returns 200, it just
   drops/misfiles the data). If the client described their expected
   format when connecting (Integration.config.payloadFormat), reshape the
   payload through Groq before sending instead of waiting for a client to
   notice their CRM never got the lead. */

const REFORMAT_SYSTEM_PROMPT = `You reshape a lead record into the exact JSON structure a receiving webhook expects, given the client's own description or example of that structure. Use ONLY the data provided - never invent values. Respond with a single JSON object matching the described structure, nothing else.`;

async function reformatPayload(
  lead: { agencyName: string; leadName: string; phone: string; email: string; notes: string },
  formatHint: string
): Promise<Record<string, unknown> | null> {
  const result = await groqChatCompletion({
    systemPrompt: REFORMAT_SYSTEM_PROMPT,
    userPrompt: `Lead data:\n${JSON.stringify(lead, null, 2)}\n\nExpected output format (the client's own description or example):\n${formatHint}`,
    jsonMode: true,
  });
  if (!result.ok) return null;
  try {
    const parsed = JSON.parse(result.content);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

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
    const config = integration?.config as { webhookUrl?: string; payloadFormat?: string } | null;
    const webhookUrl = config?.webhookUrl;
    if (webhookUrl) {
      const defaultPayload = {
        agencyName: input.agencyName,
        leadName: input.leadName,
        phone: input.phone || "",
        email: input.email || "",
        notes: input.notes || "",
      };
      // Best-effort reshape - a Groq failure or unparseable response falls
      // straight back to the default shape rather than blocking the send.
      const payload = config?.payloadFormat ? (await reformatPayload(defaultPayload, config.payloadFormat)) ?? defaultPayload : defaultPayload;

      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
