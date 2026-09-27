import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  getOwnedServiceProject,
  activateTextBack,
  activateLeadCapture,
  activateReceptionist,
  activateCrmWebhook,
  runDocumentAudit,
  importBookOfBusiness,
  connectMailbox,
  updateOwnedSpecialty,
} from "@/lib/service-workspace";
import { planAgents, planAgentStatus, planWorkflowSteps, isSupportedPlan, type WorkflowStep } from "@/lib/client-console-data";
import { LAW_FIRM_SPECIALTIES, LEGAL_SPECIALTY_PROFILES } from "@/lib/legal-specialties";
import { businessNameOf } from "@/lib/services";
import { adjustableSettings, readSettings, dbDormantDays } from "@/lib/agent-settings";
import { createTransaction, updateDeadline, setDocumentReceived, setTransactionStatus } from "@/lib/transaction-coordinator";
import { importContacts, startReengagement, markContactReplied, isDormant } from "@/lib/database-manager";
import { getSiteUrl } from "@/lib/site";
import { qualificationGroups, qualificationRulesText, readChoices, faqGroups, faqText, hoursText, DAYS, OPEN_TIMES, CLOSE_TIMES, CRM_FORMATS, type ChoiceGroup } from "@/lib/setup-options";
import { CopyField, TestLeadForm } from "./ConnectForm";
import { GuidePicker, InlineGuide } from "../../GuidePicker";
import { CRM_SETUP_GUIDES, GOOGLE_SHEETS_SHARE_GUIDE } from "@/lib/setup-guides";
import { Icon, type IconName } from "../../Icon";
import { StatusPill, Eyebrow } from "../../ui";
import u from "../../ui.module.css";
import s from "./agent.module.css";
import a from "./adjust/adjust.module.css";

const STEP_ICON: Record<string, IconName> = {
  trigger: "phone",
  sms: "message",
  email: "mail",
  qualify: "shield",
  calendar: "calendar",
  notify: "bell",
  "human review": "userCheck",
  match: "search",
  draft: "file",
  check: "check",
  handoff: "arrowRight",
};

