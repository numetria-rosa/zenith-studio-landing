import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { courseFontVars } from "@/lib/fonts";
import { CourseBar } from "@/components/CourseBar";
import { getService } from "@/lib/services";
import {
  getOwnedServiceProject,
  PROJECT_STAGE_ORDER,
  PROJECT_STAGE_LABELS,
  INTEGRATION_STATUS_LABELS,
  submitClientRequirement,
  postClientMessage,
  createClientSupportRequest,
  approveOwnedTimeEntry,
  rejectOwnedTimeEntry,
  connectMailbox,
  approveOwnedInboxDraft,
  rejectOwnedInboxDraft,
  cancelOwnedMembership,
  activateReceptionist,
  activateTextBack,
  activateLeadCapture,
  activateCrmWebhook,
  runDocumentAudit,
  importBookOfBusiness,
  updateOwnedSpecialty,
} from "@/lib/service-workspace";
import { LAW_FIRM_SPECIALTIES, LEGAL_SPECIALTY_PROFILES } from "@/lib/legal-specialties";
import { getMonthlyCostCents, resolveMonthlyBudgetCents } from "@/lib/usage-costs";
import { ProjectTabs } from "./Tabs";
import { visibleTabIds, type ActionItem } from "./tabs-visibility";
import { CancelPlanButton } from "./CancelPlanButton";
import { GuidePicker, InlineGuide } from "./GuidePicker";
import { CRM_SETUP_GUIDES, GOOGLE_SHEETS_SHARE_GUIDE } from "@/lib/setup-guides";
import { getSiteUrl } from "@/lib/site";
import { aggregateClientMetrics } from "@/lib/metric-labels";
import CrispChat from "@/components/CrispChat";

/* Client-facing service project workspace (Slice 7 of the service-platform
   build, 2026-08-28; moved from /lab/dashboard/services/[projectId] to
   /services/dashboard/[clientId] on 2026-09-24). Loaded from /lab/dashboard's
   "My projects" list. The route param is named clientId for the URL, but the
   value is still a ServiceProject id - one client can have more than one
   project, this page always shows exactly one.

   IDOR-critical: the page's ONLY data fetch is getOwnedServiceProject, which
   scopes { id: projectId, userId } in a single query - never "fetch by id,
   then check ownership after." A wrong id and someone else's real id both
   produce notFound() (404) here, identically - never a message that would
   confirm the id is real. Every server action below independently re-runs
   the same ownership-scoped check inside src/lib/service-workspace.ts,
   never trusting that reaching the action means this page's own check
   already passed. */

const REQUIREMENT_STATUS_LABELS: Record<string, string> = {
  MISSING: "Needed from you",
  SUBMITTED: "Submitted, awaiting review",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Needs revision",
};

const SUPPORT_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_CLIENT: "Waiting on you",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

/** +12134514165 -> (213) 451-4165. Falls back to the raw value for
    anything that doesn't match, never throws on an unexpected format. */
function formatPhoneNumber(e164: string): string {
  const match = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : e164;
}

/** What a client actually needs to DO with a phone-number-shaped
    integration, not just its connection status, a client cannot use this
    service without being told this somewhere. Deliberately the one
    exception to "never show more than provider + status for an
    Integration" (see the schema comment on Integration.externalRef): a
    phone number is the one externalRef shape that's actively useful and
    not sensitive to show the person it belongs to. */
function integrationInstructions(provider: string, sourceServiceId: string | null): string | null {
  if (provider === "vapi") {
    return "This is your AI Receptionist's number. Forward your business line to it, or give it out directly so every call reaches your AI receptionist.";
  }
  if (provider === "signalwire" && sourceServiceId === "law-firms") {
    return "Set up call forwarding from your business line to this number for calls that go unanswered. The AI will text that caller back immediately. Ask your phone provider how to set up conditional call forwarding if you're not sure how.";
  }
  return null;
}

/** Every mutating action below redirects here on success so the client sees
    real confirmation (not just a badge quietly changing color) and lands
    back on the tab they were on, not reset to Overview. Consistent with the
    error-redirect connectMailboxAction already did before this change. */
function flashUrl(projectId: string, tabId: string, message: string): string {
  return `/services/dashboard/${projectId}?tab=${tabId}&flash=${encodeURIComponent(message)}`;
}

function signInRedirect(projectId: string): string {
  return `/sign-in?callbackUrl=${encodeURIComponent(`/services/dashboard/${projectId}`)}`;
}

function formatEntryAmount(entry: { durationMinutes: number | null; expenseAmountCents: number | null }): string {
  if (entry.durationMinutes !== null) return `${(entry.durationMinutes / 60).toFixed(1)}h`;
  if (entry.expenseAmountCents !== null && entry.expenseAmountCents > 0) {
    return `$${(entry.expenseAmountCents / 100).toFixed(2)} expense`;
  }
  return "Case activity";
}

