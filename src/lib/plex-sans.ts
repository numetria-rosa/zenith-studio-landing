import localFont from "next/font/local";

/* IBM Plex Sans, self-hosted (OFL-1.1, from @fontsource/ibm-plex-sans 5.3.0, latin subset).
   It used to come from next/font/google, but Google started serving this family with
   `fonts.gstatic.com/l/font?kit=...&skey=...` URLs, which Next 16.1's Turbopack build cannot
   resolve ("next/font/google queries have exactly one entry"), failing every uncached deploy.
   One shared instance, so every layout that needs it gets the same --font-course-sans variable. */
export const plexSans = localFont({
  variable: "--font-course-sans",
  display: "swap",
  src: [
    { path: "../fonts/ibm-plex-sans/ibm-plex-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans/ibm-plex-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-sans/ibm-plex-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/ibm-plex-sans/ibm-plex-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});
