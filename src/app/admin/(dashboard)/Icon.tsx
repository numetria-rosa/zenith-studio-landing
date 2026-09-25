// Stroke icons (24x24, round caps/joins) - exact path data ported from
// halo/zenith-hq-admin/src/app.js's `P` object, for pixel parity with the
// approved prototype.
const paths = {
  home: "M3 11l9-7 9 7M5 10v10h14V10",
  users: "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M16 3.5a4 4 0 010 7.5M18 15c2.5.7 4 2.7 4 6",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  cpu: "M8 8h8v8H8zM5 5h14v14H5zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3",
  card: "M3 6h18v12H3zM3 10h18M7 15h4",
  chat: "M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z",
  cal: "M4 5h16v15H4zM4 10h16M8 3v4M16 3v4",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  plus: "M12 5v14M5 12h14",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  clock: "M12 21a9 9 0 110-18 9 9 0 010 18zM12 7v5l3 2",
  alert: "M12 3l10 18H2zM12 10v5M12 18h.01",
  x: "M6 6l12 12M18 6L6 18",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 6l-6 6 6 6",
  ext: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  pause: "M8 5v14M16 5v14",
  play: "M7 5v14l11-7z",
  mail: "M3 5h18v14H3zM3 7l9 6 9-6",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.8 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
