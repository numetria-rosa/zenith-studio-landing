"use client";

import Link from "next/link";
import { useState } from "react";
import { WaIcon } from "@/components/wa/Icon";
import { ConfirmAction } from "@/components/wa/ConfirmDialog";
import { GhostButton, cx, isRtl } from "@/components/wa/ui";

export type FaqItem = { id: string; question: string; answer: string; editHref: string; remove: () => Promise<void> };

/** FAQ accordion: one answer open at a time. */
export function FaqList({ items, agentName }: { items: FaqItem[]; agentName: string }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="overflow-hidden rounded-[22px] border border-[rgba(255,255,255,.09)] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
      <div className="flex justify-between px-[22px] py-[18px]">
        <span className="font-mono text-[11.5px] uppercase tracking-[.16em] text-dim">
          {items.length} {items.length === 1 ? "question" : "questions"}
        </span>
        <span className="text-[13px] text-dim">{agentName} uses your answer word for word</span>
      </div>
      {items.length === 0 && <div className="border-t border-[rgba(255,255,255,.06)] px-[22px] py-8 text-center text-[14px] text-dim">No FAQs yet. Add your first one on the right.</div>}
      {items.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id} className={cx("border-t border-[rgba(255,255,255,.06)]", isOpen && "bg-[rgba(255,255,255,.03)]")}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : f.id)}
              className="flex w-full cursor-pointer items-center gap-[14px] border-0 bg-transparent px-[22px] py-4 text-left text-[15.5px] text-frost focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan"
            >
              <span dir={isRtl(f.question) ? "rtl" : "ltr"} className="flex-1">{f.question}</span>
              <span className={cx("flex", isOpen && "rotate-180")}>
                <WaIcon name="chevronDown" size={18} stroke="#A9AEBA" />
              </span>
            </button>
            {isOpen && (
              <div className="px-[22px] pb-[18px]">
                <p dir={isRtl(f.answer) ? "rtl" : "ltr"} className="m-0 text-[14.5px] leading-[1.6] text-soft">{f.answer}</p>
                <div className="-ml-[10px] mt-3 flex gap-[6px]">
                  <Link href={f.editHref} className="inline-flex h-[34px] items-center gap-[7px] rounded-[10px] px-[10px] text-[13.5px] text-mist no-underline hover:bg-[rgba(255,255,255,.05)] hover:text-frost">
                    <WaIcon name="edit" size={14} stroke="#A9AEBA" />
                    Edit
                  </Link>
                  <ConfirmAction
                    action={f.remove}
                    title="Remove this FAQ?"
                    description={`${agentName} will stop using this answer straight away.`}
                    confirmLabel="Remove"
                    trigger={
                      <GhostButton icon="trash" className="!text-ember-text">
                        Remove
                      </GhostButton>
                    }
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
