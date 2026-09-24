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
import { GuidePicker, InlineGuide } from "../../GuidePicker";
import { CRM_SETUP_GUIDES, GOOGLE_SHEETS_SHARE_GUIDE } from "@/lib/setup-guides";
import { Icon, type IconName } from "../../Icon";
import { StatusPill, Eyebrow } from "../../ui";
import u from "../../ui.module.css";
import s from "./agent.module.css";

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

  const dashboardBase = `/services/dashboard/${clientId}`;
  const agentBase = `${dashboardBase}/agents/${agentId}`;
  function signIn() {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(agentBase)}`);
  }
  function fail(error: string): never {
    redirect(`${agentBase}?activateError=${encodeURIComponent(error)}`);
  }

  // ---------- Not-yet-built agents: honest state, no fake workflow ----------
  if (!agent.real) {
    return (
      <div>
        <Breadcrumb clientId={clientId} agentName={agent.name} />
        <Header agent={agent} tone="dim" clientId={clientId} />
        <div className={`${u.card} ${s.setupCard}`} style={{ marginTop: 28, maxWidth: 560 }}>
          <p className={s.setupTitle}>Not set up yet</p>
          <p className={s.setupDesc}>
            This role isn&apos;t automated for your account yet. Reach out from Support and we&apos;ll help get it
            running.
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
    if (!session2?.user?.id) signIn();
    const result = await activateTextBack(clientId, session2!.user.id, { businessName: String(formData.get("businessName") || "") });
    revalidatePath(dashboardBase);
    if (!result.ok) fail(result.error);
    redirect(agentBase);
  }

  async function activateLeadCaptureAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signIn();
    const result = await activateLeadCapture(clientId, session2!.user.id, {
      businessName: String(formData.get("businessName") || ""),
      qualificationRules: String(formData.get("qualificationRules") || ""),
      notifyEmail: String(formData.get("notifyEmail") || ""),
    });
    revalidatePath(dashboardBase);
    if (!result.ok) fail(result.error);
    redirect(agentBase);
  }

  async function activateReceptionistAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signIn();
    const result = await activateReceptionist(clientId, session2!.user.id, {
      businessName: String(formData.get("businessName") || ""),
      hours: String(formData.get("hours") || ""),
      faqText: String(formData.get("faqText") || ""),
      fallbackNumber: String(formData.get("fallbackNumber") || ""),
    });
    revalidatePath(dashboardBase);
    if (!result.ok) fail(result.error);
    redirect(agentBase);
  }

  async function activateCrmWebhookAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signIn();
    const result = await activateCrmWebhook(clientId, session2!.user.id, {
      webhookUrl: String(formData.get("webhookUrl") || ""),
      payloadFormat: String(formData.get("payloadFormat") || ""),
    });
    revalidatePath(dashboardBase);
    if (!result.ok) fail(result.error);
    redirect(agentBase);
  }

  async function runDocumentAuditAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signIn();
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
    if (!result.ok) fail(result.error);
    redirect(`${agentBase}?flash=${encodeURIComponent("Audit complete - see the summary below.")}`);
  }

  async function importBookOfBusinessAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signIn();
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
    if (!result.ok) fail(result.error);
    redirect(`${agentBase}?flash=${encodeURIComponent(`Imported ${result.created} clients. Renewal reminders are on.`)}`);
  }

  async function connectMailboxAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signIn();
    const result = await connectMailbox(
      clientId,
      session2!.user.id,
      String(formData.get("provider") || ""),
      String(formData.get("emailAddress") || ""),
      String(formData.get("appPassword") || "")
    );
    revalidatePath(dashboardBase);
    if (!result.ok) fail(result.error);
    redirect(agentBase);
  }

  async function updateSpecialtyAction(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) signIn();
    await updateOwnedSpecialty(clientId, session2!.user.id, String(formData.get("specialty") || ""));
    revalidatePath(dashboardBase);
    redirect(agentBase);
  }

  // ---------- Setup-needed states, per real agent ----------
  const textBackConnected = project.integrations.some((i) => i.provider === "signalwire" && i.status === "CONNECTED");
  const billingConnected = project.oauthConnections.some((c) => c.status === "CONNECTED");
  const leadCaptureConnected = project.integrations.some((i) => i.provider === "signalwire" && i.status === "CONNECTED");
  const crmConnected = project.integrations.some((i) => i.provider === "crm" && i.status === "CONNECTED");
  const mailConnected = project.mailConnections.some((c) => c.status === "CONNECTED");
  const receptionistConnected = project.integrations.some((i) => i.provider === "vapi" && i.status === "CONNECTED");

  if (agentId === "receptionist" && !receptionistConnected) {
    return (
      <SetupShell clientId={clientId} agent={agent} status={status} title="Set up your AI Receptionist" desc="This buys a real phone number and turns the receptionist on immediately - no review, no waiting on us." error={activateError}>
        <form action={activateReceptionistAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="Business name" name="businessName" placeholder="Used when greeting callers" />
          <FormField label="Hours" name="hours" placeholder="e.g. Mon-Fri 9am-5pm" />
          <FormField label="FAQs" name="faqText" textarea placeholder="Common questions and answers the receptionist should know" />
          <FormField label="Fallback phone number" name="fallbackNumber" type="tel" placeholder="Where to transfer calls it can't handle" />
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
          <FormField label="Business name" name="businessName" placeholder="Used in the missed-call text" />
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

  if ((agentId === "isa" || agentId === "lead-capture") && !leadCaptureConnected) {
    return (
      <SetupShell clientId={clientId} agent={agent} status={status} title={`Set up ${agent.name}`} desc="This buys a real phone number immediately and turns on lead follow-up - no review, no waiting on us." error={activateError}>
        <form action={activateLeadCaptureAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="Business name" name="businessName" placeholder="Used when replying to a new lead" />
          <FormField label="Qualification rules" name="qualificationRules" textarea placeholder="What makes a lead worth pursuing (motivation, timeline, financing status)" />
          <FormField label="Notify email" name="notifyEmail" type="email" placeholder="Where we send you a copy of every new lead" />
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
          <FormField
            label="Does your CRM expect specific field names? (optional)"
            name="payloadFormat"
            textarea
            placeholder='e.g.: {"full_name": "...", "contact_phone": "..."}. Leave blank to use our default field names.'
          />
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
            <FormField label="Agency name" name="agencyName" placeholder="Used in the reminder emails your clients get" />
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

  // ---------- Everything else: real workflow view ----------
  const steps = planWorkflowSteps(project, agentId);
  const currentIndex = steps.findIndex((st) => st.state === "current" || st.state === "human-waiting");
  const activeIndex = currentIndex === -1 ? steps.length - 1 : currentIndex;
  const progressPct = steps.length ? Math.round(((activeIndex + 1) / steps.length) * 100) : 0;

  const recentRuns =
    agentId === "billing-clerk"
      ? project.timeEntries.slice(0, 5).map((e) => ({ text: `${e.matterName} · ${e.status.toLowerCase()}`, time: e.entryDate.toISOString().slice(0, 10) }))
      : agentId === "isa" || agentId === "text-back" || agentId === "follow-up-clerk" || agentId === "lead-capture"
        ? project.leads.slice(0, 5).map((l) => ({ text: `${l.name ?? "Caller"} · ${l.status.toLowerCase().replace("_", " ")}`, time: l.createdAt.toISOString().slice(0, 10) }))
        : [];

  return (
    <div>
      <Breadcrumb clientId={clientId} agentName={agent.name} />
      <Header agent={agent} tone={status.tone} clientId={clientId} />

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

function Breadcrumb({ clientId, agentName }: { clientId: string; agentName: string }) {
  return (
    <nav className={s.breadcrumb} aria-label="Breadcrumb">
      <Link href={`/services/dashboard/${clientId}/agents`}>Agents</Link> / <span>{agentName}</span>
    </nav>
  );
}

function Header({ agent, tone, clientId }: { agent: { name: string; icon: IconName; description: string }; tone: "run" | "need" | "done" | "dim"; clientId: string }) {
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
      <div className={s.headerActions}>
        <Link href={`/services/dashboard/${clientId}/settings`} className={u.btnGhost}>
          Request a change
        </Link>
      </div>
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
  agent: { name: string; icon: IconName; description: string };
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

function FormField({ label, name, placeholder, type = "text", textarea }: { label: string; name: string; placeholder?: string; type?: string; textarea?: boolean }) {
  return (
    <div className={s.formRow}>
      <label className={s.label}>{label}</label>
      {textarea ? (
        <textarea name={name} rows={3} placeholder={placeholder} className={s.textarea} />
      ) : (
        <input name={name} type={type} required placeholder={placeholder} className={s.input} />
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
