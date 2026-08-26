import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

/* The same three faces the static course pages (courses/data-science/*.html)
   use — Fraunces for headings, IBM Plex Sans for body, IBM Plex Mono for
   labels/numbers. Used on the account pages (sign-in, welcome, profile,
   /lab/dashboard) so the experience right after checkout reads as a
   continuation of the course product a buyer is about to land in, not a
   different app with its own visual identity. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-course-serif",
});

export const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-course-sans",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-course-mono",
});

export const courseFontVars = `${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`;
