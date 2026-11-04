/* What happens after an agency finishes WhatsApp Embedded Signup (v4), per Meta's
   "Onboarding business customers as a Tech Provider" guide:
   developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-customers-as-a-tech-provider
   (read 2026-10-19). All calls are server-to-server, as that guide requires.

   1. Exchange the 30-second code for a business token (GET /oauth/access_token).
   2. Subscribe our app to the agency's WABA so its webhooks reach us (POST /{waba}/subscribed_apps).
   3. Register the phone number for Cloud API with a 6-digit PIN (POST /{phone}/register).
      Skipped for a WhatsApp Business app number (coexistence): Meta says that path skips registration.
   4. Read the number's display form for the dashboard.
   5. Coexistence only: request the app's contacts and history sync, which Meta requires within 24 hours.

   The browser half (SDK, FB.login, the postMessage listener) lives in EmbeddedSignupButton.tsx;
   parseSignupMessage is shared with it so the origin check is tested here. */

export const GRAPH = "https://graph.facebook.com/v26.0";

export type SignupEvent = "FINISH" | "FINISH_ONLY_WABA" | "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING" | (string & {});

export type FinishInput = { code: string; wabaId: string; phoneNumberId: string | null; event: SignupEvent };
export type FinishDeps = { fetch: typeof fetch; appId: string; appSecret: string; pin: string };
export type FinishResult = { accessToken: string; phoneNumberId: string; displayPhoneNumber: string | null; registered: boolean; syncErrors: string[] };

export const COEXISTENCE_EVENT = "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING";

const numericId = (v: string | null | undefined): v is string => typeof v === "string" && /^\d{1,30}$/.test(v);

async function graphError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return body.error?.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/** Webhook subscription for one WABA (POST /{waba}/subscribed_apps). Shared by Embedded Signup and the manual connect. */
export async function subscribeWabaToApp(wabaId: string, accessToken: string, fetchFn: typeof fetch): Promise<void> {
  if (!numericId(wabaId)) throw new Error("Invalid WhatsApp Business Account id.");
  const sub = await fetchFn(`${GRAPH}/${wabaId}/subscribed_apps`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
  if (!sub.ok) throw new Error(`Webhook subscription failed: ${await graphError(sub)}`);
}

export async function finishEmbeddedSignup(input: FinishInput, deps: FinishDeps): Promise<FinishResult> {
  const coexistence = input.event === COEXISTENCE_EVENT;
  if (!numericId(input.wabaId)) throw new Error("Invalid WhatsApp Business Account id from Embedded Signup.");
  // A WhatsApp Business app number onboarded by coexistence may report only the WABA id: its number is looked up below.
  if (!input.phoneNumberId && !coexistence) throw new Error("Embedded Signup finished without a phone number. Please run it again and add your WhatsApp number.");
  if (input.phoneNumberId && !numericId(input.phoneNumberId)) throw new Error("Invalid phone number id from Embedded Signup.");
  if (!input.code) throw new Error("Missing authorization code from Embedded Signup.");

  // 1. code -> business token
  const exchange = new URL(`${GRAPH}/oauth/access_token`);
  exchange.searchParams.set("client_id", deps.appId);
  exchange.searchParams.set("client_secret", deps.appSecret);
  exchange.searchParams.set("code", input.code);
  const tokenRes = await deps.fetch(exchange);
  if (!tokenRes.ok) throw new Error(`Code exchange failed: ${await graphError(tokenRes)}`);
  const accessToken = ((await tokenRes.json()) as { access_token?: string }).access_token;
  if (!accessToken) throw new Error("Code exchange failed: Meta returned no access token.");
  const auth = { Authorization: `Bearer ${accessToken}` };

  // 2. webhooks for this WABA
  await subscribeWabaToApp(input.wabaId, accessToken, deps.fetch);

  let phoneNumberId = input.phoneNumberId;
  if (!phoneNumberId) {
    const list = await deps.fetch(`${GRAPH}/${input.wabaId}/phone_numbers?fields=id`, { headers: auth });
    if (!list.ok) throw new Error(`Could not read the WhatsApp number: ${await graphError(list)}`);
    const first = ((await list.json()) as { data?: { id?: string }[] }).data?.[0]?.id;
    if (!numericId(first)) throw new Error("Meta did not report a phone number on this WhatsApp Business account.");
    phoneNumberId = first;
  }

  // 3. register for Cloud API (not for a WhatsApp Business app number, which stays on the app)
  const registered = !coexistence;
  if (registered) {
    const reg = await deps.fetch(`${GRAPH}/${phoneNumberId}/register`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", pin: deps.pin }),
    });
    if (!reg.ok) throw new Error(`Phone number registration failed: ${await graphError(reg)}`);
  }

  // 4. display number (best effort: the connection still works without it)
  let displayPhoneNumber: string | null = null;
  const info = await deps.fetch(`${GRAPH}/${phoneNumberId}?fields=display_phone_number,verified_name`, { headers: auth });
  if (info.ok) displayPhoneNumber = ((await info.json()) as { display_phone_number?: string }).display_phone_number ?? null;

  // 5. coexistence only: Meta gives 24 hours to ask for the app's contacts and then its chat history (each can be
  //    asked once), or the number is offboarded. We don't store either, but the request itself keeps the
  //    connection alive. Source: developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/
  //    onboarding-business-app-users (read 2026-11-04). A failure here must not undo a working connection.
  const syncErrors: string[] = [];
  if (coexistence) {
    for (const syncType of ["smb_app_state_sync", "history"]) {
      try {
        const res = await deps.fetch(`${GRAPH}/${phoneNumberId}/smb_app_data`, {
          method: "POST",
          headers: { ...auth, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product: "whatsapp", sync_type: syncType }),
        });
        if (!res.ok) syncErrors.push(`${syncType}: ${await graphError(res)}`);
      } catch (err) {
        syncErrors.push(`${syncType}: ${err instanceof Error ? err.message : "request failed"}`);
      }
    }
  }

  return { accessToken, phoneNumberId, displayPhoneNumber, registered, syncErrors };
}

export type SignupMessage = { kind: "finish"; event: SignupEvent; wabaId: string; phoneNumberId: string | null } | { kind: "cancel"; reason: string };

/** The postMessage Embedded Signup sends the opener. Only facebook.com (or a subdomain) is trusted. */
export function parseSignupMessage(origin: string, raw: unknown): SignupMessage | null {
  let host: string;
  try {
    host = new URL(origin).hostname;
  } catch {
    return null;
  }
  if (host !== "facebook.com" && !host.endsWith(".facebook.com")) return null;
  let msg: { type?: string; event?: string; data?: Record<string, string | undefined> };
  try {
    msg = typeof raw === "string" ? JSON.parse(raw) : (raw as typeof msg);
  } catch {
    return null;
  }
  if (msg?.type !== "WA_EMBEDDED_SIGNUP") return null;
  const data = msg.data ?? {};
  if (msg.event === "CANCEL") return { kind: "cancel", reason: data.error_message || data.current_step || "cancelled" };
  if (!data.waba_id) return null;
  return { kind: "finish", event: msg.event ?? "FINISH", wabaId: data.waba_id, phoneNumberId: data.phone_number_id ?? null };
}

/** A fresh two-step verification PIN for a newly registered number. */
export function newRegistrationPin(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
  return String(n).padStart(6, "0");
}
