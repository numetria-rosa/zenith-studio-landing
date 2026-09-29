import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { ExerciseView } from "@/components/learn/exercise/ExerciseView";
import { LEARN_BASE } from "@/components/learn/nav";
import { getExerciseHarness, getModule } from "@/lib/aie/content";
import { getExerciseProgress } from "@/lib/aie/progress";
import { requireEnrollment } from "@/lib/require-enrollment";

/* Inline MDX only: the brief and hints are prose with `code`, rendered without paragraph chrome. */
const inline = {
  p: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  code: ({ children }: { children?: React.ReactNode }) => <code className="font-mono text-[14px] text-cyan-text">{children}</code>,
};
const Inline = ({ source }: { source: string }) => <MDXRemote source={source} components={inline} options={{ blockJS: false }} />;

export default async function ExercisePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: moduleParam } = await params;
  const mod = await getModule(Number(moduleParam));
  const ex = mod?.exercise;
  if (!mod || !ex) notFound();

  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const [harnessSource, progress] = await Promise.all([getExerciseHarness(ex.harness), getExerciseProgress(userId, mod.number)]);
  const base = `${LEARN_BASE}/modules/${mod.number}`;
  const next = mod.quiz
    ? { label: "Next: the module quiz", href: `${base}/quiz` }
    : mod.project
      ? { label: "Next: the module project", href: `${base}/project` }
      : { label: "Back to the module overview", href: base };

  return (
    <ExerciseView
      module={mod.number}
      exerciseId={ex.id}
      title={ex.cardTitle ?? mod.lessons.find((l) => l.number === ex.id)?.title ?? "Code exercise"}
      description={<Inline source={ex.instructions} />}
      fileName={ex.fileName}
      starter={ex.starter}
      solution={ex.solution}
      tests={ex.tests.map(({ name, hint }) => ({ name, hint }))}
      hints={ex.hints.map((h) => ({ title: h.title, body: <Inline source={h.mdx} /> }))}
      harnessSource={harnessSource}
      functionName={ex.functionName}
      initial={{ code: progress?.code ?? "", attempted: progress?.attempted ?? false, passed: progress?.passed ?? 0 }}
      next={next}
    />
  );
}
