"use client";

import { useState } from "react";
import { Icon } from "@/components/obsidian/Icon";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: leave the label as is */ }
      }}
      className="glass inline-flex min-h-11 items-center gap-2 rounded-full px-[18px] text-[14px] font-medium text-frost hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
    >
      <Icon name={copied ? "check" : "copy"} size={15} />
      <span role="status">{copied ? "Copied" : label}</span>
    </button>
  );
}
