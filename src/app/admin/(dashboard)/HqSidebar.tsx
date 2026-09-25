"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

type NavItem = { href: string; label: string; icon: IconName; badge?: number; badgeTone?: "amber" | "cyan" };

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "grid" },
  { href: "/admin/clients", label: "Clients", icon: "users" },
  { href: "/admin/services", label: "Services", icon: "bolt" },
  { href: "/admin/onboarding", label: "Onboarding", icon: "clock" },
  { href: "/admin/agents", label: "Agents", icon: "cpu" },
  { href: "/admin/billing", label: "Billing", icon: "card" },
  { href: "/admin/requests", label: "Requests", icon: "chat" },
  { href: "/admin/leads", label: "Leads", icon: "flag" },
  { href: "/admin/audits", label: "Audits", icon: "clipboard" as IconName },
  { href: "/admin/proposals", label: "Proposals", icon: "file" as IconName },
  { href: "/admin/tasks", label: "Tasks", icon: "check" },
  { href: "/admin/settings", label: "Settings", icon: "gear" },
];

export function HqSidebar({ badges, ownerName }: { badges: { needsYou: number; setupsRunning: number; openRequests: number }; ownerName: string }) {
  const pathname = usePathname();

  function isCurrent(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const badgeFor: Record<string, { n: number; tone?: "cyan" } | undefined> = {
    "/admin": badges.needsYou ? { n: badges.needsYou } : undefined,
    "/admin/onboarding": badges.setupsRunning ? { n: badges.setupsRunning, tone: "cyan" } : undefined,
    "/admin/requests": badges.openRequests ? { n: badges.openRequests } : undefined,
  };

  return (
    <aside className="side">
      <div className="brand">
        <span className="mark">
          <span className="zlogo" role="img" aria-label="Zenith Studio logo" style={{ width: 30, height: 30 }} />
        </span>
        <div>
          <b>
            Zenith HQ<span className="hq-tag">ADMIN</span>
          </b>
          <span>Zenith Studio · owner</span>
        </div>
      </div>
      <nav className="nav" aria-label="Admin">
        {ITEMS.map((item) => {
          const badge = badgeFor[item.href];
          return (
            <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
              <Icon name={item.icon} size={18} />
              {item.label}
              {badge && <span className={`badge${badge.tone === "cyan" ? " b-cy" : ""}`}>{badge.n}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="side-foot">
        <Link href="/admin/clients?new=1" className="newc">
          <Icon name="plus" size={16} color="#04140C" strokeWidth={2.2} />
          New client
        </Link>
        <div className="me">
          <span className="av">{ownerName.charAt(0).toUpperCase()}</span>
          <div>
            <b>{ownerName}</b>
            <span>Owner</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
