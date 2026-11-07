import localFont from "next/font/local";

/* Fraunces, self-hosted (OFL-1.1, from @fontsource/fraunces 5.3.0, latin subset, upright 400-700).
   It used to come from next/font/google, but Google now serves this family with
   `fonts.gstatic.com/l/font?kit=...` URLs, which Next 16.1's Turbopack build cannot resolve
   ("Can't resolve '@vercel/turbopack-next/internal/font/google/font'"), failing every uncached
   deploy. Same fix as plex-sans.ts. One shared instance, so every layout gets the same variable. */
export const fraunces = localFont({
  variable: "--font-course-serif",
  display: "swap",
  src: [
    { path: "../fonts/fraunces/fraunces-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/fraunces/fraunces-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/fraunces/fraunces-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/fraunces/fraunces-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});
