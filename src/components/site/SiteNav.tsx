"use client";

import Link from "next/link";
import { Link as LocaleLink } from "@/i18n/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandMark } from "./BrandMark";

export type SiteNavLink = { href: string; label: string; active?: boolean };

/* The site navbar, modelled on the /services page: a sticky blurred bar, brand left,
   a pill of links in the middle, one white call-to-action on the right, and a dropdown
   menu on small screens. Every marketing page uses this so the bar never drifts. */
export function SiteNav({
  brand = "studio",
  links,
  cta,
  extra,
  signIn,
}: {
  brand?: "studio" | "lab";
  links: SiteNavLink[];
  cta: { href: string; label: string; external?: boolean; localized?: boolean };
  /** Shown before the CTA on wide screens (for example the language switcher). */
  extra?: ReactNode;
  signIn?: { href: string; label: string };
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const CtaLink = cta.localized ? LocaleLink : cta.external ? "a" : Link;
  const ctaProps = cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <header className={`sticky top-0 z-50 border-b bg-gradient-to-b from-[#05060a]/95 to-[#05060a]/80 py-3.5 backdrop-blur-[18px] transition-colors ${scrolled ? "border-white/10" : "border-transparent"}`}>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <BrandMark brand={brand} />

          <nav aria-label="Main" className="hidden items-center gap-0.5 rounded-full border border-white/[0.14] bg-white/5 p-[5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] lg:flex">
            {links.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                aria-current={l.active ? "page" : undefined}
                className={`relative whitespace-nowrap rounded-full px-3 py-[9px] text-[14px] no-underline transition-colors xl:px-4 ${l.active ? "bg-white/[0.07] text-[#F5F6F8]" : "text-[#A9AEBA] hover:text-[#F5F6F8]"}`}
              >
                {l.label}
                {l.active && <span className="absolute bottom-[3px] left-1/2 -ml-2 h-0.5 w-4 rounded-sm bg-[#5CC8FF] shadow-[0_0_10px_#5CC8FF]" />}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            {extra && <div className="hidden sm:block">{extra}</div>}
            {signIn && (
              <Link href={signIn.href} className="hidden text-sm text-[#A9AEBA] no-underline transition-colors hover:text-[#F5F6F8] xl:inline">
                {signIn.label}
              </Link>
            )}
            <CtaLink
              href={cta.href}
              {...ctaProps}
              className="hidden min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-[#F5F6F8] px-[18px] text-[14px] font-medium text-[#05060A] no-underline transition hover:shadow-[0_0_30px_rgba(166,225,255,0.45)] sm:inline-flex"
            >
              {cta.label}
            </CtaLink>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.16] bg-white/[0.04] text-[#F5F6F8] lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <nav id="site-menu" aria-label="Menu" className="mt-3 flex flex-col gap-1 rounded-[22px] border border-white/[0.16] bg-[#0c0e14]/95 p-3 lg:hidden">
            {links.map((l) => (
              <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)} className={`rounded-xl px-4 py-3 text-[15px] no-underline ${l.active ? "bg-white/[0.07] text-[#F5F6F8]" : "text-[#A9AEBA]"}`}>
                {l.label}
              </Link>
            ))}
            {signIn && (
              <Link href={signIn.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-[15px] text-[#A9AEBA] no-underline">
                {signIn.label}
              </Link>
            )}
            {extra && <div className="px-2 py-2 sm:hidden">{extra}</div>}
            <CtaLink href={cta.href} {...ctaProps} onClick={() => setOpen(false)} className="mt-1 inline-flex min-h-11 items-center justify-center rounded-full bg-[#F5F6F8] px-5 text-[15px] font-medium text-[#05060A] no-underline">
              {cta.label}
            </CtaLink>
          </nav>
        )}
      </div>
    </header>
  );
}
