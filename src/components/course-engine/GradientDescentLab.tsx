"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Module 5's lab - the direct payoff of Module 4's gradient. Same loss
   surface f(x,y) = x^2 + 3y^2, but now the student actually RUNS gradient
   descent on it: pick a learning rate, step (or take 10 steps at once), and
   watch the real path - including, if the learning rate is too big,
   genuine oscillation and divergence, not a scripted "bad" animation. The
   update rule below is the literal textbook gradient-descent step, nothing
   simplified for effect. */

type Vec = { x: number; y: number };

const SIZE = 380;
const SCALE = 55;
const ORIGIN: Vec = { x: SIZE / 2, y: SIZE / 2 };
const A = 1;
const B = 3;
const DIVERGE_THRESHOLD = 8; // |x| or |y| beyond this is treated as blown up

function f(x: number, y: number): number {
  return A * x * x + B * y * y;
}
function gradient(x: number, y: number): Vec {
  return { x: 2 * A * x, y: 2 * B * y };
}
function toScreen(v: Vec): Vec {
  return { x: ORIGIN.x + v.x * SCALE, y: ORIGIN.y - v.y * SCALE };
}
function toWorld(px: Vec): Vec {
  return { x: (px.x - ORIGIN.x) / SCALE, y: -(px.y - ORIGIN.y) / SCALE };
}
function round(n: number, dp = 3): number {
  const f2 = 10 ** dp;
  return Math.round(n * f2) / f2;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function heatColor(t: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [0, [10, 12, 16]],
    [0.35, [26, 27, 74]],
    [0.65, [95, 68, 176]],
    [1, [240, 180, 41]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (t >= t0 && t <= t1) {
      const u = (t - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * u),
        Math.round(c0[1] + (c1[1] - c0[1]) * u),
        Math.round(c0[2] + (c1[2] - c0[2]) * u),
      ];
    }
  }
  return stops[stops.length - 1][1];
}
const MAX_VAL = f(3, 1.8);

const START: Vec = { x: 2.6, y: 1.5 };

export function GradientDescentLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lr, setLr] = useState(0.15);
  const [path, setPath] = useState<Vec[]>([START]);

  const current = path[path.length - 1];
  const diverged = Math.abs(current.x) > DIVERGE_THRESHOLD || Math.abs(current.y) > DIVERGE_THRESHOLD;

  function step() {
    setPath((prev) => {
      if (prev.length > 300) return prev; // safety cap, not a pedagogical limit
      const last = prev[prev.length - 1];
      if (Math.abs(last.x) > DIVERGE_THRESHOLD || Math.abs(last.y) > DIVERGE_THRESHOLD) return prev;
      const g = gradient(last.x, last.y);
      const next = { x: last.x - lr * g.x, y: last.y - lr * g.y };
      return [...prev, next];
    });
  }
  function stepN(n: number) {
    for (let i = 0; i < n; i++) step();
  }
  function reset(newStart?: Vec) {
    setPath([newStart ?? START]);
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const cell = 6;
    for (let py = 0; py < SIZE; py += cell) {
      for (let px = 0; px < SIZE; px += cell) {
        const world = toWorld({ x: px + cell / 2, y: py + cell / 2 });
        const val = f(world.x, world.y);
        const t = clamp(val / MAX_VAL, 0, 1);
        const [r, g, b] = heatColor(t);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, cell, cell);
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // the descent path, drawn as connected segments
    ctx.strokeStyle = "#eeeee7";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    path.forEach((p, i) => {
      const s = toScreen({ x: clamp(p.x, -6, 6), y: clamp(p.y, -6, 6) });
      if (i === 0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    ctx.stroke();
    path.forEach((p, i) => {
      const s = toScreen({ x: clamp(p.x, -6, 6), y: clamp(p.y, -6, 6) });
      ctx.fillStyle = i === path.length - 1 ? "#ff8585" : "#eeeee799";
      ctx.beginPath();
      ctx.arc(s.x, s.y, i === path.length - 1 ? 5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [path]);

  useEffect(() => {
    draw();
  }, [draw]);

  function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const world = toWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    reset({ x: clamp(round(world.x, 2), -3, 3), y: clamp(round(world.y, 2), -1.8, 1.8) });
  }

  const loss = f(current.x, current.y);
  const isOscillating = path.length >= 4 && !diverged && (() => {
    // a crude, honest oscillation detector: the x-sign of consecutive steps
    // flips back and forth for several steps in a row, without shrinking.
    const tail = path.slice(-4);
    const signs = tail.map((p) => Math.sign(p.y));
    return signs[0] !== 0 && signs[0] === signs[2] && signs[1] === signs[3] && signs[0] !== signs[1];
  })();

  return (
    <div className="grid gap-5 sm:grid-cols-[380px_1fr]">
      <div>
        <canvas
          ref={canvasRef}
          data-tour="gd-canvas"
          width={SIZE}
          height={SIZE}
          style={{ width: SIZE, height: SIZE }}
          className="cursor-crosshair rounded-lg border border-[#333a4c]"
          onClick={onCanvasClick}
        />
        <p className="mt-2 text-[12.5px] text-[#676e7d]">Click anywhere to restart from that point.</p>

        <label data-tour="gd-lr" className="mt-3 flex flex-col gap-1">
          <span className="flex justify-between text-[12px] text-[#9aa0ae]">
            <span>Learning rate</span>
            <span className="font-[family-name:var(--font-course-mono)] text-[#eeeee7]">{lr.toFixed(3)}</span>
          </span>
          <input
            type="range"
            min={0.01}
            max={0.4}
            step={0.005}
            value={lr}
            onChange={(e) => setLr(Number(e.target.value))}
            className="accent-[#8b7cf6]"
          />
        </label>

        <div data-tour="gd-steps" className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => step()} className="rounded-full border border-[#333a4c] bg-[#191d26] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#9aa0ae] hover:border-[#8b7cf6] hover:text-[#eeeee7]">
            Step ×1
          </button>
          <button type="button" onClick={() => stepN(10)} className="rounded-full border border-[#333a4c] bg-[#191d26] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#9aa0ae] hover:border-[#8b7cf6] hover:text-[#eeeee7]">
            Step ×10
          </button>
          <button type="button" onClick={() => reset()} className="rounded-full border border-[#333a4c] bg-[#191d26] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#9aa0ae] hover:border-[#ff8585] hover:text-[#eeeee7]">
            ↺ Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Stat label="Iteration" value={path.length - 1} mono />
        <Stat label="Current point" value={`(${round(current.x, 2)}, ${round(current.y, 2)})`} mono />
        <Stat
          tourId="gd-loss"
          label="Loss f(x, y)"
          value={diverged ? "∞ (diverged)" : round(loss)}
          mono
          emphasis
          hint={
            diverged
              ? "The learning rate is too large for this surface's curvature - each step overshoots further than the last, and the loss is growing without bound instead of shrinking. Lower the learning rate and reset."
              : isOscillating
                ? "The point is bouncing back and forth across the valley instead of settling into it - the learning rate is too large for how steep this direction is, even though it hasn't fully diverged yet."
                : path.length > 15 && Math.abs(current.x) < 0.05 && Math.abs(current.y) < 0.05
                  ? "Converged - the point has settled essentially at the minimum, (0, 0)."
                  : "Keep stepping - each step moves opposite to the gradient at the current point."
          }
        />
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
  tourId,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
  emphasis?: boolean;
  hint?: string;
  tourId?: string;
}) {
  return (
    <div data-tour={tourId}>
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
