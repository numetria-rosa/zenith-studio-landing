import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getHqClients, listSupportRequestsForHq, attentionQueue } from "@/lib/hq";
import { HqSidebar } from "./HqSidebar";
import "./hq.css";

/* Zenith HQ - the owner-only business command center, replacing the
   previous plain-Tailwind /admin shell with the same Obsidian dark-glass
   system the client dashboard uses (src/app/admin/(dashboard)/hq.css,
   ported from halo/zenith-hq-admin/src/styles/*.css, scoped under .zhq
   instead of :root so it can't leak into the rest of the site - see that
   file's own header comment).

   Security: independently re-checks requireAdmin() here on top of every
   page's own check (defense in depth), same pattern the previous layout
   used. Every action in lib/hq/actions.ts re-checks it a third time. */
export default async function HqLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const [clients, requests] = await Promise.all([getHqClients(), listSupportRequestsForHq()]);
  const openRequests = requests.filter((r) => r.status !== "RESOLVED" && r.status !== "CLOSED");
  const queue = attentionQueue(
    clients,
    openRequests
      .filter((r) => r.status === "OPEN")
      .map((r) => ({ id: r.id, clientId: r.projectId ?? "", clientName: r.project?.title ?? r.user.name ?? r.user.email, title: r.subject, ageLabel: "" })),
    new Date()
  );

  const badges = {
    needsYou: queue.length,
    setupsRunning: clients.filter((c) => c.status === "setup").length,
    openRequests: openRequests.length,
  };

  const ownerName = admin.user?.name?.split(" ")[0] || "Owner";

  return (
    <div className="zhq">
      <div className="app">
        <HqSidebar badges={badges} ownerName={ownerName} />
        <main className="main">
          <div className="view">{children}</div>
        </main>
      </div>
    </div>
  );
}
