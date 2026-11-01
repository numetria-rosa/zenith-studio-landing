"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { QuickAnswer } from "@/lib/client-console-data";
import { Icon } from "./Icon";
import s from "./ask-team.module.css";

/* "Ask your team": everyday questions answered instantly from this project's live data (computed server-side
   in planQuickAnswers). A menu of questions grouped by what the client is after, then one answer with
   buttons that go straight to the thing. Free-text AI answers are not built yet, so the input says so
   instead of pretending. */

type AskTeamContextValue = { open: (question?: string) => void };
const AskTeamContext = createContext<AskTeamContextValue | null>(null);

export function useAskTeam(): AskTeamContextValue {
  const ctx = useContext(AskTeamContext);
  if (!ctx) throw new Error("useAskTeam must be used inside AskYourTeamProvider");
  return ctx;
}

const GROUPS: QuickAnswer["group"][] = ["Right now", "Your team", "Billing"];

export function AskYourTeamProvider({ children, answers }: { children: ReactNode; answers: QuickAnswer[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);
  const [focus, setFocus] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const answer = answers.find((a) => a.question === question) ?? null;

  const close = () => setIsOpen(false);
  function open(q?: string) {
    setQuestion(q ?? null);
    setFocus(0);
    setIsOpen(true);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (answer) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocus((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + answers.length) % answers.length);
      } else if (e.key === "Enter" && answers[focus]) {
        e.preventDefault();
        setQuestion(answers[focus]!.question);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, answer, answers, focus]);

  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen, question]);

  return (
    <AskTeamContext.Provider value={{ open }}>
      {children}
      {isOpen && (
        <div className={s.scrim} onClick={close}>
          <div className={s.dialog} ref={dialogRef} tabIndex={-1} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Ask your team">
            <header className={s.header}>
              <span className={s.logo}>
                <Icon name="message" size={22} />
              </span>
              <div className={s.titles}>
                <h2 className={s.title}>Ask your team</h2>
                <p className={s.sub}>
                  <span className={s.live}>
                    <i />
                    Live
                  </span>
                  Answers come straight from your team&apos;s data.
                </p>
              </div>
              <button type="button" className={s.esc} onClick={close} aria-label="Close">
                <kbd className={s.key}>Esc</kbd>
                <Icon name="x" size={16} />
              </button>
            </header>

            {answer ? (
              <div className={s.body} aria-live="polite">
                <button type="button" className={s.back} onClick={() => setQuestion(null)}>
                  <Icon name="arrowLeft" size={16} />
                  All questions
                </button>
                <div className={s.user}>{answer.question}</div>
                <div className={s.reply}>
                  <span className={s.spark}>
                    <Icon name="sparkle" size={18} />
                  </span>
                  <div className={s.replyBody}>
                    <p className={s.headline}>{answer.headline}</p>
                    {answer.items.length > 0 && (
                      <ul className={s.cards}>
                        {answer.items.map((it) => (
                          <li key={it.title + (it.detail ?? "")} className={s.card}>
                            <i className={`${s.dot} ${it.tone === "need" ? s.dotNeed : it.tone === "done" ? s.dotDone : s.dotRun}`} />
                            <span className={s.cardText}>
                              <b>{it.title}</b>
                              {it.detail && <small>{it.detail}</small>}
                            </span>
                            {it.action && (
                              <Link href={it.action.href} className={s.action} onClick={close}>
                                {it.action.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    <span className={s.stamp}>From live data · just now</span>
                  </div>
                </div>
                <p className={s.nextLabel}>Ask next</p>
                <div className={s.chips}>
                  {answers
                    .filter((a) => a.question !== answer.question)
                    .map((a) => (
                      <button key={a.question} type="button" className={s.chip} onClick={() => setQuestion(a.question)}>
                        {a.question}
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className={s.body}>
                {GROUPS.map((g) => {
                  const rows = answers.filter((a) => a.group === g);
                  if (!rows.length) return null;
                  return (
                    <section key={g} aria-label={g}>
                      <p className={s.group}>{g}</p>
                      {rows.map((a) => {
                        const i = answers.indexOf(a);
                        return (
                          <button key={a.question} type="button" className={`${s.row} ${i === focus ? s.rowOn : ""}`} onMouseEnter={() => setFocus(i)} onClick={() => setQuestion(a.question)}>
                            <span className={`${s.ic} ${s[`ic_${a.icon}`]}`}>
                              <Icon name={a.icon} size={19} />
                            </span>
                            <span className={s.q}>{a.question}</span>
                            {a.badge ? <span className={s.badge}>{a.badge}</span> : null}
                            <span className={s.meta}>{a.meta}</span>
                            <Icon name="arrowRight" size={17} />
                          </button>
                        );
                      })}
                    </section>
                  );
                })}
              </div>
            )}

            <footer className={s.foot}>
              <div className={s.free}>
                <Icon name="sparkle" size={18} />
                <span>Ask in your own words</span>
                <em>Coming soon</em>
              </div>
              <p className={s.keys}>
                <span>
                  <kbd className={s.key}>↑↓</kbd> move
                </span>
                <span>
                  <kbd className={s.key}>↵</kbd> ask
                </span>
                <span>
                  <kbd className={s.key}>esc</kbd> close
                </span>
              </p>
            </footer>
          </div>
        </div>
      )}
    </AskTeamContext.Provider>
  );
}
