"use client";

import { useState } from "react";
import Vapi from "@vapi-ai/web";

type CallState = "idle" | "connecting" | "active" | "ended" | "error";

export default function DemoCallButton({ assistant }: { assistant: Record<string, unknown> }) {
  const [state, setState] = useState<CallState>("idle");

  async function startCall() {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      setState("error");
      return;
    }
    setState("connecting");
    const vapi = new Vapi(publicKey);
    vapi.on("call-start", () => setState("active"));
    vapi.on("call-end", () => setState("ended"));
    vapi.on("error", () => setState("error"));
    await vapi.start(assistant as never);
  }

  const label: Record<CallState, string> = {
    idle: "Talk to it now",
    connecting: "Connecting...",
    active: "On the call...",
    ended: "Call ended, talk again",
    error: "Something went wrong, refresh and try again",
  };

  return (
    <button
      onClick={startCall}
      disabled={state === "connecting" || state === "active"}
      className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {label[state]}
    </button>
  );
}
