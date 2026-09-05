"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Module 7's lab — a real demonstration of the Central Limit Theorem. The
   POPULATION below is deliberately skewed (nothing bell-shaped about it),
   generated once with a seeded PRNG so server and client always agree (no
   hydration risk). Every "draw a sample" click genuinely samples n values
   from that population (with replacement) and computes their real mean —
   the histogram is built from real numbers, not a pre-rendered bell curve.
   The point the module is building toward: no matter how skewed the
   population is, the distribution of SAMPLE MEANS becomes bell-shaped and
   narrower as the sample size n grows. */

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

const POPULATION: number[] = (() => {
  const rng = mulberry32(20260906);
  const pop: number[] = [];
  // A deliberately skewed "income-like" population: mostly small values,
  // a long right tail of large ones — nothing close to a bell curve.
  for (let i = 0; i < 2000; i++) {
    pop.push(Math.round(-Math.log(1 - rng()) * 30 + 10));
  }
  return pop;
})();

const POP_MEAN = POPULATION.reduce((s, v) => s + v, 0) / POPULATION.length;
const POP_VAR = POPULATION.reduce((s, v) => s + (v - POP_MEAN) ** 2, 0) / POPULATION.length;
const POP_SD = Math.sqrt(POP_VAR);

const SIZE_W = 480;
const SIZE_H = 220;
const PAD = { l: 40, r: 14, t: 14, b: 28 };
const N_BINS = 24;

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}
function sd(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

export function SamplingLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [n, setN] = useState(5);
  const [sampleMeans, setSampleMeans] = useState<number[]>([]);

  function drawSamples(count: number) {
    const next: number[] = [];
    for (let k = 0; k < count; k++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += POPULATION[Math.floor(Math.random() * POPULATION.length)];
      }
      next.push(sum / n);
    }
    setSampleMeans((prev) => [...prev, ...next]);
  }
  function reset() {
    setSampleMeans([]);
  }

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

    // fixed axis range so the bars don't jump around as more data arrives
    const lo = 0;
    const hi = Math.max(...POPULATION) * 0.6;
    const binW = (hi - lo) / N_BINS;
    const counts = new Array(N_BINS).fill(0);
    sampleMeans.forEach((v) => {
      const idx = Math.min(N_BINS - 1, Math.max(0, Math.floor((v - lo) / binW)));
      counts[idx]++;
    });
    const maxCount = Math.max(1, ...counts);

    ctx.strokeStyle = "#232838";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t + plotH);
    ctx.lineTo(PAD.l + plotW, PAD.t + plotH);
    ctx.stroke();

    ctx.fillStyle = "#8b7cf6aa";
    counts.forEach((c, i) => {
      const barH = (c / maxCount) * plotH;
      const x = PAD.l + (i / N_BINS) * plotW;
      const w = plotW / N_BINS - 1;
      ctx.fillRect(x, PAD.t + plotH - barH, w, barH);
    });

    // true population mean reference line
    const meanX = PAD.l + ((POP_MEAN - lo) / (hi - lo)) * plotW;
    ctx.strokeStyle = "#f0b429";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(meanX, PAD.t);
    ctx.lineTo(meanX, PAD.t + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f0b429";
    ctx.font = "11px 'IBM Plex Mono', monospace";
    ctx.fillText("population mean", meanX + 4, PAD.t + 12);
  }, [sampleMeans]);

  useEffect(() => {
    draw();
  }, [draw]);

  const observedSd = sampleMeans.length > 1 ? sd(sampleMeans) : null;
  const predictedSd = POP_SD / Math.sqrt(n);

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
              <span>Sample size n (per draw)</span>
              <span className="font-[family-name:var(--font-course-mono)] text-[#eeeee7]">{n}</span>
            </span>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={n}
              onChange={(e) => {
                setN(Number(e.target.value));
                reset();
              }}
              className="accent-[#8b7cf6]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => drawSamples(1)} className="rounded-full border border-[#333a4c] bg-[#191d26] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#9aa0ae] hover:border-[#8b7cf6] hover:text-[#eeeee7]">
              Draw 1 sample
            </button>
            <button type="button" onClick={() => drawSamples(50)} className="rounded-full border border-[#333a4c] bg-[#191d26] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#9aa0ae] hover:border-[#8b7cf6] hover:text-[#eeeee7]">
              Draw 50 samples
            </button>
            <button type="button" onClick={reset} className="rounded-full border border-[#333a4c] bg-[#191d26] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#9aa0ae] hover:border-[#ff8585] hover:text-[#eeeee7]">
              ↺ Reset
            </button>
          </div>
          <p className="text-[12px] text-[#676e7d]">
            The population itself is heavily right-skewed (most values small, a long tail of large ones) — each
            bar above is the mean of one random sample of size n drawn from it.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:w-[220px]">
          <Stat label="Sample means collected" value={sampleMeans.length} mono />
          <Stat label="Population mean (true)" value={round(POP_MEAN)} mono />
          <Stat label="Mean of sample means" value={sampleMeans.length > 0 ? round(mean(sampleMeans)) : "—"} mono emphasis />
          <Stat
            label="Spread (SD) of sample means"
            value={observedSd !== null ? round(observedSd) : "—"}
            mono
            hint={`Predicted by theory: population SD / √n = ${round(predictedSd)}. Compare the two as you collect more samples.`}
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
