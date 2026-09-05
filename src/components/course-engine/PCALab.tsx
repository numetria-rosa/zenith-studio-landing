"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* Module 3's signature lab. A fixed, seeded point cloud (never Math.random()
   at render time — see the mulberry32 PRNG below — so server and client
   always agree, no hydration mismatch) is rotated by a slider, and PCA is
   recomputed from scratch on every frame: real mean-centering, a real 2x2
   covariance matrix, and a real closed-form eigen-decomposition. Rotating
   the data and watching the principal directions rotate to match is the
   whole point — it's the most direct possible demonstration that
   eigenvectors are a property of the data, not of the coordinate axes. */

type Vec = { x: number; y: number };

// mulberry32 — a small, deterministic PRNG. Same seed -> same sequence,
// every time, on server and client alike.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rng: () => number): number {
  // Box-Muller transform — turns two uniform randoms into one normal one.
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const N_POINTS = 90;
const BASE_POINTS: Vec[] = (() => {
  const rng = mulberry32(20260905);
  const pts: Vec[] = [];
  for (let i = 0; i < N_POINTS; i++) {
    // Elongated along x (variance 2.6) vs y (variance 0.35) — a strongly
    // correlated, elliptical cloud before any rotation is applied.
    pts.push({ x: gaussian(rng) * 1.6, y: gaussian(rng) * 0.6 });
  }
  return pts;
})();

const SIZE = 380;
const SCALE = 45;
const ORIGIN: Vec = { x: SIZE / 2, y: SIZE / 2 };

function toScreen(v: Vec): Vec {
  return { x: ORIGIN.x + v.x * SCALE, y: ORIGIN.y - v.y * SCALE };
}
function rotate(v: Vec, rad: number): Vec {
  return { x: v.x * Math.cos(rad) - v.y * Math.sin(rad), y: v.x * Math.sin(rad) + v.y * Math.cos(rad) };
}
function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function pca(points: Vec[]) {
  const n = points.length;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of points) {
    const dx = p.x - meanX, dy = p.y - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  sxx /= n - 1;
  syy /= n - 1;
  sxy /= n - 1;

  const trace = sxx + syy;
  const det = sxx * syy - sxy * sxy;
  const disc = Math.sqrt(Math.max(0, (trace / 2) ** 2 - det));
  const lambda1 = trace / 2 + disc; // larger eigenvalue
  const lambda2 = trace / 2 - disc;

  function eigenvector(lambda: number): Vec {
    // (S - lambda*I) v = 0 -> for a symmetric 2x2, v = (sxy, lambda - sxx) works
    // whenever sxy isn't ~0; fall back to axis-aligned when it is.
    if (Math.abs(sxy) > 1e-9) {
      const v = { x: sxy, y: lambda - sxx };
      const m = Math.sqrt(v.x * v.x + v.y * v.y);
      return { x: v.x / m, y: v.y / m };
    }
    return lambda === Math.max(lambda1, lambda2) ? { x: 1, y: 0 } : { x: 0, y: 1 };
  }

  return {
    mean: { x: meanX, y: meanY },
    lambda1,
    lambda2,
    pc1: eigenvector(lambda1),
    pc2: eigenvector(lambda2),
  };
}

