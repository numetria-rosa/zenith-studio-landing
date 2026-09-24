"use client";

/* Below-the-fold sections for the insurance demo page: the 4-agent bundle,
   an interactive intake simulation (same simulated-state-machine pattern
   as /demo/ai-lead-capture-follow-up's "Simulate a new enquiry", re-themed
   for insurance), and an honesty section listing what this doesn't do -
   matches this app's established pattern of an explicit "not included"
   list on the real client-facing proposal page. Inline styles only, same
   as InsuranceHero.tsx - this route touches no global CSS. */

import Link from "next/link";
import { useState } from "react";
import { getService, getMonthlyCheckoutUrl } from "@/lib/services";

const SANS = "var(--font-geist-sans, Geist, system-ui, sans-serif)";
const MONO = "var(--font-geist-mono, 'Geist Mono', monospace)";

const VOID = "#05060A";
const MIST = "#A9AEBA";
const DIM = "#7D8392";
const FROST = "#F5F6F8";
const VIOLET = "#8B5CF6";
const MINT = "#3DDC97";

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 22,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
        padding: 32,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: MIST }}>
      {children}
    </span>
  );
}

const AGENTS = [
  {
    name: "Intake Agent",
    tag: "Live today",
    desc: "The moment someone asks for a quote, they get a real text back, not an autoresponder. Runs on your existing AI Lead Capture & Follow-Up service.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={FROST} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    name: "Document Audit",
    tag: "Built and tested",
    desc: "Paste or upload a policy document, ACORD form, or loss run. Get named insured, coverage limits, dates, and red flags back in seconds, for you to copy into your AMS.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={FROST} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M14 3v5h5" />
      </svg>
    ),
  },
  {
    name: "CRM & Logging",
    tag: "Built and tested",
    desc: "Every lead gets logged automatically, no manual data entry. Connects to your CRM through Make.com so it fits whatever system you already use.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={FROST} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </svg>
    ),
  },
  {
    name: "Renewal Reminders",
    tag: "Built and tested",
    desc: "Import your book of business once. Clients get a reminder before their policy renews, not after it lapses.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={FROST} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 10a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10z" /><path d="M10 19a2 2 0 004 0" />
      </svg>
    ),
  },
];

const STEPS = ["ENQUIRY RECEIVED", "QUALIFIED & REPLIED", "NO REPLY AFTER 2 DAYS", "FOLLOW-UP SENT", "BOOKED"] as const;

function IntakeSimulation() {
  const [step, setStep] = useState(-1);
  return (
    <GlassCard style={{ marginTop: 24 }}>
      <Caption>New quote request</Caption>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", padding: "12px 16px", fontSize: 14, color: MIST }}>
          <strong style={{ color: FROST, fontWeight: 500 }}>Marcus D.</strong> &middot; &ldquo;Hi, I need a quote for my auto policy, mine renews next month.&rdquo;
        </div>
        <button
          onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
          disabled={step >= STEPS.length - 1}
          style={{
            alignSelf: "flex-start",
            marginTop: 4,
            padding: "10px 20px",
            borderRadius: 999,
            border: "none",
            background: step >= STEPS.length - 1 ? "rgba(255,255,255,0.08)" : FROST,
            color: step >= STEPS.length - 1 ? MIST : VOID,
            fontWeight: 500,
            fontSize: 14,
            cursor: step >= STEPS.length - 1 ? "default" : "pointer",
          }}
        >
          {step < 0 ? "Simulate a new enquiry" : step >= STEPS.length - 1 ? "Sequence complete" : "Advance sequence"}
        </button>
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {STEPS.map((label, i) => (
            <span
              key={label}
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: "0.08em",
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${i <= step ? "rgba(92,200,255,0.5)" : "rgba(255,255,255,0.10)"}`,
                background: i <= step ? "rgba(92,200,255,0.10)" : "transparent",
                color: i <= step ? "#9BDDFF" : DIM,
              }}
            >
              {label}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 12, color: DIM, marginTop: 8 }}>Simulated enquiry &middot; no real message is sent here.</span>
      </div>
    </GlassCard>
  );
}

export default function InsuranceDemoClient() {
  const service = getService("insurance-ai-team");
  const checkoutUrl = service ? getMonthlyCheckoutUrl(service) : null;
  return (
    <div style={{ background: VOID, color: FROST, fontFamily: SANS }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "96px 24px" }}>
        <Caption>The bundle</Caption>
        <h2 style={{ margin: "12px 0 48px", fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em" }}>
          Four agents, one front office.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {AGENTS.map((a) => (
            <GlassCard key={a.name}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {a.icon}
              </span>
              <h3 style={{ margin: "18px 0 4px", fontSize: 18, fontWeight: 500 }}>{a.name}</h3>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: MINT, marginBottom: 12 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: MINT }} />
                {a.tag}
              </span>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: MIST }}>{a.desc}</p>
            </GlassCard>
          ))}
        </div>

        <div style={{ marginTop: 88 }}>
          <Caption>Try it</Caption>
          <h2 style={{ margin: "12px 0 8px", fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em" }}>
            See the Intake Agent respond.
          </h2>
          <p style={{ margin: 0, fontSize: 16, color: MIST, maxWidth: 640 }}>
            This mirrors the real sequence: instant reply, then up to 3 follow-ups, then it stops if there is no
            response, exactly like your existing AI Lead Capture &amp; Follow-Up service.
          </p>
          <IntakeSimulation />
        </div>

        <div style={{ marginTop: 88 }}>
          <Caption>What this doesn&apos;t do</Caption>
          <GlassCard style={{ marginTop: 16 }}>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "No direct access to Applied Epic, AMS360, EZLynx, or any other AMS - everything here sits in front of it, not inside it",
                "No autonomous quoting or binding coverage - a human always closes the sale",
                "No message goes out without your review until you turn auto-send on yourself",
              ].map((line) => (
                <li key={line} style={{ display: "flex", gap: 12, fontSize: 14, color: MIST, lineHeight: 1.6 }}>
                  <span style={{ color: DIM, flexShrink: 0 }}>&mdash;</span>
                  {line}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        <div style={{ marginTop: 88, textAlign: "center" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em" }}>
            Ready to stop losing quote requests?
          </h2>
          <p style={{ margin: "0 0 28px", fontSize: 16, color: MIST }}>Wires into what you already use. Live in 2 to 7 days.</p>
          {checkoutUrl && (
            <a
              href={checkoutUrl}
              style={{
                display: "inline-block",
                padding: "14px 32px",
                borderRadius: 999,
                background: `linear-gradient(90deg, #5CC8FF, #3B6BFF, ${VIOLET})`,
                color: VOID,
                fontWeight: 500,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Get the Insurance Account Manager Bundle
            </a>
          )}
          <div style={{ marginTop: 14 }}>
            <Link href="/" style={{ fontSize: 13, color: MIST, textDecoration: "underline" }}>
              &larr; Back to Zenith Studio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
