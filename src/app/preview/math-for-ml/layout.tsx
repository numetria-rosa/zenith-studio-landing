import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "katex/dist/katex.min.css";

/* UNAUTHENTICATED PREVIEW ONLY — mirrors src/app/lab/[courseId]/learn/layout.tsx
   minus the auth/entitlement gate, so the course can be clicked through locally
   without a real Whop purchase or a signed-in session. Remove this route (and
   its [[...lessonSlug]]/page.tsx sibling) before the course ships — the real,
   gated route is /lab/math-for-ml/learn/... once the course is published. */

const fraunces = Fraunces({ variable: "--font-course-serif", subsets: ["latin"] });
const plexSans = IBM_Plex_Sans({ variable: "--font-course-sans", weight: ["400", "500", "600", "700"], subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-course-mono", weight: ["400", "500", "600"], subsets: ["latin"] });

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} font-[family-name:var(--font-course-sans)]`}>
      <div className="border-b border-[#f0b429] bg-[#1a1200] px-4 py-2 text-center font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#f0b429]">
        Unauthenticated local preview — not the real gated course route
      </div>
      {children}
    </div>
  );
}