export function PCALab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angleDeg, setAngleDeg] = useState(20);
  const [showProjection, setShowProjection] = useState(false);

  const rotated = useMemo(() => {
    const rad = (angleDeg * Math.PI) / 180;
    return BASE_POINTS.map((p) => rotate(p, rad));
  }, [angleDeg]);

  const result = useMemo(() => pca(rotated), [rotated]);

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

    // axes
    ctx.strokeStyle = "#232838";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ORIGIN.y);
    ctx.lineTo(SIZE, ORIGIN.y);
    ctx.moveTo(ORIGIN.x, 0);
    ctx.lineTo(ORIGIN.x, SIZE);
    ctx.stroke();

    const { mean, pc1, pc2, lambda1, lambda2 } = result;
    const meanScreen = toScreen(mean);

    // projection lines (drawn under the points so they read as "shadows")
    if (showProjection) {
      ctx.strokeStyle = "#8b7cf655";
      ctx.lineWidth = 1;
      for (const p of rotated) {
        const dx = p.x - mean.x, dy = p.y - mean.y;
        const t = dx * pc1.x + dy * pc1.y;
        const proj = { x: mean.x + t * pc1.x, y: mean.y + t * pc1.y };
        const a = toScreen(p), b = toScreen(proj);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // point cloud (or its 1D projections, highlighted)
    ctx.fillStyle = showProjection ? "#333a4c" : "#5fc2e8";
    for (const p of rotated) {
      const s = toScreen(p);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (showProjection) {
      ctx.fillStyle = "#8b7cf6";
      for (const p of rotated) {
        const dx = p.x - mean.x, dy = p.y - mean.y;
        const t = dx * pc1.x + dy * pc1.y;
        const proj = { x: mean.x + t * pc1.x, y: mean.y + t * pc1.y };
        const s = toScreen(proj);
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // principal axes, length proportional to sqrt(eigenvalue) — a real
    // encoding of "how much variance lives in this direction," not decoration
    function drawAxis(dir: Vec, lambda: number, color: string, label: string) {
      const len = Math.sqrt(Math.max(lambda, 0)) * 1.8;
      const p1 = toScreen({ x: mean.x - dir.x * len, y: mean.y - dir.y * len });
      const p2 = toScreen({ x: mean.x + dir.x * len, y: mean.y + dir.y * len });
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 2.5;
      ctx!.beginPath();
      ctx!.moveTo(p1.x, p1.y);
      ctx!.lineTo(p2.x, p2.y);
      ctx!.stroke();
      ctx!.fillStyle = color;
      ctx!.font = "600 12px 'IBM Plex Mono', monospace";
      ctx!.fillText(label, p2.x + 6, p2.y);
    }
    drawAxis(pc2, lambda2, "#4ade95", "PC2");
    drawAxis(pc1, lambda1, "#f0b429", "PC1");

    ctx.fillStyle = "#eeeee7";
    ctx.beginPath();
    ctx.arc(meanScreen.x, meanScreen.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [result, rotated, showProjection]);

  useEffect(() => {
    draw();
  }, [draw]);

  const totalVar = result.lambda1 + result.lambda2;
  const pc1Pct = totalVar > 0 ? round((result.lambda1 / totalVar) * 100, 1) : 0;
  const pc1AngleDeg = round((Math.atan2(result.pc1.y, result.pc1.x) * 180) / Math.PI, 1);

  return (
    <div className="grid gap-5 sm:grid-cols-[380px_1fr]">
      <div>
        <canvas
          ref={canvasRef}
          data-tour="pca-canvas"
          width={SIZE}
          height={SIZE}
          style={{ width: SIZE, height: SIZE }}
          className="rounded-lg border border-[#333a4c] bg-[#0a0c10]"
        />
        <label data-tour="pca-rotate" className="mt-3 flex flex-col gap-1">
          <span className="flex justify-between text-[12px] text-[#9aa0ae]">
            <span>Rotate the data</span>
            <span className="font-[family-name:var(--font-course-mono)] text-[#eeeee7]">{angleDeg}°</span>
          </span>
          <input
            type="range"
            min={0}
            max={180}
            step={1}
            value={angleDeg}
            onChange={(e) => setAngleDeg(Number(e.target.value))}
            className="accent-[#8b7cf6]"
          />
        </label>
        <button
          type="button"
          data-tour="pca-project"
          onClick={() => setShowProjection((v) => !v)}
          className={`mt-3 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
            showProjection
              ? "border-[#8b7cf6] bg-[#8b7cf6] text-[#120f24]"
              : "border-[#333a4c] bg-[#191d26] text-[#9aa0ae] hover:border-[#8b7cf6] hover:text-[#eeeee7]"
          }`}
        >
          {showProjection ? "Showing: projected onto PC1 (1D)" : "Project onto PC1 →"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <Stat label="PC1 direction (angle)" value={`${pc1AngleDeg}°`} color="#f0b429" />
        <Stat label="λ1 (variance along PC1)" value={round(result.lambda1)} mono />
        <Stat label="λ2 (variance along PC2)" value={round(result.lambda2)} mono />
        <div className="my-1 h-px bg-[#232838]" />
        <Stat
          tourId="pca-variance"
          label="Variance explained by PC1 alone"
          value={`${pc1Pct}%`}
          mono
          emphasis
          hint={
            pc1Pct > 90
              ? "Almost all the information in this 2D cloud lives along one direction — reducing it to 1D (just each point's position along PC1) would lose very little."
              : pc1Pct > 60
                ? "Most of the spread is along PC1, but PC2 still carries a real, non-trivial amount of information."
                : "The two directions carry comparably useful information — collapsing to 1D here would lose a lot."
          }
        />
      </div>
    </div>
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
