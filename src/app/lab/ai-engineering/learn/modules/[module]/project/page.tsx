import { notFound } from "next/navigation";
import { LEARN_BASE } from "@/components/learn/nav";
import { ProjectView } from "@/components/learn/project/ProjectView";
import { getModule, getProject } from "@/lib/aie/content";
import { getProjectProgress } from "@/lib/aie/progress";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function ProjectPage({ params }: { params: Promise<{ module: string }> }) {
  const { module: moduleParam } = await params;
  const mod = await getModule(Number(moduleParam));
  if (!mod?.project) notFound();
  const project = await getProject(mod.project.projectId);
  if (!project) notFound();
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const progress = await getProjectProgress(userId, project.id);

  const [first, ...rest] = project.modules;
  const moduleLabel = rest.length === 0 ? `Module ${first}` : project.modules.length > 2 ? `Modules ${first} to ${project.modules.at(-1)}` : `Modules ${first} and ${project.modules.at(-1)}`;
  return <ProjectView project={project} initial={progress} moduleLabel={moduleLabel} portfolioHref={`${LEARN_BASE}/portfolio`} />;
}
