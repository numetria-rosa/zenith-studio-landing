"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* Module 11's lab - the "reward" module's centerpiece. A tiny, fixed
   vocabulary of 2D "embeddings" (deliberately 2D so the vectors can be
   drawn directly, tying back to Module 1's VectorLab) walked through the
   exact real computation behind attention: dot product against every key,
   scale by 1/sqrt(d), softmax, then a weighted sum of values. Nothing here
   is precomputed or faked - click a different query and every number
   recomputes from the same four lines of real math a transformer actually
   runs. */

type Token = { label: string; vec: [number, number] };

// Fixed, hand-placed so cat/dog are close together and keyboard/mouse are
// close together (real semantic clusters), exactly the cosine-similarity
// intuition from Module 1 - not random placement.
const TOKENS: Token[] = [
  { label: "cat", vec: [3, 1] },
  { label: "dog", vec: [2.6, 1.4] },
  { label: "keyboard", vec: [-2, 2] },
  { label: "mouse", vec: [-1.6, 2.3] },
  { label: "queen", vec: [0.2, -2.6] },
];
const DIM = 2;

function dot(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1];
}
function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}
function round(n: number, dp = 3): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

const SIZE = 300;
const SCALE = 45;
const ORIGIN = { x: SIZE / 2, y: SIZE / 2 };
function toScreen(v: [number, number]) {
  return { x: ORIGIN.x + v[0] * SCALE, y: ORIGIN.y - v[1] * SCALE };
}

export function AttentionLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [queryIdx, setQueryIdx] = useState(3); // "mouse"

  const query = TOKENS[queryIdx];
  const rawScores = TOKENS.map((t) => dot(query.vec, t.vec) / Math.sqrt(DIM));
  const weights = softmax(rawScores);
  const outputVec = useMemo<[number, number]>(() => {
    const out: [number, number] = [0, 0];
    TOKENS.forEach((t, i) => {
      out[0] += weights[i] * t.vec[0];
      out[1] += weights[i] * t.vec[1];
    });
    return out;
  }, [weights]);

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

    TOKENS.forEach((t, i) => {
      const isQuery = i === queryIdx;
      const tip = toScreen(t.vec);
      const w = weights[i];
      ctx.strokeStyle = isQuery ? "#f0b429" : `rgba(139,124,246,${0.25 + w * 0.75})`;
      ctx.lineWidth = isQuery ? 3 : 1.5 + w * 3;
      ctx.beginPath();
      ctx.moveTo(ORIGIN.x, ORIGIN.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
      ctx.fillStyle = isQuery ? "#f0b429" : "#eeeee7";
      ctx.font = isQuery ? "700 12px 'IBM Plex Mono', monospace" : "11px 'IBM Plex Mono', monospace";
      ctx.fillText(t.label, tip.x + 6, tip.y - 6);
    });

    // output vector - the weighted combination
    const outTip = toScreen(outputVec);
    ctx.strokeStyle = "#4ade95";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(ORIGIN.x, ORIGIN.y);
    ctx.lineTo(outTip.x, outTip.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#4ade95";
    ctx.font = "700 11px 'IBM Plex Mono', monospace";
    ctx.fillText("output", outTip.x + 6, outTip.y + 12);
  }, [queryIdx, weights, outputVec]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="grid gap-5 sm:grid-cols-[300px_1fr]">
      <div>
        <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ width: SIZE, height: SIZE }} className="rounded-lg border border-[#333a4c] bg-[#0a0c10]" />
        <p className="mt-2 text-[12px] text-[#676e7d]">
          Gold is the query. Violet lines are keys, brighter and thicker the more attention they receive.
          Dashed green is the weighted-average output vector.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#9aa0ae]">Choose the query word</span>
          <div className="flex flex-wrap gap-2">
            {TOKENS.map((t, i) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setQueryIdx(i)}
                className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${
                  i === queryIdx ? "border-[#f0b429] bg-[#f0b429] text-[#1a1200]" : "border-[#333a4c] bg-[#191d26] text-[#9aa0ae] hover:border-[#f0b429] hover:text-[#eeeee7]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9aa0ae]">Attention weights over every key</span>
          {TOKENS.map((t, i) => (
            <div key={t.label} className="flex items-center gap-2">
              <span className="w-16 flex-shrink-0 text-[12px] text-[#9aa0ae]">{t.label}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#191d26]">
                <div className="h-full rounded-full bg-[#8b7cf6]" style={{ width: `${weights[i] * 100}%` }} />
              </div>
              <span className="w-14 flex-shrink-0 text-right font-[family-name:var(--font-course-mono)] text-[12px] text-[#eeeee7]">{round(weights[i])}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#232838] bg-[#151920] p-3 text-[12.5px]">
          <span className="text-[#9aa0ae]">Output vector (weighted sum of all values): </span>
          <span className="font-[family-name:var(--font-course-mono)] font-bold text-[#4ade95]">
            ({round(outputVec[0], 2)}, {round(outputVec[1], 2)})
          </span>
        </div>
      </div>
    </div>
  );
}
