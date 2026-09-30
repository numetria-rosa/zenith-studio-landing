import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { CapstoneView } from "@/components/learn/capstone/CapstoneView";
import { lessonComponents } from "@/components/learn/lesson/mdx-components";
import { remarkCodeMeta } from "@/components/learn/lesson/remark-code-meta";
import { LEARN_BASE } from "@/components/learn/nav";
import { ProjectView } from "@/components/learn/project/ProjectView";
import { getCapstone, getExerciseHarness, getModule, getProject } from "@/lib/aie/content";
import { getCapstoneState } from "@/lib/aie/capstone-db";
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
  const portfolio = <ProjectView project={project} initial={progress} moduleLabel={moduleLabel} portfolioHref={`${LEARN_BASE}/portfolio`} />;
  if (mod.number !== 8) return portfolio;

  // Module 8: the graded capstone (brief, parts 1 to 4, reference outline, design review), then its portfolio project
  const [capstone, state] = await Promise.all([getCapstone(), getCapstoneState(userId)]);
  const harnessSource = await getExerciseHarness(capstone.content.implementation.harness);
  const mdx = (source: string) => <MDXRemote source={source} components={lessonComponents({ module: 8, data: {} })} options={{ blockJS: false, mdxOptions: { remarkPlugins: [remarkCodeMeta] } }} />;
  return (
    <CapstoneView
      content={capstone.content}
      text={capstone.text}
      state={state}
      harnessSource={harnessSource}
      brief={mdx(capstone.brief)}
      reference={mdx(capstone.reference)}
      after={
        <section aria-labelledby="portfolio-project" className="flex flex-col gap-6">
          <h2 id="portfolio-project" className="m-0 text-[28px] font-medium tracking-[-0.03em]">
            Portfolio project
          </h2>
          {portfolio}
        </section>
      }
    />
  );
}
