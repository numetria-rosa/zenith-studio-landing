import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getTopMetrics } from "@/lib/dashboard-metrics";
import { getOverdueTaskCount } from "@/lib/tasks-admin";
import { listPaidAuditsForAdmin } from "@/lib/paid-audit";
import AdminNav, { type NavItem } from "./AdminNav";

/* Shared /admin/** layout (Slice 7 of the business command center,
   2026-08-28) — the first shared layout the admin area has had. Every
   existing admin page previously rendered its own full-page
   `<div className="min-h-screen bg-[#05060a] ...">` shell with no shared
   nav; this layout now owns that outer shell + a persistent sidebar
   (desktop) / drawer (mobile), and every page underneath was trimmed down
   to just its own `mx-auto max-w-*` content div — a small mechanical
   change per page (see admin/page.tsx, tasks/page.tsx, etc.), no business
   logic/queries touched.

   Security: independently re-checks requireAdmin() here, on top of every
   individual page's own unchanged requireAdmin() check. Next.js layouts
   and pages can in principle be reached somewhat independently (e.g. a
   parallel/intercepted route, or a future refactor that forgets a page's
   own check) — a shared layout is defense in depth, not a replacement for
   each page's own gate. Every page below still calls requireAdmin() and
   notFound() itself, unchanged. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  // Badge counts reuse the exact same queries dashboard-metrics.ts and
  // tasks-admin.ts already established, rather than writing new counting
  // logic that could quietly drift from the numbers shown elsewhere.
  const [topMetrics, overdueTaskCount, paidAudits] = await Promise.all([
    getTopMetrics(),
    getOverdueTaskCount(),
    listPaidAuditsForAdmin(),
  ]);
  // Needs-action badge: rows still waiting on an admin to confirm payment or
  // booking. BOOKED/COMPLETED/FOLLOW_UP/CANCELLED/REFUNDED don't need
  // action right now, so they're excluded — same "in-memory filter at low
  // volume" shortcut as getOverdueTaskCount's sibling queries.
  const paidAuditsNeedingAttention = paidAudits.filter(
    (a) => a.status === "PAYMENT_PENDING" || a.status === "PAID" || a.status === "BOOKING_PENDING",
  ).length;

  const items: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/admin/clients", label: "Clients", icon: "Users" },
    { href: "/admin/audits", label: "Audits", icon: "ClipboardList", badge: topMetrics.openAudits },
    { href: "/admin/proposals", label: "Proposals", icon: "FileText", badge: topMetrics.pendingProposals },
    { href: "/admin/projects", label: "Projects", icon: "FolderKanban" },
    { href: "/admin/tasks", label: "Tasks", icon: "CheckSquare", badge: overdueTaskCount },
    { href: "/admin/paid-audits", label: "Paid audit calls", icon: "PhoneCall", badge: paidAuditsNeedingAttention },
    { href: "/admin/service-catalog", label: "Service catalog", icon: "LayoutGrid" },
    { href: "/admin/service-requests", label: "Service requests", icon: "Inbox", badge: topMetrics.openSupportRequests },
  ];

  return (
    <div className="min-h-screen bg-[#05060a] text-white md:flex">
      <AdminNav items={items} />
      <main className="min-w-0 flex-1 px-6 py-12">{children}</main>
    </div>
  );
}
