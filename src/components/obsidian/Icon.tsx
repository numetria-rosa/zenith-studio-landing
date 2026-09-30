// Stroke icons on a 24 grid, path data copied from the design source files
// (halo/ai-engineering-course-handoff/reference/source/*.dc.html).
const PATHS = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  clock: "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  home: "M3 11l9-7 9 7M5 10v10h14V10",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
  sheet: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  code: "M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14",
  quiz: "M9.5 9a2.5 2.5 0 115 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  box: "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8",
  award: "M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 14L7 22l5-3 5 3-1.5-8",
  folder: "M3 6h6l2 2h10v11H3z",
  star: "M12 3l2.7 5.5 6 .9-4.4 4.2 1 6L12 16.8 6.7 19.6l1-6L3.3 9.4l6-.9L12 3z",
  chevron: "M6 9l6 6 6-6",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
  send: "M21 3L3 10l7 3 3 7 8-17zM10 13l11-10",
  chat: "M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z",
  phone: "M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  calendar: "M5 5h14v15H5zM5 10h14M9 3v4M15 7V3",
  file: "M7 3h7l5 5v13H7zM14 3v5h5M9.5 14h5",
  download: "M12 4v11m0 0l-4-4m4 4l4-4M5 20h14",
  copy: "M9 9h11v11H9zM5 15V5h10",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  plus: "M12 5v14M5 12h14",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z",
  warn: "M12 3l10 18H2L12 3zM12 10v5M12 18h.01",
  back: "M19 12H5M11 6l-6 6 6 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6L6 18",
  path: "M5 19a2 2 0 100-4 2 2 0 000 4zM19 9a2 2 0 100-4 2 2 0 000 4zM7 17h6a4 4 0 000-8h-2a4 4 0 010-8h6",
  play: "M7 5v14l11-7z",
  stop: "M7 7h10v10H7z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  reset: "M4 12a8 8 0 108-8H8M8 1L5 4l3 3",
  terminal: "M4 17l6-5-6-5M12 19h8",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  bell: "M6 16V11a6 6 0 0112 0v5l2 2H4zM10 20h4",
  flame: "M12 3c1 3 4 5 4 9a4 4 0 01-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  pencil: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
  signout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  color = "currentColor",
  strokeWidth = 1.8,
  className,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
