/* Shared look of the upload page: Obsidian tokens straight from the design spec. */
export const MONO = "font-[family-name:var(--font-geist-mono)]";
export const GLASS = "bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.10)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
export const GHOST = "inline-flex h-9 items-center gap-2 rounded-[10px] border-0 bg-transparent px-3 text-[14px] text-[#A9AEBA] hover:text-[#F5F6F8] disabled:opacity-50";
export const FROST = "items-center justify-center rounded-full border-0 bg-[#F5F6F8] font-semibold text-[#05060A] hover:bg-white disabled:opacity-60";

export function Icon({ d, size = 16, stroke = "currentColor", sw = 1.8 }: { d: string; size?: number; stroke?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none">
      <path d={d} />
    </svg>
  );
}
export const P = {
  lock: "M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  mail: "M3.5 6h17v12h-17z M4 7l8 6 8-6",
  phone: "M8 3h8v18H8z M11 18h2",
  upload: "M12 16V4 M7 9l5-5 5 5 M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4",
  plus: "M12 5v14 M5 12h14",
  slash: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17z M6 18L18 6",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7.5",
  undo: "M9 14l-5-5 5-5 M4 9h10a6 6 0 0 1 0 12h-3",
  file: "M7 3h7l4 4v14H7z M14 3v4h4",
};
