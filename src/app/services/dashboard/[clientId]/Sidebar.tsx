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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/zenith-mark.png" alt="Zenith Studio" width={28} height={28} />
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
            <Link key={item.href} href={item.href} className={`${s.navItem} ${active ? s.navItemActive : ""}`} data-tour={`nav-${item.label.toLowerCase()}`}>
              <Icon name={item.icon} size={18} strokeWidth={1.8} />
              <span className={s.navLabel}>{item.label}</span>
              {!!item.badge && <span className={s.navBadge}>{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      <Link href="/my-services" className={s.navItem}>
        <Icon name="grid" size={18} strokeWidth={1.8} />
        <span className={s.navLabel}>All my services</span>
      </Link>

      <div className={s.footer}>
        <button type="button" className={s.askBtn} onClick={() => open()} data-tour="ask-sidebar">
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
