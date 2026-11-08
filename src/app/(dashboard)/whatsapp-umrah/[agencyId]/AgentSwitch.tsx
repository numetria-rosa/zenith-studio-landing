"use client";

import { useState, useTransition } from "react";
import { setAgentPausedAction } from "./actions";
import { GlassButton, PrimaryButton } from "@/components/wa/ui";

/* The agent's on/off switch on the Overview page. Pausing keeps saving customer messages and alerts the team, but
   nothing is sent automatically until it is resumed. */
export function AgentSwitch({ agencyId, agentName, paused, since }: { agencyId: string; agentName: string; paused: boolean; since: string | null }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const flip = () =>
    start(async () => {
      setError("");
      try {
        await setAgentPausedAction(agencyId, !paused);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });

  return (
    <div className="mb-[18px] flex flex-wrap items-center gap-4 rounded-[22px] border px-[22px] py-4" style={{ borderColor: paused ? "rgba(255,210,122,.4)" : "rgba(255,255,255,.08)", background: paused ? "rgba(255,210,122,.07)" : "rgba(255,255,255,.025)" }}>
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-semibold">{paused ? `${agentName} is paused` : `${agentName} is on`}</div>
        <div className="mt-1 text-[13.5px] text-soft">
          {paused
            ? `Customers get no automatic replies${since ? ` (since ${since})` : ""}. Their messages are still saved here and your team is alerted, so someone can answer them.`
            : `Replying to customers on WhatsApp. Pause ${agentName} any time and your team answers instead.`}
        </div>
        {error && <div role="alert" className="mt-1 text-[13px] text-ember-text">{error}</div>}
      </div>
      {paused ? (
        <PrimaryButton onClick={flip} disabled={pending} icon="bolt">{pending ? "Resuming..." : `Resume ${agentName}`}</PrimaryButton>
      ) : (
        <GlassButton onClick={flip} disabled={pending} icon="pause">{pending ? "Pausing..." : `Pause ${agentName}`}</GlassButton>
      )}
    </div>
  );
}
