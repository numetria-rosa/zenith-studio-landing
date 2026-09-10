import { getSiteUrl } from "@/lib/site";

/* Google OAuth for the Billing Clerk's calendar + email access, this is a
   SEPARATE OAuth app/flow from Auth.js's user login, and needs offline
   access (a refresh token) since it runs unattended in a cron, not during
   a live session. Scopes are read-only by design; the Billing Clerk never
   needs to send mail or modify events.
   ponytail: endpoint URLs/scopes verified against Google's stable, long-
   documented OAuth2/Calendar/Gmail API shape, not guessed, but Google's
   *app verification* requirements for these scopes (restricted-scope
   review, ~1-6 weeks) can change; confirm current requirements in the
   Google Cloud Console before submitting for review. */

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

function redirectUri(): string {
  return `${getSiteUrl()}/api/oauth/google/callback`;
}

function clientId(): string {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_OAUTH_CLIENT_ID is not set");
  return id;
}

function clientSecret(): string {
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!secret) throw new Error("GOOGLE_OAUTH_CLIENT_SECRET is not set");
  return secret;
}

export function buildGoogleAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent", // forces a refresh_token on every consent, not just the first
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number; id_token?: string };

export type GoogleTokenResult =
  | { ok: true; accessToken: string; refreshToken: string | null; email: string }
  | { ok: false; error: string };

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResult> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  const body = (await res.json()) as TokenResponse;

  const email = await fetchGoogleAccountEmail(body.access_token);
  if (!email) return { ok: false, error: "could not resolve account email" };

  return { ok: true, accessToken: body.access_token, refreshToken: body.refresh_token ?? null, email };
}

async function fetchGoogleAccountEmail(accessToken: string): Promise<string | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { email?: string };
  return body.email ?? null;
}

export type RefreshResult = { ok: true; accessToken: string } | { ok: false; error: string };

export async function refreshGoogleAccessToken(refreshToken: string): Promise<RefreshResult> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  const body = (await res.json()) as TokenResponse;
  return { ok: true, accessToken: body.access_token };
}

export type CalendarEventSummary = {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendeeEmails: string[];
};

/** Events in the last N days with at least one external attendee, a rough
    "this looks like billable client work" filter. Attorneys review every
    draft anyway, so false positives cost a rejected draft, not a bad
    invoice. */
export async function fetchGoogleCalendarEvents(accessToken: string, sinceDays: number): Promise<CalendarEventSummary[]> {
  const timeMin = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("maxResults", "100");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return [];
  const body = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      attendees?: Array<{ email?: string }>;
    }>;
  };

  return (body.items ?? [])
    .filter((e) => e.start?.dateTime && e.end?.dateTime) // skip all-day events
    .map((e) => ({
      id: e.id,
      summary: e.summary ?? "(no title)",
      start: e.start!.dateTime!,
      end: e.end!.dateTime!,
      attendeeEmails: (e.attendees ?? []).map((a) => a.email).filter((email): email is string => Boolean(email)),
    }));
}

export type EmailThreadSummary = { id: string; subject: string; snippet: string; fromEmail: string; date: string };

export async function fetchGoogleRecentEmails(accessToken: string, sinceDays: number): Promise<EmailThreadSummary[]> {
  const afterDate = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const query = `after:${Math.floor(afterDate.getTime() / 1000)} -in:chats -category:promotions`;
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("maxResults", "50");

  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!listRes.ok) return [];
  const listBody = (await listRes.json()) as { messages?: Array<{ id: string }> };
  const ids = (listBody.messages ?? []).map((m) => m.id);

  const results: EmailThreadSummary[] = [];
  for (const id of ids) {
    const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`;
    const msgRes = await fetch(msgUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!msgRes.ok) continue;
    const msg = (await msgRes.json()) as {
      id: string;
      snippet?: string;
      payload?: { headers?: Array<{ name: string; value: string }> };
    };
    const headers = msg.payload?.headers ?? [];
    const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";
    results.push({
      id: msg.id,
      subject: get("Subject") || "(no subject)",
      snippet: msg.snippet ?? "",
      fromEmail: get("From"),
      date: get("Date"),
    });
  }
  return results;
}
