"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Module 4's lab. A real scalar function of two variables, f(x,y), rendered
   as a heatmap (every pixel's color is a real evaluation of f, not a
   decorative gradient fill), with a draggable point whose gradient vector
   - both partial derivatives, computed analytically - is drawn live. This
   is deliberately the direct visual predecessor to Module 5's gradient
   descent lab: "which way is uphill from here" is the exact question that
   module's optimizer answers by repeatedly asking. */

type Vec = { x: number; y: number };

const SIZE = 360;
const SCALE = 55; // px per unit
const ORIGIN: Vec = { x: SIZE / 2, y: SIZE / 2 };
const A = 1; // f(x,y) = A*x^2 + B*y^2 - an elliptical bowl, steeper along y
const B = 3;

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
function round(n: number, dp = 2): number {
  const f2 = 10 ** dp;
  return Math.round(n * f2) / f2;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// A small, fixed blue->purple->gold ramp - low values (the basin) read cool,
// high values (the walls of the bowl) read hot, so "downhill" reads visually
// as "toward the cooler color" without needing a legend.
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

const MAX_VAL = f(3, 1.8); // covers the visible domain for normalizing color

export function GradientLab({ onInteract }: { onInteract?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [point, setPoint] = useState<Vec>({ x: 1.8, y: -1.1 });
  const [showDescent, setShowDescent] = useState(false);
  const draggingRef = useRef(false);
  const interactedRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // heatmap - computed at a coarser resolution then upscaled, still a
    // real per-cell evaluation of f, not a canned gradient fill
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

    // axes
    ctx.strokeStyle = "#ffffff22";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ORIGIN.y);
    ctx.lineTo(SIZE, ORIGIN.y);
    ctx.moveTo(ORIGIN.x, 0);
    ctx.lineTo(ORIGIN.x, SIZE);
    ctx.stroke();

    const grad = gradient(point.x, point.y);
    const dir = showDescent ? { x: -grad.x, y: -grad.y } : grad;
    const mag = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
    const arrowLen = Math.min(90, 22 * Math.sqrt(mag));
    const tipWorld = { x: point.x + (dir.x / mag) * (arrowLen / SCALE), y: point.y + (dir.y / mag) * (arrowLen / SCALE) };
    const p0 = toScreen(point);
    const p1 = toScreen(tipWorld);

    ctx.strokeStyle = showDescent ? "#4ade95" : "#ff8585";
    ctx.fillStyle = showDescent ? "#4ade95" : "#ff8585";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const ah = 10;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p1.x - ah * Math.cos(ang - Math.PI / 7), p1.y - ah * Math.sin(ang - Math.PI / 7));
    ctx.lineTo(p1.x - ah * Math.cos(ang + Math.PI / 7), p1.y - ah * Math.sin(ang + Math.PI / 7));
    ctx.closePath();
    ctx.fill();

    // the point itself
    ctx.fillStyle = "#eeeee7";
    ctx.beginPath();
    ctx.arc(p0.x, p0.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0a0c10";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [point, showDescent]);

  useEffect(() => {
    draw();
  }, [draw]);

  function updateFromClientPoint(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = { x: clientX - rect.left, y: clientY - rect.top };
    const world = toWorld(px);
    setPoint({ x: clamp(round(world.x, 2), -3, 3), y: clamp(round(world.y, 2), -1.8, 1.8) });
    if (!interactedRef.current) {
      interactedRef.current = true;
      onInteract?.();
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    draggingRef.current = true;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    updateFromClientPoint(e.clientX, e.clientY);
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!draggingRef.current) return;
    updateFromClientPoint(e.clientX, e.clientY);
  }
  function onPointerUp() {
    draggingRef.current = false;
  }

  const grad = gradient(point.x, point.y);
  const fValue = f(point.x, point.y);
  const gradMag = Math.sqrt(grad.x * grad.x + grad.y * grad.y);

  return (
    <div className="grid gap-5 sm:grid-cols-[360px_1fr]">
      <div>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          role="application"
          aria-label={`Gradient lab. Point is at x ${point.x}, y ${point.y}. Drag to move it, or use it with a mouse or touch.`}
          style={{ width: SIZE, height: SIZE, touchAction: "none" }}
          className="cursor-grab rounded-lg border border-[#333a4c] active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        <p className="mt-2 text-[12.5px] text-[#676e7d]">
          Drag anywhere on the surface - cooler colors are lower values of f(x, y), the basin in the middle
          is the minimum.
        </p>
        <button
          type="button"
          onClick={() => setShowDescent((v) => !v)}
          className={`mt-3 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
            showDescent
              ? "border-[#4ade95] bg-[#4ade95] text-[#0a2216]"
              : "border-[#333a4c] bg-[#191d26] text-[#9aa0ae] hover:border-[#ff8585] hover:text-[#eeeee7]"
          }`}
        >
          {showDescent ? "Showing: −∇f (steepest descent)" : "Show −∇f (steepest descent) →"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <Stat label="Point (x, y)" value={`(${point.x}, ${point.y})`} />
        <Stat label="f(x, y)" value={round(fValue)} mono />
        <div className="my-1 h-px bg-[#232838]" />
        <Stat label="∂f/∂x (slope if only x moves)" value={round(grad.x)} mono />
        <Stat label="∂f/∂y (slope if only y moves)" value={round(grad.y)} mono />
        <Stat
          label="∇f (the gradient vector)"
          value={`(${round(grad.x)}, ${round(grad.y)})`}
          mono
          emphasis
          hint={
            showDescent
              ? "The green arrow is −∇f - the single direction that decreases f fastest from this exact point. This is what a gradient-descent optimizer follows."
              : "The red arrow is ∇f itself - it points toward the steepest INCREASE, not decrease. Toggle the button to see the direction training actually moves in."
          }
        />
        <Stat label="‖∇f‖ (how steep it is here)" value={round(gradMag)} mono />
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
