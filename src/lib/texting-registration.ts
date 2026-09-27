import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";
import { sendAdminAlert, sendPlainEmail } from "@/lib/outreach-mail";
import { DEFAULT_SETTINGS, instantReplySms, missedCallSms } from "@/lib/agent-settings";
import { businessNameOf } from "@/lib/services";
import { toE164UsNumber } from "@/lib/vapi-provision";

/* US carrier texting approval (A2P 10DLC), filed for each client in their
   own business name through SignalWire's Campaign Registry API:
   brand -> campaign -> number assignment. Carriers block texts until all
   three are approved, so every SMS sender checks textingApproved() first.
   The client only types facts (legal name, EIN, address, website); the
   campaign text itself is generated here from the plan and business name.
   Advanced by SignalWire's status callback and, as a fallback, the daily
   follow-up cron. */

export type RegistrationStatus = "BRAND_PENDING" | "CAMPAIGN_PENDING" | "NUMBER_PENDING" | "ACTIVE" | "FAILED";

export const ENTITY_TYPES = [
  { value: "PRIVATE_PROFIT", label: "Private company (LLC, corporation, partnership, sole owner with an EIN)" },
  { value: "PUBLIC_PROFIT", label: "Publicly traded company" },
  { value: "NON_PROFIT", label: "Non-profit" },
] as const;

const VERTICAL: Record<string, string> = { "insurance-ai-team": "INSURANCE", "law-firms": "LEGAL", brokerages: "REAL_ESTATE" };

export type RegistrationDetails = {
  legalName: string;
  ein: string;
  entityType: string;
  address: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
};

