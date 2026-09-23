"use client";

/* Obsidian "Workflow graph" hero, adapted from
   halo/demo_page_design_system/WorkflowHero.tsx (1:1 layout/positions kept
   so the hand-tuned SVG wire paths still line up with the node cards -
   only copy, labels and the two stat tiles changed). Self-contained inline
   styles on purpose, same as the source file: this page must not touch
   src/app/globals.css, so it can't affect any other route on the site.
   Geist/Geist Mono are already loaded site-wide (src/app/layout.tsx) as
   --font-geist-sans/--font-geist-mono, referenced here instead of loading
   the fonts a second time. */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const NODES = [
  { left: 820, top: 110, title: "New Quote Request", subtitle: "Enquiry received", icon: "trigger" },
  { left: 1120, top: 250, title: "Qualify & Route", subtitle: "Decides the next step", icon: "router" },
  { left: 660, top: 400, title: "Intake Agent", subtitle: "Instant text + email reply", icon: "mail" },
  { left: 920, top: 400, title: "CRM Logging", subtitle: "Every lead recorded", icon: "crm" },
  { left: 1180, top: 440, title: "Document Audit", subtitle: "Policy docs summarized", icon: "doc" },
  { left: 900, top: 660, title: "Renewal Reminders", subtitle: "Tracks every deadline", icon: "bell" },
] as const;

function NodeIcon({ kind }: { kind: (typeof NODES)[number]["icon"] }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "#F5F6F8", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "trigger":
      return <svg {...common}><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>;
    case "router":
      return <svg {...common}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 010 7" /></svg>;
    case "mail":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
    case "crm":
      return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>;
    case "doc":
      return <svg {...common}><path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M14 3v5h5" /></svg>;
    case "bell":
      return <svg {...common}><path d="M6 10a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10z" /><path d="M10 19a2 2 0 004 0" /></svg>;
  }
}

