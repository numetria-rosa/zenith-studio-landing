"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/obsidian/Icon";
import { ProgressBar } from "@/components/obsidian/ProgressBar";
import { NAV_GROUPS, activeNavKey } from "./nav";

export type SidebarUser = { name: string; initials: string };

export function SidebarContent({
  currentModule,
  percent,
  user,
}: {
  currentModule: number;
  percent: number;
  user: SidebarUser;
}) {
  const active = activeNavKey(usePathname());
  return (
    <>
      <div className="flex items-center gap-3 px-2">
        <Image src="/course/zenith-logo.png" alt="Zenith Studio logo" width={32} height={32} className="h-8 w-8 object-contain" />
        <div className="flex flex-col">
          <b className="text-[15px] font-semibold">AI Engineering</b>
          <span className="text-[12px] text-mist">Career Path Edition</span>
        </div>
      </div>
      {NAV_GROUPS.map((group) => (
        <nav key={group.label} aria-label={group.label} className="flex flex-col gap-0.5">
          <span className="px-3 pb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">{group.label}</span>
          {group.items.map((item) => {
            const on = active === item.key;
            return (
              <Link
                key={item.key}
                href={item.href(currentModule)}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-[14.5px] no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
                  on ? "bg-[rgba(92,200,255,0.10)] text-frost shadow-[inset_0_0_0_1px_rgba(92,200,255,0.30)]" : "text-soft hover:bg-white/[0.04]"
                }`}
              >
                <Icon name={item.icon} size={17} color={on ? "#5CC8FF" : "#A9AEBA"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      ))}
      <div className="glass mt-auto flex flex-col gap-2.5 rounded-2xl p-3.5">
        <div className="flex justify-between text-[13px]">
          <span className="text-mist">Course progress</span>
          <b className="font-medium">{percent}%</b>
        </div>
        <ProgressBar percent={percent} label="Course progress" />
        <div className="flex items-center gap-2.5">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/[0.08] text-[12px]">
            {user.initials}
          </span>
          <span className="text-[13px] text-soft">{user.name}</span>
        </div>
      </div>
    </>
  );
}
