/** One glass bar of big numbers with hairline dividers. */
export function StatStrip({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="glass flex rounded-[22px]">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`flex flex-1 flex-col gap-1.5 px-3 py-[22px] sm:px-6 ${i > 0 ? "border-l border-white/10" : ""}`}
        >
          <b className="text-[32px] font-medium leading-none tracking-[-0.04em] sm:text-[44px]">{s.value}</b>
          <span className="text-[15px] text-mist">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
