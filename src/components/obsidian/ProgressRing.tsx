/** 168px conic-gradient ring with a centred fraction (e.g. 3/6 lessons done). */
export function ProgressRing({ done, total, label }: { done: number; total: number; label: string }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      role="img"
      aria-label={`${done} of ${total} ${label}`}
      className="relative flex h-[168px] w-[168px] items-center justify-center rounded-full shadow-[0_0_60px_rgba(92,200,255,0.25)]"
      style={{ background: `conic-gradient(#5CC8FF 0 ${percent}%, rgba(255,255,255,0.08) ${percent}% 100%)` }}
    >
      <div className="flex h-[140px] w-[140px] flex-col items-center justify-center gap-0.5 rounded-full bg-[#0A0C12]">
        <b className="text-[40px] font-medium tracking-[-0.04em]">
          {done}/{total}
        </b>
        <span className="text-[13px] text-mist">{label}</span>
      </div>
    </div>
  );
}