export default async function AgentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; agentId: string }>;
  searchParams: Promise<{ activateError?: string; flash?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { clientId, agentId } = await params;
  const { activateError, flash } = await searchParams;
  const project = await getOwnedServiceProject(clientId, session.user.id);
  if (!project) notFound();
  if (!isSupportedPlan(project.sourceServiceId)) notFound();

  const agent = planAgents(project.sourceServiceId).find((a) => a.id === agentId);
  if (!agent) notFound();

  const businessName = businessNameOf(project);
  const dashboardBase = `/services/dashboard/${clientId}`;
  const agentBase = `${dashboardBase}/agents/${agentId}`;
  const sourceServiceId = project.sourceServiceId;

  // ---------- Not-yet-built agents: honest state, no fake workflow ----------
  if (!agent.real) {
    return (
      <div>
        <Breadcrumb clientId={clientId} agentName={agent.name} />
        <Header agent={agent} tone="dim" clientId={clientId} />
        <div className={`${u.card} ${s.setupCard}`} style={{ marginTop: 28, maxWidth: 560 }}>
          <p className={s.setupTitle}>Coming soon</p>
          <p className={s.setupDesc}>
            This agent is still in development, so there&apos;s nothing to connect yet. We&apos;ll email you the
            moment it&apos;s ready to switch on. Everything else on your team works today.
          </p>
          <Link href={`${dashboardBase}/settings`} className={`${u.btnGhost}`} style={{ marginTop: 16, display: "inline-flex" }}>
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  const status = planAgentStatus(project, agentId);

  // ---------- Server actions ----------
  async function activateTextBackAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    const result = await activateTextBack(clientId, session2!.user.id, {
      businessName: String(formData.get("businessName") || ""),
      businessPhone: String(formData.get("businessPhone") || ""),
    });
    revalidatePath(dashboardBase);
    if (!result.ok) failTo(agentBase, result.error);
    redirect(agentBase);
  }

  async function activateLeadCaptureAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    const picks = readChoices(qualificationGroups(sourceServiceId), (n) => formData.getAll(n));
    if (!picks.ok) failTo(agentBase, picks.error);
    const result = await activateLeadCapture(clientId, session2!.user.id, {
      businessName: String(formData.get("businessName") || ""),
      businessPhone: String(formData.get("businessPhone") || ""),
      qualificationRules: qualificationRulesText(picks.picks),
      notifyEmail: String(formData.get("notifyEmail") || ""),
    });
    revalidatePath(dashboardBase);
    if (!result.ok) failTo(agentBase, result.error);
    redirect(agentBase);
  }

  async function activateReceptionistAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    const numberSource = String(formData.get("numberSource") || "new");
    const faq = readChoices(faqGroups(sourceServiceId), (n) => formData.getAll(n));
    if (!faq.ok) failTo(agentBase, faq.error);
    const hours = hoursText({
      allDay: formData.get("allDay") === "yes",
      days: formData.getAll("days").map(String),
      open: String(formData.get("open") || ""),
      close: String(formData.get("close") || ""),
    });
    if (!hours.ok) failTo(agentBase, hours.error);
    const result = await activateReceptionist(clientId, session2!.user.id, {
      businessName: String(formData.get("businessName") || ""),
      hours: hours.text,
      faqText: faqText(faq.picks),
      fallbackNumber: String(formData.get("fallbackNumber") || ""),
      numberSource: numberSource === "twilio" ? "twilio" : "new",
      twilioAccountSid: String(formData.get("twilioAccountSid") || ""),
      twilioAuthToken: String(formData.get("twilioAuthToken") || ""),
      twilioNumber: String(formData.get("twilioNumber") || ""),
    });
    revalidatePath(dashboardBase);
    if (!result.ok) failTo(agentBase, result.error);
    redirect(agentBase);
  }

  async function activateCrmWebhookAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    const result = await activateCrmWebhook(clientId, session2!.user.id, {
      webhookUrl: String(formData.get("webhookUrl") || ""),
      payloadFormat: CRM_FORMATS.find((f) => f.value === formData.get("crmFormat"))?.format ?? "",
    });
    revalidatePath(dashboardBase);
    if (!result.ok) failTo(agentBase, result.error);
    redirect(agentBase);
  }

  async function runDocumentAuditAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
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
    const result = await runDocumentAudit(clientId, session2!.user.id, { filename, pdfBase64, rawText, sizeBytes });
    revalidatePath(dashboardBase);
    if (!result.ok) failTo(agentBase, result.error);
    redirect(`${agentBase}?flash=${encodeURIComponent("Audit complete - see the summary below.")}`);
  }

  async function importBookOfBusinessAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    const file = formData.get("file");
    let fileBuffer: Buffer | undefined;
    let filename: string | undefined;
    let fileMimeType: string | undefined;
    if (file instanceof File && file.size > 0) {
      filename = file.name;
      fileMimeType = file.type;
      fileBuffer = Buffer.from(await file.arrayBuffer());
    }
    const result = await importBookOfBusiness(clientId, session2!.user.id, {
      agencyName: String(formData.get("agencyName") || ""),
      googleSheetUrl: String(formData.get("googleSheetUrl") || ""),
      fileBuffer,
      filename,
      fileMimeType,
    });
    revalidatePath(dashboardBase);
    if (!result.ok) failTo(agentBase, result.error);
    redirect(`${agentBase}?flash=${encodeURIComponent(`Imported ${result.created} clients. Renewal reminders are on.`)}`);
  }

  async function connectMailboxAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    const result = await connectMailbox(
      clientId,
      session2!.user.id,
      String(formData.get("provider") || ""),
      String(formData.get("emailAddress") || ""),
      String(formData.get("appPassword") || "")
    );
    revalidatePath(dashboardBase);
    if (!result.ok) failTo(agentBase, result.error);
    redirect(agentBase);
  }

  async function updateSpecialtyAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    await updateOwnedSpecialty(clientId, session2!.user.id, String(formData.get("specialty") || ""));
    revalidatePath(dashboardBase);
    redirect(agentBase);
  }

  // ---------- Transaction Coordinator ----------
  async function addDealAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    const result = await createTransaction(clientId, session2!.user.id, {
      propertyAddress: String(formData.get("propertyAddress") || ""),
      side: String(formData.get("side") || ""),
      clientName: String(formData.get("clientName") || ""),
      clientEmail: String(formData.get("clientEmail") || ""),
      contractDate: String(formData.get("contractDate") || ""),
      closingDate: String(formData.get("closingDate") || ""),
    });
    revalidatePath(dashboardBase, "layout");
    if (!result.ok) failTo(agentBase, result.error);
    redirect(`${agentBase}?flash=${encodeURIComponent("Deal added. Its deadlines and document checklist are ready below.")}`);
  }

  async function deadlineAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    const dueDate = formData.get("dueDate");
    const done = formData.get("done");
    const result = await updateDeadline(clientId, session2!.user.id, String(formData.get("id") || ""), {
      ...(typeof done === "string" ? { done: done === "true" } : {}),
      ...(typeof dueDate === "string" ? { dueDate } : {}),
    });
    revalidatePath(dashboardBase, "layout");
    if (!result.ok) failTo(agentBase, result.error);
    redirect(agentBase);
  }

  async function documentAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    const result = await setDocumentReceived(clientId, session2!.user.id, String(formData.get("id") || ""), formData.get("received") === "true");
    revalidatePath(dashboardBase, "layout");
    if (!result.ok) failTo(agentBase, result.error);
    redirect(agentBase);
  }

  async function dealStatusAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    const result = await setTransactionStatus(clientId, session2!.user.id, String(formData.get("id") || ""), String(formData.get("status") || ""));
    revalidatePath(dashboardBase, "layout");
    if (!result.ok) failTo(agentBase, result.error);
    redirect(agentBase);
  }

  // ---------- Database Manager ----------
  async function importContactsAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    const file = formData.get("file");
    const hasFile = file instanceof File && file.size > 0;
    const result = await importContacts(clientId, session2!.user.id, {
      fileBuffer: hasFile ? Buffer.from(await file.arrayBuffer()) : undefined,
      filename: hasFile ? file.name : undefined,
      googleSheetUrl: String(formData.get("googleSheetUrl") || ""),
    });
    revalidatePath(dashboardBase, "layout");
    if (!result.ok) failTo(agentBase, result.error);
    redirect(`${agentBase}?flash=${encodeURIComponent(`Imported ${result.imported} contacts.`)}`);
  }

  async function startDbAction(): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    const result = await startReengagement(clientId, session2!.user.id);
    revalidatePath(dashboardBase, "layout");
    if (!result.ok) failTo(agentBase, result.error);
    const n = result.started ?? 0;
    redirect(`${agentBase}?flash=${encodeURIComponent(`Started. ${n} contact${n === 1 ? " gets its" : "s get their"} first check-in email in the next daily run.`)}`);
  }

  async function markRepliedAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signInTo(agentBase);
    await markContactReplied(clientId, session2!.user.id, String(formData.get("id") || ""));
    revalidatePath(dashboardBase, "layout");
    redirect(agentBase);
  }

  // ---------- Setup-needed states, per real agent ----------
  const textBackConnected = project.integrations.some((i) => i.provider === "signalwire" && i.status === "CONNECTED");
  const billingConnected = project.oauthConnections.some((c) => c.status === "CONNECTED");
  const leadCaptureConnected = project.integrations.some((i) => i.provider === "signalwire" && i.status === "CONNECTED");
  const crmConnected = project.integrations.some((i) => i.provider === "crm" && i.status === "CONNECTED");
  const mailConnected = project.mailConnections.some((c) => c.status === "CONNECTED");
  const receptionistConnected = project.integrations.some((i) => i.provider === "vapi" && i.status === "CONNECTED");
  const leadNumber = project.integrations.find((i) => i.provider === "signalwire" && i.status === "CONNECTED")?.externalRef ?? null;

  if (agentId === "receptionist" && !receptionistConnected) {
    return (
      <SetupShell clientId={clientId} agent={agent} status={status} title="Set up your AI Receptionist" desc="This buys a real phone number and turns the receptionist on immediately - no review, no waiting on us." error={activateError}>
        <form action={activateReceptionistAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="Business name" name="businessName" defaultValue={businessName} placeholder="Used when greeting callers" />
          <HoursFields />
          <ChoiceFields groups={faqGroups(sourceServiceId)} />
          <FormField label="Fallback phone number" name="fallbackNumber" type="tel" placeholder="A real person's line for calls it can't handle" />
          <div className={s.formRow}>
            <label className={s.label}>Phone number</label>
            <select name="numberSource" className={s.input} defaultValue="new">
              <option value="new">Get a new number (recommended, instant)</option>
              <option value="twilio">Import a number I already own on Twilio</option>
            </select>
            <p style={{ marginTop: 6, fontSize: 13, color: "var(--zc-muted)" }}>
              Importing only works for a number already hosted on Twilio. If your existing number is with another
              carrier or is a personal cell, pick &quot;Get a new number&quot; instead - you can forward your
              existing line to it whenever you want calls answered.
            </p>
          </div>
          <FormField label="Twilio Account SID (only if importing)" name="twilioAccountSid" placeholder="Starts with AC..., found in your Twilio Console" />
          <FormField label="Twilio Auth Token (only if importing)" name="twilioAuthToken" type="password" placeholder="Found in your Twilio Console" />
          <FormField label="Twilio phone number to import (only if importing)" name="twilioNumber" type="tel" placeholder="The number already hosted on your Twilio account" />
          <button type="submit" className={u.btnPrimary}>
            Activate
          </button>
        </form>
      </SetupShell>
    );
  }

  if (agentId === "text-back" && !textBackConnected) {
    return (
      <SetupShell clientId={clientId} agent={agent} status={status} title="Set up Missed Call Text-Back" desc="This buys a real phone number and turns text-back on immediately - no review, no waiting on us." error={activateError}>
        <form action={activateTextBackAction}>
          <FormField label="Business name" name="businessName" defaultValue={businessName} placeholder="Used in the missed-call text" />
          <FormField label="Your business phone number" name="businessPhone" type="tel" placeholder="The number your customers call today" />
          <NumberNote what="missed calls" />
          <button type="submit" className={`${u.btnPrimary} ${s.submitBtn}`}>
            Activate
          </button>
        </form>
      </SetupShell>
    );
  }

  if (agentId === "billing-clerk" && !billingConnected) {
    return (
      <SetupShell clientId={clientId} agent={agent} status={status} title="Set up AI Billing Clerk" desc="Connect the calendar and email of the attorney whose billable time should be tracked. Nothing is ever sent or invoiced automatically." error={activateError}>
        <div style={{ display: "flex", gap: 10 }}>
          <a href={`/api/oauth/google/authorize?projectId=${clientId}`} className={u.btnGhost}>
            Connect Google
          </a>
          <a href={`/api/oauth/microsoft/authorize?projectId=${clientId}`} className={u.btnGhost}>
            Connect Microsoft 365
          </a>
        </div>
      </SetupShell>
    );
  }

  if (agentId === "follow-up-clerk" && !textBackConnected) {
    return (
      <SetupShell clientId={clientId} agent={agent} status={status} title="Waiting on Missed Call Text-Back" desc="The Follow-Up Clerk works leads that came in through Text-Back, so set that up first.">
        <Link href={`${dashboardBase}/agents/text-back`} className={u.btnPrimary} style={{ display: "inline-flex" }}>
          Set up Text-Back
        </Link>
      </SetupShell>
    );
  }

  const isLeadAgent = agentId === "isa" || agentId === "lead-capture" || agentId === "intake";
  if (isLeadAgent && !leadCaptureConnected) {
    return (
      <SetupShell clientId={clientId} agent={agent} status={status} title={`Set up ${agent.name}`} desc="Step 1 of 2. This gets your texting number and turns on instant replies right away, no waiting on us. Next you'll connect your website form." error={activateError}>
        <form action={activateLeadCaptureAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="Business name" name="businessName" defaultValue={businessName} placeholder="Used when replying to a new lead" />
          <FormField label="Your business phone number" name="businessPhone" type="tel" placeholder="The number your customers call today" />
          <NumberNote what="lead replies" />
          <ChoiceFields groups={qualificationGroups(sourceServiceId)} />
          <FormField label="Notify email" name="notifyEmail" type="email" defaultValue={session.user.email ?? ""} placeholder="Where we send you a copy of every new lead" />
          <button type="submit" className={u.btnPrimary}>
            Activate
          </button>
        </form>
      </SetupShell>
    );
  }

  if (agentId === "crm" && !crmConnected) {
    return (
      <SetupShell clientId={clientId} agent={agent} status={status} title="Connect your CRM" desc="Every new lead gets sent here automatically. Paste your CRM's own inbound webhook URL - we never ask for a login to your CRM." error={activateError}>
        <GuidePicker guides={CRM_SETUP_GUIDES} label="Not sure how to get your webhook URL? Tell us what you use" />
        <form action={activateCrmWebhookAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="Webhook URL" name="webhookUrl" type="url" placeholder="https://..." />
          <div className={s.formRow}>
            <label className={s.label}>Which CRM is it?</label>
            <select name="crmFormat" className={s.input} defaultValue="default">
              {CRM_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={u.btnPrimary}>
            Connect
          </button>
        </form>
      </SetupShell>
    );
  }

  if (agentId === "inbox" && !mailConnected) {
    return (
      <SetupShell clientId={clientId} agent={agent} status={status} title="Connect your mailbox" desc="Connect your Gmail (personal), Yahoo, or Zoho Mail using an app password, not your regular password." error={activateError}>
        <form action={connectMailboxAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className={s.formRow}>
            <label className={s.label}>Provider</label>
            <select name="provider" className={s.input}>
              <option value="GMAIL">Gmail</option>
              <option value="YAHOO">Yahoo</option>
              <option value="ZOHO">Zoho Mail</option>
            </select>
          </div>
          <FormField label="Email address" name="emailAddress" type="email" placeholder="you@gmail.com" />
          <FormField label="App password" name="appPassword" type="password" placeholder="16-character app password" />
          <button type="submit" className={u.btnPrimary}>
            Connect
          </button>
        </form>
      </SetupShell>
    );
  }

  // ---------- Insurance's on-demand tools (no "connect", used per document/import) ----------
  if (agentId === "document-audit") {
    return (
      <div>
        <Breadcrumb clientId={clientId} agentName={agent.name} />
        <Header agent={agent} tone={status.tone} clientId={clientId} />
        {flash && <FlashBox text={flash} />}
        <div className={`${u.card} ${s.setupCard}`} style={{ marginTop: 28, maxWidth: 640 }}>
          <p className={s.setupTitle}>Run a document audit</p>
          <p className={s.setupDesc}>Upload a policy document, ACORD form, or loss run as a PDF - we read it directly, no need to copy anything out first.</p>
          {activateError && <p className={s.errorBox}>Couldn&apos;t run the audit: {activateError}</p>}
          <form action={runDocumentAuditAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div className={s.formRow}>
              <label className={s.label}>Upload a PDF</label>
              <input name="file" type="file" accept="application/pdf" className={s.input} />
            </div>
            <FormField label="Or paste the text instead" name="rawText" textarea placeholder="Paste the document text here" />
            <button type="submit" className={u.btnPrimary}>
              Run audit
            </button>
          </form>
        </div>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
          {project.documents.length === 0 && <p style={{ fontSize: 14, color: "var(--zc-muted)" }}>No audits run yet.</p>}
          {project.documents.map((d) => (
            <div key={d.id} className={`${u.card}`} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 500 }}>
                <span>{d.filename}</span>
                <span style={{ fontSize: 12, color: "var(--zc-dim)" }}>{d.createdAt.toISOString().slice(0, 10)}</span>
              </div>
              {d.summary && <pre style={{ marginTop: 10, whiteSpace: "pre-wrap", fontSize: 13, color: "var(--zc-text-2)", fontFamily: "inherit" }}>{d.summary}</pre>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (agentId === "renewals") {
    return (
      <div>
        <Breadcrumb clientId={clientId} agentName={agent.name} />
        <Header agent={agent} tone={status.tone} clientId={clientId} />
        {flash && <FlashBox text={flash} />}
        <div className={`${u.card} ${s.setupCard}`} style={{ marginTop: 28, maxWidth: 640 }}>
          <p className={s.setupTitle}>Import your book of business</p>
          <p className={s.setupDesc}>One-time import - clients get a reminder before their policy renews, not after. CSV, Excel, a Google Sheets link, or a PDF report.</p>
          {activateError && <p className={s.errorBox}>Couldn&apos;t import: {activateError}</p>}
          <form action={importBookOfBusinessAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField label="Agency name" name="agencyName" defaultValue={businessName} placeholder="Used in the reminder emails your clients get" />
            <div className={s.formRow}>
              <label className={s.label}>Upload a file (CSV, Excel, or PDF)</label>
              <input name="file" type="file" accept=".csv,.xlsx,.xls,application/pdf" className={s.input} />
            </div>
            <div className={s.formRow}>
              <label className={s.label}>Or paste a Google Sheets link instead</label>
              <input name="googleSheetUrl" type="url" placeholder="https://docs.google.com/spreadsheets/..." className={s.input} />
              <InlineGuide guide={GOOGLE_SHEETS_SHARE_GUIDE} />
            </div>
            <button type="submit" className={u.btnPrimary}>
              Import
            </button>
          </form>
        </div>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8, maxWidth: 640 }}>
          {project.insurancePolicies.length === 0 && <p style={{ fontSize: 14, color: "var(--zc-muted)" }}>No clients imported yet.</p>}
          {project.insurancePolicies.map((p) => (
            <div key={p.id} className={u.card} style={{ padding: 14, display: "flex", justifyContent: "space-between" }}>
              <span>{p.clientName}</span>
              <span style={{ fontSize: 12, color: "var(--zc-muted)" }}>
                Renews {p.renewalDate.toISOString().slice(0, 10)}
                {p.lastReminderSentAt && " · reminded"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------- Brokerage: Transaction Coordinator ----------
  if (agentId === "tc") {
    const today = new Date().toISOString().slice(0, 10);
    const deals = [...project.transactions].sort((a, b) => (a.status === "ACTIVE" ? 0 : 1) - (b.status === "ACTIVE" ? 0 : 1));
    return (
      <div>
        <Breadcrumb clientId={clientId} agentName={agent.name} />
        <Header agent={agent} tone={status.tone} clientId={clientId} />
        {flash && <FlashBox text={flash} />}
        <div className={`${u.card} ${s.setupCard}`} style={{ marginTop: 28, maxWidth: 720 }}>
          <p className={s.setupTitle}>Add a deal</p>
          <p className={s.setupDesc}>
            We build the standard deadline timeline and the document checklist for your side, then remind you before every
            deadline and chase your client for anything missing. You can move any date afterwards.
          </p>
          {activateError && <p className={s.errorBox}>Couldn&apos;t add the deal: {activateError}</p>}
          <form action={addDealAction} style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            <FormField label="Property address" name="propertyAddress" placeholder="123 Main St, Austin TX" />
            <div className={s.formRow}>
              <label className={s.label}>You represent the</label>
              <select name="side" className={s.input} defaultValue="BUYER">
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
              </select>
            </div>
            <FormField label="Client name" name="clientName" placeholder="Jane Doe" />
            <div className={s.formRow}>
              <label className={s.label}>Client email (to chase documents)</label>
              <input name="clientEmail" type="email" placeholder="jane@example.com" className={s.input} />
            </div>
            <FormField label="Contract date" name="contractDate" type="date" defaultValue={today} />
            <FormField label="Closing date" name="closingDate" type="date" />
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="submit" className={u.btnPrimary}>
                Add deal
              </button>
            </div>
          </form>
        </div>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
          {deals.length === 0 && <p style={{ fontSize: 14, color: "var(--zc-muted)" }}>No deals yet.</p>}
          {deals.map((t) => (
            <section key={t.id} className={u.card} style={{ padding: 20, opacity: t.status === "ACTIVE" ? 1 : 0.6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{t.propertyAddress}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--zc-muted)" }}>
                    {t.side === "BUYER" ? "Buyer" : "Seller"} side · {t.clientName}
                    {t.clientEmail ? ` · ${t.clientEmail}` : " · no client email, documents won't be chased"} · closes {t.closingDate.toISOString().slice(0, 10)}
                    {t.status !== "ACTIVE" && ` · ${t.status.toLowerCase()}`}
                  </p>
                </div>
                <form action={dealStatusAction} style={{ display: "flex", gap: 8 }}>
                  <input type="hidden" name="id" value={t.id} />
                  {t.status === "ACTIVE" ? (
                    <>
                      <button type="submit" name="status" value="CLOSED" className={u.btnGhost}>
                        Mark closed
                      </button>
                      <button type="submit" name="status" value="CANCELLED" className={u.btnGhost}>
                        Cancel deal
                      </button>
                    </>
                  ) : (
                    <button type="submit" name="status" value="ACTIVE" className={u.btnGhost}>
                      Reopen
                    </button>
                  )}
                </form>
              </div>

              <p className={s.label} style={{ marginTop: 16 }}>
                Deadlines
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                {t.deadlines.map((d) => {
                  const overdue = !d.done && d.dueDate.getTime() < Date.now();
                  return (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <form action={deadlineAction}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="done" value={d.done ? "false" : "true"} />
                        <button type="submit" className={u.btnGhost} style={{ minHeight: 34, padding: "0 12px", fontSize: 12 }} aria-label={d.done ? `Mark ${d.label} not done` : `Mark ${d.label} done`}>
                          {d.done ? <><Icon name="check" size={12} strokeWidth={2.4} /> Done</> : "Mark done"}
                        </button>
                      </form>
                      <span style={{ flex: 1, minWidth: 150, fontSize: 14, textDecoration: d.done ? "line-through" : "none", color: overdue ? "var(--zc-error-text)" : d.done ? "var(--zc-muted)" : "var(--zc-text)" }}>
                        {d.label}
                        {overdue && " · overdue"}
                      </span>
                      <form action={deadlineAction} style={{ display: "flex", gap: 6 }}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="date" name="dueDate" defaultValue={d.dueDate.toISOString().slice(0, 10)} className={s.input} style={{ minHeight: 34, padding: "0 10px", fontSize: 13 }} aria-label={`${d.label} date`} />
                        <button type="submit" className={u.btnGhost} style={{ minHeight: 34, padding: "0 12px", fontSize: 12 }}>
                          Move
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>

              <p className={s.label} style={{ marginTop: 16 }}>
                Documents
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                {t.documents.map((doc) => (
                  <form key={doc.id} action={documentAction} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="hidden" name="id" value={doc.id} />
                    <input type="hidden" name="received" value={doc.received ? "false" : "true"} />
                    <button type="submit" className={u.btnGhost} style={{ minHeight: 34, padding: "0 12px", fontSize: 12 }}>
                      {doc.received ? <><Icon name="check" size={12} strokeWidth={2.4} /> Received</> : "Mark received"}
                    </button>
                    <span style={{ fontSize: 14, color: doc.received ? "var(--zc-muted)" : "var(--zc-text)" }}>
                      {doc.label}
                      {!doc.received && doc.chaseCount > 0 && <span style={{ color: "var(--zc-muted)" }}> · chased {doc.chaseCount}x</span>}
                    </span>
                  </form>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  // ---------- Brokerage: Database Manager ----------
  if (agentId === "db") {
    const contacts = project.dormantContacts;
    const days = dbDormantDays(readSettings(project.agentSettings));
    const eligible = contacts.filter((c) => c.status === "DORMANT" && isDormant(c.lastContactAt, days)).length;
    const count = (st: string) => contacts.filter((c) => c.status === st).length;
    return (
      <div>
        <Breadcrumb clientId={clientId} agentName={agent.name} />
        <Header agent={agent} tone={status.tone} clientId={clientId} />
        {flash && <FlashBox text={flash} />}
        {activateError && <p className={s.errorBox} style={{ maxWidth: 720 }}>{activateError}</p>}

        {eligible > 0 && (
          <div className={`${u.card} ${s.setupCard}`} style={{ marginTop: 28, maxWidth: 720 }}>
            <p className={s.setupTitle}>
              {eligible} contact{eligible === 1 ? " hasn't" : "s haven't"} heard from you in {days >= 365 ? "12" : days >= 180 ? "6" : "3"}+ months
            </p>
            <p className={s.setupDesc}>
              Start sends each one 3 short check-in emails in your business name (a week, then two weeks apart). Replies land in your own
              inbox, and every email has an unsubscribe link.
            </p>
            <form action={startDbAction} style={{ marginTop: 14 }}>
              <button type="submit" className={u.btnPrimary}>
                Start waking them up
              </button>
            </form>
          </div>
        )}

        <div className={`${u.card} ${s.setupCard}`} style={{ marginTop: 24, maxWidth: 720 }}>
          <p className={s.setupTitle}>{contacts.length === 0 ? "Import your past clients and leads" : "Import more contacts"}</p>
          <p className={s.setupDesc}>
            A CSV, Excel file, or Google Sheets link with a name and email column. A &quot;last contact&quot; date column is optional; anyone
            without one counts as dormant. Duplicates are skipped.
          </p>
          <form action={importContactsAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div className={s.formRow}>
              <label className={s.label}>Upload a file (CSV or Excel)</label>
              <input name="file" type="file" accept=".csv,.xlsx,.xls" className={s.input} />
            </div>
            <div className={s.formRow}>
              <label className={s.label}>Or paste a Google Sheets link</label>
              <input name="googleSheetUrl" type="url" placeholder="https://docs.google.com/spreadsheets/..." className={s.input} />
              <InlineGuide guide={GOOGLE_SHEETS_SHARE_GUIDE} />
            </div>
            <button type="submit" className={u.btnPrimary} style={{ alignSelf: "flex-start" }}>
              Import
            </button>
          </form>
        </div>

        {contacts.length > 0 && (
          <section className={u.card} style={{ marginTop: 24, maxWidth: 720, padding: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--zc-muted)" }}>
              {contacts.length} contacts · {count("DORMANT")} not started · {count("IN_SEQUENCE")} being woken up · {count("REPLIED")} replied ·{" "}
              {count("DONE")} finished · {count("UNSUBSCRIBED")} unsubscribed
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              {contacts.slice(0, 100).map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14 }}>
                    {c.name} <span style={{ color: "var(--zc-muted)" }}>· {c.email}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, fontFamily: "var(--zc-mono)", color: "var(--zc-muted)" }}>
                      {c.status === "IN_SEQUENCE" ? `email ${c.sequenceStep} of 3 sent` : c.status.toLowerCase().replace("_", " ")}
                    </span>
                    {c.status === "IN_SEQUENCE" && (
                      <form action={markRepliedAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className={u.btnGhost} style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}>
                          They replied
                        </button>
                      </form>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ---------- Everything else: real workflow view ----------
  const steps = planWorkflowSteps(project, agentId);
  const currentIndex = steps.findIndex((st) => st.state === "current" || st.state === "human-waiting");
  const activeIndex = currentIndex === -1 ? steps.length - 1 : currentIndex;
  const progressPct = steps.length ? Math.round(((activeIndex + 1) / steps.length) * 100) : 0;

  const recentRuns =
    agentId === "billing-clerk"
      ? project.timeEntries.slice(0, 5).map((e) => ({ text: `${e.matterName} · ${e.status.toLowerCase()}`, time: e.entryDate.toISOString().slice(0, 10) }))
      : isLeadAgent || agentId === "text-back" || agentId === "follow-up-clerk"
        ? project.leads.slice(0, 5).map((l) => ({ text: `${l.name ?? "Caller"} · ${l.status.toLowerCase().replace("_", " ")}`, time: l.createdAt.toISOString().slice(0, 10) }))
        : [];

  return (
    <div>
      <Breadcrumb clientId={clientId} agentName={agent.name} />
      <Header agent={agent} tone={status.tone} clientId={clientId} />

      {isLeadAgent && leadNumber && <WebsiteFormCard clientId={clientId} number={leadNumber} firstLeadIn={project.leads.length > 0} />}

      <div className={s.body}>
        <section className={`${u.card} ${s.workflowCard}`}>
          <div className={s.workflowHead}>
            <Eyebrow>Workflow · current run</Eyebrow>
            <span className={s.stepCount}>
              step {activeIndex + 1} / {steps.length}
            </span>
          </div>
          <div className={s.steps}>
            {steps.map((step, i) => (
              <StepRow key={i} step={step} index={i} isLast={i === steps.length - 1} />
            ))}
          </div>
        </section>

        <div className={s.side}>
          <div className={`${u.card} ${s.runCard}`}>
            <div className={s.runTop}>
              <div>
                <div className={s.runTitle}>Current run</div>
                <div className={s.runSub}>{steps[activeIndex]?.title ?? "Idle"}</div>
              </div>
              <div className={s.runPct}>{progressPct}%</div>
            </div>
            <div className={s.progress}>
              <div className={s.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {agentId === "billing-clerk" && (
            <div className={`${u.card} ${s.detailsCard}`}>
              <Eyebrow>Practice area</Eyebrow>
              <p style={{ marginTop: 8, fontSize: 13, color: "var(--zc-muted)" }}>Changes how entries are written - hourly, or contingency case-activity notes.</p>
              <form action={updateSpecialtyAction} style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <select name="specialty" defaultValue={project.specialty ?? "GENERAL"} className={s.input} style={{ flex: 1 }}>
                  {LAW_FIRM_SPECIALTIES.map((sp) => (
                    <option key={sp} value={sp}>
                      {LEGAL_SPECIALTY_PROFILES[sp].label}
                    </option>
                  ))}
                </select>
                <button type="submit" className={u.btnGhost}>
                  Save
                </button>
              </form>
            </div>
          )}

          <div className={`${u.card} ${s.recentCard}`}>
            <Eyebrow>Recent runs</Eyebrow>
            {recentRuns.length === 0 && <p style={{ fontSize: 13, color: "var(--zc-muted)", marginTop: 10 }}>Nothing yet.</p>}
            {recentRuns.map((r, i) => (
              <div key={i} className={s.recentItem}>
                <span className={s.recentDot} />
                <span className={s.recentText}>{r.text}</span>
                <span className={s.recentTime}>{r.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Module level on purpose: inline "use server" actions can only close over
// serializable values, and a local helper function crashed every form save.
function signInTo(agentBase: string): never {
  redirect(`/sign-in?callbackUrl=${encodeURIComponent(agentBase)}`);
}
function failTo(agentBase: string, error: string): never {
  redirect(`${agentBase}?activateError=${encodeURIComponent(error)}`);
}

function WebsiteFormCard({ clientId, number, firstLeadIn }: { clientId: string; number: string; firstLeadIn: boolean }) {
  const endpoint = `${getSiteUrl()}/api/leads/capture/${clientId}`;
  const snippet = `<form action="${endpoint}" method="POST">
  <input name="name" placeholder="Your name" required>
  <input name="phone" type="tel" placeholder="Mobile number" required>
  <input name="email" type="email" placeholder="Email">
  <textarea name="message" placeholder="How can we help?"></textarea>
  <button type="submit">Send</button>
</form>`;
  return (
    <section className={`${u.card} ${s.setupCard}`} style={{ marginTop: 24 }}>
      <p className={s.setupTitle}>{firstLeadIn ? "Your website form is connected" : "Step 2 of 2: connect your website form"}</p>
      <p className={s.setupDesc}>
        Your agent texts from <b style={{ color: "var(--zc-text)" }}>{number}</b>. Send your website&apos;s enquiry form to the address
        below and every new lead gets an instant reply. Using a form builder (Jotform, Typeform, Wix, WordPress)? Paste the address
        into its &quot;send submissions to a webhook / URL&quot; setting. Fields it reads: name, phone, email, message.
      </p>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <CopyField label="Your form address" value={endpoint} />
        <CopyField label="Or paste this form into your site" value={snippet} multiline />
        <TestLeadForm endpoint={endpoint} />
      </div>
    </section>
  );
}

function Breadcrumb({ clientId, agentName }: { clientId: string; agentName: string }) {
  return (
    <nav className={s.breadcrumb} aria-label="Breadcrumb">
      <Link href={`/services/dashboard/${clientId}/agents`}>Agents</Link> / <span>{agentName}</span>
    </nav>
  );
}

function Header({ agent, tone, clientId }: { agent: { id: string; name: string; icon: IconName; description: string; real: boolean }; tone: "run" | "need" | "done" | "dim"; clientId: string }) {
  const canAdjust = agent.real && adjustableSettings(agent.id).length > 0;
  return (
    <div className={s.header}>
      <div className={s.headerLeft}>
        <div className={s.iconTile}>
          <Icon name={agent.icon} size={30} strokeWidth={1.5} />
        </div>
        <div>
          <div className={s.titleRow}>
            <h1 className={s.title}>{agent.name}</h1>
            <StatusPill tone={tone} />
          </div>
          <p className={s.desc}>{agent.description}</p>
        </div>
      </div>
      {canAdjust && (
        <div className={s.headerActions}>
          <Link href={`/services/dashboard/${clientId}/agents/${agent.id}/adjust`} className={u.btnGhost}>
            Request a change
          </Link>
        </div>
      )}
    </div>
  );
}

function SetupShell({
  clientId,
  agent,
  status,
  title,
  desc,
  error,
  children,
}: {
  clientId: string;
  agent: { id: string; name: string; icon: IconName; description: string; real: boolean };
  status: { tone: "run" | "need" | "done" | "dim" };
  title: string;
  desc: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Breadcrumb clientId={clientId} agentName={agent.name} />
      <Header agent={agent} tone={status.tone} clientId={clientId} />
      <div className={`${u.card} ${s.setupCard}`} style={{ marginTop: 28, maxWidth: 560 }}>
        <p className={s.setupTitle}>{title}</p>
        <p className={s.setupDesc}>{desc}</p>
        {error && <p className={s.errorBox}>Couldn&apos;t activate: {error}</p>}
        <div style={{ marginTop: 16 }}>{children}</div>
      </div>
    </div>
  );
}

function FlashBox({ text }: { text: string }) {
  return (
    <p style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(61,220,151,.08)", border: "1px solid rgba(61,220,151,.3)", color: "var(--zc-done-text)", fontSize: 14 }}>
      {text}
    </p>
  );
}

function NumberNote({ what }: { what: string }) {
  return (
    <p style={{ margin: "-4px 0 0", fontSize: 13, lineHeight: 1.5, color: "var(--zc-muted)" }}>
      Your business number stays exactly as it is. Texts for {what} go out from a new local number with the same area code, because a
      number can only text through one provider at a time. Every message carries your business name.
    </p>
  );
}

function ChoiceFields({ groups }: { groups: ChoiceGroup[] }) {
  return (
    <>
      {groups.map((g) => (
        <fieldset key={g.name} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <legend className={s.label}>{g.question}</legend>
          {g.multi && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--zc-muted)" }}>Pick all that apply.</p>}
          <div className={a.options} style={{ paddingTop: 10 }}>
            {g.options.map((o) => (
              <label key={o.value} className={a.option} style={{ padding: 12 }}>
                <input type={g.multi ? "checkbox" : "radio"} name={g.name} value={o.value} className={a.radio} required={!g.multi && g.required} />
                <span className={a.optionLabel}>{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </>
  );
}

function HoursFields() {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <legend className={s.label}>Business hours</legend>
      <div className={a.options} style={{ paddingTop: 10, gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))" }}>
        {DAYS.map((d) => (
          <label key={d.value} className={a.option} style={{ padding: 12 }}>
            <input type="checkbox" name="days" value={d.value} className={a.radio} defaultChecked={!["Sat", "Sun"].includes(d.value)} />
            <span className={a.optionLabel}>{d.label}</span>
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <select name="open" className={s.input} defaultValue="9am" aria-label="Opens at" style={{ flex: 1, minWidth: 120 }}>
          {OPEN_TIMES.map((t) => (
            <option key={t.value} value={t.value}>
              Opens {t.label}
            </option>
          ))}
        </select>
        <select name="close" className={s.input} defaultValue="5pm" aria-label="Closes at" style={{ flex: 1, minWidth: 120 }}>
          {CLOSE_TIMES.map((t) => (
            <option key={t.value} value={t.value}>
              Closes {t.label}
            </option>
          ))}
        </select>
      </div>
      <label className={a.option} style={{ padding: 12, marginTop: 10 }}>
        <input type="checkbox" name="allDay" value="yes" className={a.radio} />
        <span className={a.optionLabel}>We&apos;re open 24/7 (ignore the days and times above)</span>
      </label>
    </fieldset>
  );
}

function FormField({ label, name, placeholder, type = "text", textarea, defaultValue }: { label: string; name: string; placeholder?: string; type?: string; textarea?: boolean; defaultValue?: string }) {
  return (
    <div className={s.formRow}>
      <label className={s.label}>{label}</label>
      {textarea ? (
        <textarea name={name} rows={3} placeholder={placeholder} className={s.textarea} defaultValue={defaultValue} />
      ) : (
        <input name={name} type={type} required placeholder={placeholder} className={s.input} defaultValue={defaultValue} />
      )}
    </div>
  );
}

function StepRow({ step, index, isLast }: { step: WorkflowStep; index: number; isLast: boolean }) {
  const cls =
    step.state === "done"
      ? s.stepDone
      : step.state === "current"
        ? s.stepCurrent
        : step.state === "human-waiting"
          ? s.stepHumanWaiting
          : step.state === "human-pending"
            ? s.stepHumanPending
            : "";
  return (
    <div className={s.stepRow}>
      <div className={s.stepNum}>{String(index + 1).padStart(2, "0")}</div>
      <div style={{ flex: 1 }}>
        <div className={`${s.step} ${cls}`}>
          <div className={s.stepIcon}>
            <Icon name={STEP_ICON[step.kind] ?? "activity"} size={20} strokeWidth={1.6} />
          </div>
          <div className={s.stepText}>
            <div className={s.stepTitle}>{step.title}</div>
            <div className={s.stepMeta}>
              {step.kind} · {step.detail}
            </div>
          </div>
          <div className={s.stepRight}>
            {step.state === "done" && <Icon name="check" size={18} strokeWidth={2} label="Done" />}
            {(step.state === "current" || step.state === "human-waiting") && <span className={s.pulseDot} />}
          </div>
        </div>
        {!isLast && (
          <div className={s.stepLineWrap}>
            <div className={s.stepLine} />
          </div>
        )}
      </div>
    </div>
  );
}
