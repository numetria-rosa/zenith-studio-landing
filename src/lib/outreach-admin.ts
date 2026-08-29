import { randomBytes } from "node:crypto";
import { Prisma, type OutreachEmailType, type OutreachPath, type ProspectStatus, type ReplyClass } from "@prisma/client";
import { db } from "@/lib/db";
import { getService, servicePagePath } from "@/lib/services";
import { PAID_AUDIT_BOOKING_URL } from "@/lib/paid-audit";
import { catalogPricesForService } from "@/lib/service-pages";
import { getSiteUrl } from "@/lib/site";
import { DALLAS_DENTAL_PROSPECTS } from "@/data/outreach-prospects";
import {
  type EligibilityInput,
  type ProspectResearch,
  evaluateEligibility,
  factCheckEmail,
  generateFollowUp,
  generateOutreachEmail,
  generateProposalCopy,
  isPublicEmail,
  outreachPriority,
  scoreEmailQuality,
} from "@/lib/outreach";
import { appendPlainLinks, renderOutreachHtml, sendAdminAlert, sendOutreachEmail } from "@/lib/outreach-mail";

function newUnsubscribeToken(): string {
  return randomBytes(24).toString("hex");
}

export async function getOutreachSettings() {
  return db.outreachSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export async function setAutoSendEnabled(enabled: boolean) {
  return db.outreachSettings.upsert({
    where: { id: "default" },
    create: { id: "default", autoSendEnabled: enabled },
    update: { autoSendEnabled: enabled },
  });
}

export async function recordOutreachEvent(
  prospectId: string,
  type: string,
  payload?: Prisma.InputJsonValue
) {
  await db.outreachEvent.create({
    data: { prospectId, type, payload: payload ?? Prisma.JsonNull },
  });
}

async function isSuppressed(email: string | null): Promise<boolean> {
  if (!isPublicEmail(email)) return false;
  const row = await db.emailSuppression.findUnique({ where: { email: email!.trim().toLowerCase() } });
  return Boolean(row);
}

export async function suppressEmail(email: string, reason: string) {
  const normalized = email.trim().toLowerCase();
  await db.emailSuppression.upsert({
    where: { email: normalized },
    create: { email: normalized, reason },
    update: { reason },
  });
}

function toEligibilityInput(
  prospect: {
    businessName: string;
    city: string;
    country: string;
    niche: string;
    website: string | null;
    email: string | null;
    phone: string | null;
    contactName: string | null;
    prospectScore: number;
    recommendedServiceId: string;
    recommendedOffer: string;
    personalizationSignal: string;
    opportunity: string;
    buyingSignal: string | null;
    researchData: Prisma.JsonValue;
    status: ProspectStatus;
    lastOutreachAt: Date | null;
  },
  flags: { alreadyContacted: boolean; previouslyNegative: boolean; unsubscribed: boolean; suppressed: boolean }
): EligibilityInput {
  const research = prospect.researchData as ProspectResearch;
  return {
    businessName: prospect.businessName,
    city: prospect.city,
    country: prospect.country,
    niche: prospect.niche,
    website: prospect.website,
    email: prospect.email,
    phone: prospect.phone,
    contactName: prospect.contactName,
    prospectScore: prospect.prospectScore,
    recommendedServiceId: prospect.recommendedServiceId,
    recommendedOffer: prospect.recommendedOffer as EligibilityInput["recommendedOffer"],
    personalizationSignal: prospect.personalizationSignal,
    opportunity: prospect.opportunity,
    buyingSignal: prospect.buyingSignal,
    research,
    alreadyContacted: flags.alreadyContacted,
    previouslyNegative: flags.previouslyNegative,
    unsubscribed: flags.unsubscribed,
    suppressed: flags.suppressed,
    hasOpenProposal: false,
  };
}

async function ensureProposal(prospectId: string): Promise<{ id: string; accessToken: string } | { error: string }> {
  const prospect = await db.prospect.findUnique({ where: { id: prospectId } });
  if (!prospect) return { error: "prospect not found" };
  if (prospect.proposalId) {
    const existing = await db.proposal.findUnique({
      where: { id: prospect.proposalId },
      select: { id: true, accessToken: true },
    });
    if (existing) return existing;
  }

  const catalog = await db.serviceCatalog.findUnique({
    where: { slug: prospect.recommendedServiceId },
    select: { id: true, title: true, setupPriceCents: true, monthlyPriceCents: true },
  });
  const prices = catalogPricesForService(prospect.recommendedServiceId);
  const setupCents = catalog?.setupPriceCents ?? prices.setupCents;
  const monthlyCents = catalog?.monthlyPriceCents ?? prices.monthlyCents;
  const service = getService(prospect.recommendedServiceId);
  const copy = generateProposalCopy(
    toEligibilityInput(prospect, {
      alreadyContacted: false,
      previouslyNegative: false,
      unsubscribed: false,
      suppressed: false,
    })
  );

  const items: Prisma.ProposalItemCreateWithoutProposalInput[] = [];
  let order = 0;
  if (setupCents > 0) {
    items.push({
      label: `${service?.title ?? "Service"} setup`,
      kind: "SETUP",
      amountCents: setupCents,
      catalogService: catalog ? { connect: { id: catalog.id } } : undefined,
      order: order++,
    });
  }
  if (monthlyCents > 0) {
    items.push({
      label: `${service?.title ?? "Service"} monthly`,
      kind: "MONTHLY",
      amountCents: monthlyCents,
      catalogService: catalog ? { connect: { id: catalog.id } } : undefined,
      order: order++,
    });
  }
  if (items.length === 0) return { error: "catalog has no prices for this service" };

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const proposal = await db.proposal.create({
    data: {
      clientEmail: prospect.email || "unknown@invalid.local",
      clientName: prospect.contactName,
      companyName: prospect.businessName,
      accessToken: randomBytes(24).toString("hex"),
      expiresAt,
      ...copy,
      items: { create: items },
    },
    select: { id: true, accessToken: true },
  });

  await db.prospect.update({ where: { id: prospectId }, data: { proposalId: proposal.id } });
  return proposal;
}

async function markProposalSent(proposalId: string) {
  const proposal = await db.proposal.findUnique({ where: { id: proposalId }, include: { items: true } });
  if (!proposal) return;
  if (proposal.status === "DRAFT") {
    await db.proposal.update({ where: { id: proposalId }, data: { status: "SENT", sentAt: new Date() } });
  }
}

export async function prepareOutreach(prospectId: string, emailType: OutreachEmailType = "INITIAL") {
  const prospect = await db.prospect.findUnique({
    where: { id: prospectId },
    include: { messages: { select: { status: true, emailType: true } } },
  });
  if (!prospect) return { ok: false as const, error: "prospect not found" };

  const suppressed = await isSuppressed(prospect.email);
  const alreadySent = prospect.messages.some((m) => m.emailType === emailType && (m.status === "SENT" || m.status === "DELIVERED"));
  const input = toEligibilityInput(prospect, {
    alreadyContacted: alreadySent,
    previouslyNegative: prospect.status === "NOT_INTERESTED",
    unsubscribed: prospect.status === "UNSUBSCRIBED",
    suppressed,
  });
  const eligibility = evaluateEligibility(input);

  if (emailType === "INITIAL" && !eligibility.hard.ok) {
    await db.prospect.update({
      where: { id: prospectId },
      data: { status: "REJECTED", rejectionReasons: eligibility.hard.failures, outreachScore: eligibility.outreachScore, priority: eligibility.priority },
    });
    return { ok: false as const, error: `not eligible: ${eligibility.hard.failures.join(", ")}` };
  }

  if (emailType === "INITIAL" && eligibility.priority === "SKIP") {
    await db.prospect.update({
      where: { id: prospectId },
      data: { status: "REJECTED", rejectionReasons: ["score below 70"], outreachScore: eligibility.outreachScore, priority: "SKIP" },
    });
    return { ok: false as const, error: "score below 70 — will not contact" };
  }

  const path = eligibility.path;
  const generated =
    emailType === "INITIAL"
      ? generateOutreachEmail(input, path)
      : (() => {
          const fu = generateFollowUp(
            emailType === "FOLLOW_UP_1" ? 1 : emailType === "FOLLOW_UP_2" ? 2 : 3,
            input,
            input.personalizationSignal
          );
          return {
            subject: fu.subject,
            bodyText: fu.bodyText,
            greeting: "",
            observation: input.personalizationSignal,
            factsUsed: [input.personalizationSignal],
          };
        })();

  const fact = factCheckEmail(generated.bodyText, input);
  const quality = scoreEmailQuality(
    { subject: generated.subject, bodyText: generated.bodyText, greeting: generated.greeting, observation: generated.observation, factsUsed: generated.factsUsed },
    input,
    fact
  );

  let proposalPath: string | null = null;
  if (path === "PROPOSAL" && emailType === "INITIAL") {
    const proposal = await ensureProposal(prospectId);
    if ("error" in proposal) return { ok: false as const, error: proposal.error };
    proposalPath = `/proposal/${proposal.accessToken}`;
  }

  const servicePath = servicePagePath(prospect.recommendedServiceId);
  if (!servicePath) return { ok: false as const, error: "no service page" };

  const needsReview = quality.total < 85 || !fact.passed || eligibility.priority === "C";
  const messageStatus = needsReview ? "NEEDS_REVIEW" : "READY_TO_SEND";
  const prospectStatus: ProspectStatus =
    prospect.status === "SEQUENCE_ACTIVE"
      ? "SEQUENCE_ACTIVE"
      : needsReview
        ? "NEEDS_REVIEW"
        : "READY_TO_SEND";

  const message = await db.outreachMessage.create({
    data: {
      prospectId,
      emailType,
      subject: generated.subject,
      bodyText: generated.bodyText,
      bodyHtml: "",
      qualityScore: quality.total,
      status: messageStatus,
      factsUsed: generated.factsUsed,
      factCheckPassed: fact.passed,
      factCheckNotes: { notes: fact.notes, unverified: fact.unverifiedClaims, quality },
      servicePagePath: servicePath,
      proposalPath,
      auditCta: path,
    },
  });

  await db.prospect.update({
    where: { id: prospectId },
    data: {
      status: prospectStatus,
      outreachScore: eligibility.outreachScore,
      priority: eligibility.priority,
      outreachPath: path as OutreachPath,
      rejectionReasons: eligibility.hard.failures,
    },
  });

  await recordOutreachEvent(prospectId, "email_prepared", { messageId: message.id, emailType, quality: quality.total });
  return { ok: true as const, messageId: message.id, needsReview, quality: quality.total, eligibility };
}

export async function prepareEligibleProspects() {
  const prospects = await db.prospect.findMany({
    where: { status: { in: ["RESEARCHED", "NEEDS_REVIEW"] } },
  });
  const results = [];
  for (const p of prospects) {
    results.push({ id: p.id, name: p.businessName, ...(await prepareOutreach(p.id)) });
  }
  return results;
}

async function sentCounts() {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [hour, day] = await Promise.all([
    db.outreachMessage.count({ where: { sentAt: { gte: hourAgo }, status: { in: ["SENT", "DELIVERED"] } } }),
    db.outreachMessage.count({ where: { sentAt: { gte: dayAgo }, status: { in: ["SENT", "DELIVERED"] } } }),
  ]);
  return { hour, day };
}

export async function canSendNow(): Promise<{ ok: true } | { ok: false; error: string }> {
  const settings = await getOutreachSettings();
  const counts = await sentCounts();
  if (counts.hour >= settings.maxEmailsPerHour) {
    return { ok: false, error: `hourly limit reached (${settings.maxEmailsPerHour}/hour)` };
  }
  if (counts.day >= settings.maxEmailsPerDay) {
    return { ok: false, error: `daily limit reached (${settings.maxEmailsPerDay}/day)` };
  }
  return { ok: true };
}

function trackingUrl(messageId: string, target: string): string {
  const site = getSiteUrl();
  return `${site}/api/outreach/r?m=${encodeURIComponent(messageId)}&u=${encodeURIComponent(target)}`;
}

export async function sendPreparedMessage(
  messageId: string,
  opts: { overrideTo?: string; requireReady?: boolean } = {}
) {
  const requireReady = opts.requireReady !== false;
  const message = await db.outreachMessage.findUnique({
    where: { id: messageId },
    include: { prospect: true },
  });
  if (!message) return { ok: false as const, error: "message not found" };
  if (requireReady && message.status !== "READY_TO_SEND" && message.status !== "QUEUED") {
    return { ok: false as const, error: `message is ${message.status}, not ready to send` };
  }
  const prospect = message.prospect;
  const to = opts.overrideTo || prospect.email;
  if (!isPublicEmail(to) && !opts.overrideTo) return { ok: false as const, error: "no public email" };
  if (await isSuppressed(to)) return { ok: false as const, error: "email is suppressed" };
  if (["UNSUBSCRIBED", "NOT_INTERESTED", "CUSTOMER", "BOUNCED"].includes(prospect.status) && !opts.overrideTo) {
    return { ok: false as const, error: `prospect status ${prospect.status} blocks send` };
  }

  const rate = await canSendNow();
  if (!rate.ok) return { ok: false as const, error: rate.error };

  const site = getSiteUrl();
  const service = getService(prospect.recommendedServiceId);
  const serviceUrl = `${site}${message.servicePagePath}`;
  const proposalUrl = message.proposalPath ? `${site}${message.proposalPath}` : null;
  if (proposalUrl && prospect.proposalId) await markProposalSent(prospect.proposalId);

  const links = {
    serviceUrl: trackingUrl(message.id, serviceUrl),
    proposalUrl: proposalUrl ? trackingUrl(message.id, proposalUrl) : null,
    auditUrl:
      message.auditCta === "FREE_AUDIT" ? trackingUrl(message.id, `${site}/audit`) : null,
    paidAuditUrl:
      message.auditCta === "PAID_AUDIT_CALL" ? trackingUrl(message.id, PAID_AUDIT_BOOKING_URL) : null,
    unsubscribeUrl: `${site}/unsubscribe?token=${prospect.unsubscribeToken}`,
  };

  const text = appendPlainLinks(message.bodyText, {
    serviceUrl,
    proposalUrl,
    auditUrl: message.auditCta === "FREE_AUDIT" ? `${site}/audit` : null,
    paidAuditUrl: message.auditCta === "PAID_AUDIT_CALL" ? PAID_AUDIT_BOOKING_URL : null,
    unsubscribeUrl: links.unsubscribeUrl,
  }, service?.title ?? "this system");
  const html = renderOutreachHtml(message.bodyText, links, service?.title ?? "this system");

  const sent = await sendOutreachEmail({
    to: to!,
    subject: message.subject,
    html,
    text,
    unsubscribeUrl: links.unsubscribeUrl,
    listUnsubscribeUrl: `${site}/api/unsubscribe?token=${prospect.unsubscribeToken}`,
  });
  if (!sent.ok) {
    await db.outreachMessage.update({
      where: { id: messageId },
      data: { status: "FAILED" },
    });
    await recordOutreachEvent(prospect.id, "email_failed", { error: sent.error });
    return sent;
  }

  await db.outreachMessage.update({
    where: { id: messageId },
    data: {
      status: "SENT",
      bodyHtml: html,
      resendEmailId: sent.resendId,
      sentAt: new Date(),
    },
  });
  await db.prospect.update({
    where: { id: prospect.id },
    data: {
      status: "SEQUENCE_ACTIVE",
      lastOutreachAt: new Date(),
      sequenceStep:
        message.emailType === "INITIAL"
          ? 1
          : message.emailType === "FOLLOW_UP_1"
            ? 2
            : message.emailType === "FOLLOW_UP_2"
              ? 3
              : 4,
    },
  });
  await recordOutreachEvent(prospect.id, "email_sent", { messageId, resendId: sent.resendId });
  return { ok: true as const, resendId: sent.resendId };
}

export async function approveAndSend(messageId: string) {
  const message = await db.outreachMessage.findUnique({ where: { id: messageId } });
  if (!message) return { ok: false as const, error: "message not found" };
  if (message.status === "NEEDS_REVIEW" || message.status === "DRAFT") {
    await db.outreachMessage.update({ where: { id: messageId }, data: { status: "READY_TO_SEND" } });
  }
  return sendPreparedMessage(messageId, { requireReady: true });
}

export async function sendTestCopy(messageId: string, adminEmail: string) {
  return sendPreparedMessage(messageId, { overrideTo: adminEmail, requireReady: false });
}

export async function stopSequence(prospectId: string, reason: string, status?: ProspectStatus) {
  await db.prospect.update({
    where: { id: prospectId },
    data: {
      status: status ?? "NOT_INTERESTED",
      sequenceStoppedAt: new Date(),
      sequenceStopReason: reason,
    },
  });
  await db.outreachMessage.updateMany({
    where: { prospectId, status: { in: ["DRAFT", "NEEDS_REVIEW", "READY_TO_SEND", "QUEUED"] } },
    data: { status: "CANCELLED" },
  });
  await recordOutreachEvent(prospectId, "sequence_stopped", { reason });
}

export async function unsubscribeByToken(token: string) {
  if (!token || token.length < 10) return { ok: false as const, error: "invalid token" };
  const prospect = await db.prospect.findUnique({ where: { unsubscribeToken: token } });
  if (!prospect) return { ok: false as const, error: "invalid token" };
  if (prospect.email) await suppressEmail(prospect.email, "unsubscribe");
  await stopSequence(prospect.id, "unsubscribe", "UNSUBSCRIBED");
  return { ok: true as const, businessName: prospect.businessName };
}

export async function classifyReply(
  prospectId: string,
  replyClass: ReplyClass,
  note?: string
) {
  const stop =
    replyClass === "UNSUBSCRIBE" ||
    replyClass === "NOT_INTERESTED" ||
    replyClass === "WRONG_CONTACT";
  const positive =
    replyClass === "INTERESTED" ||
    replyClass === "WANTS_INFO" ||
    replyClass === "WANTS_AUDIT" ||
    replyClass === "WANTS_PRICING" ||
    replyClass === "WANTS_CALL";

  await db.outreachMessage.updateMany({
    where: { prospectId, emailType: { in: ["INITIAL", "FOLLOW_UP_1", "FOLLOW_UP_2", "FOLLOW_UP_3"] } },
    data: { repliedAt: new Date(), replyClass },
  });

  if (stop) {
    await stopSequence(
      prospectId,
      replyClass.toLowerCase(),
      replyClass === "UNSUBSCRIBE" ? "UNSUBSCRIBED" : replyClass === "WRONG_CONTACT" ? "WRONG_CONTACT" : "NOT_INTERESTED"
    );
    if (replyClass === "UNSUBSCRIBE") {
      const p = await db.prospect.findUnique({ where: { id: prospectId }, select: { email: true } });
      if (p?.email) await suppressEmail(p.email, "unsubscribe");
    }
  } else if (positive) {
    await db.prospect.update({
      where: { id: prospectId },
      data: {
        status: replyClass === "WANTS_AUDIT" ? "AUDIT_REQUESTED" : "HOT",
        sequenceStoppedAt: new Date(),
        sequenceStopReason: `reply:${replyClass}`,
      },
    });
    await db.outreachMessage.updateMany({
      where: { prospectId, status: { in: ["DRAFT", "NEEDS_REVIEW", "READY_TO_SEND", "QUEUED"] } },
      data: { status: "CANCELLED" },
    });
    const p = await db.prospect.findUnique({ where: { id: prospectId } });
    await sendAdminAlert(
      `Hot reply from ${p?.businessName ?? prospectId}`,
      `${p?.businessName} (${p?.email}) classified as ${replyClass}. ${note ?? ""}\nOpen /admin/outreach/${prospectId}`
    );
  } else if (replyClass === "OUT_OF_OFFICE") {
    await recordOutreachEvent(prospectId, "out_of_office", { note: note ?? null });
  }

  await recordOutreachEvent(prospectId, "reply_classified", { replyClass, note: note ?? null });
  return { ok: true as const };
}

export async function processFollowUps() {
  const settings = await getOutreachSettings();
  const now = Date.now();
  const active = await db.prospect.findMany({
    where: { status: "SEQUENCE_ACTIVE" },
    include: { messages: { orderBy: { createdAt: "desc" } } },
  });
  const prepared: string[] = [];
  for (const prospect of active) {
    if (!prospect.lastOutreachAt) continue;
    const hours = (now - prospect.lastOutreachAt.getTime()) / 36e5;
    const hasUnsent = prospect.messages.some((m) =>
      ["DRAFT", "NEEDS_REVIEW", "READY_TO_SEND", "QUEUED"].includes(m.status)
    );
    if (hasUnsent) continue;

    let next: OutreachEmailType | null = null;
    if (prospect.sequenceStep === 1 && hours >= settings.followUp1Hours) next = "FOLLOW_UP_1";
    else if (prospect.sequenceStep === 2 && hours >= settings.followUp2Hours) next = "FOLLOW_UP_2";
    else if (prospect.sequenceStep === 3 && hours >= settings.followUp3Hours) next = "FOLLOW_UP_3";
    else if (prospect.sequenceStep >= 4) {
      await stopSequence(prospect.id, "sequence_complete", "RESEARCHED");
      continue;
    }
    if (!next) continue;
    const already = prospect.messages.some((m) => m.emailType === next);
    if (already) continue;
    const result = await prepareOutreach(prospect.id, next);
    if (result.ok) prepared.push(result.messageId);
  }

  if (settings.autoSendEnabled) {
    const ready = await db.outreachMessage.findMany({
      where: { status: "READY_TO_SEND", emailType: { not: "INITIAL" } },
      take: 5,
    });
    for (const m of ready) {
      const rate = await canSendNow();
      if (!rate.ok) break;
      await sendPreparedMessage(m.id);
    }
  }

  return { prepared: prepared.length };
}

export async function syncProspectFromProposal(proposalId: string, event: "viewed" | "accepted" | "declined" | "paid") {
  const prospect = await db.prospect.findUnique({ where: { proposalId } });
  if (!prospect) return;
  if (event === "viewed") {
    await recordOutreachEvent(prospect.id, "proposal_viewed", { proposalId });
  } else if (event === "accepted") {
    await db.prospect.update({
      where: { id: prospect.id },
      data: { status: "HOT", sequenceStoppedAt: new Date(), sequenceStopReason: "proposal_accepted" },
    });
    await recordOutreachEvent(prospect.id, "proposal_accepted", { proposalId });
    await sendAdminAlert(`Proposal accepted — ${prospect.businessName}`, `${prospect.businessName} approved a proposal.`);
  } else if (event === "declined") {
    await stopSequence(prospect.id, "proposal_declined", "NOT_INTERESTED");
  } else if (event === "paid") {
    await db.prospect.update({
      where: { id: prospect.id },
      data: { status: "CUSTOMER", sequenceStoppedAt: new Date(), sequenceStopReason: "paid" },
    });
    await recordOutreachEvent(prospect.id, "payment_completed", { proposalId });
    await sendAdminAlert(`Paid — ${prospect.businessName}`, `${prospect.businessName} is now a customer.`);
  }
}

export async function getCampaignStats() {
  const [
    prospects,
    messages,
    proposals,
    suppressions,
    settings,
  ] = await Promise.all([
    db.prospect.findMany({ select: { status: true, prospectScore: true, recommendedServiceId: true, proposalId: true } }),
    db.outreachMessage.findMany({
      select: { status: true, sentAt: true, deliveredAt: true, openedAt: true, clickedAt: true, repliedAt: true, bouncedAt: true },
    }),
    db.proposal.findMany({
      where: { prospect: { isNot: null } },
      select: { status: true, viewedAt: true, setupPaidAt: true, items: { select: { amountCents: true, kind: true, isOptionalAddOn: true } } },
    }),
    db.emailSuppression.count(),
    getOutreachSettings(),
  ]);

  const sent = messages.filter((m) => m.sentAt).length;
  const delivered = messages.filter((m) => m.deliveredAt).length;
  const bounced = messages.filter((m) => m.bouncedAt).length;
  const replied = messages.filter((m) => m.repliedAt).length;
  const opened = messages.filter((m) => m.openedAt).length;
  const clicked = messages.filter((m) => m.clickedAt).length;

  let setupPotential = 0;
  let monthlyPotential = 0;
  let setupWon = 0;
  let monthlyWon = 0;
  for (const p of proposals) {
    for (const item of p.items) {
      if (item.isOptionalAddOn) continue;
      if (item.kind === "MONTHLY") {
        monthlyPotential += item.amountCents;
        if (p.setupPaidAt) monthlyWon += item.amountCents;
      } else {
        setupPotential += item.amountCents;
        if (p.setupPaidAt) setupWon += item.amountCents;
      }
    }
  }

  return {
    settings,
    prospects: prospects.length,
    byStatus: countBy(prospects.map((p) => p.status)),
    readyToSend: prospects.filter((p) => p.status === "READY_TO_SEND" || p.status === "NEEDS_REVIEW").length,
    emails: { sent, delivered, bounced, opened, clicked, replied },
    audits: prospects.filter((p) => p.status === "AUDIT_REQUESTED").length,
    proposals: {
      total: proposals.length,
      viewed: proposals.filter((p) => p.viewedAt).length,
      accepted: proposals.filter((p) => p.status === "APPROVED").length,
      paid: proposals.filter((p) => p.setupPaidAt).length,
    },
    revenue: {
      setupPotential,
      monthlyPotential,
      setupWon,
      monthlyWon,
    },
    suppressions,
  };
}

function countBy(values: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}

export async function importDallasDentalProspects() {
  let created = 0;
  let skipped = 0;
  for (const seed of DALLAS_DENTAL_PROSPECTS) {
    const existing = await db.prospect.findFirst({
      where: {
        OR: [
          { businessName: seed.businessName, city: seed.city },
          ...(seed.email ? [{ email: seed.email }] : []),
        ],
      },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    await db.prospect.create({
      data: {
        businessName: seed.businessName,
        website: seed.website,
        city: seed.city,
        country: seed.country,
        niche: seed.niche,
        area: seed.area,
        email: seed.email,
        phone: seed.phone,
        prospectScore: seed.prospectScore,
        outreachScore: seed.prospectScore,
        priority: outreachPriority(seed.prospectScore),
        tier: seed.tier,
        recommendedServiceId: seed.recommendedServiceId,
        recommendedOffer: seed.recommendedOffer,
        outreachPath: seed.recommendedOffer === "PAID_AUDIT_CALL" ? "PAID_AUDIT_CALL" : "FREE_AUDIT",
        personalizationSignal: seed.personalizationSignal,
        opportunity: seed.opportunity,
        buyingSignal: seed.buyingSignal,
        researchData: seed.research,
        unsubscribeToken: newUnsubscribeToken(),
        status: "RESEARCHED",
      },
    });
    created += 1;
  }
  return { created, skipped, total: DALLAS_DENTAL_PROSPECTS.length };
}
