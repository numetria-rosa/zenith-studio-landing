"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Module 2's flagship lab. A 2x2 matrix is not an abstract grid of numbers
   here - it's a function that moves every point in the plane, and this lets
   a student watch it do that to a whole grid and a unit square in real
   time. Same "real computation, not decoration" discipline as VectorLab:
   every transformed point on screen is genuinely M * v for the student's
   current a/b/c/d, computed on every render. */

type Mat = { a: number; b: number; c: number; d: number };
type Vec = { x: number; y: number };

const SIZE = 360;
const SCALE = 30;
const ORIGIN: Vec = { x: SIZE / 2, y: SIZE / 2 };
const RANGE = 3; // grid lines drawn from -RANGE to +RANGE

function apply(m: Mat, v: Vec): Vec {
  return { x: m.a * v.x + m.b * v.y, y: m.c * v.x + m.d * v.y };
}
function toScreen(v: Vec): Vec {
  return { x: ORIGIN.x + v.x * SCALE, y: ORIGIN.y - v.y * SCALE };
}
function det(m: Mat): number {
  return m.a * m.d - m.b * m.c;
}
function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

const PRESETS: Record<string, Mat> = {
  Identity: { a: 1, b: 0, c: 0, d: 1 },
  "Rotate 45°": { a: Math.SQRT1_2, b: -Math.SQRT1_2, c: Math.SQRT1_2, d: Math.SQRT1_2 },
  "Scale ×2": { a: 2, b: 0, c: 0, d: 2 },
  Shear: { a: 1, b: 0.8, c: 0, d: 1 },
  Collapse: { a: 1, b: 2, c: 0.5, d: 1 },
};

