/** 6px track with a filled bar. `color` is the fill (cyan in the app, mint when complete). */
export function ProgressBar({ percent, color = "#5CC8FF", label }: { percent: number; color?: string; label: string }) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-1.5 rounded-[3px] bg-white/[0.08]"
    >
      <div className="h-full rounded-[3px]" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}
