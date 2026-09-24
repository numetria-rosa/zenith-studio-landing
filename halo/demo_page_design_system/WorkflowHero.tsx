// WorkflowHero.tsx — Obsidian "Workflow graph" hero, 1:1 with the canvas artboard (1440x1000).
// Fonts: load Geist + Geist Mono (see note at bottom). Tailwind not required.
"use client";

import { useEffect, useRef, useState } from "react";

export default function WorkflowHero() {
  // Scale-to-fit: renders the 1440x1000 design pixel-identical, scaled down to the container width.
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

  return (
    <section
      ref={wrapRef}
      aria-label="Hero"
      style={{ width: "100%", maxWidth: 1440, margin: "0 auto", aspectRatio: "1440 / 1000", overflow: "hidden", background: "#05060A" }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 1440, height: 1000 }}>
      <div style={{ width: '1440px', height: '1000px', position: 'relative', overflow: 'hidden', background: '#05060A', fontFamily: "'Geist', system-ui, sans-serif", color: '#F5F6F8' }}>

      <div style={{ position: 'absolute', left: '760px', top: '60px', width: '820px', height: '820px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.38) 0%, rgba(139,92,246,0.10) 40%, rgba(5,6,10,0) 66%)' }}></div>
      <div style={{ position: 'absolute', left: '420px', top: '620px', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,107,255,0.30) 0%, rgba(5,6,10,0) 62%)' }}></div>

      <svg aria-hidden="true" width="1440" height="1000" viewBox="0 0 1440 1000" fill="none" style={{ position: 'absolute', left: '0px', top: '0px' }}>
      <defs>
      <linearGradient id="wire" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#E052F0"></stop>
      <stop offset="1" stopColor="#8B5CF6"></stop>
      </linearGradient>
      </defs>
      <g stroke="#B77CFF" strokeWidth="7" strokeOpacity="0.22" strokeLinecap="round">
      <path d="M930 210 C930 300, 1030 310, 1030 400"></path>
      <path d="M1040 160 C1090 160, 1070 300, 1120 300"></path>
      <path d="M930 210 C930 300, 770 310, 770 400"></path>
      <path d="M1230 350 C1230 400, 1290 390, 1290 440"></path>
      <path d="M770 500 C770 590, 1010 570, 1010 660"></path>
      <path d="M1030 500 C1030 580, 1010 580, 1010 660"></path>
      <path d="M1290 540 C1290 650, 1200 710, 1120 710"></path>
      </g>
      <g stroke="url(#wire)" strokeWidth="2" strokeLinecap="round">
      <path d="M930 210 C930 300, 1030 310, 1030 400"></path>
      <path d="M1040 160 C1090 160, 1070 300, 1120 300"></path>
      <path d="M930 210 C930 300, 770 310, 770 400"></path>
      <path d="M1230 350 C1230 400, 1290 390, 1290 440"></path>
      <path d="M770 500 C770 590, 1010 570, 1010 660"></path>
      <path d="M1030 500 C1030 580, 1010 580, 1010 660"></path>
      <path d="M1290 540 C1290 650, 1200 710, 1120 710"></path>
      </g>
      <g fill="#F5F6F8">
      <circle cx="930" cy="210" r="5"></circle><circle cx="1040" cy="160" r="5"></circle><circle cx="1120" cy="300" r="5"></circle>
      <circle cx="770" cy="400" r="5"></circle><circle cx="1030" cy="400" r="5"></circle><circle cx="1230" cy="350" r="5"></circle>
      <circle cx="1290" cy="440" r="5"></circle><circle cx="770" cy="500" r="5"></circle><circle cx="1030" cy="500" r="5"></circle>
      <circle cx="1290" cy="540" r="5"></circle><circle cx="1010" cy="660" r="5"></circle><circle cx="1120" cy="710" r="5"></circle>
      </g>
      <g fill="#E052F0" fillOpacity="0.35">
      <circle cx="930" cy="210" r="10"></circle><circle cx="1040" cy="160" r="10"></circle><circle cx="1120" cy="300" r="10"></circle>
      <circle cx="770" cy="400" r="10"></circle><circle cx="1030" cy="400" r="10"></circle><circle cx="1230" cy="350" r="10"></circle>
      <circle cx="1290" cy="440" r="10"></circle><circle cx="770" cy="500" r="10"></circle><circle cx="1030" cy="500" r="10"></circle>
      <circle cx="1290" cy="540" r="10"></circle><circle cx="1010" cy="660" r="10"></circle><circle cx="1120" cy="710" r="10"></circle>
      </g>
      </svg>

      <div style={{ position: 'absolute', left: '80px', top: '80px', width: '500px', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      <a href="#" aria-label="Home" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F5F6F8', textDecoration: 'none', fontWeight: '600', fontSize: '20px', letterSpacing: '0.02em' }}>
      <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#C7B0FF" strokeWidth="3.2" strokeLinecap="square"><path d="M16 3 L29 16 L22 23"></path><path d="M16 29 L3 16 L10 9"></path></svg>
      [BRAND] AI
      </a>
      <h1 style={{ margin: '0px', fontSize: '76px', lineHeight: '0.96', fontWeight: '600', letterSpacing: '-0.045em', textTransform: 'uppercase' }}>Automate your workflow</h1>
      <div style={{ width: '220px', height: '2px', background: 'linear-gradient(90deg, #E052F0, #8B5CF6, rgba(139,92,246,0))' }}></div>
      <p style={{ margin: '0px', fontSize: '19px', lineHeight: '1.5', color: '#C9CCD4' }}>Connect tasks, teams and tools with automation that routes itself.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingTop: '8px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
      <span style={{ width: '44px', height: '44px', flexShrink: '0', borderRadius: '12px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C7B0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"></path></svg></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '16px', fontWeight: '500' }}>Smart automation</span><span style={{ fontSize: '14px', color: '#A9AEBA' }}>Workflows that decide the next step.</span></div>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
      <span style={{ width: '44px', height: '44px', flexShrink: '0', borderRadius: '12px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C7B0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"></path><path d="M16 4.5a3.5 3.5 0 010 7"></path><path d="M18 14.8c2.2.6 3.5 2.4 3.5 5.2"></path></svg></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '16px', fontWeight: '500' }}>Unified connections</span><span style={{ fontSize: '14px', color: '#A9AEBA' }}>Your apps, teams and data in one graph.</span></div>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
      <span style={{ width: '44px', height: '44px', flexShrink: '0', borderRadius: '12px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C7B0FF" strokeWidth="1.8" strokeLinecap="round"><path d="M5 20V12"></path><path d="M12 20V6"></path><path d="M19 20v-9"></path></svg></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '16px', fontWeight: '500' }}>Real-time insights</span><span style={{ fontSize: '14px', color: '#A9AEBA' }}>Live analytics on every run.</span></div>
      </div>
      </div>
      </div>

      <div style={{ position: 'absolute', left: '80px', top: '870px', display: 'flex', alignItems: 'center', gap: '28px', padding: '16px 26px', borderRadius: '18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#C9CCD4' }}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7B0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7l-5 5 5 5"></path><path d="M16 7l5 5-5 5"></path></svg>No-code builder</span>
      <span style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.14)' }}></span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#C9CCD4' }}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7B0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 018 0v3"></path></svg>Secure</span>
      <span style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.14)' }}></span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#C9CCD4' }}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7B0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="6" rx="7" ry="3"></ellipse><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"></path><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"></path></svg>Scalable</span>
      </div>

      <div style={{ position: 'absolute', left: '820px', top: '110px', width: '220px', height: '100px', boxSizing: 'border-box', borderRadius: '20px', padding: '1px', background: 'linear-gradient(160deg, rgba(255,255,255,0.5), rgba(139,92,246,0.4) 50%, rgba(255,255,255,0.08))', boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 30px rgba(139,92,246,0.18)' }}>
      <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: '19px', background: 'rgba(18,15,34,0.92)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #3B6BFF, #8B5CF6)', boxShadow: '0 0 14px rgba(139,92,246,0.6)' }}></span>
      <span style={{ fontSize: '16px', fontWeight: '500' }}>Trigger</span>
      </div>
      <span style={{ fontSize: '12px', color: '#A9AEBA' }}>New event scheduled</span>
      <span style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(61,220,151,0.10)', border: '1px solid rgba(61,220,151,0.35)', color: '#7FF0BD', fontSize: '11px' }}><span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3DDC97' }}></span>Active</span>
      </div>
      </div>
      <div style={{ position: 'absolute', left: '1120px', top: '250px', width: '220px', height: '100px', boxSizing: 'border-box', borderRadius: '20px', padding: '1px', background: 'linear-gradient(160deg, rgba(255,255,255,0.5), rgba(139,92,246,0.4) 50%, rgba(255,255,255,0.08))', boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 30px rgba(139,92,246,0.18)' }}>
      <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: '19px', background: 'rgba(18,15,34,0.92)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #3B6BFF, #8B5CF6)', boxShadow: '0 0 14px rgba(139,92,246,0.6)' }}></span>
      <span style={{ fontSize: '16px', fontWeight: '500' }}>AI Router</span>
      </div>
      <span style={{ fontSize: '12px', color: '#A9AEBA' }}>Analyze, route, optimize</span>
      <span style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(61,220,151,0.10)', border: '1px solid rgba(61,220,151,0.35)', color: '#7FF0BD', fontSize: '11px' }}><span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3DDC97' }}></span>Active</span>
      </div>
      </div>
      <div style={{ position: 'absolute', left: '660px', top: '400px', width: '220px', height: '100px', boxSizing: 'border-box', borderRadius: '20px', padding: '1px', background: 'linear-gradient(160deg, rgba(255,255,255,0.5), rgba(139,92,246,0.4) 50%, rgba(255,255,255,0.08))', boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 30px rgba(139,92,246,0.18)' }}>
      <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: '19px', background: 'rgba(18,15,34,0.92)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #3B6BFF, #8B5CF6)', boxShadow: '0 0 14px rgba(139,92,246,0.6)' }}></span>
      <span style={{ fontSize: '16px', fontWeight: '500' }}>Email</span>
      </div>
      <span style={{ fontSize: '12px', color: '#A9AEBA' }}>Send and manage messages</span>
      <span style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(61,220,151,0.10)', border: '1px solid rgba(61,220,151,0.35)', color: '#7FF0BD', fontSize: '11px' }}><span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3DDC97' }}></span>Active</span>
      </div>
      </div>
      <div style={{ position: 'absolute', left: '920px', top: '400px', width: '220px', height: '100px', boxSizing: 'border-box', borderRadius: '20px', padding: '1px', background: 'linear-gradient(160deg, rgba(255,255,255,0.5), rgba(139,92,246,0.4) 50%, rgba(255,255,255,0.08))', boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 30px rgba(139,92,246,0.18)' }}>
      <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: '19px', background: 'rgba(18,15,34,0.92)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #3B6BFF, #8B5CF6)', boxShadow: '0 0 14px rgba(139,92,246,0.6)' }}></span>
      <span style={{ fontSize: '16px', fontWeight: '500' }}>CRM</span>
      </div>
      <span style={{ fontSize: '12px', color: '#A9AEBA' }}>Leads and customers</span>
      <span style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(61,220,151,0.10)', border: '1px solid rgba(61,220,151,0.35)', color: '#7FF0BD', fontSize: '11px' }}><span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3DDC97' }}></span>Active</span>
      </div>
      </div>
      <div style={{ position: 'absolute', left: '1180px', top: '440px', width: '220px', height: '100px', boxSizing: 'border-box', borderRadius: '20px', padding: '1px', background: 'linear-gradient(160deg, rgba(255,255,255,0.5), rgba(139,92,246,0.4) 50%, rgba(255,255,255,0.08))', boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 30px rgba(139,92,246,0.18)' }}>
      <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: '19px', background: 'rgba(18,15,34,0.92)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #3B6BFF, #8B5CF6)', boxShadow: '0 0 14px rgba(139,92,246,0.6)' }}></span>
      <span style={{ fontSize: '16px', fontWeight: '500' }}>Tasks</span>
      </div>
      <span style={{ fontSize: '12px', color: '#A9AEBA' }}>Track work and progress</span>
      <span style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(61,220,151,0.10)', border: '1px solid rgba(61,220,151,0.35)', color: '#7FF0BD', fontSize: '11px' }}><span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3DDC97' }}></span>Active</span>
      </div>
      </div>
      <div style={{ position: 'absolute', left: '900px', top: '660px', width: '220px', height: '100px', boxSizing: 'border-box', borderRadius: '20px', padding: '1px', background: 'linear-gradient(160deg, rgba(255,255,255,0.5), rgba(139,92,246,0.4) 50%, rgba(255,255,255,0.08))', boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 30px rgba(139,92,246,0.18)' }}>
      <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: '19px', background: 'rgba(18,15,34,0.92)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #3B6BFF, #8B5CF6)', boxShadow: '0 0 14px rgba(139,92,246,0.6)' }}></span>
      <span style={{ fontSize: '16px', fontWeight: '500' }}>Analytics</span>
      </div>
      <span style={{ fontSize: '12px', color: '#A9AEBA' }}>Measure performance</span>
      <span style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(61,220,151,0.10)', border: '1px solid rgba(61,220,151,0.35)', color: '#7FF0BD', fontSize: '11px' }}><span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3DDC97' }}></span>Active</span>
      </div>
      </div>

      <div style={{ position: 'absolute', left: '640px', top: '800px', width: '230px', boxSizing: 'border-box', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '12px', color: '#A9AEBA' }}>Tasks completed</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}><span style={{ fontSize: '30px', fontWeight: '500', letterSpacing: '-0.03em' }}>[0,000]</span><span style={{ fontSize: '12px', color: '#7FF0BD' }}>+[00]%</span></div>
      <svg aria-hidden="true" width="190" height="30" viewBox="0 0 190 30" fill="none"><path d="M0 24 C20 22, 30 10, 50 14 S80 26, 100 16 S140 4, 160 10 S180 6, 190 2" stroke="#C7B0FF" strokeWidth="2" strokeLinecap="round"></path></svg>
      </div>
      <div style={{ position: 'absolute', left: '1170px', top: '800px', width: '210px', boxSizing: 'border-box', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '12px', color: '#A9AEBA' }}>Team efficiency</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}><span style={{ fontSize: '30px', fontWeight: '500', letterSpacing: '-0.03em' }}>[00]%</span><span style={{ fontSize: '12px', color: '#7FF0BD' }}>+[00]%</span></div>
      <svg aria-hidden="true" width="170" height="30" viewBox="0 0 170 30" fill="none"><path d="M0 20 C20 26, 40 8, 60 14 S100 24, 120 12 S150 4, 170 6" stroke="#9BDDFF" strokeWidth="2" strokeLinecap="round"></path></svg>
      </div>

      <div style={{ position: 'absolute', right: '60px', top: '936px', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: '999px', background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.5)', boxShadow: '0 0 24px rgba(139,92,246,0.3)', fontFamily: "'Geist Mono', monospace", fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E052F0', boxShadow: '0 0 10px #E052F0' }}></span>AI workflow platform
      </div>
      </div>
      </div>
    </section>
  );
}

/* Fonts (Next.js app router), in app/layout.tsx:
   import { Geist, Geist_Mono } from "next/font/google";
   const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
   const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
   <body className={`${geist.className} ${geistMono.variable}`}>
   The component references the families by name ('Geist', 'Geist Mono'). With next/font the real
   family names are hashed, so either keep the Google Fonts <link> from workflow-hero.html in your
   <head>, or replace 'Geist' with var(--font-geist) and 'Geist Mono' with var(--font-geist-mono). */
