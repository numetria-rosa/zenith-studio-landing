"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Module 8's lab. A fixed dataset (assumed drawn from an unknown Gaussian),
   and two sliders — mean and standard deviation — controlling a CANDIDATE
   Gaussian model. The log-likelihood shown is a real computation (the sum
   of log-PDF values at every data point for the current slider settings),
   recomputed every render. Maximizing it by hand with the sliders is
   literally doing maximum likelihood estimation — the "Reveal MLE" button
   then shows the closed-form answer (sample mean/SD) for comparison. */

const DATA = [23, 25, 22, 30, 27, 24, 26, 29, 21, 28];

function gaussianPdf(x: number, mu: number, sigma: number): number {
  const coef = 1 / (sigma * Math.sqrt(2 * Math.PI));
  return coef * Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));
}
function logLikelihood(data: number[], mu: number, sigma: number): number {
  return data.reduce((sum, x) => sum + Math.log(gaussianPdf(x, mu, sigma)), 0);
}
function sampleMean(data: number[]): number {
  return data.reduce((s, v) => s + v, 0) / data.length;
}
function sampleSd(data: number[]): number {
  const m = sampleMean(data);
  return Math.sqrt(data.reduce((s, v) => s + (v - m) ** 2, 0) / data.length);
}
function round(n: number, dp = 3): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

const SIZE_W = 480;
const SIZE_H = 220;
const PAD = { l: 14, r: 14, t: 14, b: 30 };
const X_MIN = 15;
const X_MAX = 35;

const MLE_MU = round(sampleMean(DATA), 2);
const MLE_SIGMA = round(sampleSd(DATA), 2);

export function LikelihoodLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mu, setMu] = useState(24);
  const [sigma, setSigma] = useState(4);

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
    function toX(x: number) {
      return PAD.l + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
    }

    // x axis
    ctx.strokeStyle = "#232838";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t + plotH);
    ctx.lineTo(PAD.l + plotW, PAD.t + plotH);
    ctx.stroke();
    ctx.fillStyle = "#676e7d";
    ctx.font = "11px 'IBM Plex Mono', monospace";
    for (let x = X_MIN; x <= X_MAX; x += 5) {
      ctx.fillText(String(x), toX(x) - 6, PAD.t + plotH + 16);
    }

    // the candidate Gaussian curve
    const maxPdf = gaussianPdf(mu, mu, sigma);
    ctx.strokeStyle = "#8b7cf6";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = X_MIN + (i / 200) * (X_MAX - X_MIN);
      const p = gaussianPdf(x, mu, sigma);
      const y = PAD.t + plotH - (p / maxPdf) * plotH * 0.92;
      if (i === 0) ctx.moveTo(toX(x), y);
      else ctx.lineTo(toX(x), y);
    }
    ctx.stroke();

    // data points as ticks along the axis, with a small "how likely is this
    // point under the current curve" shading via dot size
    DATA.forEach((x) => {
      const sx = toX(x);
      const p = gaussianPdf(x, mu, sigma) / maxPdf;
      ctx.fillStyle = "#ff8585";
      ctx.beginPath();
      ctx.arc(sx, PAD.t + plotH, 3 + p * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8b7cf655";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, PAD.t + plotH);
      ctx.lineTo(sx, PAD.t + plotH - gaussianPdf(x, mu, sigma) / maxPdf * plotH * 0.92);
      ctx.stroke();
    });
  }, [mu, sigma]);

  useEffect(() => {
    draw();
  }, [draw]);

  const ll = logLikelihood(DATA, mu, sigma);
  const llAtMle = logLikelihood(DATA, MLE_MU, MLE_SIGMA);

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        width={SIZE_W}
        height={SIZE_H}
        style={{ width: "100%", maxWidth: SIZE_W, height: SIZE_H }}
        className="rounded-lg border border-[#333a4c] bg-[#0a0c10]"
      />
      <p className="text-[12px] text-[#676e7d]">
        Red dots are the real data points (bigger = more likely under your current curve). The violet curve is
        your candidate Gaussian model.
      </p>
      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="flex justify-between text-[12px] text-[#9aa0ae]">
              <span>μ (candidate mean)</span>
              <span className="font-[family-name:var(--font-course-mono)] text-[#eeeee7]">{mu.toFixed(1)}</span>
            </span>
            <input type="range" min={18} max={32} step={0.1} value={mu} onChange={(e) => setMu(Number(e.target.value))} className="accent-[#8b7cf6]" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="flex justify-between text-[12px] text-[#9aa0ae]">
              <span>σ (candidate standard deviation)</span>
              <span className="font-[family-name:var(--font-course-mono)] text-[#eeeee7]">{sigma.toFixed(1)}</span>
            </span>
            <input type="range" min={0.5} max={10} step={0.1} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} className="accent-[#8b7cf6]" />
          </label>
          <button
            type="button"
            onClick={() => {
              setMu(MLE_MU);
              setSigma(MLE_SIGMA);
            }}
            className="self-start rounded-full border border-[#4ade95] bg-[#4ade95]/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#4ade95] hover:bg-[#4ade95]/20"
          >
            Reveal the MLE (best-fitting) values →
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:w-[220px]">
          <Stat label="Log-likelihood (higher is better fit)" value={round(ll)} mono emphasis />
          <Stat
            label="Log-likelihood at the true MLE"
            value={round(llAtMle)}
            mono
            hint={`The MLE is μ=${MLE_MU}, σ=${MLE_SIGMA} — no other values of μ and σ produce a higher log-likelihood for this exact data.`}
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
