"use client";

/* Sticky nav with scroll-spy (active link tracks the section in view) and
   a mobile hamburger menu, ported from ai-team-landing_5.html's vanilla-JS
   nav behavior. Self-contained inline styles, same as every other file in
   this route - no global CSS touched. */

import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "#demo", label: "Demo" },
  { href: "#agents", label: "Agents" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

const SECTION_IDS = ["demo", "agents", "how", "pricing", "faq", "book"];

const MIST = "#A9AEBA";
const FROST = "#F5F6F8";
const MONO = "var(--font-geist-mono, 'Geist Mono', monospace)";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
      let current = "";
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= window.scrollY + 140) current = id;
      }
      setActive(current);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function go(e: React.MouseEvent, href: string) {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "14px 24px",
        background: scrolled ? "linear-gradient(180deg, rgba(5,6,10,0.94), rgba(5,6,10,0.80))" : "rgba(5,6,10,0.6)",
        backdropFilter: "blur(18px)",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <Link href="#top" onClick={(e) => go(e, "#top")} style={{ display: "flex", alignItems: "center", gap: 10, color: FROST, textDecoration: "none", fontWeight: 600, fontSize: 17 }}>
          <svg aria-hidden="true" width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="#C7B0FF" strokeWidth="3.2" strokeLinecap="square"><path d="M16 3 L29 16 L22 23" /><path d="M16 29 L3 16 L10 9" /></svg>
          Zenith Studio
        </Link>

        <nav style={{ display: "none" }} className="ob-nav-pill">
          {/* Desktop pill nav is rendered via the wrapper below using a media query workaround (inline styles can't do @media, so this component renders both and CSS-in-JS via <style>). */}
        </nav>

        <style>{`
          .ob-desktop-nav { display: flex; }
          .ob-mobile-toggle { display: none; }
          @media (max-width: 900px) {
            .ob-desktop-nav { display: none !important; }
            .ob-mobile-toggle { display: inline-flex !important; }
          }
        `}</style>

        <div className="ob-desktop-nav" style={{ alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 5, borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}>
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => go(e, l.href)}
                style={{
                  position: "relative",
                  padding: "9px 16px",
                  borderRadius: 999,
                  fontSize: 14,
                  textDecoration: "none",
                  color: active === l.href.slice(1) ? FROST : MIST,
                  background: active === l.href.slice(1) ? "rgba(255,255,255,0.07)" : "transparent",
                }}
              >
                {l.label}
              </a>
            ))}
          </div>
          <a
            href="#book"
            onClick={(e) => go(e, "#book")}
            style={{ padding: "13px 22px", borderRadius: 999, background: FROST, color: "#05060A", fontWeight: 500, fontSize: 15, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Book a walkthrough
          </a>
        </div>

        <button
          className="ob-mobile-toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.04)", color: FROST, alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
      </div>

      {mobileOpen && (
        <div style={{ maxWidth: 1280, margin: "12px auto 0", display: "flex", flexDirection: "column", gap: 4, padding: 12, borderRadius: 22, background: "rgba(12,14,20,0.96)", border: "1px solid rgba(255,255,255,0.16)" }}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)} style={{ padding: "12px 14px", borderRadius: 14, color: FROST, textDecoration: "none", fontSize: 16 }}>
              {l.label}
            </a>
          ))}
          <a href="#book" onClick={(e) => go(e, "#book")} style={{ padding: "12px 14px", borderRadius: 14, color: FROST, textDecoration: "none", fontSize: 16, fontFamily: MONO }}>
            Book a walkthrough
          </a>
        </div>
      )}
    </header>
  );
}
