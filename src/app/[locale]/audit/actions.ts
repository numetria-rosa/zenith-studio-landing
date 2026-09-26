"use server";

import { db } from "@/lib/db";
import { STEPS, answerList, type AuditAnswers } from "./fields";
import { sendAdminAlert } from "@/lib/outreach-mail";
import { matchAudit } from "@/lib/audit-matcher";
import {
  createProposalFromAudit,
  emailProposalPdfAsAdmin,
  sendProposalAsAdmin,
  updateProposalSectionsAsAdmin,
} from "@/lib/proposals-admin";

export type SubmitAuditResult =
  | { ok: true; proposalSent: boolean; email: string }
  | { ok: false; error: string };

/* Public, no-account intake form. Every non-contact answer is a fixed
   choice, so a submission is matched to services (audit-matcher.ts) and a
   priced proposal is built and emailed right here, with no admin step.
   When nothing matches or any step fails, the audit still saves and the
   client is told honestly that a person will follow up instead. */
export async function submitAuditRequest(answers: AuditAnswers): Promise<SubmitAuditResult> {
  const clean: AuditAnswers = {};
  for (const step of STEPS) {
    for (const field of step.fields) {
      const raw = answers[field.key];
      let value: string | string[] | undefined;
      if (field.options) {
        const picked = answerList(raw).filter((v) => field.options!.includes(v));
        value = field.type === "multi" ? picked : picked[0];
      } else if (typeof raw === "string") {
        value = raw.trim();
      }
      const empty = !value || value.length === 0;
      if (field.required && empty) return { ok: false, error: "Please answer all required questions." };
      if (!empty) clean[field.key] = value!;
    }
  }

  const email = String(clean.contactEmail).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  const company = String(clean.companyName);
  const name = String(clean.contactName);

  const audit = await db.auditRequest.create({
    data: { email, name, companyName: company, formAnswers: clean },
  });

  let proposalSent = false;
  let detail = "";
  try {
    const result = await buildAndSendProposal(audit.id, clean);
    proposalSent = result.ok;
    detail = result.ok ? `Proposal sent automatically (${result.summary}).` : `No proposal sent: ${result.error}. Needs manual review.`;
  } catch (err) {
    console.error(`[audit] auto-proposal failed for ${audit.id}:`, err);
    detail = "Auto-proposal crashed, needs manual review.";
  }

  await sendAdminAlert(
    `Free audit request: ${company}`,
    `${name} (${email}, ${company}) submitted the audit form. ${detail} Review at ${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://zenith-studio.site"}/admin/audits/${audit.id}`
  ).catch(() => {});

  return { ok: true, proposalSent, email };
}

async function buildAndSendProposal(
  auditId: string,
  answers: AuditAnswers
): Promise<{ ok: true; summary: string } | { ok: false; error: string }> {
  const match = matchAudit(answers);
  if (match.services.length === 0) return { ok: false, error: "no service matched these answers" };

  const catalog = await db.serviceCatalog.findMany({
    where: { slug: { in: match.services.map((s) => s.slug) }, active: true, acceptingNewClients: true },
  });
  const bySlug = new Map(catalog.map((c) => [c.slug, c]));
  const services = match.services.filter((s) => bySlug.has(s.slug));
  if (services.length === 0) return { ok: false, error: "matched services are not accepting new clients" };

  const outcomes = answerList(answers.desiredOutcomes).join(", ").toLowerCase();
  await db.auditFinding.createMany({ data: match.findings.map((f) => ({ ...f, auditId })) });
  // One at a time, not createMany: proposal line items follow createdAt, so
  // the main recommendation (bundle) must be written first to be listed first.
  for (const s of services) {
    await db.auditRecommendation.create({
      data: {
        auditId,
        catalogServiceId: bySlug.get(s.slug)!.id,
        title: bySlug.get(s.slug)!.title,
        priority: "HIGH",
        rationale: s.reasons.join(". ") + ".",
        expectedOutcome: outcomes ? `Directly targets what you said matters most: ${outcomes}.` : "Less manual work every week.",
        estimatedEffort: "Live in 2-7 days",
      },
    });
  }

  const created = await createProposalFromAudit(auditId);
  if (!created.ok) return created;

  const titles = services.map((s) => bySlug.get(s.slug)!.title);
  const hasSetupFee = services.some((s) => (bySlug.get(s.slug)!.setupPriceCents ?? 0) > 0);
  const company = String(answers.companyName);
  const bottleneck = String(answers.biggestBottleneck).toLowerCase();

  await updateProposalSectionsAsAdmin(created.id, {
    executiveSummary: `${company} told us the biggest bottleneck right now is ${bottleneck}. Based on your answers, we recommend ${joinList(titles)}: a done-for-you system we build, connect to your existing tools, and run for you every day, so your team spends less time on repetitive work and more time with clients.`,
    notIncluded: [
      ...match.notIncluded.map((line) => `• ${line}`),
      "• Custom software unrelated to the services listed",
      "• Third-party subscription fees (billed by those vendors directly)",
    ].join("\n"),
    ...(hasSetupFee
      ? {}
      : {
          nextSteps: "1. Approve this proposal. Nothing is charged today.\n2. Complete the short project checklist so we can start the build.\n3. Your monthly plan is billed once your system is live.",
          terms: "Setup is included at no charge. The monthly plan covers hosting, monitoring and ongoing improvements, is billed once your system is live, and can be cancelled anytime.",
        }),
  });

  const sent = await sendProposalAsAdmin(created.id);
  if (!sent.ok) return sent;

  const proposal = await db.proposal.findUniqueOrThrow({ where: { id: created.id }, select: { accessToken: true } });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zenith-studio.site";
  const emailed = await emailProposalPdfAsAdmin(created.id, `${siteUrl}/proposals/view/${proposal.accessToken}`);
  if (!emailed.ok) return emailed;

  await db.auditRequest.update({ where: { id: auditId }, data: { status: "PROPOSAL_SENT" } });
  return { ok: true, summary: titles.join(" + ") };
}

function joinList(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
