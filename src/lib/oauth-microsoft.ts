import { getSiteUrl } from "@/lib/site";
import type { CalendarEventSummary, EmailThreadSummary } from "@/lib/oauth-google";

/* Microsoft OAuth (Entra ID v2 endpoint) for firms on Microsoft 365/Outlook
   instead of Google Workspace — mirrors oauth-google.ts's shape exactly so
   billing-clerk.ts can treat both providers identically. `common` tenant
   supports both personal and work/school Microsoft accounts.
   ponytail: endpoints/scopes verified against Microsoft's stable, long-
   documented identity-platform + Graph API shape — but Microsoft's own app
   consent/verification requirements can change; confirm current
   requirements in the Entra admin center before submitting for review. */

const AUTHORIZE_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const SCOPES = ["offline_access", "openid", "email", "Calendars.Read", "Mail.Read"].join(" ");

function redirectUri(): string {
  return `${getSiteUrl()}/api/oauth/microsoft/callback`;
}

function clientId(): string {
  const id = process.env.MICROSOFT_OAUTH_CLIENT_ID;
  if (!id) throw new Error("MICROSOFT_OAUTH_CLIENT_ID is not set");
  return id;
}

function clientSecret(): string {
  const secret = process.env.MICROSOFT_OAUTH_CLIENT_SECRET;
  if (!secret) throw new Error("MICROSOFT_OAUTH_CLIENT_SECRET is not set");
  return secret;
}

export function buildMicrosoftAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: "code",
    response_mode: "query",
    scope: SCOPES,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number };

export type MicrosoftTokenResult =
  | { ok: true; accessToken: string; refreshToken: string | null; email: string }
  | { ok: false; error: string };

export async function exchangeMicrosoftCode(code: string): Promise<MicrosoftTokenResult> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
      scope: SCOPES,
    }),
  });
  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  const body = (await res.json()) as TokenResponse;

  const email = await fetchMicrosoftAccountEmail(body.access_token);
  if (!email) return { ok: false, error: "could not resolve account email" };

  return { ok: true, accessToken: body.access_token, refreshToken: body.refresh_token ?? null, email };
}

async function fetchMicrosoftAccountEmail(accessToken: string): Promise<string | null> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { mail?: string; userPrincipalName?: string };
  return body.mail ?? body.userPrincipalName ?? null;
}

export type RefreshResult = { ok: true; accessToken: string } | { ok: false; error: string };

export async function refreshMicrosoftAccessToken(refreshToken: string): Promise<RefreshResult> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "refresh_token",
      scope: SCOPES,
    }),
  });
  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  const body = (await res.json()) as TokenResponse;
  return { ok: true, accessToken: body.access_token };
}

export async function fetchMicrosoftCalendarEvents(accessToken: string, sinceDays: number): Promise<CalendarEventSummary[]> {
  const sinceIso = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const url = new URL("https://graph.microsoft.com/v1.0/me/events");
  url.searchParams.set("$filter", `start/dateTime ge '${sinceIso}'`);
  url.searchParams.set("$top", "100");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return [];
  const body = (await res.json()) as {
    value?: Array<{
      id: string;
      subject?: string;
      isAllDay?: boolean;
      start?: { dateTime?: string };
      end?: { dateTime?: string };
      attendees?: Array<{ emailAddress?: { address?: string } }>;
    }>;
  };

  return (body.value ?? [])
    .filter((e) => !e.isAllDay && e.start?.dateTime && e.end?.dateTime)
    .map((e) => ({
      id: e.id,
      summary: e.subject ?? "(no title)",
      start: e.start!.dateTime!,
      end: e.end!.dateTime!,
      attendeeEmails: (e.attendees ?? [])
        .map((a) => a.emailAddress?.address)
        .filter((email): email is string => Boolean(email)),
    }));
}

export async function fetchMicrosoftRecentEmails(accessToken: string, sinceDays: number): Promise<EmailThreadSummary[]> {
  const sinceIso = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const url = new URL("https://graph.microsoft.com/v1.0/me/messages");
  url.searchParams.set("$filter", `receivedDateTime ge ${sinceIso}`);
  url.searchParams.set("$select", "id,subject,bodyPreview,from,receivedDateTime");
  url.searchParams.set("$top", "50");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return [];
  const body = (await res.json()) as {
    value?: Array<{
      id: string;
      subject?: string;
      bodyPreview?: string;
      from?: { emailAddress?: { address?: string } };
      receivedDateTime?: string;
    }>;
  };

  return (body.value ?? []).map((m) => ({
    id: m.id,
    subject: m.subject ?? "(no subject)",
    snippet: m.bodyPreview ?? "",
    fromEmail: m.from?.emailAddress?.address ?? "",
    date: m.receivedDateTime ?? "",
  }));
}
