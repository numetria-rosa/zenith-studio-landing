import u from "./ui.module.css";

type ChipTone = "live" | "done" | "attention";

const toneClass: Record<ChipTone, string> = {
  live: u.chipLive,
  done: u.chipDone,
  attention: u.chipAttention,
};

export function StatusChip({
  tone,
  height = 28,
  padX = 12,
  children,
}: {
  tone: ChipTone;
  height?: number;
  padX?: number;
  children: React.ReactNode;
}) {
  return (
    <span className={`${u.chip} ${toneClass[tone]}`} style={{ height, padding: `0 ${padX}px` }}>
      <span className={u.chipDot} />
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className={u.eyebrow}>{children}</span>;
}
