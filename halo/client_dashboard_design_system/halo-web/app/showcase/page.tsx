import { AgentFiles } from "@/components/AgentFiles";

// Demo route for the AI agent files animation. Drop <AgentFiles /> into any section.
export default function ShowcasePage() {
  return (
    <main style={{ flexGrow: 1, padding: "48px 40px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
        <AgentFiles holdSeconds={5.5} />
      </div>
    </main>
  );
}
