"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { agency } from "@/lib/demo-data";
import s from "./shell.module.css";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  match: (path: string) => boolean;
  badge?: number;
};

const nav: NavItem[] = [
  { label: "Overview", href: "/", icon: "home", match: (p) => p === "/" },
  { label: "Agents", href: "/agents/claims", icon: "users", match: (p) => p.startsWith("/agents") },
  { label: "Activity", href: "#", icon: "activity", match: () => false },
  { label: "Approvals", href: "/agents/claims", icon: "userCheck", match: () => false, badge: 1 },
  { label: "Settings", href: "#", icon: "settings", match: () => false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={s.sidebar}>
      <div className={s.brand}>
        <div className={s.brandMark}>
          <Icon name="shield" size={18} strokeWidth={1.7} />
        </div>
        <div className={s.brandText}>
          <span className={s.brandName}>AI Team</span>
          <span className={s.brandSub}>{agency.name}</span>
        </div>
      </div>

      <nav aria-label="Main" className={s.nav}>
        {nav.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${s.navItem} ${active ? s.navItemActive : ""}`}
            >
              <Icon name={item.icon} size={18} strokeWidth={active ? 1.7 : 1.6} />
              {item.badge ? (
                <>
                  <span className={s.navLabel}>{item.label}</span>
                  <span className={s.badge} aria-label={`${item.badge} pending`}>
                    {item.badge}
                  </span>
                </>
              ) : (
                item.label
              )}
            </Link>
          );
        })}
      </nav>

      <div className={s.sidebarFooter}>
        <button type="button" className={s.askButton}>
          <Icon name="plus" size={16} strokeWidth={2} />
          Ask your team
        </button>
        <div className={s.user}>
          <div className={s.avatar} aria-hidden="true">
            {agency.userInitial}
          </div>
          <div className={s.userText}>
            <span className={s.userName}>{agency.userName}</span>
            <span className={s.userRole}>{agency.userRole}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
