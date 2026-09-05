import { SimilarityEngineWorkspace } from "@/components/course-engine/projects/SimilarityEngineWorkspace";
import { ProjectBrief } from "@/components/course-engine/projects/ProjectBrief";

export function WorkspaceSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
        Workspace
      </span>
      <SimilarityEngineWorkspace />
    </div>
  );
}

export function BriefSection() {
  return (
    <ProjectBrief
      courseId="math-for-ml"
      projectId="similarity-engine"
      objective="Build and understand a real vector similarity search engine - the same core operation behind semantic search, recommendation systems, and retrieval for language models."
      requirements={[
        "Pick at least 4 different documents as the query and record which documents rank highest each time",
        "Find one case where the top-ranked result surprised you, and explain why the vectors' directions produced that ranking",
        "Identify one pair of documents that are topically related but score LOW on cosine similarity - explain what that reveals about this simplified 2D embedding",
        "Explain, in your own words, why cosine similarity ignores vector length",
      ]}
      hints={[
        "The ranked list recomputes live every time you change the query - use it, don't just read the numbers.",
        "Look at the canvas: documents whose arrows point in similar directions from the origin will rank each other highly.",
        "Real embeddings have hundreds of dimensions, not 2 - this project's insight generalizes even though the visual doesn't.",
      ]}
      rubric={[
        { key: "queried4", label: "Tried at least 4 different query documents and recorded the top result each time" },
        { key: "explainedSurprise", label: "Found and explained one surprising ranking" },
        { key: "foundLowSim", label: "Identified a related-but-low-similarity pair and explained why" },
        { key: "explainedLength", label: "Can explain why cosine similarity ignores magnitude, not just recite the formula" },
      ]}
      expectedConcepts={["Dot product", "Cosine similarity", "Vector direction vs. magnitude", "Embeddings"]}
    />
  );
}
