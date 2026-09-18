"use client";

import { useEffect, useState } from "react";

type NavItem = { href: string; label: string };

export default function MobileNav({ items, signInHref, signInLabel }: { items: NavItem[]; signInHref: string; signInLabel: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 p-2 text-white/80 backdrop-blur-xl transition hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-[#05060a]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute right-5 top-5 rounded-full border border-white/15 bg-white/5 p-2 text-white/80"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-2xl font-semibold tracking-[-0.02em] text-white/90"
            >
              {item.label}
            </a>
          ))}

          <a
            href={signInHref}
            onClick={() => setOpen(false)}
            className="mt-4 text-base text-white/55"
          >
            {signInLabel}
          </a>
        </div>
      )}
    </div>
  );
}
