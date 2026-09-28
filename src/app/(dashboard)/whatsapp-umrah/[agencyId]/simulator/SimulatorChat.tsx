"use client";

import { useState, useTransition } from "react";
import { simulateMessageAction, type SimulatorTurn } from "../actions";
import waStyles from "../waConsole.module.css";

export function SimulatorChat({ agencyId }: { agencyId: string }) {
  const [turns, setTurns] = useState<SimulatorTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();

  function send() {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    setTurns((t) => [...t, { role: "customer", text }]);
    startTransition(async () => {
      const result = await simulateMessageAction(agencyId, text);
      setTurns((t) => [
        ...t,
        { role: "ai", text: result.text, language: result.language, guardsTriggered: result.action === "handoff" ? [...result.guardsTriggered, "handoff"] : result.guardsTriggered },
      ]);
    });
  }

  return (
    <div className={waStyles.chatWrap}>
      <div className={waStyles.chatMessages}>
        {turns.length === 0 && <p style={{ color: "var(--zc-dim)", fontSize: 13, textAlign: "center", marginTop: 20 }}>Type a message below, exactly as a customer would.</p>}
        {turns.map((t, i) => (
          <div key={i} className={`${waStyles.bubble} ${t.role === "customer" ? waStyles.bubbleUser : waStyles.bubbleAi}`}>
            {t.text}
            {t.role === "ai" && (t.language || t.guardsTriggered?.length) ? (
              <div className={waStyles.bubbleMeta}>
                {t.language}
                {t.guardsTriggered && t.guardsTriggered.length > 0 ? ` · ${t.guardsTriggered.join(", ")}` : ""}
              </div>
            ) : null}
          </div>
        ))}
        {pending && <div className={`${waStyles.bubble} ${waStyles.bubbleAi}`} style={{ color: "var(--zc-dim)" }}>Thinking…</div>}
      </div>
      <div className={waStyles.chatComposer}>
        <input
          className={waStyles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about a package, in any of your enabled languages…"
          disabled={pending}
        />
        <button onClick={send} disabled={pending} className={waStyles.badgeAi} style={{ padding: "0 18px", border: "1px solid var(--zc-done)", flexShrink: 0 }}>
          Send
        </button>
      </div>
    </div>
  );
}
