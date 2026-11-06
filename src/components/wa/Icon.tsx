import type { SVGProps } from "react";

/* Stroke icons for the WhatsApp agent dashboard, 24x24 grid. Path data is copied from the design handoff
   (reference/source/*.dc.html), so each icon matches the reference exactly. */
const PATHS = {
  whatsapp: "M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8z M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z",
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  book: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z M5 17a3 3 0 0 1 3-3h11",
  chat: "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-5 4z M8 9h8 M8 12h5",
  inbox: "M3 13l3-8h12l3 8v6H3z M3 13h5l1.5 2.5h5L16 13h5",
  users: "M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7z M2.5 20a6.5 6.5 0 0 1 13 0 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14a6 6 0 0 1 3.5 6",
  activity: "M3 12h4l2-5 4 10 2-5h6",
  settings: "M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6z M12 2.5v3 M12 18.5v3 M2.5 12h3 M18.5 12h3 M5.3 5.3l2.1 2.1 M16.6 16.6l2.1 2.1 M5.3 18.7l2.1-2.1 M16.6 7.4l2.1-2.1",
  grid: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  userCheck: "M9 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8z M2 21a7 7 0 0 1 12-5 M16 18l2 2 4-4",
  flame: "M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5c0 2 1 3 2 3c0-3-1-5.5.5-8z",
  bolt: "M13 3L5 13h6l-1 8 8-10h-6z",
  sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z",
  plus: "M12 5v14 M5 12h14",
  arrow: "M5 12h14M13 6l6 6-6 6",
  plane: "M21 4L3 11l7 2 2 7z M10 13l11-9",
  file: "M7 3h7l4 4v14H7z M14 3v4h4",
  edit: "M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4",
  trash: "M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13",
  hotel: "M4 21V5h11v16 M15 10h5v11 M7 9h2 M7 13h2 M11 9h1 M11 13h1 M3 21h18",
  chevronDown: "M6 9l6 6 6-6",
  search: "M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14z M20 20l-4-4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  send: "M21 3L10 14 M21 3l-7 18-4-7-7-4z",
  dots: "M5 12h.01 M12 12h.01 M19 12h.01",
  download: "M12 4v11 M7 10l5 5 5-5 M4 20h16",
  reset: "M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7",
  info: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17z M12 11v5 M12 8h.01",
  clock: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17z M12 7.5V12l3 2",
  globe: "M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z M3 12h18 M12 3c3 3.5 3 14.5 0 18 M12 3c-3 3.5-3 14.5 0 18",
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10c-4-2-7-5.5-7-10V6z",
  card: "M3 6.5h18v11H3z M3 10.5h18 M7 14.5h3",
  external: "M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6",
  pause: "M8 5v14 M16 5v14",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
  person: "M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0",
  x: "M6 6l12 12M18 6L6 18",
  flag: "M5 21V4 M5 4h11l-2 4 2 4H5",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.8z",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
} as const;

export type WaIconName = keyof typeof PATHS;

export function WaIcon({ name, size = 16, stroke = "currentColor", strokeWidth = 1.8, ...rest }: { name: WaIconName; size?: number; stroke?: string; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, "stroke" | "strokeWidth">) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={PATHS[name]} />
    </svg>
  );
}
