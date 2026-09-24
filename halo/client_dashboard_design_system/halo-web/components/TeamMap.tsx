import Link from "next/link";
import { Icon } from "./Icon";
import { mapAgents, type AgentState } from "@/lib/demo-data";
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

/** Hairline wires from the orchestrator (center 340,50) to each agent tile. */
const wires = [
  "M300 50 H72 V90", // -> Intake
  "M380 50 H608 V90", // -> Renewals
  "M322 90 V262 H214", // -> Quoting
  "M358 90 V262 H466", // -> Claims
  "M340 90 V320", // -> Client service
];

/** Bright "data moving" pulse segments drawn over the wires. */
const pulses: { d: string; glow: string; core: string }[] = [
  { d: "M250 50 H170", glow: "#22D3EE", core: "#A5F3FC" },
  { d: "M430 50 H510", glow: "#22D3EE", core: "#A5F3FC" },
  { d: "M322 140 V190", glow: "#A855F7", core: "#D8B4FE" },
  { d: "M358 165 V215", glow: "#A855F7", core: "#D8B4FE" },
  { d: "M340 265 V305", glow: "#22D3EE", core: "#A5F3FC" },
];

export function TeamMap() {
  return (
    <div className={s.map}>
      <svg className={s.wires} width="680" height="440" viewBox="0 0 680 440" fill="none" aria-hidden="true">
        <defs>
          <filter id="team-map-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <g stroke="rgba(255,255,255,0.15)" strokeWidth="1">
          {wires.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g strokeLinecap="round">
          {pulses.map((p) => (
            <g key={p.d}>
              <path d={p.d} stroke={p.glow} strokeWidth="5" filter="url(#team-map-glow)" />
              <path d={p.d} stroke={p.core} strokeWidth="1.8" />
            </g>
          ))}
        </g>
      </svg>

      <div className={s.orchestrator}>
        <Icon name="cpu" size={34} strokeWidth={1.4} />
      </div>
      <span className={s.orchestratorLabel}>orchestrator</span>

      {mapAgents.map((a) => {
        const tileProps = {
          className: `${s.tile} ${tileClass[a.state]}`,
          style: { left: a.x, top: a.y },
        };
        const inner = (
          <>
            <Icon name={a.icon} size={26} strokeWidth={1.5} />
            {a.state !== "idle" && <span className={s.tileDot} />}
          </>
        );
        return (
          <div key={a.id}>
            {a.href ? (
              <Link href={a.href} aria-label={`Open ${a.name} Agent`} {...tileProps}>
                {inner}
              </Link>
            ) : (
              <div {...tileProps}>{inner}</div>
            )}
            <div className={`${s.label} ${labelClass[a.state]}`} style={{ left: a.x - 28, top: a.y + 72 }}>
              <span className={s.labelName}>{a.name}</span>
              <span className={s.labelStatus}>{a.status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
