"use client";

import { WaIcon, type WaIconName } from "@/components/wa/Icon";

/* No PDF library needed: the browser's print dialog saves the page as a PDF. */
export function PrintButton({ label, icon, className = "" }: { label: string; icon: WaIconName; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={`inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.04)] px-4 py-2 text-[13px] text-frost print:hidden ${className}`}>
      <WaIcon name={icon} size={14} />
      {label}
    </button>
  );
}
