"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ModuleTab = { label: string; href: string; match: string };

/** Pill tab bar. A tab is active when the path is inside its `match` prefix (Overview matches exactly). */
export function ModuleTabs({ tabs, overviewHref }: { tabs: ModuleTab[]; overviewHref: string }) {
  const pathname = usePathname().replace(/\/$/, "");
  return (
    <nav
      aria-label="Module sections"
      className="glass flex gap-0.5 self-start overflow-x-auto rounded-full p-[5px] lg:self-auto"
    >
      {tabs.map((tab) => {
        const on = tab.href === overviewHref ? pathname === overviewHref : pathname.startsWith(tab.match);
        return (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={on ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-[14.5px] no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan lg:min-h-10 ${
              on ? "bg-white/[0.08] text-frost shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]" : "text-soft hover:text-frost"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
