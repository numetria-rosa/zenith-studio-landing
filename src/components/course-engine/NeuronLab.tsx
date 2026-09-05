"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Module 10's lab — the course's major synthesis. A genuinely tiny neural
   network (2 inputs, 1 neuron, sigmoid activation) but every number is
   real: the forward pass, the loss, and the backward pass (the chain rule,
   computed by hand in code exactly as Module 4/5 described it) are all
   real arithmetic on the current slider values, and "Step" performs one
   real gradient-descent update using those exact gradients. */

const X1 = 1.5;
const X2 = -0.8;
const TARGET = 1;

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}
function round(n: number, dp = 4): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function forward(w1: number, w2: number, b: number) {
  const z = w1 * X1 + w2 * X2 + b;
  const a = sigmoid(z);
  const loss = (a - TARGET) ** 2;
  return { z, a, loss };
}
function backward(w1: number, w2: number, b: number) {
  const { a } = forward(w1, w2, b);
  const dLda = 2 * (a - TARGET);
  const dadz = a * (1 - a);
  const dLdz = dLda * dadz;
  return { dLdw1: dLdz * X1, dLdw2: dLdz * X2, dLdb: dLdz };
}

const SIZE_W = 400;
const SIZE_H = 220;

export function NeuronLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [w1, setW1] = useState(0.4);
  const [w2, setW2] = useState(0.4);
  const [b, setB] = useState(0);
  const [lr, setLr] = useState(1);
  const [lossHistory, setLossHistory] = useState<number[]>([]);

  const { z, a, loss } = forward(w1, w2, b);
  const grads = backward(w1, w2, b);

  function step() {
    const g = backward(w1, w2, b);
    const nextW1 = w1 - lr * g.dLdw1;
    const nextW2 = w2 - lr * g.dLdw2;
    const nextB = b - lr * g.dLdb;
    setW1(nextW1);
    setW2(nextW2);
    setB(nextB);
    setLossHistory((prev) => [...prev, forward(nextW1, nextW2, nextB).loss].slice(-60));
  }
  function reset() {
    setW1(0.4);
    setW2(0.4);
    setB(0);
    setLossHistory([]);
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

    const in1 = { x: 50, y: 60 };
    const in2 = { x: 50, y: 160 };
    const hidden = { x: 210, y: 110 };
    const out = { x: 340, y: 110 };

    function edge(p1: { x: number; y: number }, p2: { x: number; y: number }, weight: number, label: string) {
      ctx!.strokeStyle = weight >= 0 ? "#4ade95" : "#ff8585";
      ctx!.lineWidth = Math.min(6, 1 + Math.abs(weight) * 2.5);
      ctx!.beginPath();
      ctx!.moveTo(p1.x, p1.y);
      ctx!.lineTo(p2.x, p2.y);
      ctx!.stroke();
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      ctx!.fillStyle = "#eeeee7";
      ctx!.font = "11px 'IBM Plex Mono', monospace";
      ctx!.fillText(label, mx - 10, my - 6);
    }
    edge(in1, hidden, w1, `w1=${round(w1, 2)}`);
    edge(in2, hidden, w2, `w2=${round(w2, 2)}`);
    edge(hidden, out, 1, "");

    function node(p: { x: number; y: number }, label: string, sub: string, color: string) {
      ctx!.fillStyle = "#151920";
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, 26, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.stroke();
      ctx!.fillStyle = "#eeeee7";
      ctx!.font = "600 12px 'IBM Plex Mono', monospace";
      ctx!.textAlign = "center";
      ctx!.fillText(label, p.x, p.y + 4);
      ctx!.fillStyle = "#9aa0ae";
      ctx!.font = "10px 'IBM Plex Mono', monospace";
      ctx!.fillText(sub, p.x, p.y + 42);
      ctx!.textAlign = "left";
    }
    const current = forward(w1, w2, b);
    node(in1, String(X1), "x1", "#5fc2e8");
    node(in2, String(X2), "x2", "#5fc2e8");
    node(hidden, round(current.a, 2).toString(), `z=${round(current.z, 2)}`, "#8b7cf6");
    node(out, round(current.a, 2).toString(), `target=${TARGET}`, "#f0b429");

    // bias label near hidden node
    ctx.fillStyle = "#676e7d";
    ctx.font = "10px 'IBM Plex Mono', monospace";
    ctx.fillText(`bias b=${round(b, 2)}`, hidden.x - 22, hidden.y - 40);
  }, [w1, w2, b]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        data-tour="neuron-canvas"
        width={SIZE_W}
        height={SIZE_H}
        style={{ width: "100%", maxWidth: SIZE_W, height: SIZE_H }}
        className="rounded-lg border border-[#333a4c] bg-[#0a0c10]"
      />
      <p className="text-[12px] text-[#676e7d]">
        Green edges are positive weights, red are negative — thickness is magnitude. Forward pass:
        x1·w1 + x2·w2 + b = z, then σ(z) = a (the output). Target is {TARGET}.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div data-tour="neuron-sliders" className="flex flex-col gap-2">
          <SliderRow label="w1" value={w1} onChange={setW1} />
          <SliderRow label="w2" value={w2} onChange={setW2} />
          <SliderRow label="b" value={b} onChange={setB} />
          <SliderRow label="learning rate" value={lr} min={0.1} max={5} onChange={setLr} />
        </div>
        <div className="flex flex-col gap-2">
          <Stat label="z (weighted sum)" value={round(z)} mono />
          <Stat label="a = σ(z) (the output)" value={round(a)} mono />
          <Stat tourId="neuron-loss" label="Loss = (a − target)²" value={round(loss)} mono emphasis />
          <Stat tourId="neuron-grad" label="∂Loss/∂w1" value={round(grads.dLdw1)} mono />
        </div>
      </div>

      <div data-tour="neuron-step" className="flex flex-wrap gap-2">
        <button type="button" onClick={step} className="rounded-full border border-[#8b7cf6] bg-[#8b7cf6]/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#8b7cf6] hover:bg-[#8b7cf6]/20">
          Step (one gradient-descent update) →
        </button>
        <button type="button" onClick={reset} className="rounded-full border border-[#333a4c] bg-[#191d26] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#9aa0ae] hover:border-[#ff8585] hover:text-[#eeeee7]">
          ↺ Reset
        </button>
        {lossHistory.length > 0 && (
          <span className="self-center font-[family-name:var(--font-course-mono)] text-[12px] text-[#676e7d]">
            {lossHistory.length} step{lossHistory.length === 1 ? "" : "s"} taken — loss went from {round(lossHistory[0])} to {round(loss)}
          </span>
        )}
      </div>
    </div>
  );
}

function SliderRow({ label, value, onChange, min = -3, max = 3 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between text-[12px] text-[#9aa0ae]">
        <span>{label}</span>
        <span className="font-[family-name:var(--font-course-mono)] text-[#eeeee7]">{value.toFixed(2)}</span>
      </span>
      <input type="range" min={min} max={max} step={0.02} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-[#8b7cf6]" />
    </label>
  );
}

function Stat({ label, value, mono, emphasis, tourId }: { label: string; value: number; mono?: boolean; emphasis?: boolean; tourId?: string }) {
  return (
    <div data-tour={tourId} className="flex items-baseline justify-between gap-3 rounded-lg border border-[#232838] bg-[#151920] px-3 py-2">
      <span className="text-[12px] text-[#9aa0ae]">{label}</span>
      <span className={`${mono ? "font-[family-name:var(--font-course-mono)]" : ""} ${emphasis ? "text-[15px] font-bold" : "text-[13px] font-semibold"}`} style={{ color: emphasis ? "#8b7cf6" : "#eeeee7" }}>
        {value}
      </span>
    </div>
  );
}
