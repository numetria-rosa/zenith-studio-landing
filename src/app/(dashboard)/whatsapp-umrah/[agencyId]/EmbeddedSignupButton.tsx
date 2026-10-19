"use client";

import { useEffect, useRef, useState } from "react";
import { parseSignupMessage, type SignupMessage } from "@/lib/whatsapp-umrah/embedded-signup-flow";
import { completeEmbeddedSignupAction } from "./actions";
import waStyles from "./waConsole.module.css";

/* Meta's Embedded Signup popup (v4), per developers.facebook.com/documentation/business-messaging/whatsapp/
   embedded-signup/implementation and .../versions (read 2026-10-19): load the JS SDK, FB.login with our
   Facebook Login for Business configuration, response_type "code", and an empty extras object (v4 is chosen
   by the configuration itself). The popup posts the WABA and phone number ids to this window; FB.login's
   callback gives a code that expires in 30 seconds. Once both are in, the server finishes the connection. */

type FB = {
  init: (opts: Record<string, unknown>) => void;
  login: (cb: (r: { authResponse?: { code?: string } | null }) => void, opts: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    FB?: FB;
    fbAsyncInit?: () => void;
  }
}

const SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";

export function EmbeddedSignupButton({ agencyId, appId, configId }: { agencyId: string; appId: string; configId: string }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<{ tone: "info" | "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const code = useRef<string | null>(null);
  const finish = useRef<Extract<SignupMessage, { kind: "finish" }> | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, autoLogAppEvents: true, xfbml: false, version: "v26.0" });
      setReady(true);
    };
    if (window.FB) window.fbAsyncInit();
    else if (!document.querySelector(`script[src="${SDK_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SDK_SRC;
      s.async = true;
      s.defer = true;
      s.crossOrigin = "anonymous";
      document.body.appendChild(s);
    }

    const onMessage = (event: MessageEvent) => {
      const msg = parseSignupMessage(event.origin, event.data);
      if (!msg) return;
      if (msg.kind === "cancel") {
        setBusy(false);
        setStatus({ tone: "bad", text: `Meta setup was not finished (${msg.reason}). You can try again.` });
        return;
      }
      finish.current = msg;
      void submitIfReady();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  async function submitIfReady() {
    if (sent.current || !code.current || !finish.current) return;
    sent.current = true;
    setStatus({ tone: "info", text: "Connecting your number..." });
    const r = await completeEmbeddedSignupAction(agencyId, { code: code.current, wabaId: finish.current.wabaId, phoneNumberId: finish.current.phoneNumberId, event: finish.current.event });
    setBusy(false);
    if (r.ok) setStatus({ tone: "ok", text: `Connected${r.displayPhoneNumber ? ` ${r.displayPhoneNumber}` : ""}. Refreshing...` });
    else {
      sent.current = false;
      code.current = null;
      setStatus({ tone: "bad", text: r.error });
    }
  }

  function launch() {
    if (!window.FB) return;
    code.current = null;
    finish.current = null;
    sent.current = false;
    setBusy(true);
    setStatus(null);
    window.FB.login(
      (response) => {
        const c = response.authResponse?.code;
        if (!c) {
          setBusy(false);
          if (!finish.current) setStatus({ tone: "bad", text: "Meta setup was closed before it finished. You can try again." });
          return;
        }
        code.current = c;
        void submitIfReady();
      },
      { config_id: configId, response_type: "code", override_default_response_type: true, extras: {} },
    );
  }

  const tone = status?.tone === "ok" ? "var(--zc-done)" : status?.tone === "bad" ? "var(--zc-error-text)" : "var(--zc-muted)";
  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--zc-muted)", marginBottom: 12 }}>
        Log in with the Facebook account that manages your business, choose or create your WhatsApp Business account, and add the number your customers message. It
        takes about five minutes. After that, add a payment method in WhatsApp Manager: Meta bills WhatsApp messages to you directly.
      </p>
      <button
        type="button"
        onClick={launch}
        disabled={!ready || busy}
        className={waStyles.badgeAi}
        style={{ padding: "11px 20px", fontSize: 14, border: "1px solid var(--zc-done)", minHeight: 44, cursor: ready && !busy ? "pointer" : "not-allowed", opacity: ready && !busy ? 1 : 0.6 }}
      >
        {busy ? "Waiting for Meta..." : "Connect with Meta"}
      </button>
      {status && (
        <p role="status" style={{ fontSize: 13, marginTop: 10, color: tone }}>
          {status.text}
        </p>
      )}
    </div>
  );
}
