"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#8b7cf6] bg-[#8b7cf6]/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#8b7cf6] hover:bg-[#8b7cf6]/20 print:hidden"
    >
      <Printer size={14} aria-hidden /> Print this cheat sheet
    </button>
  );
}