export function MatrixLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [m, setM] = useState<Mat>(PRESETS.Shear);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    // faint original grid, for reference
    ctx.strokeStyle = "#1c212c";
    ctx.lineWidth = 1;
    for (let i = -RANGE; i <= RANGE; i++) {
      const p1 = toScreen({ x: i, y: -RANGE });
      const p2 = toScreen({ x: i, y: RANGE });
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      const p3 = toScreen({ x: -RANGE, y: i });
      const p4 = toScreen({ x: RANGE, y: i });
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    }

    // transformed grid - every line segment run through the matrix
    ctx.strokeStyle = "#5fc2e855";
    ctx.lineWidth = 1.25;
    const steps = 12;
    for (let i = -RANGE; i <= RANGE; i++) {
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const y = -RANGE + (s / steps) * (2 * RANGE);
        const p = toScreen(apply(m, { x: i, y }));
        if (s === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const x = -RANGE + (s / steps) * (2 * RANGE);
        const p = toScreen(apply(m, { x, y: i }));
        if (s === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // axes
    ctx.strokeStyle = "#333a4c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, ORIGIN.y);
    ctx.lineTo(SIZE, ORIGIN.y);
    ctx.moveTo(ORIGIN.x, 0);
    ctx.lineTo(ORIGIN.x, SIZE);
    ctx.stroke();

    // the transformed unit square, filled, so area-scaling is visible
    const corners = [
      apply(m, { x: 0, y: 0 }),
      apply(m, { x: 1, y: 0 }),
      apply(m, { x: 1, y: 1 }),
      apply(m, { x: 0, y: 1 }),
    ].map(toScreen);
    ctx.fillStyle = "#8b7cf633";
    ctx.strokeStyle = "#8b7cf6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    corners.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // transformed basis vectors e1, e2
    function drawArrow(v: Vec, color: string, label: string) {
      const tip = toScreen(v);
      ctx!.strokeStyle = color;
      ctx!.fillStyle = color;
      ctx!.lineWidth = 2.5;
      ctx!.beginPath();
      ctx!.moveTo(ORIGIN.x, ORIGIN.y);
      ctx!.lineTo(tip.x, tip.y);
      ctx!.stroke();
      const ang = Math.atan2(tip.y - ORIGIN.y, tip.x - ORIGIN.x);
      const ah = 9;
      ctx!.beginPath();
      ctx!.moveTo(tip.x, tip.y);
      ctx!.lineTo(tip.x - ah * Math.cos(ang - Math.PI / 7), tip.y - ah * Math.sin(ang - Math.PI / 7));
      ctx!.lineTo(tip.x - ah * Math.cos(ang + Math.PI / 7), tip.y - ah * Math.sin(ang + Math.PI / 7));
      ctx!.closePath();
      ctx!.fill();
      ctx!.font = "600 12px 'IBM Plex Mono', monospace";
      ctx!.fillText(label, tip.x + 8, tip.y - 8);
    }
    drawArrow(apply(m, { x: 1, y: 0 }), "#5fc2e8", "M·e1");
    drawArrow(apply(m, { x: 0, y: 1 }), "#4ade95", "M·e2");
  }, [m]);

  useEffect(() => {
    draw();
  }, [draw]);

  function setField(field: keyof Mat, value: number) {
    setM((prev) => ({ ...prev, [field]: round(value, 2) }));
  }

  const determinant = round(det(m));
  const invertible = Math.abs(determinant) > 1e-9;

  return (
    <div className="grid gap-5 sm:grid-cols-[360px_1fr]">
      <div>
        <canvas
          ref={canvasRef}
          data-tour="matrix-canvas"
          width={SIZE}
          height={SIZE}
          style={{ width: SIZE, height: SIZE }}
          className="rounded-lg border border-[#333a4c] bg-[#0a0c10]"
        />
        <div data-tour="matrix-presets" className="mt-3 flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([name, preset]) => (
            <button
              key={name}
              type="button"
              onClick={() => setM(preset)}
              className="rounded-full border border-[#333a4c] bg-[#191d26] px-3 py-1 text-[12px] font-semibold text-[#9aa0ae] transition hover:border-[#8b7cf6] hover:text-[#eeeee7]"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div data-tour="matrix-sliders" className="grid grid-cols-2 gap-x-4 gap-y-3">
          <MatrixSlider label="a" value={m.a} onChange={(v) => setField("a", v)} />
          <MatrixSlider label="b" value={m.b} onChange={(v) => setField("b", v)} />
          <MatrixSlider label="c" value={m.c} onChange={(v) => setField("c", v)} />
          <MatrixSlider label="d" value={m.d} onChange={(v) => setField("d", v)} />
        </div>
        <div className="my-1 h-px bg-[#232838]" />
        <Stat label="M · e1 (where (1,0) lands)" value={`(${round(m.a)}, ${round(m.c)})`} color="#5fc2e8" />
        <Stat label="M · e2 (where (0,1) lands)" value={`(${round(m.b)}, ${round(m.d)})`} color="#4ade95" />
        <Stat
          tourId="matrix-det"
          label="det(M) - the unit square's new area"
          value={determinant}
          mono
          emphasis
          hint={
            !invertible
              ? "det(M) = 0 - the whole plane just got flattened onto a line. This matrix has no inverse: information was permanently destroyed, and no matrix could undo this transformation."
              : determinant < 0
                ? "Negative determinant - the transformation also flips orientation (like a mirror), in addition to scaling area by the size of this number."
                : "The shaded parallelogram is exactly this many times the area of the original unit square."
          }
        />
      </div>
    </div>
  );
}

function MatrixSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between text-[12px] text-[#9aa0ae]">
        <span>{label}</span>
        <span className="font-[family-name:var(--font-course-mono)] text-[#eeeee7]">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={-2}
        max={2}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-[#8b7cf6]"
      />
    </label>
  );
}

function Stat({
  label,
  value,
  color,
  mono,
  emphasis,
  hint,
  tourId,
}: {
  label: string;
  value: string | number;
  color?: string;
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
          style={{ color: color ?? (emphasis ? "#8b7cf6" : "#eeeee7") }}
        >
          {value}
        </span>
      </div>
      {hint && <p className="mt-1 text-[12px] text-[#676e7d]">{hint}</p>}
    </div>
  );
}