export default async function ServiceProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ mailError?: string; activateError?: string; flash?: string; tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { clientId: projectId } = await params;
  const { mailError, activateError, flash, tab: requestedTab } = await searchParams;
  const project = await getOwnedServiceProject(projectId, session.user.id);
  if (!project) notFound();

  async function submitRequirement(formData: FormData) {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const requirementId = String(formData.get("requirementId") || "");
    const detail = String(formData.get("detail") || "");
    await submitClientRequirement(projectId, session2.user.id, requirementId, detail);
    revalidatePath(`/services/dashboard/${projectId}`);
    redirect(flashUrl(projectId, "requirements", "Submitted - we'll review it shortly."));
  }

  async function sendMessage(formData: FormData) {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const body = String(formData.get("body") || "");
    await postClientMessage(projectId, session2.user.id, body);
    revalidatePath(`/services/dashboard/${projectId}`);
    redirect(flashUrl(projectId, "messages", "Message sent."));
  }

  async function submitSupportRequest(formData: FormData) {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const subject = String(formData.get("subject") || "");
    const body = String(formData.get("body") || "");
    const priority = String(formData.get("priority") || "MEDIUM");
    await createClientSupportRequest(projectId, session2.user.id, subject, body, priority);
    revalidatePath(`/services/dashboard/${projectId}`);
    redirect(flashUrl(projectId, "support", "Request submitted - we'll follow up here."));
  }

  async function approveEntry(formData: FormData) {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const entryId = String(formData.get("entryId") || "");
    await approveOwnedTimeEntry(projectId, session2.user.id, entryId);
    revalidatePath(`/services/dashboard/${projectId}`);
    redirect(flashUrl(projectId, "billing", "Entry approved."));
  }

  async function rejectEntry(formData: FormData) {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const entryId = String(formData.get("entryId") || "");
    await rejectOwnedTimeEntry(projectId, session2.user.id, entryId);
    revalidatePath(`/services/dashboard/${projectId}`);
    redirect(flashUrl(projectId, "billing", "Entry rejected."));
  }

  async function connectMailboxAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const provider = String(formData.get("provider") || "");
    const emailAddress = String(formData.get("emailAddress") || "");
    const appPassword = String(formData.get("appPassword") || "");
    const result = await connectMailbox(projectId, session2.user.id, provider, emailAddress, appPassword);
    revalidatePath(`/services/dashboard/${projectId}`);
    if (!result.ok) {
      redirect(`/services/dashboard/${projectId}?tab=inbox&mailError=${encodeURIComponent(result.error)}`);
    }
    redirect(flashUrl(projectId, "inbox", "Inbox connected."));
  }

  async function approveDraft(formData: FormData) {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const draftId = String(formData.get("draftId") || "");
    await approveOwnedInboxDraft(projectId, session2.user.id, draftId);
    revalidatePath(`/services/dashboard/${projectId}`);
    redirect(flashUrl(projectId, "inbox", "Reply approved and sent."));
  }

  async function rejectDraft(formData: FormData) {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const draftId = String(formData.get("draftId") || "");
    await rejectOwnedInboxDraft(projectId, session2.user.id, draftId);
    revalidatePath(`/services/dashboard/${projectId}`);
    redirect(flashUrl(projectId, "inbox", "Reply rejected."));
  }

  async function activateReceptionistAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const result = await activateReceptionist(projectId, session2.user.id, {
      businessName: String(formData.get("businessName") || ""),
      hours: String(formData.get("hours") || ""),
      faqText: String(formData.get("faqText") || ""),
      fallbackNumber: String(formData.get("fallbackNumber") || ""),
    });
    revalidatePath(`/services/dashboard/${projectId}`);
    if (!result.ok) {
      redirect(`/services/dashboard/${projectId}?tab=integrations&activateError=${encodeURIComponent(result.error)}`);
    }
    redirect(flashUrl(projectId, "integrations", "Receptionist is live. Your number is ready below."));
  }

  async function activateTextBackAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const result = await activateTextBack(projectId, session2.user.id, {
      businessName: String(formData.get("businessName") || ""),
    });
    revalidatePath(`/services/dashboard/${projectId}`);
    if (!result.ok) {
      redirect(`/services/dashboard/${projectId}?tab=integrations&activateError=${encodeURIComponent(result.error)}`);
    }
    redirect(flashUrl(projectId, "integrations", "Text-Back is live. Your number is ready below."));
  }

  async function activateLeadCaptureAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const result = await activateLeadCapture(projectId, session2.user.id, {
      businessName: String(formData.get("businessName") || ""),
      qualificationRules: String(formData.get("qualificationRules") || ""),
      notifyEmail: String(formData.get("notifyEmail") || ""),
    });
    revalidatePath(`/services/dashboard/${projectId}`);
    if (!result.ok) {
      redirect(`/services/dashboard/${projectId}?tab=integrations&activateError=${encodeURIComponent(result.error)}`);
    }
    redirect(flashUrl(projectId, "integrations", "Lead Capture is live. Your number is ready below."));
  }

  async function activateCrmWebhookAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const result = await activateCrmWebhook(projectId, session2.user.id, {
      webhookUrl: String(formData.get("webhookUrl") || ""),
      payloadFormat: String(formData.get("payloadFormat") || ""),
    });
    revalidatePath(`/services/dashboard/${projectId}`);
    if (!result.ok) {
      redirect(`/services/dashboard/${projectId}?tab=integrations&activateError=${encodeURIComponent(result.error)}`);
    }
    redirect(flashUrl(projectId, "integrations", "Your CRM is connected. New leads will be sent there automatically."));
  }

  async function runDocumentAuditAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));

    const file = formData.get("file");
    const rawText = String(formData.get("rawText") || "");
    let pdfBase64: string | undefined;
    let filename = "Pasted text";
    let sizeBytes: number | undefined;
    if (file instanceof File && file.size > 0) {
      filename = file.name;
      sizeBytes = file.size;
      pdfBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    }

    const result = await runDocumentAudit(projectId, session2.user.id, { filename, pdfBase64, rawText, sizeBytes });
    revalidatePath(`/services/dashboard/${projectId}`);
    if (!result.ok) {
      redirect(`/services/dashboard/${projectId}?tab=audit&activateError=${encodeURIComponent(result.error)}`);
    }
    redirect(flashUrl(projectId, "audit", "Audit complete - see the summary below."));
  }

  async function importBookOfBusinessAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));

    const file = formData.get("file");
    let fileBuffer: Buffer | undefined;
    let filename: string | undefined;
    let fileMimeType: string | undefined;
    if (file instanceof File && file.size > 0) {
      filename = file.name;
      fileMimeType = file.type;
      fileBuffer = Buffer.from(await file.arrayBuffer());
    }

    const result = await importBookOfBusiness(projectId, session2.user.id, {
      agencyName: String(formData.get("agencyName") || ""),
      googleSheetUrl: String(formData.get("googleSheetUrl") || ""),
      fileBuffer,
      filename,
      fileMimeType,
    });
    revalidatePath(`/services/dashboard/${projectId}`);
    if (!result.ok) {
      redirect(`/services/dashboard/${projectId}?tab=renewals&activateError=${encodeURIComponent(result.error)}`);
    }
    redirect(flashUrl(projectId, "renewals", `Imported ${result.created} ${result.created === 1 ? "client" : "clients"}. Renewal reminders are on.`));
  }

  async function updateSpecialtyAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const result = await updateOwnedSpecialty(projectId, session2.user.id, String(formData.get("specialty") || ""));
    revalidatePath(`/services/dashboard/${projectId}`);
    if (!result.ok) {
      redirect(`/services/dashboard/${projectId}?tab=billing&activateError=${encodeURIComponent(result.error)}`);
    }
    redirect(flashUrl(projectId, "billing", "Practice area updated."));
  }

  async function cancelPlan(): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(signInRedirect(projectId));
    const result = await cancelOwnedMembership(projectId, session2.user.id);
    revalidatePath(`/services/dashboard/${projectId}`);
    if (!result.ok) {
      redirect(`/services/dashboard/${projectId}?tab=billing&flash=${encodeURIComponent(`Couldn't cancel: ${result.error}`)}`);
    }
    redirect(flashUrl(projectId, "billing", "Your plan will cancel at the end of the current billing period."));
  }

  const serviceLabel =
    project.catalogService?.title ??
    (project.sourceServiceId ? getService(project.sourceServiceId)?.title : null) ??
    project.sourceServiceId ??
    "Service engagement";

  const stageIndex = PROJECT_STAGE_ORDER.indexOf(project.stage as (typeof PROJECT_STAGE_ORDER)[number]);
  const nextMilestone = project.milestones.find((m) => !m.completedAt);
  const outstandingCount = project.requirements.filter((r) => r.status === "MISSING" || r.status === "REJECTED").length;
  const aggregatedMetrics = aggregateClientMetrics(project.metrics);

  // Self-serve activation: a receptionist/text-back number is bought via
  // its own API call (real money, real phone number), so it's only
  // offered once and hidden the moment the matching Integration exists -
  // never a re-submittable form sitting next to a live number.
  const showReceptionistSetup =
    (project.sourceServiceId === "ai-receptionist" || project.sourceServiceId === "law-firms") &&
    !project.integrations.some((i) => i.provider === "vapi");
  const showTextBackSetup =
    project.sourceServiceId === "law-firms" && !project.integrations.some((i) => i.provider === "signalwire");
  const showLeadCaptureSetup =
    (project.sourceServiceId === "ai-lead-capture" || project.sourceServiceId === "brokerages") &&
    !project.integrations.some((i) => i.provider === "signalwire");
  const showCrmWebhookSetup =
    project.sourceServiceId === "insurance-ai-team" && !project.integrations.some((i) => i.provider === "crm");

  const [spentCents, budgetCents] = await Promise.all([getMonthlyCostCents(projectId), resolveMonthlyBudgetCents(projectId)]);
  const usagePct = budgetCents > 0 ? Math.min(100, Math.round((spentCents / budgetCents) * 100)) : 0;

  const tabs = visibleTabIds(project);
  const initialTab = tabs.includes((requestedTab ?? "") as (typeof tabs)[number]) ? (requestedTab as (typeof tabs)[number]) : undefined;
  const actionItems: ActionItem[] = [];
  if (outstandingCount > 0) {
    actionItems.push({
      id: "requirements",
      label: `Answer ${outstandingCount} outstanding requirement${outstandingCount === 1 ? "" : "s"}`,
      tabId: "requirements",
    });
  }
  if (tabs.includes("billing") && project.oauthConnections.length === 0) {
    actionItems.push({ id: "billing-connect", label: "Connect your calendar and email", tabId: "billing" });
  }
  if (tabs.includes("inbox") && project.mailConnections.length === 0) {
    actionItems.push({ id: "inbox-connect", label: "Connect your inbox", tabId: "inbox" });
  }
  const draftsToReview = project.timeEntries.filter((e) => e.status === "DRAFT").length;
  if (draftsToReview > 0) {
    actionItems.push({
      id: "billing-review",
      label: `Review ${draftsToReview} draft time ${draftsToReview === 1 ? "entry" : "entries"}`,
      tabId: "billing",
    });
  }
  const inboxDraftsToReview = project.inboxDrafts.filter((d) => d.status === "DRAFT").length;
  if (inboxDraftsToReview > 0) {
    actionItems.push({
      id: "inbox-review",
      label: `Review ${inboxDraftsToReview} draft ${inboxDraftsToReview === 1 ? "reply" : "replies"}`,
      tabId: "inbox",
    });
  }

  return (
    <div
      className={`${courseFontVars} min-h-screen bg-[#0d0f14] font-[family-name:var(--font-course-sans)] text-[#eeeee7]`}
    >
      <CrispChat />
      <CourseBar
        tag="Project"
        brand="lab"
        right={
          <Link
            href="/lab/dashboard"
            className="font-[family-name:var(--font-course-mono)] text-xs uppercase tracking-[0.08em] text-[#9aa0ae] transition hover:text-[#eeeee7]"
          >
            &larr; Dashboard
          </Link>
        }
      />

      <main className="mx-auto max-w-[980px] px-6 pb-20 pt-12">
        <div className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#f0b429]">
          Zenith Lab &middot; Project
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-course-serif)] text-[clamp(28px,4.5vw,40px)] font-semibold leading-[1.1] tracking-[-0.02em]">
          {project.title}
        </h1>
        <p className="mt-2 text-[15.5px] text-[#9aa0ae]">{serviceLabel}</p>

        {flash && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-[#4ade95]/30 bg-[#4ade95]/10 px-4 py-3 text-[13.5px] font-semibold text-[#4ade95]">
            {flash}
            <Link
              href={`/services/dashboard/${projectId}${initialTab ? `?tab=${initialTab}` : ""}`}
              className="flex-shrink-0 text-[#9aa0ae] hover:text-[#eeeee7]"
            >
              Dismiss
            </Link>
          </div>
        )}

        <ProjectTabs
          tabs={tabs}
          initialTab={initialTab}
          actionItems={actionItems}
          panels={{
            overview: (
              <div className="flex flex-col gap-8">
                <div>
                  <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
                    Stage
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {PROJECT_STAGE_ORDER.map((s, i) => (
                      <div
                        key={s}
                        className={`h-1.5 flex-1 rounded-full ${
                          stageIndex >= 0 && i <= stageIndex ? "bg-[#f0b429]" : "border border-[#232838] bg-[#0a0c10]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-[13px] text-[#9aa0ae]">
                    Current stage:{" "}
                    <span className="font-semibold text-[#eeeee7]">
                      {PROJECT_STAGE_LABELS[project.stage] ?? project.stage}
                    </span>
                  </p>
                </div>

                <div>
                  <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
                    Next milestone
                  </div>
                  {nextMilestone ? (
                    <p className="mt-3 text-[15.5px] font-semibold">{nextMilestone.title}</p>
                  ) : (
                    <p className="mt-3 text-[15.5px] text-[#9aa0ae]">All milestones complete.</p>
                  )}
                  <div className="mt-4 flex flex-col gap-2">
                    {project.milestones.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 text-[13.5px]">
                        <span
                          className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${
                            m.completedAt ? "bg-[#4ade95]" : "border border-[#333a4c] bg-transparent"
                          }`}
                        />
                        <span className={m.completedAt ? "text-[#9aa0ae] line-through" : "text-[#eeeee7]"}>
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
                    Outstanding requirements
                  </div>
                  <p className="mt-3 text-[15.5px]">
                    <span className="font-semibold text-[#f0b429]">{outstandingCount}</span>{" "}
                    {outstandingCount === 1 ? "item" : "items"} still needed from you
                  </p>
                </div>
              </div>
            ),

            requirements: (
              <div className="flex flex-col gap-4">
                {project.requirements.length === 0 && <p className="text-sm text-[#9aa0ae]">No requirements listed.</p>}
                {project.requirements.map((r) => {
                  const writable = r.status === "MISSING" || r.status === "REJECTED";
                  return (
                    <div key={r.id} className="rounded-xl border border-[#232838] bg-[#0d1016] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[14.5px] font-bold">{r.label}</span>
                        <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                          {REQUIREMENT_STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </div>
                      {r.detail && <p className="mt-2 text-[13px] text-[#9aa0ae]">{r.detail}</p>}
                      {writable ? (
                        <form action={submitRequirement} className="mt-3 flex flex-col gap-2">
                          <input type="hidden" name="requirementId" value={r.id} />
                          <textarea
                            name="detail"
                            required
                            rows={3}
                            placeholder="Provide the requested information here..."
                            className="w-full rounded-lg border border-[#333a4c] bg-[#191d26] px-3 py-2 text-[13.5px] text-[#eeeee7] placeholder:text-[#676e7d]"
                          />
                          <button
                            type="submit"
                            className="self-start rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                          >
                            Submit
                          </button>
                        </form>
                      ) : (
                        <p className="mt-3 text-[12px] text-[#676e7d]">
                          This item is being reviewed and can&apos;t be edited right now.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ),

            integrations: (
              <div className="flex flex-col gap-3">
                {activateError && (
                  <p className="rounded-lg border border-[#ff8585]/30 bg-[#ff8585]/10 px-3 py-2 text-[12.5px] text-[#ff8585]">
                    Couldn&apos;t activate: {activateError}
                  </p>
                )}

                {showReceptionistSetup && (
                  <div className="rounded-xl border border-[#333a4c] bg-[#191d26] p-5">
                    <p className="text-[13.5px] font-bold">Set up your AI Receptionist</p>
                    <p className="mt-1 text-[12.5px] text-[#9aa0ae]">
                      This buys a real phone number and turns the receptionist on immediately - no review, no
                      waiting on us.
                    </p>
                    <form action={activateReceptionistAction} className="mt-4 flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Business name</label>
                        <input
                          name="businessName"
                          required
                          placeholder="The name the AI should use when it answers"
                          className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Business hours</label>
                        <input
                          name="hours"
                          required
                          placeholder="e.g. Mon-Fri 9am-6pm"
                          className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">FAQ / common questions</label>
                        <textarea
                          name="faqText"
                          required
                          rows={3}
                          placeholder="Anything the AI should be able to answer on its own: services, pricing, location, policies"
                          className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Fallback phone number</label>
                        <input
                          name="fallbackNumber"
                          required
                          placeholder="A real human line to ring if the AI can't help - not the number you forward from"
                          className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="self-start rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                      >
                        Activate Receptionist
                      </button>
                    </form>
                  </div>
                )}

                {showTextBackSetup && (
                  <div className="rounded-xl border border-[#333a4c] bg-[#191d26] p-5">
                    <p className="text-[13.5px] font-bold">Set up your Missed Call Text-Back</p>
                    <p className="mt-1 text-[12.5px] text-[#9aa0ae]">
                      This buys a real phone number immediately. Once it&apos;s ready, forward your business line to
                      it on no-answer.
                    </p>
                    <form action={activateTextBackAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex flex-1 flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Business name</label>
                        <input
                          name="businessName"
                          required
                          placeholder="Used in the missed-call text"
                          className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                      >
                        Activate Text-Back
                      </button>
                    </form>
                  </div>
                )}

                {showLeadCaptureSetup && (
                  <div className="rounded-xl border border-[#333a4c] bg-[#191d26] p-5">
                    <p className="text-[13.5px] font-bold">
                      {project.sourceServiceId === "brokerages" ? "Set up your Inside Sales Agent" : "Set up your Lead Capture"}
                    </p>
                    <p className="mt-1 text-[12.5px] text-[#9aa0ae]">
                      This buys a real phone number immediately and turns on{" "}
                      {project.sourceServiceId === "brokerages" ? "lead follow-up" : "enquiry follow-up"} - no review,
                      no waiting on us.
                    </p>
                    <form action={activateLeadCaptureAction} className="mt-4 flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Business name</label>
                        <input
                          name="businessName"
                          required
                          placeholder={project.sourceServiceId === "brokerages" ? "Used when replying to a new lead" : "Used when replying to a new enquiry"}
                          className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Qualification rules</label>
                        <textarea
                          name="qualificationRules"
                          required
                          rows={3}
                          placeholder={
                            project.sourceServiceId === "brokerages"
                              ? "In plain language, what makes a lead worth pursuing (e.g. motivation, timeline, financing status)"
                              : "In plain language, what makes an enquiry worth pursuing (e.g. service area, budget, timing)"
                          }
                          className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Notify email</label>
                        <input
                          name="notifyEmail"
                          type="email"
                          required
                          placeholder={project.sourceServiceId === "brokerages" ? "Where we send you a copy of every new lead" : "Where we send you a copy of every new enquiry"}
                          className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="self-start rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                      >
                        {project.sourceServiceId === "brokerages" ? "Activate Inside Sales Agent" : "Activate Lead Capture"}
                      </button>
                    </form>
                  </div>
                )}

                {showCrmWebhookSetup && (
                  <div className="rounded-xl border border-[#333a4c] bg-[#191d26] p-5">
                    <p className="text-[13.5px] font-bold">Connect your CRM</p>
                    <p className="mt-1 text-[12.5px] leading-5 text-[#9aa0ae]">
                      Every new lead gets sent here automatically. Paste your CRM&apos;s own inbound webhook URL -
                      most CRMs (HubSpot, Zoho, AgencyZoom, monday.com, or a Zapier webhook) have one under their
                      own integrations settings. We never ask for a login to your CRM.
                    </p>

                    <GuidePicker guides={CRM_SETUP_GUIDES} label="Not sure how to get your webhook URL? Tell us what you use" />

                    <form action={activateCrmWebhookAction} className="mt-4 flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Webhook URL</label>
                        <input
                          name="webhookUrl"
                          type="url"
                          required
                          placeholder="https://..."
                          className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                          Does your CRM expect specific field names? (optional)
                        </label>
                        <textarea
                          name="payloadFormat"
                          rows={3}
                          placeholder={
                            'Only fill this in if your CRM needs exact field names, e.g.: {"full_name": "...", "contact_phone": "...", "contact_email": "...", "source": "Zenith AI"}. Leave blank to use our default field names.'
                          }
                          className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="self-start rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                      >
                        Connect
                      </button>
                    </form>
                  </div>
                )}

                {project.integrations.length === 0 && !showReceptionistSetup && !showTextBackSetup && !showLeadCaptureSetup && !showCrmWebhookSetup && (
                  <p className="text-sm text-[#9aa0ae]">No integrations set up for this project yet.</p>
                )}
                {project.integrations.map((i) => {
                  const instructions = integrationInstructions(i.provider, project.sourceServiceId);
                  const isPhoneNumber = (i.provider === "vapi" || i.provider === "signalwire") && i.externalRef;
                  return (
                    <div key={i.id} className="rounded-xl border border-[#232838] bg-[#0d1016] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[14.5px] font-bold capitalize">
                          {i.provider === "vapi"
                            ? "AI Receptionist number"
                            : i.provider === "signalwire"
                              ? "Phone number"
                              : i.provider === "crm"
                                ? "CRM webhook"
                                : i.provider}
                        </span>
                        <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                          {INTEGRATION_STATUS_LABELS[i.status] ?? "Not connected"}
                        </span>
                      </div>
                      {isPhoneNumber && i.status === "CONNECTED" && (
                        <p className="mt-2 font-[family-name:var(--font-course-mono)] text-lg font-bold text-[#f0b429]">
                          {formatPhoneNumber(i.externalRef!)}
                        </p>
                      )}
                      {instructions && i.status === "CONNECTED" && (
                        <p className="mt-2 text-[13px] leading-6 text-[#9aa0ae]">{instructions}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ),

            billing: (
              <div className="flex flex-col gap-6">
                {project.whopMonthlyMembershipId && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#232838] bg-[#0d1016] p-4">
                    <div>
                      <p className="text-[13.5px] font-bold">Manage your plan</p>
                      <p className="mt-1 text-[12.5px] text-[#9aa0ae]">
                        Cancels at the end of your current billing period. You keep access until then.
                      </p>
                    </div>
                    <CancelPlanButton action={cancelPlan} />
                  </div>
                )}

                {project.sourceServiceId === "law-firms" && (
                  <div className="rounded-xl border border-[#232838] bg-gradient-to-br from-[#151a24] to-[#0d1016] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13.5px] font-bold">Practice area</p>
                        <p className="mt-1 text-[12.5px] leading-5 text-[#9aa0ae]">
                          Changes how the Billing Clerk writes your entries - hourly time narratives, or case-activity
                          notes for contingency work.
                        </p>
                      </div>
                      <span className="flex-shrink-0 rounded-full border border-[#f0b429]/30 bg-[#f0b429]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#f0b429]">
                        {project.specialty ? LEGAL_SPECIALTY_PROFILES[project.specialty].billingModel : "Hourly"}
                      </span>
                    </div>
                    <form action={updateSpecialtyAction} className="mt-4 flex flex-wrap items-center gap-2">
                      <select
                        name="specialty"
                        defaultValue={project.specialty ?? "GENERAL"}
                        className="flex-1 rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2.5 text-[13px] text-[#eeeee7]"
                      >
                        {LAW_FIRM_SPECIALTIES.map((s) => (
                          <option key={s} value={s}>
                            {LEGAL_SPECIALTY_PROFILES[s].label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-[#f0b429] px-4 py-2.5 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                      >
                        Save
                      </button>
                    </form>
                  </div>
                )}

                <div>
                  <p className="text-[13px] text-[#9aa0ae]">
                    {project.sourceServiceId === "law-firms"
                      ? "Connect the calendar and email of the attorney whose billable time should be tracked. Nothing is ever sent or invoiced automatically. Every entry below waits for you to approve it."
                      : "Connect a calendar and email account to enable time tracking for this project. Nothing is ever sent or invoiced automatically. Every entry below waits for you to approve it."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`/api/oauth/google/authorize?projectId=${projectId}`}
                      className="rounded-lg border border-[#333a4c] px-4 py-2 text-[12.5px] font-bold text-[#eeeee7] hover:bg-[#191d26]"
                    >
                      Connect Google
                    </a>
                    <a
                      href={`/api/oauth/microsoft/authorize?projectId=${projectId}`}
                      className="rounded-lg border border-[#333a4c] px-4 py-2 text-[12.5px] font-bold text-[#eeeee7] hover:bg-[#191d26]"
                    >
                      Connect Microsoft 365
                    </a>
                    {project.timeEntries.some((e) => e.status === "APPROVED") && (
                      <a
                        href={`/api/billing/${projectId}/export`}
                        className="rounded-lg border border-[#4ade95]/40 bg-[#4ade95]/10 px-4 py-2 text-[12.5px] font-bold text-[#4ade95] hover:bg-[#4ade95]/20"
                      >
                        Export approved entries (CSV)
                      </a>
                    )}
                  </div>
                </div>

                {project.oauthConnections.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {project.oauthConnections.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#232838] bg-[#0d1016] p-4"
                      >
                        <span className="text-[13.5px] font-bold">
                          {c.provider === "GOOGLE" ? "Google" : "Microsoft 365"} &middot; {c.accountEmail}
                        </span>
                        <span
                          className={`font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] ${
                            c.status === "CONNECTED" ? "text-[#4ade95]" : "text-[#f0b429]"
                          }`}
                        >
                          {c.status === "CONNECTED" ? "Connected" : c.status === "EXPIRED" ? "Needs reconnect" : "Revoked"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
                    Awaiting your review
                  </div>
                  <div className="mt-3 flex flex-col gap-3">
                    {project.timeEntries.filter((e) => e.status === "DRAFT").length === 0 && (
                      <p className="text-sm text-[#9aa0ae]">
                        Nothing to review right now. Connect a calendar/email above if you haven&apos;t yet.
                      </p>
                    )}
                    {project.timeEntries
                      .filter((e) => e.status === "DRAFT")
                      .map((entry) => (
                        <div key={entry.id} className="rounded-xl border border-[#232838] bg-[#0d1016] p-5">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="text-[14.5px] font-bold">
                              {entry.matterName} &middot; {formatEntryAmount(entry)}
                            </span>
                            <span className="text-[11px] text-[#676e7d]">
                              {entry.entryDate.toISOString().slice(0, 10)} &middot; {entry.attorneyEmail}
                            </span>
                          </div>
                          <p className="mt-2 text-[13.5px] text-[#9aa0ae]">{entry.narrative}</p>
                          <div className="mt-3 flex gap-2">
                            <form action={approveEntry}>
                              <input type="hidden" name="entryId" value={entry.id} />
                              <button
                                type="submit"
                                className="rounded-lg bg-[#f0b429] px-4 py-1.5 text-[12px] font-bold text-[#1a1200] hover:brightness-110"
                              >
                                Approve
                              </button>
                            </form>
                            <form action={rejectEntry}>
                              <input type="hidden" name="entryId" value={entry.id} />
                              <button
                                type="submit"
                                className="rounded-lg border border-[#333a4c] px-4 py-1.5 text-[12px] font-bold text-[#9aa0ae] hover:bg-[#191d26]"
                              >
                                Reject
                              </button>
                            </form>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {project.timeEntries.some((e) => e.status === "APPROVED") && (
                  <div>
                    <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
                      Approved
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {project.timeEntries
                        .filter((e) => e.status === "APPROVED")
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#232838] bg-[#0d1016] p-4"
                          >
                            <span className="text-[13px]">
                              {entry.entryDate.toISOString().slice(0, 10)} &middot; {entry.matterName} &middot;{" "}
                              {formatEntryAmount(entry)}
                            </span>
                            <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#4ade95]">
                              Approved
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ),

            leads: (
              <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-[#333a4c] bg-[#191d26] p-5">
                  <p className="text-[13.5px] text-[#9aa0ae]">
                    Point your existing website form at this address to capture enquiries automatically. It
                    accepts a normal form POST with <code className="text-[#f0b429]">name</code>,{" "}
                    <code className="text-[#f0b429]">email</code>, <code className="text-[#f0b429]">phone</code>,
                    and <code className="text-[#f0b429]">message</code> fields.
                  </p>
                  <p className="mt-3 break-all font-[family-name:var(--font-course-mono)] text-[12px] text-[#f0b429]">
                    {getSiteUrl()}/api/leads/capture/{projectId}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {project.leads.length === 0 && (
                    <p className="text-sm text-[#9aa0ae]">
                      No enquiries yet. They&apos;ll appear here the moment your form (or a missed call) sends one
                      in.
                    </p>
                  )}
                  {project.leads.map((lead) => (
                    <div key={lead.id} className="rounded-xl border border-[#232838] bg-[#0d1016] p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[14.5px] font-bold">
                          {lead.name || lead.email || lead.phone || "Unknown"}
                        </span>
                        <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                          {lead.status} &middot; {lead.createdAt.toISOString().slice(0, 10)}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-[#676e7d]">
                        {[lead.email, lead.phone].filter(Boolean).join(" · ") || "No contact info"} &middot; source:{" "}
                        {lead.source}
                      </p>
                      {lead.message && <p className="mt-2 text-[13.5px] text-[#9aa0ae]">{lead.message}</p>}
                      {lead.qualified !== null && (
                        <p
                          className={`mt-2 text-[12px] font-semibold ${
                            lead.qualified ? "text-[#4ade95]" : "text-[#f0b429]"
                          }`}
                        >
                          {lead.qualified ? "Qualified" : "Not qualified"}
                          {lead.qualificationNote ? `: ${lead.qualificationNote}` : ""}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ),

            inbox: (
              <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-[#333a4c] bg-[#191d26] p-5">
                  <p className="text-[13.5px] text-[#9aa0ae]">
                    Connect your own <span className="font-semibold text-[#eeeee7]">Gmail (personal account)</span>,{" "}
                    <span className="font-semibold text-[#eeeee7]">Yahoo Mail</span>, or{" "}
                    <span className="font-semibold text-[#eeeee7]">Zoho Mail</span> using an app password, not your
                    regular password. Outlook / Microsoft 365 isn&apos;t supported yet.{" "}
                    <span className="text-[#676e7d]">
                      Gmail: Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App passwords. Yahoo:
                      Account Info &rarr; Account Security &rarr; Generate app password. Zoho: Account Settings
                      &rarr; Security &rarr; App Passwords.
                    </span>
                  </p>
                  {mailError && (
                    <p className="mt-3 rounded-lg border border-[#ff8585]/30 bg-[#ff8585]/10 px-3 py-2 text-[12.5px] text-[#ff8585]">
                      Couldn&apos;t connect: {mailError}
                    </p>
                  )}
                  <form action={connectMailboxAction} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Provider</label>
                      <select
                        name="provider"
                        className="rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7]"
                      >
                        <option value="GMAIL">Gmail</option>
                        <option value="YAHOO">Yahoo</option>
                        <option value="ZOHO">Zoho Mail</option>
                      </select>
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Email address</label>
                      <input
                        name="emailAddress"
                        type="email"
                        required
                        placeholder="you@gmail.com"
                        className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">App password</label>
                      <input
                        name="appPassword"
                        type="password"
                        required
                        placeholder="16-character app password"
                        className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                    >
                      Connect
                    </button>
                  </form>
                </div>

                {project.mailConnections.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {project.mailConnections.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#232838] bg-[#0d1016] p-4"
                      >
                        <span className="text-[13.5px] font-bold">
                          {c.provider === "GMAIL" ? "Gmail" : c.provider === "YAHOO" ? "Yahoo" : "Zoho Mail"} &middot; {c.emailAddress}
                        </span>
                        <span
                          className={`font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] ${
                            c.status === "CONNECTED" ? "text-[#4ade95]" : "text-[#f0b429]"
                          }`}
                        >
                          {c.status === "CONNECTED" ? "Connected" : "Connection issue"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
                    Awaiting your review
                  </div>
                  <div className="mt-3 flex flex-col gap-3">
                    {project.inboxDrafts.filter((d) => d.status === "DRAFT").length === 0 && (
                      <p className="text-sm text-[#9aa0ae]">
                        Nothing to review right now. Connect a mailbox above if you haven&apos;t yet.
                      </p>
                    )}
                    {project.inboxDrafts
                      .filter((d) => d.status === "DRAFT")
                      .map((draft) => (
                        <div key={draft.id} className="rounded-xl border border-[#232838] bg-[#0d1016] p-5">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="text-[14.5px] font-bold">{draft.subject}</span>
                            <span className="text-[11px] text-[#676e7d]">{draft.fromEmail}</span>
                          </div>
                          <p className="mt-2 text-[12px] text-[#676e7d]">{draft.snippet}</p>
                          <p className="mt-3 rounded-lg border border-[#232838] bg-[#191d26] p-3 text-[13.5px] text-[#eeeee7]">
                            {draft.draftReply}
                          </p>
                          <div className="mt-3 flex gap-2">
                            <form action={approveDraft}>
                              <input type="hidden" name="draftId" value={draft.id} />
                              <button
                                type="submit"
                                className="rounded-lg bg-[#f0b429] px-4 py-1.5 text-[12px] font-bold text-[#1a1200] hover:brightness-110"
                              >
                                Approve &amp; send
                              </button>
                            </form>
                            <form action={rejectDraft}>
                              <input type="hidden" name="draftId" value={draft.id} />
                              <button
                                type="submit"
                                className="rounded-lg border border-[#333a4c] px-4 py-1.5 text-[12px] font-bold text-[#9aa0ae] hover:bg-[#191d26]"
                              >
                                Reject
                              </button>
                            </form>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {project.inboxDrafts.some((d) => d.status === "APPROVED") && (
                  <div>
                    <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
                      Sent
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {project.inboxDrafts
                        .filter((d) => d.status === "APPROVED")
                        .map((draft) => (
                          <div
                            key={draft.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#232838] bg-[#0d1016] p-4"
                          >
                            <span className="text-[13px]">
                              {draft.subject} &middot; {draft.fromEmail}
                            </span>
                            <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#4ade95]">
                              Sent
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ),

            audit: (
              <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-[#333a4c] bg-[#191d26] p-5">
                  <p className="text-[13.5px] font-bold">Run a document audit</p>
                  <p className="mt-1 text-[12.5px] leading-5 text-[#9aa0ae]">
                    Upload a policy document, ACORD form, or loss run as a PDF - we read it directly, no need to
                    copy anything out first. Named insured, coverage limits, dates, and red flags, back in
                    seconds.
                  </p>
                  {activateError && (
                    <p className="mt-3 rounded-lg border border-[#ff8585]/30 bg-[#ff8585]/10 px-3 py-2 text-[12.5px] text-[#ff8585]">
                      Couldn&apos;t run the audit: {activateError}
                    </p>
                  )}
                  <form action={runDocumentAuditAction} className="mt-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Upload a PDF</label>
                      <input
                        name="file"
                        type="file"
                        accept="application/pdf"
                        className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Or paste the text instead</label>
                      <textarea
                        name="rawText"
                        rows={4}
                        placeholder="Paste the document text here if you'd rather not upload a file"
                        className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="self-start rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                    >
                      Run audit
                    </button>
                  </form>
                </div>

                <div className="flex flex-col gap-3">
                  {project.documents.length === 0 && <p className="text-sm text-[#9aa0ae]">No audits run yet.</p>}
                  {project.documents.map((d) => (
                    <div key={d.id} className="rounded-xl border border-[#232838] bg-[#0d1016] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[14.5px] font-bold">{d.filename}</span>
                        <span className="text-[11px] text-[#676e7d]">{d.createdAt.toISOString().slice(0, 10)}</span>
                      </div>
                      {d.summary && (
                        <pre className="mt-3 whitespace-pre-wrap font-[family-name:var(--font-course-sans)] text-[13px] leading-6 text-[#eeeee7]">
                          {d.summary}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ),

            renewals: (
              <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-[#333a4c] bg-[#191d26] p-5">
                  <p className="text-[13.5px] font-bold">Import your book of business</p>
                  <p className="mt-1 text-[12.5px] leading-5 text-[#9aa0ae]">
                    One-time import - clients get a reminder before their policy renews, not after. Use whatever
                    format you already have it in: a CSV or Excel export, a Google Sheets link (shared as
                    &quot;Anyone with the link can view&quot;), or a PDF report.
                  </p>
                  {activateError && (
                    <p className="mt-3 rounded-lg border border-[#ff8585]/30 bg-[#ff8585]/10 px-3 py-2 text-[12.5px] text-[#ff8585]">
                      Couldn&apos;t import: {activateError}
                    </p>
                  )}
                  <form action={importBookOfBusinessAction} className="mt-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Agency name</label>
                      <input
                        name="agencyName"
                        required
                        placeholder="Used in the reminder emails your clients get"
                        className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Upload a file (CSV, Excel, or PDF)</label>
                      <input
                        name="file"
                        type="file"
                        accept=".csv,.xlsx,.xls,application/pdf"
                        className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">Or paste a Google Sheets link instead</label>
                      <input
                        name="googleSheetUrl"
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/..."
                        className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7] placeholder:text-[#676e7d]"
                      />
                      <InlineGuide guide={GOOGLE_SHEETS_SHARE_GUIDE} />
                    </div>
                    <button
                      type="submit"
                      className="self-start rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                    >
                      Import
                    </button>
                  </form>
                </div>

                <div className="flex flex-col gap-2">
                  {project.insurancePolicies.length === 0 && <p className="text-sm text-[#9aa0ae]">No clients imported yet.</p>}
                  {project.insurancePolicies.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#232838] bg-[#0d1016] p-4"
                    >
                      <div>
                        <span className="text-[13.5px] font-bold">{p.clientName}</span>
                        {p.policyType && <span className="ml-2 text-[12px] text-[#676e7d]">{p.policyType}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] text-[#9aa0ae]">Renews {p.renewalDate.toISOString().slice(0, 10)}</span>
                        {p.lastReminderSentAt && (
                          <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#4ade95]">
                            Reminded
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),

            messages: (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {project.messages.length === 0 && <p className="text-sm text-[#9aa0ae]">No messages yet.</p>}
                  {project.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-4 ${
                        m.senderRole === "CLIENT"
                          ? "border-[#333a4c] bg-[#191d26]"
                          : "border-[#2a3550] bg-[#141a28]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.06em] text-[#f0b429]">
                          {m.senderRole === "CLIENT" ? "You" : "Zenith Studio"}
                        </span>
                        <span className="text-[11px] text-[#676e7d]">
                          {m.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[13.5px] text-[#eeeee7]">{m.body}</p>
                    </div>
                  ))}
                </div>
                <form action={sendMessage} className="flex flex-col gap-2 border-t border-[#232838] pt-4">
                  <textarea
                    name="body"
                    required
                    rows={3}
                    placeholder="Write a message..."
                    className="w-full rounded-lg border border-[#333a4c] bg-[#191d26] px-3 py-2 text-[13.5px] text-[#eeeee7] placeholder:text-[#676e7d]"
                  />
                  <button
                    type="submit"
                    className="self-start rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                  >
                    Send
                  </button>
                </form>
              </div>
            ),

            performance: (
              <div className="flex flex-col gap-6">
                {budgetCents > 0 && (
                  <div className="rounded-xl border border-[#232838] bg-[#0d1016] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13.5px] font-bold">Usage this month</span>
                      <span
                        className={`font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] ${
                          usagePct >= 100 ? "text-[#ff8585]" : usagePct >= 90 ? "text-[#f0b429]" : "text-[#4ade95]"
                        }`}
                      >
                        {usagePct >= 100 ? "At your plan's limit" : usagePct >= 90 ? "Approaching your plan's limit" : "Normal usage"}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full border border-[#232838] bg-[#0a0c10]">
                      <div
                        className={`h-full rounded-full ${usagePct >= 100 ? "bg-[#ff8585]" : usagePct >= 90 ? "bg-[#f0b429]" : "bg-[#4ade95]"}`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[12px] text-[#676e7d]">Resets at the start of each billing month.</p>
                  </div>
                )}

                {aggregatedMetrics.length === 0 ? (
                  <div className="rounded-xl border border-[#333a4c] bg-[#191d26] p-5">
                    <p className="text-[13.5px] text-[#9aa0ae]">
                      Awaiting live data. Performance metrics will appear here once this project&apos;s systems are
                      live and reporting.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {aggregatedMetrics.map((m) => (
                      <div
                        key={m.key}
                        className="flex items-center justify-between rounded-xl border border-[#232838] bg-[#0d1016] p-4"
                      >
                        <span className="text-[13.5px] font-semibold capitalize">{m.label}</span>
                        <span className="font-[family-name:var(--font-course-mono)] text-[13px] text-[#f0b429]">
                          {m.display}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),

            support: (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  {project.supportRequests.length === 0 && (
                    <p className="text-sm text-[#9aa0ae]">No support requests yet.</p>
                  )}
                  {project.supportRequests.map((s) => (
                    <div key={s.id} className="rounded-xl border border-[#232838] bg-[#0d1016] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[14.5px] font-bold">{s.subject}</span>
                        <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                          {SUPPORT_STATUS_LABELS[s.status] ?? s.status} &middot; {s.priority}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[13px] text-[#9aa0ae]">{s.body}</p>
                    </div>
                  ))}
                </div>
                <form action={submitSupportRequest} className="flex flex-col gap-2 border-t border-[#232838] pt-4">
                  <input
                    name="subject"
                    required
                    placeholder="Subject"
                    className="w-full rounded-lg border border-[#333a4c] bg-[#191d26] px-3 py-2 text-[13.5px] text-[#eeeee7] placeholder:text-[#676e7d]"
                  />
                  <textarea
                    name="body"
                    required
                    rows={3}
                    placeholder="Describe the issue or question..."
                    className="w-full rounded-lg border border-[#333a4c] bg-[#191d26] px-3 py-2 text-[13.5px] text-[#eeeee7] placeholder:text-[#676e7d]"
                  />
                  <select
                    name="priority"
                    defaultValue="MEDIUM"
                    className="w-fit rounded-lg border border-[#333a4c] bg-[#191d26] px-3 py-2 text-[13px] text-[#eeeee7]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                  <button
                    type="submit"
                    className="self-start rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                  >
                    Submit request
                  </button>
                </form>
              </div>
            ),
          }}
        />
      </main>
    </div>
  );
}
