"use client";

import Link from "next/link";
import { Link as LocaleLink } from "@/i18n/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrandMark } from "./BrandMark";

export type SiteNavChild = { href: string; label: string };
/** `children` turns a link into a dropdown: clicking the label still goes to `href`, the arrow opens the extra pages. */
export type SiteNavLink = { href: string; label: string; active?: boolean; children?: SiteNavChild[] };

const hashId = (href: string) => (href.startsWith("#") ? href.slice(1) : null);

/* The site navbar, modelled on the /services page: a sticky blurred bar, brand left,
   a pill of links in the middle that highlights the section you are reading, one white
   call-to-action on the right, and a dropdown menu on small screens. Every marketing
   page uses this so the bar never drifts. */
export function SiteNav({
  brand = "studio",
  links,
  cta,
  extra,
  signIn,
}: {
  brand?: "studio" | "lab";
  links: SiteNavLink[];
  cta: { href: string; label: string; external?: boolean; localized?: boolean; plain?: boolean };
  /** Shown before the CTA on wide screens (for example the language switcher). */
  extra?: ReactNode;
  /** Signed-out label and link. Signed-in visitors see a link to their account instead. */
  signIn?: { href: string; label: string };
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const pillRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ids = links.map((l) => hashId(l.href)).filter((id): id is string => !!id);
    const update = () => {
      setScrolled(window.scrollY > 8);
      // The section being read is the last one whose top has passed just under the bar.
      // At the very bottom a short last section can never reach the bar, so treat it as read.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const y = atBottom ? Infinity : window.scrollY + 140;
      let best: { id: string; top: number } | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        // offsetTop is relative to the nearest positioned ancestor, so measure against the page instead.
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= y && (!best || top > best.top)) best = { id, top };
      }
      setCurrent(best?.id ?? null);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [links]);

  useEffect(() => {
    if (!signIn) return;
    let live = true;
    fetch("/api/auth/session", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setSignedIn(Boolean(d?.user)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [signIn]);

  useEffect(() => {
    if (!menuFor) return;
    const close = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) setMenuFor(null);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenuFor(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menuFor]);

  const account = signIn ? (signedIn ? { href: "/account", label: "My account" } : signIn) : null;
  const isActive = (l: SiteNavLink) => l.active || (hashId(l.href) !== null && hashId(l.href) === current);

  const CtaLink = cta.localized ? LocaleLink : cta.external || cta.plain ? "a" : Link;
  const ctaProps = cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const linkClass = (active: boolean) =>
    `relative whitespace-nowrap rounded-full px-3 py-[9px] text-[14px] no-underline transition-colors xl:px-4 ${active ? "bg-white/[0.07] text-[#F5F6F8]" : "text-[#A9AEBA] hover:text-[#F5F6F8]"}`;
  const underline = <span className="absolute bottom-[3px] left-1/2 -ml-2 h-0.5 w-4 rounded-sm bg-[#5CC8FF] shadow-[0_0_10px_#5CC8FF]" />;

  return (
    <header className="sticky top-0 z-50 py-3.5">
      {/* Backdrop: a blurred veil that fades out below the bar, so it never shows as a band over glows or images. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 -bottom-7 top-0 backdrop-blur-[18px] transition-colors [mask-image:linear-gradient(to_bottom,#000_62%,transparent)] ${scrolled ? "bg-gradient-to-b from-[#05060a]/95 to-[#05060a]/60" : "bg-gradient-to-b from-[#05060a]/85 to-[#05060a]/30"}`}
      />
      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <BrandMark brand={brand} />

          <nav ref={pillRef} aria-label="Main" className="hidden items-center gap-0.5 rounded-full border border-white/[0.14] bg-white/5 p-[5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] lg:flex">
            {links.map((l) => {
              const active = isActive(l);
              if (!l.children) {
                return (
                  <Link key={l.href + l.label} href={l.href} aria-current={active ? "location" : undefined} className={linkClass(active)}>
                    {l.label}
                    {active && underline}
                  </Link>
                );
              }
              const key = l.href + l.label;
              return (
                <div key={key} className="relative flex items-center">
                  <Link href={l.href} aria-current={active ? "location" : undefined} className={`${linkClass(active)} !pr-1.5`} onClick={() => setMenuFor(null)}>
                    {l.label}
                    {active && underline}
                  </Link>
                  <button
                    type="button"
                    aria-label={`${l.label} menu`}
                    aria-expanded={menuFor === key}
                    onClick={() => setMenuFor(menuFor === key ? null : key)}
                    className="-ml-1 mr-0.5 flex h-8 w-7 items-center justify-center rounded-full text-[#A9AEBA] transition-colors hover:text-[#F5F6F8]"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform ${menuFor === key ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {menuFor === key && (
                    <div className="absolute left-0 top-[calc(100%+10px)] z-10 min-w-[180px] rounded-2xl border border-white/[0.16] bg-[#0c0e14]/95 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                      {l.children.map((c) => (
                        <Link key={c.href} href={c.href} onClick={() => setMenuFor(null)} className="block rounded-xl px-4 py-2.5 text-[14px] text-[#A9AEBA] no-underline transition-colors hover:bg-white/[0.07] hover:text-[#F5F6F8]">
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            {extra && <div className="hidden sm:block">{extra}</div>}
            {account && (
              <Link href={account.href} className="hidden text-sm text-[#A9AEBA] no-underline transition-colors hover:text-[#F5F6F8] xl:inline">
                {account.label}
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
            {links.flatMap((l) => [
              <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)} className={`rounded-xl px-4 py-3 text-[15px] no-underline ${isActive(l) ? "bg-white/[0.07] text-[#F5F6F8]" : "text-[#A9AEBA]"}`}>
                {l.label}
              </Link>,
              ...(l.children ?? []).map((c) => (
                <Link key={c.href} href={c.href} onClick={() => setOpen(false)} className="rounded-xl py-2.5 pl-8 pr-4 text-[14.5px] text-[#A9AEBA] no-underline">
                  {c.label}
                </Link>
              )),
            ])}
            {account && (
              <Link href={account.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-[15px] text-[#A9AEBA] no-underline">
                {account.label}
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
