"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { QuickAnswer } from "@/lib/client-console-data";
import { Icon } from "./Icon";
import s from "./ask-team.module.css";

/* "Ask your team": everyday questions answered instantly from this
   project's live data (computed server-side in planQuickAnswers). Free-text
   AI answers are not built yet, so the input says so instead of pretending. */

type AskTeamContextValue = { open: (question?: string) => void };
const AskTeamContext = createContext<AskTeamContextValue | null>(null);

export function useAskTeam(): AskTeamContextValue {
  const ctx = useContext(AskTeamContext);
  if (!ctx) throw new Error("useAskTeam must be used inside AskYourTeamProvider");
  return ctx;
}

export function AskYourTeamProvider({ children, answers }: { children: ReactNode; answers: QuickAnswer[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [asked, setAsked] = useState<string[]>([]);
  const threadRef = useRef<HTMLDivElement>(null);

  function ask(question: string) {
    setAsked((prev) => [...prev.filter((q) => q !== question), question]);
  }

  function open(question?: string) {
    setIsOpen(true);
    if (question) ask(question);
  }

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [asked]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <AskTeamContext.Provider value={{ open }}>
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
            <div className={s.thread} ref={threadRef} aria-live="polite">
              <div className={s.bubbleTeam}>Pick a question below. Answers come straight from your team&apos;s live data.</div>
              {asked.map((q) => {
                const a = answers.find((x) => x.question === q);
                if (!a) return null;
                return (
                  <div key={q} className={s.exchange}>
                    <div className={s.bubbleUser}>{q}</div>
                    <div className={s.bubbleTeam}>
                      {a.answer.length === 1 ? (
                        a.answer[0]
                      ) : (
                        <ul className={s.answerList}>
                          {a.answer.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={s.suggestions}>
              {answers.map((a) => (
                <button key={a.question} type="button" className={s.chip} onClick={() => ask(a.question)}>
                  {a.question}
                </button>
              ))}
            </div>
            <div className={s.inputRow}>
              <input className={s.input} placeholder="Ask in your own words: coming soon" disabled aria-label="Custom questions coming soon" />
            </div>
          </div>
        </div>
      )}
    </AskTeamContext.Provider>
  );
}
