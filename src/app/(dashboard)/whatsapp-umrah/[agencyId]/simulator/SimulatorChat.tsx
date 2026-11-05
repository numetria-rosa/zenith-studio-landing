"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { WaIcon } from "@/components/wa/Icon";
import { Card, GlassButton, Input, Label, PageHeader, Pill, PrimaryButton, VIOLET, cx, hhmm, isRtl } from "@/components/wa/ui";
import { simulateMessageAction, type SimulatorTurn } from "../actions";

const KIND_LABEL: Record<string, string> = { PACKAGE: "Packages", FAQ: "FAQs" };
const sourceText = (s: { kind: string; title: string }) => `${KIND_LABEL[s.kind] ?? "General info"} › ${s.title}`;

const SUGGESTIONS = [
  { lang: "EN", q: "Do you have prices for children?" },
  { lang: "AR", q: "كم سعر عمرة رمضان؟" },
  { lang: "TR", q: "Umre vizesi dahil mi?" },
  { lang: "UR", q: "کیا عمرہ ویزا شامل ہے؟" },
];

type Turn = SimulatorTurn & { time: string; handoff?: boolean };

export function SimulatorChat({ agencyId, agencyName, agentName, rail }: { agencyId: string; agencyName: string; agentName: string; rail: ReactNode }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight }), [turns, pending]);

  function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || pending) return;
    setInput("");
    setTurns((t) => [...t, { role: "customer", text, time: hhmm(new Date()) }]);
    startTransition(async () => {
      try {
        const r = await simulateMessageAction(agencyId, text);
        setTurns((t) => [...t, { role: "ai", text: r.text, language: r.language, sources: r.sources, handoff: r.action === "handoff", time: hhmm(new Date()) }]);
      } catch {
        setTurns((t) => [...t, { role: "ai", text: "Something went wrong running this test. Please try again.", sources: [], handoff: false, time: hhmm(new Date()) }]);
      }
    });
  }

  return (
    <div>
      <PageHeader
        title="Simulator"
        subtitle={`Chat with ${agentName} exactly as a customer would. Nothing here reaches WhatsApp or counts toward your reply limit.`}
        actions={<GlassButton icon="reset" onClick={() => { setTurns([]); setInput(""); }}>Reset chat</GlassButton>}
      />
      <div className="grid items-start gap-[18px]" style={{ gridTemplateColumns: "minmax(0, 1fr) 340px" }}>
        <Card className="flex h-[660px] flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,.07)] px-5 py-4">
            <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[19px] font-semibold" style={{ background: "linear-gradient(135deg, rgba(61,220,151,.3), rgba(92,200,255,.25))" }}>{agentName.charAt(0).toUpperCase()}</span>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">{agentName}</div>
              <div className="text-[12.5px] text-dim">{agencyName} · test mode</div>
            </div>
            <Pill color={VIOLET}>Not sent to WhatsApp</Pill>
          </div>

          <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto px-[22px] pb-2 pt-[22px]" aria-live="polite">
            {turns.length === 0 && !pending && <div className="m-auto text-center text-[14.5px] text-dim">Type a message below, or pick a test question.</div>}
            {turns.map((t, i) =>
              t.role === "customer" ? (
                <div key={i} className="flex justify-start">
                  <div dir={isRtl(t.text) ? "rtl" : "ltr"} className="max-w-[72%] rounded-[18px_18px_18px_6px] border border-[rgba(255,255,255,.07)] bg-bubble px-4 py-3 text-[15px] leading-[1.5]">
                    {t.text}
                    <div dir="ltr" className="mt-[6px] font-mono text-[11px] text-dim">You, as a customer · {t.time}</div>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[72%]">
                    <div dir={isRtl(t.text) ? "rtl" : "ltr"} className="whitespace-pre-wrap rounded-[18px_18px_6px_18px] border border-[rgba(61,220,151,.30)] bg-[rgba(61,220,151,.10)] px-4 py-3 text-[15px] leading-[1.5]">
                      {t.text}
                      <div dir="ltr" className="mt-[6px] font-mono text-[11px] text-mint-text opacity-80">{agentName} · AI · {t.time}</div>
                    </div>
                    <div className="mt-[6px] flex justify-end">
                      <span className={cx("inline-flex items-center gap-[6px] font-mono text-[11px] text-dim")}>
                        {t.handoff ? (
                          <>
                            <WaIcon name="userCheck" size={12} stroke="#7D8392" />
                            This chat would be handed to your team
                          </>
                        ) : t.sources && t.sources.length > 0 ? (
                          <>
                            <WaIcon name="book" size={12} stroke="#7D8392" />
                            Answered from {t.sources.map(sourceText).join(" · ")}
                          </>
                        ) : (
                          `${agentName} didn't use the knowledge base for this reply`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ),
            )}
            {pending && (
              <div className="flex justify-end">
                <div className="rounded-[18px_18px_6px_18px] border border-[rgba(61,220,151,.30)] bg-[rgba(61,220,151,.10)] px-4 py-3 text-[15px] text-dim">{agentName} is typing…</div>
              </div>
            )}
          </div>

          <div className="px-5 pt-3">
            <Label className="mb-2 block text-[10.5px]">Try a test question</Label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <GlassButton key={s.lang} onClick={() => setInput(s.q)} className="h-[34px] gap-2 pl-2 pr-3 text-[13.5px]">
                  <span className="rounded-md bg-[rgba(255,255,255,.07)] px-[6px] py-[2px] font-mono text-[10.5px] text-mist">{s.lang}</span>
                  <span dir={isRtl(s.q) ? "rtl" : "ltr"}>{s.q}</span>
                </GlassButton>
              ))}
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-[10px] px-5 pb-[18px] pt-[14px]">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about a package, in any of your languages…" aria-label="Test message" className="h-[50px] rounded-full px-5" />
            <PrimaryButton type="submit" aria-label="Send" disabled={pending} className="h-[50px] w-[50px] p-0"><WaIcon name="send" size={19} stroke="#05060A" strokeWidth={2} /></PrimaryButton>
          </form>
        </Card>
        <div className="flex min-w-0 flex-col gap-[18px]">{rail}</div>
      </div>
    </div>
  );
}
