"use client";

import { useState } from "react";
import { SERVICE_ORDER, SERVICE_COLOR, SERVICE_SHORT, fmtMoney } from "@/lib/hq";
import type { HqMrrMonth } from "@/lib/hq/build";

export function MrrChart({ months }: { months: HqMrrMonth[] }) {
  const [showTable, setShowTable] = useState(false);
  const [tip, setTip] = useState<{ x: number; month: HqMrrMonth } | null>(null);

  return (
    <section className="card pad">
      <div className="ctop">
        <h2>Monthly recurring revenue</h2>
        <div className="legend">
          {SERVICE_ORDER.map((s) => (
            <span key={s}>
              <i style={{ background: SERVICE_COLOR[s] }} />
              {SERVICE_SHORT[s]}
            </span>
          ))}
        </div>
        <button className="link" type="button" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>

      {showTable ? (
        <div className="tbl-wrap">
          <table className="tbl" style={{ minWidth: 0 }}>
            <thead>
              <tr>
                <th>Month</th>
                {SERVICE_ORDER.map((s) => (
                  <th key={s} className="r">
                    {SERVICE_SHORT[s]}
                  </th>
                ))}
                <th className="r">Total</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.label}>
                  <td>{m.label}</td>
                  {SERVICE_ORDER.map((s) => (
                    <td key={s} className="r num">
                      {fmtMoney(m.bySlug[s] ?? 0)}
                    </td>
                  ))}
                  <td className="r num">
                    <b>{fmtMoney(m.totalCents)}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Bars months={months} tip={tip} setTip={setTip} />
      )}
    </section>
  );
}

function Bars({ months, tip, setTip }: { months: HqMrrMonth[]; tip: { x: number; month: HqMrrMonth } | null; setTip: (t: { x: number; month: HqMrrMonth } | null) => void }) {
  const W = 720,
    H = 280,
    L = 52,
    B = 30,
    T = 24;
  const max = Math.ceil(Math.max(1, ...months.map((m) => m.totalCents / 100)) / 2000) * 2000 || 2000;
  const bw = 46;
  const step = (W - L - 10) / Math.max(1, months.length);

  const gridLines = [];
  for (let g = 0; g <= max; g += max / 4) {
    const y = T + (H - T - B) * (1 - g / max);
    gridLines.push(
      <g key={g}>
        <line className="gl" x1={L} x2={W} y1={y} y2={y} />
        <text className="al" x={L - 10} y={y + 4} textAnchor="end">
          ${g / 1000}k
        </text>
      </g>
    );
  }

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Monthly recurring revenue by service">
        {gridLines}
        {months.map((m, i) => {
          const x = L + step * i + (step - bw) / 2;
          let base = H - B;
          const bars = SERVICE_ORDER.map((s) => {
            const v = (m.bySlug[s] ?? 0) / 100;
            if (!v) return null;
            const h = ((H - T - B) * v) / max;
            base -= h;
            return <rect key={s} x={x} y={base + 1} width={bw} height={Math.max(0, h - 2)} rx={3} fill={SERVICE_COLOR[s]} />;
          });
          return (
            <g key={m.label}>
              {bars}
              <text className="tl2" x={x + bw / 2} y={base - 8} textAnchor="middle">
                {m.totalCents >= 100000 ? `$${(m.totalCents / 100000).toFixed(1)}k` : fmtMoney(m.totalCents)}
              </text>
              <text className="al" x={x + bw / 2} y={H - 8} textAnchor="middle">
                {m.label}
              </text>
              <rect
                className="hit"
                x={L + step * i}
                y={T}
                width={step}
                height={H - T - B}
                onMouseMove={(e) => setTip({ x: e.clientX, month: m })}
                onMouseLeave={() => setTip(null)}
              />
            </g>
          );
        })}
      </svg>
      {tip && (
        <div className="tip" style={{ left: 16, top: 10 }}>
          <b>{tip.month.label}</b>
          {[...SERVICE_ORDER].reverse().map((s) => (
            <div className="r" key={s}>
              <span>
                <i style={{ background: SERVICE_COLOR[s] }} />
                {SERVICE_SHORT[s]}
              </span>
              <span className="num">{fmtMoney(tip.month.bySlug[s] ?? 0)}</span>
            </div>
          ))}
          <div className="r t">
            <span>Total MRR</span>
            <span className="num">{fmtMoney(tip.month.totalCents)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
