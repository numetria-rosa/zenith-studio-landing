"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { PrimaryButton } from "./ui";
import s from "./ask-team.module.css";

/* "Ask your team" dialog, opened from either the sidebar's own button or
   the Overview header's search bar - a small context instead of prop
   drilling since those two triggers live in different components with no
   parent/child relationship to each other. Purely a canned-answer
   demo today (SUGGESTED_ANSWERS below): real chat against this
   project's live data is a separate, larger build (would need an LLM
   call scoped to the project's own requirements/messages/integrations),
   not something to fake with placeholder copy that looks live. */

type AskTeamContextValue = { open: () => void };
const AskTeamContext = createContext<AskTeamContextValue | null>(null);

export function useAskTeam(): AskTeamContextValue {
  const ctx = useContext(AskTeamContext);
  if (!ctx) throw new Error("useAskTeam must be used inside AskYourTeamProvider");
  return ctx;
}

const SUGGESTIONS = ["What is waiting on me?", "What did my agents do today?", "How do I pause an agent?"];

export function AskYourTeamProvider({ children, projectId }: { children: ReactNode; projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AskTeamContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      {isOpen && (
        <div className={s.scrim} onClick={() => setIsOpen(false)}>
          <div className={s.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Ask your team">
            <div className={s.header}>
              <span className={s.title}>Ask your team</span>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close">
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className={s.thread}>
              <div className={s.bubbleTeam}>
                Ask anything about your agents - what&apos;s running, what needs you, or how something works. For
                anything specific to this project, use Support in the meantime; live answers here are coming soon.
              </div>
            </div>
            <div className={s.suggestions}>
              {SUGGESTIONS.map((q) => (
                <span key={q} className={s.chip}>
                  {q}
                </span>
              ))}
            </div>
            <div className={s.inputRow}>
              <input className={s.input} placeholder="Type a message... (coming soon)" disabled />
              <a href={`/services/dashboard/${projectId}?tab=support`}>
                <PrimaryButton type="button" onClick={() => setIsOpen(false)}>
                  Go to Support
                </PrimaryButton>
              </a>
            </div>
          </div>
        </div>
      )}
    </AskTeamContext.Provider>
  );
}
