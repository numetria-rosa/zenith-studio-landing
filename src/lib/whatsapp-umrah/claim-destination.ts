/** Where a buyer lands after Whop's checkout redirect (/api/auth/claim). The most recent purchase wins, so someone who
    already has a service project and has just subscribed to the WhatsApp agent still lands on the WhatsApp dashboard. */
export function claimDestination(input: {
  project: { id: string; createdAt: Date } | null;
  waMembership: { agencyId: string; createdAt: Date } | null;
}): string {
  const { project, waMembership } = input;
  if (project && waMembership) {
    return waMembership.createdAt >= project.createdAt ? `/whatsapp-umrah/${waMembership.agencyId}` : `/services/dashboard/${project.id}`;
  }
  if (waMembership) return `/whatsapp-umrah/${waMembership.agencyId}`;
  if (project) return `/services/dashboard/${project.id}`;
  return "/welcome";
}
