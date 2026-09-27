import { db } from "@/lib/db";
import { sendAsBusiness } from "@/lib/client-mail";
import { readSettings, tcReminderDays, tcDocumentChaseEmail } from "@/lib/agent-settings";

/* Brokerage AI Transaction Coordinator. The agent adds a deal; a standard
   deadline timeline and a document checklist for their side are generated
   from the contract and closing dates. A daily cron (runTransactionCoordinator)
   emails the agent before each deadline and chases the buyer/seller for
   missing documents. Deterministic: dates and templates, no AI. */

const DAY = 86400000;
const MAX_CHASES = 3;
const CHASE_GAP_DAYS = 3;

export const SIDES = ["BUYER", "SELLER"] as const;
export type Side = (typeof SIDES)[number];

const DOCUMENTS: Record<Side, string[]> = {
  BUYER: ["Pre-approval letter", "Proof of earnest money deposit", "Signed inspection response", "Homeowner's insurance binder", "Final loan documents"],
  SELLER: ["Signed seller disclosures", "HOA documents (if any)", "Mortgage payoff information", "Keys and access codes", "Signed closing documents"],
};

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY);
}

/** Standard timeline, clamped so nothing lands before the contract or after closing. */
export function defaultDeadlines(contract: Date, closing: Date): { label: string; dueDate: Date }[] {
  const clamp = (d: Date) => new Date(Math.min(Math.max(d.getTime(), contract.getTime()), closing.getTime()));
  return [
    { label: "Earnest money deposit", dueDate: clamp(addDays(contract, 3)) },
    { label: "Inspection period ends", dueDate: clamp(addDays(contract, 10)) },
    { label: "Appraisal completed", dueDate: clamp(addDays(contract, 21)) },
    { label: "Loan approval", dueDate: clamp(addDays(closing, -10)) },
    { label: "Final walkthrough", dueDate: clamp(addDays(closing, -1)) },
    { label: "Closing", dueDate: closing },
  ];
}

export function defaultDocuments(side: Side): string[] {
  return DOCUMENTS[side];
}

/** Parses a yyyy-mm-dd form value as a calendar day at 12:00 UTC. */
export function parseDay(value: string): Date | null {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)) : null;
}

type Result = { ok: true } | { ok: false; error: string };

async function ownedBrokerage(projectId: string, userId: string) {
  return db.serviceProject.findFirst({ where: { id: projectId, userId, sourceServiceId: "brokerages" }, select: { id: true } });
}

export async function createTransaction(
  projectId: string,
  userId: string,
  input: { propertyAddress: string; side: string; clientName: string; clientEmail: string; contractDate: string; closingDate: string }
): Promise<Result> {
  if (!(await ownedBrokerage(projectId, userId))) return { ok: false, error: "not_found" };
  const address = input.propertyAddress.trim();
  const clientName = input.clientName.trim();
  const clientEmail = input.clientEmail.trim().toLowerCase();
  const side = input.side as Side;
  const contract = parseDay(input.contractDate);
  const closing = parseDay(input.closingDate);
  if (!address || !clientName) return { ok: false, error: "Property address and client name are required." };
  if (!SIDES.includes(side)) return { ok: false, error: "Pick buyer or seller side." };
  if (!contract || !closing) return { ok: false, error: "Enter both the contract and closing dates." };
  if (closing.getTime() <= contract.getTime()) return { ok: false, error: "Closing has to be after the contract date." };
  if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) return { ok: false, error: "That client email doesn't look valid." };

  await db.transaction.create({
    data: {
      projectId,
      propertyAddress: address.slice(0, 200),
      side,
      clientName: clientName.slice(0, 120),
      clientEmail: clientEmail || null,
      contractDate: contract,
      closingDate: closing,
      deadlines: { create: defaultDeadlines(contract, closing).map((d, i) => ({ ...d, order: i })) },
      documents: { create: defaultDocuments(side).map((label, i) => ({ label, order: i })) },
    },
  });
  return { ok: true };
}

async function ownedTransaction(transactionId: string, projectId: string, userId: string) {
  return db.transaction.findFirst({ where: { id: transactionId, projectId, project: { userId } }, select: { id: true } });
}