export default function InsuranceHero() {
  const wrapRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / 1440));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sans = "var(--font-geist-sans, Geist, system-ui, sans-serif)";
  const mono = "var(--font-geist-mono, 'Geist Mono', monospace)";

  return (
    <section
      ref={wrapRef}
      id="top"
      aria-label="Insurance Account Manager Bundle overview"
      style={{ width: "100%", maxWidth: 1440, margin: "0 auto", aspectRatio: "1440 / 1000", overflow: "hidden", background: "#05060A" }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 1440, height: 1000 }}>
        <div style={{ width: "1440px", height: "1000px", position: "relative", overflow: "hidden", background: "#05060A", fontFamily: sans, color: "#F5F6F8" }}>
          <div style={{ position: "absolute", left: "760px", top: "60px", width: "820px", height: "820px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.38) 0%, rgba(139,92,246,0.10) 40%, rgba(5,6,10,0) 66%)" }} />
          <div style={{ position: "absolute", left: "420px", top: "620px", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,107,255,0.30) 0%, rgba(5,6,10,0) 62%)" }} />

          <svg aria-hidden="true" width="1440" height="1000" viewBox="0 0 1440 1000" fill="none" style={{ position: "absolute", left: 0, top: 0 }}>
            <defs>
              <linearGradient id="wire" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#E052F0" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <g stroke="#B77CFF" strokeWidth="7" strokeOpacity="0.22" strokeLinecap="round">
              <path d="M930 210 C930 300, 1030 310, 1030 400" />
              <path d="M1040 160 C1090 160, 1070 300, 1120 300" />
              <path d="M930 210 C930 300, 770 310, 770 400" />
              <path d="M1230 350 C1230 400, 1290 390, 1290 440" />
              <path d="M770 500 C770 590, 1010 570, 1010 660" />
              <path d="M1030 500 C1030 580, 1010 580, 1010 660" />
              <path d="M1290 540 C1290 650, 1200 710, 1120 710" />
            </g>
            <g stroke="url(#wire)" strokeWidth="2" strokeLinecap="round">
              <path d="M930 210 C930 300, 1030 310, 1030 400" />
              <path d="M1040 160 C1090 160, 1070 300, 1120 300" />
              <path d="M930 210 C930 300, 770 310, 770 400" />
              <path d="M1230 350 C1230 400, 1290 390, 1290 440" />
              <path d="M770 500 C770 590, 1010 570, 1010 660" />
              <path d="M1030 500 C1030 580, 1010 580, 1010 660" />
              <path d="M1290 540 C1290 650, 1200 710, 1120 710" />
            </g>
            <g fill="#F5F6F8">
              <circle cx="930" cy="210" r="5" /><circle cx="1040" cy="160" r="5" /><circle cx="1120" cy="300" r="5" />
              <circle cx="770" cy="400" r="5" /><circle cx="1030" cy="400" r="5" /><circle cx="1230" cy="350" r="5" />
              <circle cx="1290" cy="440" r="5" /><circle cx="770" cy="500" r="5" /><circle cx="1030" cy="500" r="5" />
              <circle cx="1290" cy="540" r="5" /><circle cx="1010" cy="660" r="5" /><circle cx="1120" cy="710" r="5" />
            </g>
            <g fill="#E052F0" fillOpacity="0.35">
              <circle cx="930" cy="210" r="10" /><circle cx="1040" cy="160" r="10" /><circle cx="1120" cy="300" r="10" />
              <circle cx="770" cy="400" r="10" /><circle cx="1030" cy="400" r="10" /><circle cx="1230" cy="350" r="10" />
              <circle cx="1290" cy="440" r="10" /><circle cx="770" cy="500" r="10" /><circle cx="1030" cy="500" r="10" />
              <circle cx="1290" cy="540" r="10" /><circle cx="1010" cy="660" r="10" /><circle cx="1120" cy="710" r="10" />
            </g>
          </svg>

          <div style={{ position: "absolute", left: "80px", top: "80px", width: "500px", display: "flex", flexDirection: "column", gap: "26px" }}>
            <Link href="/" aria-label="Home" style={{ display: "flex", alignItems: "center", gap: "10px", color: "#F5F6F8", textDecoration: "none", fontWeight: 600, fontSize: "20px", letterSpacing: "0.02em" }}>
              <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#C7B0FF" strokeWidth="3.2" strokeLinecap="square"><path d="M16 3 L29 16 L22 23" /><path d="M16 29 L3 16 L10 9" /></svg>
              Zenith Studio
            </Link>
            <h1 style={{ margin: 0, fontSize: "68px", lineHeight: 0.98, fontWeight: 600, letterSpacing: "-0.04em", textTransform: "uppercase" }}>
              Your front office, on autopilot
            </h1>
            <div style={{ width: "220px", height: "2px", background: "linear-gradient(90deg, #E052F0, #8B5CF6, rgba(139,92,246,0))" }} />
            <p style={{ margin: 0, fontSize: "19px", lineHeight: 1.5, color: "#C9CCD4" }}>
              Four agents for independent insurance agencies: instant intake, document audit, CRM logging, and renewal
              reminders. Nothing touches your AMS.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "22px", paddingTop: "8px" }}>
              {[
                { title: "Never miss a quote request", body: "Texts back the moment someone asks." },
                { title: "Policy docs, summarized", body: "Named insured, limits, red flags in seconds." },
                { title: "Every renewal tracked", body: "Reminders sent before the deadline, not after." },
              ].map((f) => (
                <div key={f.title} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span style={{ width: "44px", height: "44px", flexShrink: 0, borderRadius: "12px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C7B0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 500 }}>{f.title}</span>
                    <span style={{ fontSize: "14px", color: "#A9AEBA" }}>{f.body}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "14px", paddingTop: "10px" }}>
              <a
                href="#demo"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector("#demo")?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{ padding: "13px 24px", borderRadius: 999, background: "#F5F6F8", color: "#05060A", fontWeight: 500, fontSize: 15, textDecoration: "none" }}
              >
                See the demo
              </a>
              <a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{ padding: "13px 24px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.16)", color: "#F5F6F8", fontWeight: 500, fontSize: 15, textDecoration: "none" }}
              >
                View pricing
              </a>
            </div>
          </div>

          <div style={{ position: "absolute", left: "80px", top: "870px", display: "flex", alignItems: "center", gap: "28px", padding: "16px 26px", borderRadius: "18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}>
            {[
              { icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7B0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>, label: "No AMS access needed" },
              { icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7B0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>, label: "You approve every send" },
              { icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7B0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>, label: "Live in 2–7 days" },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "28px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#C9CCD4" }}>{item.icon}{item.label}</span>
                {i < arr.length - 1 && <span style={{ width: "1px", height: "22px", background: "rgba(255,255,255,0.14)" }} />}
              </div>
            ))}
          </div>

          {NODES.map((n) => (
            <div key={n.title} style={{ position: "absolute", left: `${n.left}px`, top: `${n.top}px`, width: "220px", height: "100px", boxSizing: "border-box", borderRadius: "20px", padding: "1px", background: "linear-gradient(160deg, rgba(255,255,255,0.5), rgba(139,92,246,0.4) 50%, rgba(255,255,255,0.08))", boxShadow: "0 20px 50px rgba(0,0,0,0.55), 0 0 30px rgba(139,92,246,0.18)" }}>
              <div style={{ width: "100%", height: "100%", boxSizing: "border-box", borderRadius: "19px", background: "rgba(18,15,34,0.92)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "5px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                  <span style={{ width: "26px", height: "26px", flexShrink: 0, borderRadius: "8px", background: "linear-gradient(135deg, #3B6BFF, #8B5CF6)", boxShadow: "0 0 14px rgba(139,92,246,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <NodeIcon kind={n.icon} />
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 500, lineHeight: 1.15 }}>{n.title}</span>
                </div>
                <span style={{ fontSize: "11px", color: "#A9AEBA", lineHeight: 1.2 }}>{n.subtitle}</span>
                <span style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "6px", padding: "1px 7px", borderRadius: "6px", background: "rgba(61,220,151,0.10)", border: "1px solid rgba(61,220,151,0.35)", color: "#7FF0BD", fontSize: "10px", lineHeight: 1.4 }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3DDC97", flexShrink: 0 }} />Active
                </span>
              </div>
            </div>
          ))}

          <div style={{ position: "absolute", left: "640px", top: "800px", width: "230px", boxSizing: "border-box", borderRadius: "18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#A9AEBA" }}>First reply</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "30px", fontWeight: 500, letterSpacing: "-0.03em" }}>Instant</span>
              <span style={{ fontSize: "12px", color: "#7FF0BD" }}>day or night</span>
            </div>
          </div>
          <div style={{ position: "absolute", left: "1170px", top: "800px", width: "210px", boxSizing: "border-box", borderRadius: "18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#A9AEBA" }}>Follow-ups before it stops</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "30px", fontWeight: 500, letterSpacing: "-0.03em" }}>3</span>
              <span style={{ fontSize: "12px", color: "#9BDDFF" }}>then it waits for you</span>
            </div>
          </div>

          <div style={{ position: "absolute", right: "60px", top: "936px", display: "flex", alignItems: "center", gap: "10px", padding: "12px 20px", borderRadius: "999px", background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.5)", boxShadow: "0 0 24px rgba(139,92,246,0.3)", fontFamily: mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#E052F0", boxShadow: "0 0 10px #E052F0" }} />Insurance account manager bundle
          </div>

          {/* Fades the hero's nebula/wire-graph into flat Void at the exact
              color InsuranceDemoClient starts with, so the fixed 1440x1000
              artwork dissolves into the scrolling page below it instead of
              cutting off at a hard rectangle edge. */}
          <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "260px", background: "linear-gradient(to bottom, rgba(5,6,10,0), #05060A 85%)", pointerEvents: "none" }} />
        </div>
      </div>
    </section>
  );
}
