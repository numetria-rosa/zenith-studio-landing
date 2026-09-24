import Link from "next/link";
import { Icon } from "./Icon";
import type { MapAgent, AgentState } from "../sample-data";
import s from "./TeamMap.module.css";

const tileClass: Record<AgentState, string> = {
  active: s.tileActive,
  idle: s.tileIdle,
  attention: s.tileAttention,
};

const labelClass: Record<AgentState, string> = {
  active: s.labelActive,
  idle: s.labelIdle,
  attention: s.labelAttention,
};

const MAP_W = 680;
const ORCHESTRATOR_X = 340; // center
const ORCHESTRATOR_BOTTOM_Y = 90;
const ROW_Y = 250;
const TILE_SIZE = 64;

/** Evenly spaces N agent tiles across a row below the orchestrator, however
    many a client actually has (1 for a single-service niche, up to 5-6 for
    a full bundle) - this is the one part of the source design that was
    hand-placed for exactly 5 fixed agents; everything else here is an
    unmodified port. Positions are computed, not looked up per niche, so
    adding a new niche's agent count never touches this file. */
function layoutFor(count: number) {
  const spacing = MAP_W / (count + 1);
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(spacing * (i + 1) - TILE_SIZE / 2),
    y: ROW_Y,
  }));
}

export function TeamMap({ agents }: { agents: MapAgent[] }) {
  const positions = layoutFor(agents.length);

  return (
    <div className={s.map}>
      <svg className={s.wires} width={MAP_W} height="440" viewBox={`0 0 ${MAP_W} 440`} fill="none" aria-hidden="true">
        <defs>
          <filter id="team-map-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <linearGradient id="wire-pulse" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#A855F7" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <g stroke="rgba(255,255,255,0.15)" strokeWidth="1">
          {positions.map((p, i) => {
            const midY = (ORCHESTRATOR_BOTTOM_Y + p.y) / 2;
            const tileCenterX = p.x + TILE_SIZE / 2;
            return (
              <path
                key={agents[i]!.id}
                d={`M${ORCHESTRATOR_X} ${ORCHESTRATOR_BOTTOM_Y} V${midY} H${tileCenterX} V${p.y}`}
              />
            );
          })}
        </g>
        <g strokeLinecap="round">
          {positions.map((p, i) => {
            const midY = (ORCHESTRATOR_BOTTOM_Y + p.y) / 2;
            if (agents[i]!.state === "idle") return null;
            return (
              <g key={agents[i]!.id}>
                <path d={`M${ORCHESTRATOR_X} ${ORCHESTRATOR_BOTTOM_Y + 8} V${midY - 8}`} stroke="#22D3EE" strokeWidth="5" filter="url(#team-map-glow)" />
                <path d={`M${ORCHESTRATOR_X} ${ORCHESTRATOR_BOTTOM_Y + 8} V${midY - 8}`} stroke="#A5F3FC" strokeWidth="1.8" />
              </g>
            );
          })}
        </g>
      </svg>

      <div className={s.orchestrator}>
        <Icon name="cpu" size={34} strokeWidth={1.4} />
      </div>
      <span className={s.orchestratorLabel}>orchestrator</span>

      {agents.map((a, i) => {
        const p = positions[i]!;
        const tileProps = {
          className: `${s.tile} ${tileClass[a.state]}`,
          style: { left: p.x, top: p.y },
        };
        const inner = (
          <>
            <Icon name={a.icon} size={26} strokeWidth={1.5} />
            {a.state !== "idle" && <span className={s.tileDot} />}
          </>
        );
        return (
          <div key={a.id}>
            <Link href={a.href} aria-label={`Open ${a.name}`} {...tileProps}>
              {inner}
            </Link>
            <div className={`${s.label} ${labelClass[a.state]}`} style={{ left: p.x + TILE_SIZE / 2 - 70, top: p.y + 72 }}>
              <span className={s.labelName}>{a.name}</span>
              <span className={s.labelStatus}>{a.status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
