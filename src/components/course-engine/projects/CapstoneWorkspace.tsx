"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* The capstone workspace - the synthesis the brief asks for: data
   representation (points as vectors), a model transformation (the same
   weighted-sum + sigmoid neuron from Module 10), a real loss (binary
   cross-entropy, from Module 9 - not MSE, deliberately, to use the
   information-theory module too), optimization (batch gradient descent,
   Module 5), a probability interpretation of each output (Module 6), and
   an evaluation metric (accuracy). Every number is computed live from the
   current weights - nothing is precomputed or animated. */

type Point = { x1: number; x2: number; y: 0 | 1 };

// A small, fixed, linearly-separable-ish 2-class dataset - real coordinates,
// not randomly generated, so the same dataset is identical every session.
const DATASET: Point[] = [
  { x1: 1.2, x2: 1.5, y: 1 },
  { x1: 1.8, x2: 0.8, y: 1 },
  { x1: 0.6, x2: 1.9, y: 1 },
  { x1: 2.0, x2: 1.6, y: 1 },
  { x1: -1.4, x2: -1.1, y: 0 },
  { x1: -0.8, x2: -1.7, y: 0 },
  { x1: -1.9, x2: -0.6, y: 0 },
  { x1: -0.5, x2: -0.9, y: 0 },
];

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}
function round(n: number, dp = 4): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function forward(w1: number, w2: number, b: number, p: Point) {
  const z = w1 * p.x1 + w2 * p.x2 + b;
  return sigmoid(z);
}
// Average binary cross-entropy loss over the dataset.
function avgLoss(w1: number, w2: number, b: number): number {
  const eps = 1e-9;
  const total = DATASET.reduce((s, p) => {
    const a = forward(w1, w2, b, p);
    return s - (p.y * Math.log(a + eps) + (1 - p.y) * Math.log(1 - a + eps));
  }, 0);
  return total / DATASET.length;
}
// Gradient of average BCE loss w.r.t. w1, w2, b - the (a-y)*x simplification
// that falls out of combining sigmoid activation with cross-entropy loss.
function batchGradient(w1: number, w2: number, b: number) {
  let gw1 = 0, gw2 = 0, gb = 0;
  DATASET.forEach((p) => {
    const a = forward(w1, w2, b, p);
    const diff = a - p.y;
    gw1 += diff * p.x1;
    gw2 += diff * p.x2;
    gb += diff;
  });
  const n = DATASET.length;
  return { gw1: gw1 / n, gw2: gw2 / n, gb: gb / n };
}
function accuracy(w1: number, w2: number, b: number): number {
  const correct = DATASET.filter((p) => (forward(w1, w2, b, p) >= 0.5 ? 1 : 0) === p.y).length;
  return correct / DATASET.length;
}

const SIZE = 340;
const SCALE = 70;
const ORIGIN = { x: SIZE / 2, y: SIZE / 2 };
function toScreen(x1: number, x2: number) {
  return { x: ORIGIN.x + x1 * SCALE, y: ORIGIN.y - x2 * SCALE };
}

export function CapstoneWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Deliberately a BAD starting point (misclassifies half the dataset) -
  // (0.1, 0.1) would already separate this dataset perfectly at z=0, making
  // "train it" a no-op. w1=1, w2=-1 draws the boundary along the wrong
  // diagonal (x1-x2=0) instead of the actual separating one (x1+x2=0), so
  // there's real, visible work for gradient descent to do.
  const [w1, setW1] = useState(1);
  const [w2, setW2] = useState(-1);
  const [b, setB] = useState(0);
  const [lr, setLr] = useState(0.5);
  const [steps, setSteps] = useState(0);

  function step() {
    const g = batchGradient(w1, w2, b);
    setW1((v) => v - lr * g.gw1);
    setW2((v) => v - lr * g.gw2);
    setB((v) => v - lr * g.gb);
    setSteps((n) => n + 1);
  }
  function reset() {
    setW1(1);
    setW2(-1);
    setB(0);
    setSteps(0);
  }

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

    ctx.strokeStyle = "#232838";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ORIGIN.y);
    ctx.lineTo(SIZE, ORIGIN.y);
    ctx.moveTo(ORIGIN.x, 0);
    ctx.lineTo(ORIGIN.x, SIZE);
    ctx.stroke();

    // decision boundary: w1*x1 + w2*x2 + b = 0  =>  x2 = -(w1*x1+b)/w2
    if (Math.abs(w2) > 1e-6) {
      ctx.strokeStyle = "#8b7cf6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const range = SIZE / SCALE / 2;
      for (let i = 0; i <= 1; i++) {
        const x1 = i === 0 ? -range : range;
        const x2 = -(w1 * x1 + b) / w2;
        const s = toScreen(x1, x2);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      }
      ctx.stroke();
    }

    DATASET.forEach((p) => {
      const s = toScreen(p.x1, p.x2);
      const a = forward(w1, w2, b, p);
      const predicted = a >= 0.5 ? 1 : 0;
      ctx.fillStyle = p.y === 1 ? "#5fc2e8" : "#f0b429";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fill();
      if (predicted !== p.y) {
        ctx.strokeStyle = "#ff8585";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }, [w1, w2, b]);

  useEffect(() => {
    draw();
  }, [draw]);

  const loss = avgLoss(w1, w2, b);
  const acc = accuracy(w1, w2, b);

  return (
    <div className="grid gap-5 sm:grid-cols-[340px_1fr]">
      <div>
        <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ width: SIZE, height: SIZE }} className="rounded-lg border border-[#333a4c] bg-[#0a0c10]" />
        <p className="mt-2 text-[12px] text-[#676e7d]">
          Blue = class 1, gold = class 0. Violet line is the current decision boundary. A red ring means the model
          currently misclassifies that point.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="flex justify-between text-[12px] text-[#9aa0ae]">
            <span>Learning rate</span>
            <span className="font-[family-name:var(--font-course-mono)] text-[#eeeee7]">{lr.toFixed(2)}</span>
          </span>
          <input type="range" min={0.05} max={2} step={0.05} value={lr} onChange={(e) => setLr(Number(e.target.value))} className="accent-[#8b7cf6]" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={step} className="rounded-full border border-[#8b7cf6] bg-[#8b7cf6]/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#8b7cf6] hover:bg-[#8b7cf6]/20">
            Step (batch gradient descent) →
          </button>
          <button type="button" onClick={reset} className="rounded-full border border-[#333a4c] bg-[#191d26] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#9aa0ae] hover:border-[#ff8585] hover:text-[#eeeee7]">
            ↺ Reset
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Steps taken" value={steps} />
          <Stat label="Accuracy" value={`${round(acc * 100, 1)}%`} />
          <Stat label="Avg. cross-entropy loss" value={round(loss)} emphasis />
          <Stat label="w1, w2, b" value={`${round(w1, 2)}, ${round(w2, 2)}, ${round(b, 2)}`} />
        </div>
        <p className="text-[12px] text-[#676e7d]">
          Keep clicking Step - watch the loss fall, the accuracy rise to 100%, and the violet line rotate until it
          actually separates the two classes.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: string | number; emphasis?: boolean }) {
  return (
    <div className="rounded-lg border border-[#232838] bg-[#151920] p-3">
      <div className="text-[11px] text-[#9aa0ae]">{label}</div>
      <div className={`mt-1 font-[family-name:var(--font-course-mono)] ${emphasis ? "text-[16px] font-bold text-[#8b7cf6]" : "text-[13.5px] font-semibold text-[#eeeee7]"}`}>
        {value}
      </div>
    </div>
  );
}
