export type Price = { now: string; was: string; percent: number };

/** "$36  $120" over "70% off, limited time". Sits beside the hero buttons and in the career banner. */
export function PriceLockup({ price, className = "", compact = false }: { price: Price; className?: string; compact?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="flex items-baseline gap-2.5">
        <b className={`${compact ? "text-[24px]" : "text-[28px]"} font-medium leading-none tracking-[-0.04em] text-frost`}>{price.now}</b>
        <s className="text-[16px] text-dim">
          <span className="sr-only">Regular price </span>
          {price.was}
        </s>
      </span>
      <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-mint-text">
        {price.percent}% off, limited time
      </span>
    </div>
  );
}
