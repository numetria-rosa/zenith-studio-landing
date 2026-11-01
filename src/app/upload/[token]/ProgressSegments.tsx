import { GLASS, MONO } from "./ui";

const SEG = {
  ok: "bg-[#3DDC97] shadow-[0_0_10px_rgba(61,220,151,0.5)]",
  skip: "bg-[rgba(255,255,255,0.28)]",
  need: "bg-[rgba(255,255,255,0.08)]",
} as const;

/* "2 of 7 · 5 documents to go · 29%" and one bar segment per file slot, coloured by status.
   The Sent / Not applicable / To upload legend is for phones only. */
export function ProgressSegments({ done, total, left, pct, segs }: { done: number; total: number; left: number; pct: number; segs: (keyof typeof SEG)[] }) {
  return (
    <div className={`${GLASS} relative mt-7 rounded-[22px] p-[18px] lg:rounded-[20px] lg:px-[22px] lg:py-5`}>
      <div className="flex items-baseline gap-[10px]">
        <span className="text-[30px] font-semibold tracking-[-0.03em]">
          {done}
          <span className="text-[#7D8392]"> of {total}</span>
        </span>
        <span className="flex-1 text-[15px] text-[#A9AEBA] lg:text-[14.5px]">{left === 0 ? "Everything is in. Thank you!" : `${left} ${left === 1 ? "document" : "documents"} to go`}</span>
        <span className={`${MONO} text-[13px] text-[#7FF0BD]`}>{pct}%</span>
      </div>
      <div className="mt-4 flex gap-[5px] lg:mt-[14px]" role="img" aria-label={`${done} of ${total} sent`}>
        {segs.map((s, i) => (
          <span key={i} className={`h-2 flex-1 rounded-[4px] ${SEG[s]}`} />
        ))}
      </div>
      <div className={`${MONO} mt-[14px] flex flex-wrap gap-[18px] text-[12px] text-[#7D8392] lg:hidden`}>
        <span className="inline-flex items-center gap-[7px]">
          <span className="h-2 w-2 rounded-[4px] bg-[#3DDC97]" />
          Sent
        </span>
        <span className="inline-flex items-center gap-[7px]">
          <span className="h-2 w-2 rounded-[4px] bg-[rgba(255,255,255,0.28)]" />
          Not applicable
        </span>
        <span className="inline-flex items-center gap-[7px]">
          <span className="box-border h-2 w-2 rounded-[4px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)]" />
          To upload
        </span>
      </div>
    </div>
  );
}
