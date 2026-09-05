"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Module 1's flagship interactive lab. Real computation, not a decorative
   animation: every number below (magnitude, angle, dot product, cosine
   similarity) is computed from the actual dragged coordinates on every
   frame, the same arithmetic a real embedding-similarity search performs.
   Framed as "how similar are these two feature vectors" — the ML connection
   the lesson text builds toward — rather than an abstract grid-drag toy. */

type Vec = { x: number; y: number };

const SIZE = 360; // canvas is SIZE x SIZE CSS px, scaled for devicePixelRatio internally
const SCALE = 26; // px per unit, so vectors stay comfortably inside the canvas
const ORIGIN: Vec = { x: SIZE / 2, y: SIZE / 2 };

function toScreen(v: Vec): Vec {
  return { x: ORIGIN.x + v.x * SCALE, y: ORIGIN.y - v.y * SCALE };
}
function toWorld(px: Vec): Vec {
  return { x: (px.x - ORIGIN.x) / SCALE, y: -(px.y - ORIGIN.y) / SCALE };
}
function magnitude(v: Vec): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}
function dot(a: Vec, b: Vec): number {
  return a.x * b.x + a.y * b.y;
}
function clampToGrid(v: Vec, max = 6): Vec {
  return { x: Math.max(-max, Math.min(max, v.x)), y: Math.max(-max, Math.min(max, v.y)) };
}
function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export function VectorLab({
  onInteract,
}: {
  /** Called once the student has actually dragged the vector at least once —
      the module's graded "prediction" exercise (see the MDX lesson) unlocks
      only after real interaction, not just page-load. */
  onInteract?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a] = useState<Vec>({ x: 4, y: 1 }); // fixed reference vector — "a stored document embedding"
  const [b, setB] = useState<Vec>({ x: 2, y: 3 }); // draggable — "a new query embedding"
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    // grid
    ctx.strokeStyle = "#1c212c";
    ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i++) {
      const gx = toScreen({ x: i, y: 0 }).x;
      const gy = toScreen({ x: 0, y: i }).y;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(SIZE, gy);
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

    function drawVector(v: Vec, color: string, label: string) {
      const tip = toScreen(v);
      ctx!.strokeStyle = color;
      ctx!.fillStyle = color;
      ctx!.lineWidth = 2.5;
      ctx!.beginPath();
      ctx!.moveTo(ORIGIN.x, ORIGIN.y);
      ctx!.lineTo(tip.x, tip.y);
      ctx!.stroke();
      // arrowhead
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

    // angle arc between a and b
    const startAng = Math.atan2(-a.y, a.x);
    const endAng = Math.atan2(-b.y, b.x);
    ctx.strokeStyle = "#676e7d";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ORIGIN.x, ORIGIN.y, 30, startAng, endAng, endAng < startAng);
    ctx.stroke();

    drawVector(a, "#5fc2e8", "a (stored)");
    drawVector(b, "#8b7cf6", "b (yours)");
  }, [a, b]);

  useEffect(() => {
    draw();
  }, [draw]);

  function updateFromClientPoint(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = { x: clientX - rect.left, y: clientY - rect.top };
    const world = toWorld(px);
    setB(clampToGrid({ x: round(world.x, 1), y: round(world.y, 1) }));
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

  function nudge(dx: number, dy: number) {
    setB((prev) => {
      const next = clampToGrid({ x: round(prev.x + dx, 1), y: round(prev.y + dy, 1) });
      if (!interactedRef.current) {
        interactedRef.current = true;
        onInteract?.();
      }
      return next;
    });
  }

  const magA = magnitude(a);
  const magB = magnitude(b);
  const dotAB = dot(a, b);
  const cosSim = magA > 0 && magB > 0 ? dotAB / (magA * magB) : 0;
  const angleBetween = round((Math.acos(Math.max(-1, Math.min(1, cosSim))) * 180) / Math.PI, 1);

  return (
    <div className="grid gap-5 sm:grid-cols-[360px_1fr]">
      <div>
        <canvas
          ref={canvasRef}
          data-tour="vector-canvas"
          width={SIZE}
          height={SIZE}
          role="application"
          aria-label={`Vector lab canvas. Vector b is at x ${b.x}, y ${b.y}. Use arrow keys to move it, or drag with a mouse or touch.`}
          tabIndex={0}
          style={{ width: SIZE, height: SIZE, touchAction: "none" }}
          className="cursor-grab rounded-lg border border-[#333a4c] bg-[#0a0c10] active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 1 : 0.2;
            if (e.key === "ArrowUp") { e.preventDefault(); nudge(0, step); }
            else if (e.key === "ArrowDown") { e.preventDefault(); nudge(0, -step); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-step, 0); }
            else if (e.key === "ArrowRight") { e.preventDefault(); nudge(step, 0); }
          }}
        />
        <p className="mt-2 text-[12.5px] text-[#676e7d]">
          Drag the violet vector <b className="text-[#8b7cf6]">b</b>, or focus the canvas and use the arrow keys
          (hold Shift for bigger steps).
        </p>
      </div>

      <div className="flex flex-col gap-3" aria-live="polite">
        <Stat label="a (fixed — a stored document embedding)" value={`(${a.x}, ${a.y})`} color="#5fc2e8" />
        <Stat label="b (yours — a new query embedding)" value={`(${b.x}, ${b.y})`} color="#8b7cf6" />
        <div className="my-1 h-px bg-[#232838]" />
        <Stat label="‖a‖ (magnitude of a)" value={round(magA)} mono />
        <Stat label="‖b‖ (magnitude of b)" value={round(magB)} mono />
        <Stat tourId="dot-product" label="a · b (dot product)" value={round(dotAB)} mono />
        <Stat label="angle between a and b" value={`${angleBetween}°`} mono />
        <Stat
          tourId="cosine-sim"
          label="cosine similarity"
          value={round(cosSim)}
          mono
          emphasis
          hint={
            cosSim > 0.9
              ? "Nearly identical direction — a search engine would call these a strong match."
              : cosSim > 0.5
                ? "Same general direction — a moderate match."
                : cosSim > 0
                  ? "Only loosely related — a weak match."
                  : "Pointing away from each other — not a match at all."
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