/** Validates what the client typed. Only facts here, no free-form text. */
export function readDetails(get: (name: string) => unknown): { ok: true; details: RegistrationDetails } | { ok: false; error: string } {
  const s = (k: string) => String(get(k) ?? "").trim();
  const legalName = s("legalName");
  const ein = s("ein").replace(/\D/g, "");
  const entityType = s("entityType");
  const address = s("address");
  let website = s("website");
  const contactEmail = s("contactEmail").toLowerCase();
  const contactPhone = toE164UsNumber(s("contactPhone"));
  if (legalName.length < 2) return { ok: false, error: "Enter your legal business name exactly as it appears on your IRS paperwork." };
  if (ein.length !== 9) return { ok: false, error: "Your EIN should be 9 digits, like 12-3456789." };
  if (!ENTITY_TYPES.some((t) => t.value === entityType)) return { ok: false, error: "Pick your business type." };
  if (address.length < 10) return { ok: false, error: "Enter your full business address (street, city, state, ZIP)." };
  if (!/^https?:\/\//i.test(website)) website = `https://${website}`;
  try {
    if (!new URL(website).hostname.includes(".")) throw new Error();
  } catch {
    return { ok: false, error: "Enter your business website, like yourbusiness.com." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return { ok: false, error: "That contact email doesn't look valid." };
  if (!contactPhone) return { ok: false, error: "That contact phone number doesn't look like a valid US number." };
  return { ok: true, details: { legalName, ein, entityType, address, website, contactEmail, contactPhone } };
}

/** Carriers expect opt-out wording on the first text of a conversation. */
export const withOptOut = (text: string) => `${text} Reply STOP to opt out.`;

/** The consent line every web form sending leads to us must show. */
export const formConsentText = (business: string) =>
  `By submitting, you agree to receive text messages from ${business} about your enquiry. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`;

export function campaignRequest(business: string, d: RegistrationDetails, callbackUrl: string) {
  return {
    name: `${business} customer care`,
    sms_use_case: "LOW_VOLUME_MIXED",
    sub_use_cases: ["CUSTOMER_CARE", "ACCOUNT_NOTIFICATION"],
    description: `${business} sends one-to-one text replies only to people who contact the business first: a text back when their call to the business is missed, and a reply when they submit the enquiry form on ${d.website}. Follow-up texts only continue that same conversation and stop as soon as the person replies. No marketing or promotional messages.`,
    sample1: withOptOut(missedCallSms(DEFAULT_SETTINGS, business)),
    sample2: withOptOut(instantReplySms(DEFAULT_SETTINGS, business)),
    message_flow: `Consumers opt in by contacting ${business} first. (1) They call the business phone number; if the call is missed, one text is sent to the number that called, and any follow-up only continues that conversation. (2) They submit the enquiry form on ${d.website}, which asks for their phone number and shows: "${formConsentText(business)}"`,
    opt_out_message: `${business}: you're unsubscribed and won't get more texts. Reply START to resubscribe.`,
    help_message: `${business}: for help call ${d.contactPhone} or email ${d.contactEmail}. Reply STOP to opt out.`,
    number_pooling_required: false,
    direct_lending: false,
    embedded_link: false,
    embedded_phone: false,
    age_gated_content: false,
    lead_generation: false,
    terms_and_conditions: true,
    status_callback_url: callbackUrl,
  };
}

// ---------- SignalWire Campaign Registry API ----------

async function registry(path: string, init?: { method: "POST"; body: unknown }): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  const space = (process.env.SIGNALWIRE_SPACE_URL || process.env.SIGNALWIRE_SPACE || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const token = process.env.SIGNALWIRE_API_TOKEN;
  if (!space || !projectId || !token) return { ok: false, error: "SignalWire is not configured" };
  try {
    const res = await fetch(`https://${space}/api/relay/rest/registry/beta${path}`, {
      method: init?.method ?? "GET",
      headers: { Authorization: `Basic ${Buffer.from(`${projectId}:${token}`).toString("base64")}`, "Content-Type": "application/json", Accept: "application/json" },
      body: init ? JSON.stringify(init.body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status} ${text.slice(0, 400)}` };
    return { ok: true, data: text ? (JSON.parse(text) as Record<string, unknown>) : {} };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "SignalWire request failed" };
  }
}

// SignalWire documents the callback events but not every state string, so
// both are matched loosely. ponytail: tighten once real states are observed.
const BRAND_OK = ["completed", "verified", "approved", "active", "activated"];
const CAMPAIGN_OK = ["active", "approved", "completed", "activated"];
const ORDER_OK = ["processed", "completed", "success", "succeeded"];
const FAILED = ["unverified", "rejected", "failed", "denied", "deactivated", "suspended", "expired"];
const stateOf = (d: Record<string, unknown>) => String(d.state ?? "").toLowerCase();

// ---------- Callback URL signing (SignalWire doesn't sign these callbacks) ----------

function callbackKey(): string {
  const key = process.env.AUTH_SECRET;
  if (!key) throw new Error("AUTH_SECRET is not set");
  return key;
}
export function callbackToken(projectId: string): string {
  return createHmac("sha256", callbackKey()).update(`texting-registration:${projectId}`).digest("hex");
}
export function verifyCallbackToken(projectId: string, token: string): boolean {
  const expected = Buffer.from(callbackToken(projectId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
const callbackUrl = (projectId: string) => `${getSiteUrl()}/api/webhooks/texting-registration?p=${projectId}&t=${callbackToken(projectId)}`;

// ---------- Flow ----------

export async function textingApproved(projectId: string): Promise<boolean> {
  const reg = await db.textingRegistration.findUnique({ where: { projectId }, select: { status: true } });
  return reg?.status === "ACTIVE";
}

export async function submitTextingRegistration(projectId: string, userId: string, details: RegistrationDetails): Promise<{ ok: true } | { ok: false; error: string }> {
  const project = await db.serviceProject.findFirst({
    where: { id: projectId, userId },
    select: { id: true, sourceServiceId: true, title: true, textingRegistration: { select: { status: true } } },
  });
  if (!project) return { ok: false, error: "not_found" };
  if (project.textingRegistration && project.textingRegistration.status !== "FAILED") return { ok: false, error: "Your texting registration is already submitted." };

  const business = businessNameOf(project) || details.legalName;
  const brand = await registry("/brands", {
    method: "POST",
    body: {
      name: business,
      company_name: details.legalName,
      contact_email: details.contactEmail,
      contact_phone: details.contactPhone,
      ein_issuing_country: "US",
      legal_entity_type: details.entityType,
      ein: details.ein,
      company_address: details.address,
      company_website: details.website,
      company_vertical: VERTICAL[project.sourceServiceId ?? ""] ?? "PROFESSIONAL",
      status_callback_url: callbackUrl(project.id),
    },
  });
  if (!brand.ok) {
    await sendAdminAlert("Texting registration failed to submit", `Project ${project.id} (${business}): ${brand.error}`);
    return { ok: false, error: "We couldn't submit your registration right now. We've been alerted and will fix it; please try again later." };
  }

  const data = { status: "BRAND_PENDING", brandId: String(brand.data.id ?? ""), campaignId: null, orderId: null, details, lastError: null, submittedAt: new Date() };
  await db.textingRegistration.upsert({ where: { projectId: project.id }, create: { projectId: project.id, ...data }, update: data });
  await sendAdminAlert("Texting registration submitted", `${business} (${project.id}) filed brand ${data.brandId}.`);
  return { ok: true };
}

/** Moves one registration forward as far as SignalWire's current state
    allows. `hint` is a callback event type (e.g. "brand_activated"), used
    when the fetched state string isn't one we recognise yet. */
export async function advanceTextingRegistration(projectId: string, hint?: string): Promise<RegistrationStatus | null> {
  const reg = await db.textingRegistration.findUnique({
    where: { projectId },
    include: { project: { select: { id: true, title: true, sourceServiceId: true, user: { select: { email: true } }, integrations: { where: { provider: "signalwire" }, select: { externalRef: true } } } } },
  });
  if (!reg) return null;
  const details = reg.details as RegistrationDetails;
  const business = businessNameOf(reg.project) || details.legalName;
  const fail = async (error: string) => {
    await db.textingRegistration.update({ where: { id: reg.id }, data: { status: "FAILED", lastError: error } });
    await sendAdminAlert("Texting registration rejected", `${business} (${projectId}): ${error}`);
    if (reg.project.user.email) {
      await sendPlainEmail(
        reg.project.user.email,
        "Your texting registration needs a fix",
        `US carriers couldn't approve texting for ${business}. The most common reason is that the legal name or EIN doesn't exactly match IRS records.\n\nOpen your dashboard, check the details, and resubmit. Everything else on your AI team keeps working in the meantime.`
      );
    }
    return "FAILED" as const;
  };

  if (reg.status === "BRAND_PENDING" && reg.brandId) {
    const brand = await registry(`/brands/${reg.brandId}`);
    if (!brand.ok) return reg.status as RegistrationStatus;
    const state = stateOf(brand.data);
    if (FAILED.includes(state) || hint === "brand_unverified") return fail(`brand ${state || "unverified"}`);
    if (!BRAND_OK.includes(state) && hint !== "brand_activated") return reg.status as RegistrationStatus;
    const campaign = await registry(`/brands/${reg.brandId}/campaigns`, { method: "POST", body: campaignRequest(business, details, callbackUrl(projectId)) });
    if (!campaign.ok) return fail(`campaign submit: ${campaign.error}`);
    await db.textingRegistration.update({ where: { id: reg.id }, data: { status: "CAMPAIGN_PENDING", campaignId: String(campaign.data.id ?? "") } });
    return "CAMPAIGN_PENDING";
  }

  if (reg.status === "CAMPAIGN_PENDING" && reg.campaignId) {
    const campaign = await registry(`/campaigns/${reg.campaignId}`);
    if (!campaign.ok) return reg.status as RegistrationStatus;
    const state = stateOf(campaign.data);
    if (FAILED.includes(state) || hint === "campaign_deactivated") return fail(`campaign ${state || "deactivated"}`);
    if (!CAMPAIGN_OK.includes(state) && hint !== "campaign_activated") return reg.status as RegistrationStatus;
    const numbers = reg.project.integrations.map((i) => i.externalRef).filter((n): n is string => !!n);
    if (numbers.length === 0) return reg.status as RegistrationStatus; // number not bought yet; retried next run
    const order = await registry(`/campaigns/${reg.campaignId}/orders`, { method: "POST", body: { phone_numbers: numbers, status_callback_url: callbackUrl(projectId) } });
    if (!order.ok) return fail(`number assignment: ${order.error}`);
    await db.textingRegistration.update({ where: { id: reg.id }, data: { status: "NUMBER_PENDING", orderId: String(order.data.id ?? "") } });
    return "NUMBER_PENDING";
  }

  if (reg.status === "NUMBER_PENDING" && reg.orderId) {
    const order = await registry(`/orders/${reg.orderId}`);
    if (!order.ok) return reg.status as RegistrationStatus;
    const state = stateOf(order.data);
    if (FAILED.includes(state)) return fail(`number assignment ${state}`);
    if (!ORDER_OK.includes(state) && hint !== "number_assignment_order_processed") return reg.status as RegistrationStatus;
    await db.textingRegistration.update({ where: { id: reg.id }, data: { status: "ACTIVE", activatedAt: new Date(), lastError: null } });
    await sendAdminAlert("Texting approved", `${business} (${projectId}) can now text.`);
    if (reg.project.user.email) {
      await sendPlainEmail(reg.project.user.email, "Texting is live", `US carriers approved texting for ${business}. From now on, missed calls and new enquiries get an automatic text reply.`);
    }
    return "ACTIVE";
  }

  return reg.status as RegistrationStatus;
}

/** Daily fallback in case a callback was missed. Loops so a registration
    can move several steps in one run when SignalWire is already ahead. */
export async function advanceAllTextingRegistrations(): Promise<number> {
  const pending = await db.textingRegistration.findMany({ where: { status: { in: ["BRAND_PENDING", "CAMPAIGN_PENDING", "NUMBER_PENDING"] } }, select: { projectId: true } });
  let moved = 0;
  for (const { projectId } of pending) {
    for (let i = 0; i < 3; i++) {
      const before = await db.textingRegistration.findUnique({ where: { projectId }, select: { status: true } });
      const after = await advanceTextingRegistration(projectId);
      if (!after || after === before?.status) break;
      moved++;
    }
  }
  return moved;
}
