"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-[46px] items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.035] px-[22px] text-[15px] font-medium text-frost shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
    >
      Print
    </button>
  );
}
