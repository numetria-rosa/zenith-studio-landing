import localFont from "next/font/local";
import { fraunces } from "./fraunces";
import { plexMono } from "./plex-mono";
import { plexSans } from "./plex-sans";

/* The same three faces the static course pages (courses/data-science/*.html)
   use - Fraunces for headings, IBM Plex Sans for body, IBM Plex Mono for
   labels/numbers. Used on the account pages (sign-in, welcome, profile,
   /lab/dashboard) so the experience right after checkout reads as a
   continuation of the course product a buyer is about to land in, not a
   different app with its own visual identity. */
export { fraunces };

export { plexMono };

export const courseFontVars = `${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`;

/* The Zenith wordmark font (the owner picked Unbounded on 2026-10-21). Used only for the
   "Zenith Studio" / "Zenith Lab" wordmark next to the Z mark (public/brand/zenith-mark.png). */
export const wordmark = localFont({
  src: [{ path: "../fonts/unbounded/unbounded-latin-600-normal.woff2", weight: "600", style: "normal" }],
  variable: "--font-wordmark",
  display: "swap",
});
