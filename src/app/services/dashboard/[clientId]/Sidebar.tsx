"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { useAskTeam } from "./AskYourTeam";
import s from "./sidebar.module.css";

type NavItem = { label: string; href: string; icon: IconName; badge?: number };

export function Sidebar({
  clientId,
  planLabel,
  businessName,
  userName,
  userEmail,
  approvalsCount,
}: {
  clientId: string;
  planLabel: string;
  businessName: string;
  userName: string | null;
  userEmail: string | null;
  approvalsCount: number;
}) {
  const pathname = usePathname();
  const base = `/services/dashboard/${clientId}`;
  const { open } = useAskTeam();

  const nav: NavItem[] = [
    { label: "Overview", href: base, icon: "home" },
    { label: "Agents", href: `${base}/agents`, icon: "users" },
    { label: "Activity", href: `${base}/activity`, icon: "activity" },
    { label: "Approvals", href: `${base}/approvals`, icon: "userCheck", badge: approvalsCount },
    { label: "Settings", href: `${base}/settings`, icon: "settings" },
  ];

  const initial = (userName ?? userEmail ?? "?").trim().charAt(0).toUpperCase();

  return (
    <aside className={s.sidebar}>
      <div className={s.brand}>
        <div className={s.logoTile}>
          <svg width={22} height={22} viewBox="0 0 32 32" fill="none" stroke="#C7B0FF" strokeWidth={3.2} strokeLinecap="square" aria-hidden>
            <path d="M16 3 L29 16 L22 23" />
            <path d="M16 29 L3 16 L10 9" />
          </svg>
        </div>
        <div className={s.brandText}>
          <div className={s.brandTitle}>{planLabel}</div>
          <div className={s.brandSub}>{businessName}</div>
        </div>
      </div>

      <nav className={s.nav}>
        {nav.map((item) => {
          const active = item.href === base ? pathname === base : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`${s.navItem} ${active ? s.navItemActive : ""}`}>
              <Icon name={item.icon} size={18} strokeWidth={1.8} />
              <span className={s.navLabel}>{item.label}</span>
              {!!item.badge && <span className={s.navBadge}>{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={s.footer}>
        <button type="button" className={s.askBtn} onClick={open}>
          <Icon name="message" size={16} />
          Ask your team
        </button>
        <div className={s.userCard}>
          <div className={s.avatar}>{initial}</div>
          <div>
            <div className={s.userName}>{userName ?? userEmail}</div>
            <div className={s.userRole}>Owner</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
