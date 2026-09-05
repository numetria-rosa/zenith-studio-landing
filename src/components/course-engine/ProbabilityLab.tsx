"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Module 6's lab - a real Bernoulli-trial simulator. Every flip is a genuine
   Math.random() draw, generated only inside a click handler (never during
   render), so there's no hydration risk: the server and the first client
   render both show zero flips, and randomness only enters once a real user
   interaction has happened. The running-average line is the actual law of
   large numbers happening on screen, not an animation of it. */

const SIZE_W = 480;
const SIZE_H = 220;
const PAD = { l: 40, r: 14, t: 14, b: 24 };

function round(n: number, dp = 4): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export function ProbabilityLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trueP, setTrueP] = useState(0.5);
  const [flips, setFlips] = useState<number[]>([]); // 1 = heads, 0 = tails

  function doFlips(n: number) {
    const next: number[] = [];
    for (let i = 0; i < n; i++) next.push(Math.random() < trueP ? 1 : 0);
    setFlips((prev) => [...prev, ...next]);
  }
  function reset() {
    setFlips([]);
  }

  const n = flips.length;
  const heads = flips.reduce((s, v) => s + v, 0);
  const empirical = n > 0 ? heads / n : 0;
  const variance = trueP * (1 - trueP);
  const standardError = n > 0 ? Math.sqrt(variance / n) : null;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = SIZE_W * dpr;
    canvas.height = SIZE_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE_W, SIZE_H);

    const plotW = SIZE_W - PAD.l - PAD.r;
    const plotH = SIZE_H - PAD.t - PAD.b;
    function toX(i: number, total: number) {
      return PAD.l + (total <= 1 ? 0 : (i / (total - 1)) * plotW);
    }
    function toY(p: number) {
      return PAD.t + (1 - p) * plotH;
    }

    // axes + gridlines at 0, 0.5, 1
    ctx.strokeStyle = "#232838";
    ctx.fillStyle = "#676e7d";
    ctx.font = "11px 'IBM Plex Mono', monospace";
    ctx.lineWidth = 1;
    [0, 0.5, 1].forEach((p) => {
      const y = toY(p);
      ctx.beginPath();
      ctx.moveTo(PAD.l, y);
      ctx.lineTo(SIZE_W - PAD.r, y);
      ctx.stroke();
      ctx.fillText(p.toFixed(1), 6, y + 4);
    });

    // true probability reference line
    ctx.strokeStyle = "#f0b429";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD.l, toY(trueP));
    ctx.lineTo(SIZE_W - PAD.r, toY(trueP));
    ctx.stroke();
    ctx.setLineDash([]);

    // running average path
    if (n > 0) {
      let runningHeads = 0;
      ctx.strokeStyle = "#5fc2e8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      flips.forEach((v, i) => {
        runningHeads += v;
        const p = runningHeads / (i + 1);
        const x = toX(i, n);
        const y = toY(p);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [flips, trueP, n]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        width={SIZE_W}
        height={SIZE_H}
        style={{ width: "100%", maxWidth: SIZE_W, height: SIZE_H }}
        className="rounded-lg border border-[#333a4c] bg-[#0a0c10]"
      />
      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="flex justify-between text-[12px] text-[#9aa0ae]">
              <span>True probability p (this coin&apos;s real bias)</span>
              <span className="font-[family-name:var(--font-course-mono)] text-[#eeeee7]">{trueP.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={0.05}
              max={0.95}
              step={0.01}
              value={trueP}
              onChange={(e) => {
                setTrueP(Number(e.target.value));
                reset();
              }}
              className="accent-[#8b7cf6]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => doFlips(1)} className="rounded-full border border-[#333a4c] bg-[#191d26] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#9aa0ae] hover:border-[#8b7cf6] hover:text-[#eeeee7]">
              Flip ×1
            </button>
            <button type="button" onClick={() => doFlips(10)} className="rounded-full border border-[#333a4c] bg-[#191d26] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#9aa0ae] hover:border-[#8b7cf6] hover:text-[#eeeee7]">
              Flip ×10
            </button>
            <button type="button" onClick={() => doFlips(100)} className="rounded-full border border-[#333a4c] bg-[#191d26] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#9aa0ae] hover:border-[#8b7cf6] hover:text-[#eeeee7]">
              Flip ×100
            </button>
            <button type="button" onClick={reset} className="rounded-full border border-[#333a4c] bg-[#191d26] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#9aa0ae] hover:border-[#ff8585] hover:text-[#eeeee7]">
              ↺ Reset
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:w-[220px]">
          <Stat label="Flips (n)" value={n} mono />
          <Stat label="Heads" value={heads} mono />
          <Stat label="Empirical probability" value={n > 0 ? round(empirical) : "-"} mono emphasis />
          <Stat
            label="Standard error of the mean"
            value={standardError !== null ? round(standardError) : "-"}
            mono
            hint="Shrinks as 1/√n - this is exactly why the blue line's wobble calms down as n grows, not because of any special rule beyond more data averaging out noise."
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
  emphasis,
  hint,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
  emphasis?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] text-[#9aa0ae]">{label}</span>
        <span
          className={`text-right ${mono ? "font-[family-name:var(--font-course-mono)]" : ""} ${
            emphasis ? "text-[17px] font-bold" : "text-[14px] font-semibold"
          }`}
          style={{ color: emphasis ? "#8b7cf6" : "#eeeee7" }}
        >
          {value}
        </span>
      </div>
      {hint && <p className="mt-1 text-[12px] text-[#676e7d]">{hint}</p>}
    </div>
  );
}
