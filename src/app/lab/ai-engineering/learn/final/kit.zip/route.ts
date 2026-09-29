import { LEARN_BASE } from "@/components/learn/nav";
import { flattenFiles, kitTree, readKitFiles } from "@/lib/aie/final-module";
import { requireEnrollment } from "@/lib/require-enrollment";
import { createZip } from "@/lib/zip";

export const dynamic = "force-dynamic";

/** The whole agent kit as one zip, for enrolled students only. */
export async function GET() {
  await requireEnrollment("ai-engineering", `${LEARN_BASE}/final/agents`);
  const paths = flattenFiles(await kitTree());
  const files = await readKitFiles(paths);
  const zip = createZip(Object.entries(files).map(([name, content]) => ({ name: `zenith-agent-kit/${name}`, content })));
  return new Response(zip as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="zenith-agent-kit.zip"',
      "Cache-Control": "private, no-store",
    },
  });
}
