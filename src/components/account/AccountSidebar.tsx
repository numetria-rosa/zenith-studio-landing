"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/obsidian/Icon";

export type AccountUser = { name: string; email: string; initials: string };

const ITEMS: { label: string; icon: IconName; href: string; match: (p: string) => boolean }[] = [
  { label: "My courses", icon: "grid", href: "/account", match: (p) => p === "/account" },
  { label: "Profile", icon: "user", href: "/account/profile", match: (p) => p === "/account/profile" },
  { label: "Purchases", icon: "receipt", href: "/account/profile#purchases", match: () => false },
  { label: "Notifications", icon: "bell", href: "/account/profile#notifications", match: () => false },
  { label: "Support", icon: "quiz", href: "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Studio%20support", match: () => false },
];

export function AccountSidebar({ user, signOut }: { user: AccountUser; signOut: () => Promise<void> }) {
  const pathname = usePathname();
  return (
    <>
      <div className="flex items-center gap-3 px-2">
        <Image src="/course/zenith-logo.png" alt="Zenith Studio logo" width={32} height={32} className="h-8 w-8 object-contain" />
        <div className="flex flex-col">
          <b className="text-[15px] font-semibold">Zenith Studio</b>
          <span className="text-[12px] text-mist">Student space</span>
        </div>
      </div>
      <nav aria-label="Account" className="flex flex-col gap-0.5">
        <span className="px-3 pb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Account</span>
        {ITEMS.map((item) => {
          const on = item.match(pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={`flex min-h-[42px] items-center gap-3 rounded-xl px-3 text-[15px] no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
                on ? "bg-[rgba(92,200,255,0.10)] text-frost shadow-[inset_0_0_0_1px_rgba(92,200,255,0.30)]" : "text-soft hover:bg-white/[0.04]"
              }`}
            >
              <Icon name={item.icon} size={18} color={on ? "#5CC8FF" : "#A9AEBA"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-2.5">
        <div className="glass flex items-center gap-3 rounded-2xl p-3">
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(92,200,255,0.35),rgba(139,92,246,0.35))] text-[13px] font-semibold">
            {user.initials}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <b className="truncate text-[14px] font-medium">{user.name}</b>
            <span className="truncate text-[12px] text-mist">{user.email}</span>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-[14.5px] text-mist hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            <Icon name="signout" size={18} color="#A9AEBA" />
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}
