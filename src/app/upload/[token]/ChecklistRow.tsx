import { MONO } from "./ui";

const LOOK = {
  todo: { dot: "border-[1.5px] border-[rgba(255,255,255,0.35)]", text: "text-[#A9AEBA]", label: "To upload" },
  partial: { dot: "bg-[#5CC8FF] shadow-[0_0_8px_rgba(92,200,255,0.6)]", text: "text-[#9BDDFF]", label: "In progress" },
  sent: { dot: "bg-[#3DDC97] shadow-[0_0_8px_rgba(61,220,151,0.6)]", text: "text-[#7FF0BD]", label: "Sent" },
  skip: { dot: "border-[1.5px] border-[rgba(255,255,255,0.25)]", text: "text-[#7D8392]", label: "N/A" },
} as const;

/* One line of the rail checklist: status dot, title, coloured mono status. */
export function ChecklistRow({ title, state }: { title: string; state: keyof typeof LOOK }) {
  const l = LOOK[state];
  return (
    <div className="flex items-center gap-[14px] border-b border-[rgba(255,255,255,0.05)] py-[11px]">
      <span className={`box-border h-[10px] w-[10px] flex-shrink-0 rounded-[5px] ${l.dot}`} />
      <span className="min-w-0 flex-1 truncate text-[14.5px] text-[#C9CCD4]">{title}</span>
      <span className={`${MONO} whitespace-nowrap text-[11.5px] ${l.text}`}>{l.label}</span>
    </div>
  );
}
