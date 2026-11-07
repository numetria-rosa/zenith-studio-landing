import localFont from "next/font/local";

/* IBM Plex Mono, self-hosted (OFL-1.1, from @fontsource/ibm-plex-mono 5.3.0, latin subset). Moved off
   next/font/google with the other families (see fraunces.ts): Google's new font?kit= URLs fail the
   Turbopack build on every uncached deploy. One shared instance for every layout that needs it. */
export const plexMono = localFont({
  variable: "--font-course-mono",
  display: "swap",
  src: [
    { path: "../fonts/ibm-plex-mono/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-mono/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-mono/ibm-plex-mono-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
});
