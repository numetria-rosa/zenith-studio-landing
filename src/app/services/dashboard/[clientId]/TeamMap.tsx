import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import type { Tone } from "@/lib/client-console-data";
import s from "./overview.module.css";

/* Team map, spec'd in components.md: orchestrator at (500,130), agent
   layouts hand-positioned per count (only 3-agent used so far - law
   firm). Wires are orthogonal with a moving light in the state color for
   running/needs-you nodes; CSS-animated (stroke-dashoffset) rather than
   matching the reference GIF frame-for-frame, "calm by default" already
   gives latitude on exact motion per the design system's own principles. */

const ORCH = { x: 500, y: 130 };
const LAYOUT_3 = [
  { x: 200, y: 380 },
  { x: 500, y: 520 },
  { x: 800, y: 380 },
];
const LAYOUT_4 = [
  { x: 180, y: 330 },
  { x: 340, y: 510 },
  { x: 660, y: 510 },
  { x: 820, y: 330 },
];

const TONE_COLOR: Record<Tone, string> = { run: "var(--zc-run)", need: "var(--zc-need)", done: "var(--zc-done)", dim: "var(--zc-dim)" };
const TONE_STATE: Record<Tone, string> = { run: "running", need: "waiting on you", done: "done", dim: "idle" };

export type MapAgent = { id: string; name: string; icon: IconName; tone: Tone };

export function TeamMap({ agents, agentHref }: { agents: MapAgent[]; agentHref: (id: string) => string }) {
  const positions = agents.length === 4 ? LAYOUT_4 : agents.length === 1 ? [{ x: 500, y: 420 }] : LAYOUT_3.slice(0, agents.length);

  return (
    <svg viewBox="0 0 1000 620" className={s.mapSvg} role="img" aria-label="Your AI team, current status">
      {agents.map((a, i) => {
        const p = positions[i];
        if (!p) return null;
        const midY = (ORCH.y + p.y) / 2;
        const color = TONE_COLOR[a.tone];
        const animated = a.tone === "run" || a.tone === "need";
        return (
          <g key={a.id}>
            <path
              d={`M${ORCH.x} ${ORCH.y + 44} V${midY} H${p.x} V${p.y - 39}`}
              fill="none"
              stroke="rgba(255,255,255,.14)"
              strokeWidth={1.5}
            />
            {animated && (
              <path
                d={`M${ORCH.x} ${ORCH.y + 44} V${midY} H${p.x} V${p.y - 39}`}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeDasharray="70 900"
                strokeLinecap="round"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-970" dur="3.2s" repeatCount="indefinite" />
              </path>
            )}
          </g>
        );
      })}

      <g>
        <circle cx={ORCH.x} cy={ORCH.y} r={54} fill="rgba(139,92,246,.12)" />
        <rect x={ORCH.x - 49} y={ORCH.y - 49} width={98} height={98} rx={26} className={s.nodeTile} stroke="rgba(139,92,246,.5)" />
        <g transform={`translate(${ORCH.x - 16}, ${ORCH.y - 16})`}>
          <Icon name="cpu" size={32} strokeWidth={1.4} />
        </g>
        <text x={ORCH.x} y={ORCH.y + 68} textAnchor="middle" className={s.nodeState}>
          orchestrator
        </text>
      </g>

      {agents.map((a, i) => {
        const p = positions[i];
        if (!p) return null;
        return (
          <Link key={a.id} href={agentHref(a.id)} aria-label={`${a.name}, ${TONE_STATE[a.tone]}`}>
            <g className={s.nodeBtn}>
              <rect x={p.x - 39} y={p.y - 39} width={78} height={78} rx={22} className={s.nodeTile} />
              <circle cx={p.x + 30} cy={p.y - 30} r={6} fill={TONE_COLOR[a.tone]} />
              <g transform={`translate(${p.x - 12}, ${p.y - 12})`} color="var(--zc-text)">
                <Icon name={a.icon} size={24} strokeWidth={1.6} />
              </g>
              <text x={p.x} y={p.y + 56} textAnchor="middle" className={s.nodeLabel}>
                {a.name}
              </text>
              <text x={p.x} y={p.y + 74} textAnchor="middle" className={s.nodeState} fill={TONE_COLOR[a.tone]}>
                {TONE_STATE[a.tone]}
              </text>
            </g>
          </Link>
        );
      })}
    </svg>
  );
}
