import { db } from "@/lib/db";
import { getService, businessNameOf } from "@/lib/services";
import { isSupportedPlan } from "@/lib/client-console-data";

/* Everything a client has bought that has its own dashboard: catalogue services (the client console at
   /services/dashboard/[id]) and WhatsApp agent agencies (/whatsapp-umrah/[id]). The account home lists these
   as cards, one per service, so a client with several services picks which one to open. */

export type OwnedService = {
  key: string;
  kind: "service" | "whatsapp";
  /** Catalogue service id, for the card icon; null for custom proposal projects. */
  serviceId: string | null;
  title: string;
  subtitle: string;
  href: string;
  status: { label: string; tone: "live" | "setup" | "paused" | "ended" };
  createdAt: Date;
};

const PROJECT_STATUS: Record<string, OwnedService["status"]> = {
  LIVE: { label: "Live", tone: "live" },
  MAINTENANCE: { label: "Live", tone: "live" },
  PAUSED: { label: "Paused", tone: "paused" },
  CANCELLED: { label: "Cancelled", tone: "ended" },
  COMPLETED: { label: "Completed", tone: "ended" },
};
const AGENCY_STATUS: Record<string, OwnedService["status"]> = {
  LIVE: { label: "Live", tone: "live" },
  PAUSED: { label: "Paused", tone: "paused" },
  CANCELLED: { label: "Cancelled", tone: "ended" },
};
const SETTING_UP: OwnedService["status"] = { label: "Setting up", tone: "setup" };

export function serviceFromProject(p: { id: string; title: string; sourceServiceId: string | null; stage: string; createdAt: Date }): OwnedService {
  const catalogue = p.sourceServiceId ? getService(p.sourceServiceId) : undefined;
  // Custom proposal projects have no client console; their details live on /lab/dashboard.
  const href = isSupportedPlan(p.sourceServiceId) ? `/services/dashboard/${p.id}` : "/lab/dashboard";
  return {
    key: `project:${p.id}`,
    kind: "service",
    serviceId: p.sourceServiceId,
    title: catalogue?.title ?? p.title,
    subtitle: catalogue ? businessNameOf(p) : "",
    href,
    status: PROJECT_STATUS[p.stage] ?? SETTING_UP,
    createdAt: p.createdAt,
  };
}

export function serviceFromAgency(a: { id: string; name: string; status: string; createdAt: Date }): OwnedService {
  return {
    key: `agency:${a.id}`,
    kind: "whatsapp",
    serviceId: "whatsapp-umrah",
    title: "WhatsApp AI Agent",
    subtitle: a.name,
    href: `/whatsapp-umrah/${a.id}`,
    status: AGENCY_STATUS[a.status] ?? SETTING_UP,
    createdAt: a.createdAt,
  };
}

/** Newest first. Ended services stay listed (a cancelled client still has 30 days to download their data). */
export async function loadOwnedServices(userId: string): Promise<OwnedService[]> {
  const [projects, memberships] = await Promise.all([
    db.serviceProject.findMany({ where: { userId }, select: { id: true, title: true, sourceServiceId: true, stage: true, createdAt: true } }),
    db.waMembership.findMany({ where: { userId }, select: { agency: { select: { id: true, name: true, status: true, createdAt: true } } } }),
  ]);
  return [...projects.map(serviceFromProject), ...memberships.map((m) => serviceFromAgency(m.agency))].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Where a signed-in person lands. Services are for clients and courses are for students, so they get separate
    homes: one service and nothing else opens that service straight away; any services otherwise open the services
    home (which links to the student space if they also study); courses only open the student space. */
export function landingDestination(input: { services: Pick<OwnedService, "href">[]; courseCount: number }): string {
  if (input.services.length === 1 && input.courseCount === 0) return input.services[0]!.href;
  if (input.services.length > 0) return "/my-services";
  return "/account";
}