export async function updateDeadline(projectId: string, userId: string, deadlineId: string, patch: { done?: boolean; dueDate?: string }): Promise<Result> {
  const deadline = await db.transactionDeadline.findUnique({ where: { id: deadlineId }, select: { transactionId: true } });
  if (!deadline || !(await ownedTransaction(deadline.transactionId, projectId, userId))) return { ok: false, error: "not_found" };
  const due = patch.dueDate !== undefined ? parseDay(patch.dueDate) : undefined;
  if (patch.dueDate !== undefined && !due) return { ok: false, error: "That date isn't valid." };
  await db.transactionDeadline.update({
    where: { id: deadlineId },
    // A moved date gets a fresh reminder.
    data: { ...(patch.done !== undefined ? { done: patch.done } : {}), ...(due ? { dueDate: due, remindedAt: null } : {}) },
  });
  return { ok: true };
}

export async function setDocumentReceived(projectId: string, userId: string, documentId: string, received: boolean): Promise<Result> {
  const doc = await db.transactionDocument.findUnique({ where: { id: documentId }, select: { transactionId: true } });
  if (!doc || !(await ownedTransaction(doc.transactionId, projectId, userId))) return { ok: false, error: "not_found" };
  await db.transactionDocument.update({ where: { id: documentId }, data: { received } });
  return { ok: true };
}

export async function setTransactionStatus(projectId: string, userId: string, transactionId: string, status: string): Promise<Result> {
  if (!["ACTIVE", "CLOSED", "CANCELLED"].includes(status)) return { ok: false, error: "bad status" };
  if (!(await ownedTransaction(transactionId, projectId, userId))) return { ok: false, error: "not_found" };
  await db.transaction.update({ where: { id: transactionId }, data: { status } });
  return { ok: true };
}

/** Daily: deadline reminders to the agent, document chases to the client. */
export async function runTransactionCoordinator(now = new Date()): Promise<{ reminders: number; chases: number }> {
  const transactions = await db.transaction.findMany({
    where: { status: "ACTIVE", project: { stage: { not: "PAUSED" } } },
    include: {
      deadlines: { orderBy: { order: "asc" } },
      documents: { orderBy: { order: "asc" } },
      project: { select: { title: true, agentSettings: true, user: { select: { email: true } } } },
    },
  });

  let reminders = 0;
  let chases = 0;
  for (const t of transactions) {
    const settings = readSettings(t.project.agentSettings);
    const agentEmail = t.project.user.email;
    const business = t.project.title;

    // A deadline is reminded once when it enters the window, and once more if it passes undone.
    const due = t.deadlines.filter((d) => {
      if (d.done) return false;
      const inWindow = d.dueDate.getTime() - now.getTime() <= tcReminderDays(settings) * DAY;
      const overdue = d.dueDate.getTime() < now.getTime();
      return (inWindow && !d.remindedAt) || (overdue && (!d.remindedAt || d.remindedAt < d.dueDate));
    });
    if (due.length > 0 && agentEmail) {
      const lines = due.map((d) => `- ${d.label}: ${d.dueDate.toDateString()}${d.dueDate < now ? " (overdue)" : ""}`).join("\n");
      const sent = await sendAsBusiness({
        businessName: "Zenith Transaction Coordinator",
        to: agentEmail,
        replyTo: null,
        subject: `Deadlines coming up: ${t.propertyAddress}`,
        text: `Upcoming for ${t.propertyAddress} (${t.clientName}, ${t.side.toLowerCase()} side):\n\n${lines}\n\nMark them done from your dashboard once handled.`,
      });
      if (sent.ok) {
        await db.transactionDeadline.updateMany({ where: { id: { in: due.map((d) => d.id) } }, data: { remindedAt: now } });
        reminders += due.length;
      }
    }

    if (settings.tcClientUpdates !== "off" && t.clientEmail) {
      const chaseable = t.documents.filter(
        (d) => !d.received && d.chaseCount < MAX_CHASES && (!d.lastChasedAt || now.getTime() - d.lastChasedAt.getTime() >= CHASE_GAP_DAYS * DAY)
      );
      if (chaseable.length > 0) {
        const email = tcDocumentChaseEmail(settings, { clientName: t.clientName, business, address: t.propertyAddress, documents: chaseable.map((d) => d.label) });
        const sent = await sendAsBusiness({ businessName: business, to: t.clientEmail, replyTo: agentEmail, subject: email.subject, text: email.body });
        if (sent.ok) {
          await db.transactionDocument.updateMany({
            where: { id: { in: chaseable.map((d) => d.id) } },
            data: { lastChasedAt: now, chaseCount: { increment: 1 } },
          });
          chases++;
        }
      }
    }
  }
  return { reminders, chases };
}
