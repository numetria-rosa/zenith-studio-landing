"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Project 1 workspace — a real (if tiny) similarity search engine. 8 fixed
   "documents," each a 2D embedding vector (real coordinates, not random —
   see the comment on DOCS), ranked against a chosen query by real cosine
   similarity (Module 1's exact formula), live-recomputed on every click. */

type Doc = { label: string; vec: [number, number] };

const DOCS: Doc[] = [
  { label: "Golden retriever puppy", vec: [3.2, 1.0] },
  { label: "Cat grooming tips", vec: [2.8, 1.4] },
  { label: "Best dog food brands", vec: [3.0, 0.6] },
  { label: "Mechanical keyboard review", vec: [-2.2, 2.0] },
  { label: "Wireless mouse comparison", vec: [-1.8, 2.4] },
  { label: "Ergonomic desk setup", vec: [-2.6, 1.2] },
  { label: "Stock market volatility", vec: [0.2, -2.8] },
  { label: "Quarterly earnings report", vec: [0.6, -2.4] },
];

function dot(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1];
}
function mag(v: [number, number]): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}
function cosineSim(a: [number, number], b: [number, number]): number {
  const denom = mag(a) * mag(b);
  return denom > 0 ? dot(a, b) / denom : 0;
}
function round(n: number, dp = 3): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

const SIZE = 320;
const SCALE = 45;
const ORIGIN = { x: SIZE / 2, y: SIZE / 2 };
function toScreen(v: [number, number]) {
  return { x: ORIGIN.x + v[0] * SCALE, y: ORIGIN.y - v[1] * SCALE };
}

export function SimilarityEngineWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [queryIdx, setQueryIdx] = useState(0);

  const query = DOCS[queryIdx];
  const ranked = DOCS.map((d, i) => ({ ...d, i, sim: cosineSim(query.vec, d.vec) }))
    .filter((d) => d.i !== queryIdx)
    .sort((a, b) => b.sim - a.sim);

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

    DOCS.forEach((d, i) => {
      const isQuery = i === queryIdx;
      const sim = isQuery ? 1 : cosineSim(query.vec, d.vec);
      const tip = toScreen(d.vec);
      ctx.strokeStyle = isQuery ? "#f0b429" : `rgba(139,124,246,${0.25 + Math.max(0, sim) * 0.75})`;
      ctx.lineWidth = isQuery ? 3 : 1.5 + Math.max(0, sim) * 3;
      ctx.beginPath();
      ctx.moveTo(ORIGIN.x, ORIGIN.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
      ctx.fillStyle = isQuery ? "#f0b429" : "#eeeee7";
      ctx.font = isQuery ? "700 10px 'IBM Plex Mono', monospace" : "9px 'IBM Plex Mono', monospace";
      ctx.fillText(d.label.split(" ").slice(0, 2).join(" "), tip.x + 4, tip.y - 4);
    });
  }, [queryIdx, query]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="grid gap-5 sm:grid-cols-[320px_1fr]">
      <div>
        <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ width: SIZE, height: SIZE }} className="rounded-lg border border-[#333a4c] bg-[#0a0c10]" />
        <p className="mt-2 text-[12px] text-[#676e7d]">Gold is the query. Line brightness/thickness tracks cosine similarity to it.</p>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#9aa0ae]">Choose a query document</span>
          <select
            value={queryIdx}
            onChange={(e) => setQueryIdx(Number(e.target.value))}
            className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13.5px] text-[#eeeee7] outline-none focus:border-[#8b7cf6]"
          >
            {DOCS.map((d, i) => (
              <option key={d.label} value={i}>{d.label}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#9aa0ae]">Ranked by cosine similarity</span>
          <ol className="flex flex-col gap-1.5">
            {ranked.map((d, rank) => (
              <li key={d.label} className="flex items-center gap-3 rounded-lg border border-[#232838] bg-[#151920] px-3 py-2">
                <span className="font-[family-name:var(--font-course-mono)] text-[11px] text-[#676e7d]">#{rank + 1}</span>
                <span className="flex-1 text-[13.5px] text-[#eeeee7]">{d.label}</span>
                <span className="font-[family-name:var(--font-course-mono)] text-[13px] font-bold text-[#8b7cf6]">{round(d.sim)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
