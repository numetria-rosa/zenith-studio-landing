"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WaIcon, type WaIconName } from "@/components/wa/Icon";
import { cx } from "@/components/wa/ui";

const NAV: { href: string; label: string; icon: WaIconName }[] = [
  { href: "", label: "Overview", icon: "home" },
  { href: "/kb", label: "Knowledge base", icon: "book" },
  { href: "/simulator", label: "Simulator", icon: "chat" },
  { href: "/inbox", label: "Inbox", icon: "inbox" },
  { href: "/leads", label: "Leads", icon: "users" },
  { href: "/analytics", label: "Analytics", icon: "activity" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

const ITEM = "flex h-[42px] items-center gap-3 rounded-xl px-3 text-[14.5px] text-mist no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";

export function SidebarNav({ base, waiting }: { base: string; waiting: number }) {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label="WhatsApp agent" className="flex flex-col gap-[3px]">
        {NAV.map((item) => {
          const href = `${base}${item.href}`;
          const active = item.href === "" ? pathname === base : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={item.href} href={href} aria-current={active ? "page" : undefined} className={cx(ITEM, active && "bg-[rgba(92,200,255,.10)] text-frost shadow-[inset_0_0_0_1px_rgba(92,200,255,.30)]")}>
              <WaIcon name={item.icon} size={18} stroke={active ? "#F5F6F8" : "#A9AEBA"} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/inbox" && waiting > 0 && (
                <span aria-label={`${waiting} waiting for a person`} className="box-border flex h-[22px] min-w-[22px] items-center justify-center rounded-[11px] bg-amber px-[6px] font-mono text-[11.5px] font-semibold text-void">
                  {waiting}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mx-2 my-[14px] h-px bg-[rgba(255,255,255,.07)]" />
      <Link href="/my-services" className={ITEM}>
        <WaIcon name="grid" size={18} stroke="#A9AEBA" />
        All my services
      </Link>
    </>
  );
}
