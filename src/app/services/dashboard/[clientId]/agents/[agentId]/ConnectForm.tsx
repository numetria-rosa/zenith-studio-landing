"use client";

import { useState } from "react";
import u from "../../ui.module.css";
import s from "./agent.module.css";

export function CopyField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className={s.formRow}>
      <label className={s.label}>{label}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        {multiline ? (
          <textarea readOnly value={value} rows={7} className={s.textarea} style={{ fontFamily: "var(--zc-mono)", fontSize: 12, flex: 1 }} />
        ) : (
          <input readOnly value={value} className={s.input} style={{ fontFamily: "var(--zc-mono)", fontSize: 13, flex: 1 }} />
        )}
        <button type="button" onClick={copy} className={u.btnGhost} aria-live="polite">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/** Posts a real lead to the client's own capture address, so they can see
    the instant reply arrive on their phone. */
export function TestLeadForm({ endpoint }: { endpoint: string }) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Test lead", phone, message: "This is a test from my dashboard." }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) setState("sent");
      else {
        setError(body.error ?? "Something went wrong.");
        setState("error");
      }
    } catch {
      setError("Couldn't reach the server.");
      setState("error");
    }
  }

  return (
    <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label className={s.label} htmlFor="testPhone">
        Send yourself a test lead
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          id="testPhone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Your mobile, e.g. 615 555 0142"
          className={s.input}
          style={{ flex: 1 }}
        />
        <button type="submit" className={u.btnPrimary} disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send test"}
        </button>
      </div>
      {state === "sent" && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--zc-done-text)" }}>
          Sent. Your phone should get the instant reply within a few seconds, and the lead now shows in Recent runs after a refresh.
        </p>
      )}
      {state === "error" && <p className={s.errorBox}>Couldn&apos;t send the test: {error}</p>}
    </form>
  );
}
