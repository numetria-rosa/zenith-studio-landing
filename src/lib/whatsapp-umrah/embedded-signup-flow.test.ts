import { describe, expect, it } from "vitest";
import { finishEmbeddedSignup, parseSignupMessage } from "./embedded-signup-flow";

type Call = { url: string; method: string; body?: unknown; auth?: string | null };

/** A fetch stand-in that records each call and answers from a script, in order. */
function scriptedFetch(responses: Array<{ status?: number; json: unknown }>) {
  const calls: Call[] = [];
  const fn = (async (input: string | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({ url: String(input), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined, auth: headers.get("Authorization") });
    const next = responses.shift();
    if (!next) throw new Error(`unexpected call ${String(input)}`);
    return new Response(JSON.stringify(next.json), { status: next.status ?? 200 });
  }) as typeof fetch;
  return { fn, calls };
}

const base = { appId: "111", appSecret: "shh", pin: "123456" };

describe("finishEmbeddedSignup", () => {
  it("exchanges the code, subscribes the app, registers the number and reads its display number", async () => {
    const { fn, calls } = scriptedFetch([
      { json: { access_token: "BIZ_TOKEN", token_type: "bearer" } },
      { json: { success: true } },
      { json: { success: true } },
      { json: { display_phone_number: "+44 20 7946 0000", verified_name: "Al Noor Travel", id: "555" } },
    ]);
    const r = await finishEmbeddedSignup({ code: "CODE", wabaId: "999", phoneNumberId: "555", event: "FINISH" }, { ...base, fetch: fn });

    expect(r).toEqual({ accessToken: "BIZ_TOKEN", displayPhoneNumber: "+44 20 7946 0000", registered: true });
    const exchange = new URL(calls[0]!.url);
    expect(exchange.pathname).toMatch(/\/oauth\/access_token$/);
    expect(Object.fromEntries(exchange.searchParams)).toEqual({ client_id: "111", client_secret: "shh", code: "CODE" });
    expect(calls[1]).toMatchObject({ method: "POST", auth: "Bearer BIZ_TOKEN" });
    expect(calls[1]!.url).toMatch(/\/999\/subscribed_apps$/);
    expect(calls[2]).toMatchObject({ method: "POST", auth: "Bearer BIZ_TOKEN", body: { messaging_product: "whatsapp", pin: "123456" } });
    expect(calls[2]!.url).toMatch(/\/555\/register$/);
    expect(calls[3]!.url).toMatch(/\/555\?fields=display_phone_number/);
  });

  it("does not register a WhatsApp Business app number (coexistence): it is already registered", async () => {
    const { fn, calls } = scriptedFetch([
      { json: { access_token: "BIZ_TOKEN" } },
      { json: { success: true } },
      { json: { display_phone_number: "+44 7700 900000" } },
    ]);
    const r = await finishEmbeddedSignup({ code: "C", wabaId: "999", phoneNumberId: "555", event: "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING" }, { ...base, fetch: fn });
    expect(r.registered).toBe(false);
    expect(calls.map((c) => c.url).some((u) => u.endsWith("/register"))).toBe(false);
  });

  it("names the step that failed, and never leaks the app secret in the error", async () => {
    const { fn } = scriptedFetch([{ status: 400, json: { error: { message: "This authorization code has expired." } } }]);
    await expect(finishEmbeddedSignup({ code: "C", wabaId: "999", phoneNumberId: "555", event: "FINISH" }, { ...base, fetch: fn })).rejects.toThrow(/code exchange failed: .*expired/i);
    await expect(
      finishEmbeddedSignup({ code: "C", wabaId: "999", phoneNumberId: "555", event: "FINISH" }, { ...base, fetch: scriptedFetch([{ status: 400, json: { error: { message: "bad" } } }]).fn }),
    ).rejects.not.toThrow(/shh/);
  });

  it("refuses ids that are not Meta's numeric ids, before calling anything", async () => {
    const { fn, calls } = scriptedFetch([]);
    await expect(finishEmbeddedSignup({ code: "C", wabaId: "../../me", phoneNumberId: "555", event: "FINISH" }, { ...base, fetch: fn })).rejects.toThrow(/invalid/i);
    expect(calls).toHaveLength(0);
  });

  it("refuses a flow that finished without a phone number", async () => {
    const { fn } = scriptedFetch([]);
    await expect(finishEmbeddedSignup({ code: "C", wabaId: "999", phoneNumberId: null, event: "FINISH_ONLY_WABA" }, { ...base, fetch: fn })).rejects.toThrow(/phone number/i);
  });
});

describe("parseSignupMessage", () => {
  const ok = { type: "WA_EMBEDDED_SIGNUP", event: "FINISH", data: { waba_id: "999", phone_number_id: "555", business_id: "1" } };

  it("reads a finished flow from a facebook.com origin", () => {
    expect(parseSignupMessage("https://www.facebook.com", JSON.stringify(ok))).toEqual({ kind: "finish", event: "FINISH", wabaId: "999", phoneNumberId: "555" });
  });
  it("ignores other origins and other message types", () => {
    expect(parseSignupMessage("https://evil.example", JSON.stringify(ok))).toBeNull();
    expect(parseSignupMessage("https://evilfacebook.com.example", JSON.stringify(ok))).toBeNull();
    expect(parseSignupMessage("https://www.facebook.com", JSON.stringify({ type: "OTHER" }))).toBeNull();
    expect(parseSignupMessage("https://www.facebook.com", "not json")).toBeNull();
  });
  it("reports a cancelled flow with its step or error", () => {
    expect(parseSignupMessage("https://web.facebook.com", JSON.stringify({ type: "WA_EMBEDDED_SIGNUP", event: "CANCEL", data: { current_step: "PHONE_NUMBER_SETUP" } }))).toEqual({
      kind: "cancel",
      reason: "PHONE_NUMBER_SETUP",
    });
    expect(parseSignupMessage("https://www.facebook.com", JSON.stringify({ type: "WA_EMBEDDED_SIGNUP", event: "CANCEL", data: { error_message: "Number in use" } }))).toEqual({
      kind: "cancel",
      reason: "Number in use",
    });
  });
});
