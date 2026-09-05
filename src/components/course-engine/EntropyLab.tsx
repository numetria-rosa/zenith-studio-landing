"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Module 9's lab. Two categorical distributions over the same 4 categories —
   a "true" distribution p and a "predicted" distribution q — each controlled
   by 4 independent weight sliders, normalized to sum to 1 so they're always
   valid probability distributions. Entropy, cross-entropy, and KL divergence
   are all computed directly from the normalized values on every render —
   real information theory, not a lookup table. */

const CATEGORIES = ["Cat", "Dog", "Bird", "Fish"];
const LOG2 = Math.log(2);
function log2(x: number): number {
  return Math.log(x) / LOG2;
}
function normalize(weights: number[]): number[] {
  const sum = weights.reduce((s, v) => s + v, 0) || 1;
  return weights.map((w) => w / sum);
}
function entropy(p: number[]): number {
  return -p.reduce((s, pi) => (pi > 0 ? s + pi * log2(pi) : s), 0);
}
function crossEntropy(p: number[], q: number[]): number {
  return -p.reduce((s, pi, i) => (pi > 0 ? s + pi * log2(Math.max(q[i], 1e-9)) : s), 0);
}
function round(n: number, dp = 3): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

const SIZE_W = 460;
const SIZE_H = 200;
const COLORS = { p: "#5fc2e8", q: "#8b7cf6" };

export function EntropyLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pw, setPw] = useState([6, 2, 1, 1]);
  const [qw, setQw] = useState([3, 3, 2, 2]);

  const p = normalize(pw);
  const q = normalize(qw);

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

    const pad = { l: 10, r: 10, t: 10, b: 26 };
    const plotW = SIZE_W - pad.l - pad.r;
    const plotH = SIZE_H - pad.t - pad.b;
    const groupW = plotW / CATEGORIES.length;
    const barW = groupW * 0.32;

    ctx.strokeStyle = "#232838";
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + plotH);
    ctx.lineTo(pad.l + plotW, pad.t + plotH);
    ctx.stroke();

    CATEGORIES.forEach((label, i) => {
      const gx = pad.l + i * groupW + groupW / 2;
      const pH = p[i] * plotH;
      const qH = q[i] * plotH;
      ctx.fillStyle = COLORS.p;
      ctx.fillRect(gx - barW - 2, pad.t + plotH - pH, barW, pH);
      ctx.fillStyle = COLORS.q;
      ctx.fillRect(gx + 2, pad.t + plotH - qH, barW, qH);
      ctx.fillStyle = "#9aa0ae";
      ctx.font = "11px 'IBM Plex Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, gx, pad.t + plotH + 16);
    });
    ctx.textAlign = "left";
  }, [p, q]);

  useEffect(() => {
    draw();
  }, [draw]);

  const hP = entropy(p);
  const hPQ = crossEntropy(p, q);
  const kl = hPQ - hP;

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        data-tour="entropy-canvas"
        width={SIZE_W}
        height={SIZE_H}
        style={{ width: "100%", maxWidth: SIZE_W, height: SIZE_H }}
        className="rounded-lg border border-[#333a4c] bg-[#0a0c10]"
      />
      <div className="flex items-center gap-4 text-[12px]">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.p }} /> True (p)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.q }} /> Predicted (q)</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div data-tour="entropy-p-sliders" className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5fc2e8]">True distribution p</span>
          {CATEGORIES.map((label, i) => (
            <SliderRow key={label} label={label} value={pw[i]} onChange={(v) => setPw((arr) => arr.map((x, j) => (j === i ? v : x)))} />
          ))}
        </div>
        <div data-tour="entropy-q-sliders" className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8b7cf6]">Predicted distribution q</span>
          {CATEGORIES.map((label, i) => (
            <SliderRow key={label} label={label} value={qw[i]} onChange={(v) => setQw((arr) => arr.map((x, j) => (j === i ? v : x)))} />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="H(p) — entropy of the true distribution" value={`${round(hP)} bits`} mono />
        <Stat label="H(p, q) — cross-entropy" value={`${round(hPQ)} bits`} mono emphasis />
        <Stat
          tourId="entropy-kl"
          label="D_KL(p ‖ q) — KL divergence"
          value={`${round(kl)} bits`}
          mono
          hint={kl < 0.01 ? "p and q are (almost) identical — the model's predictions match reality." : "This is exactly the extra bits 'wasted' by predicting q when the truth is p — make q match p perfectly and this drops to 0."}
        />
      </div>
    </div>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-2 text-[12px] text-[#9aa0ae]">
      <span className="w-10 flex-shrink-0">{label}</span>
      <input type="range" min={0.1} max={10} step={0.1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[#8b7cf6]" />
    </label>
  );
}

function Stat({ label, value, mono, emphasis, hint, tourId }: { label: string; value: string; mono?: boolean; emphasis?: boolean; hint?: string; tourId?: string }) {
  return (
    <div data-tour={tourId} className="rounded-lg border border-[#232838] bg-[#151920] p-3">
      <div className="text-[11px] text-[#9aa0ae]">{label}</div>
      <div className={`mt-1 ${mono ? "font-[family-name:var(--font-course-mono)]" : ""} ${emphasis ? "text-[16px] font-bold" : "text-[14px] font-semibold"}`} style={{ color: emphasis ? "#8b7cf6" : "#eeeee7" }}>
        {value}
      </div>
      {hint && <p className="mt-1 text-[11px] text-[#676e7d]">{hint}</p>}
    </div>
  );
}
