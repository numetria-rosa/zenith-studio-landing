import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { Icon } from "@/app/services/dashboard/[clientId]/Icon";
import waStyles from "./waConsole.module.css";

const NAV = [
  { href: "", label: "Overview", icon: "home" as const },
  { href: "/kb", label: "Knowledge base", icon: "file" as const },
  { href: "/simulator", label: "Simulator", icon: "message" as const },
  { href: "/inbox", label: "Inbox", icon: "userCheck" as const },
  { href: "/leads", label: "Leads", icon: "users" as const },
  { href: "/analytics", label: "Analytics", icon: "activity" as const },
  { href: "/settings", label: "Settings", icon: "shield" as const },
];

export default async function WhatsAppUmrahLayout({ children, params }: { children: React.ReactNode; params: Promise<{ agencyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const base = `/whatsapp-umrah/${agencyId}`;

  return (
    <div className={waStyles.waConsole}>
      <div className={waStyles.shell}>
        <aside className={waStyles.sidebar}>
          <div className={waStyles.brand}>
            {agency.name}
            <span className={waStyles.brandSub}>WhatsApp AI Agent</span>
          </div>
          {NAV.map((item) => (
            <Link key={item.href} href={`${base}${item.href}`} className={waStyles.navLink}>
              <Icon name={item.icon} size={17} strokeWidth={1.8} />
              {item.label}
            </Link>
          ))}
          <Link href="/my-services" className={waStyles.navLink} style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <Icon name="grid" size={17} strokeWidth={1.8} />
            All my services
          </Link>
        </aside>
        <main className={waStyles.main}>{children}</main>
      </div>
    </div>
  );
}
