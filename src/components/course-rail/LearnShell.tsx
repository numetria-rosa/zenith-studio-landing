"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { CourseRailClient } from "./CourseRailClient";
import type { CourseRailData } from "@/lib/course-rail-data";
import styles from "./course-rail.module.css";

/* Shared page shell for every "react" render-mode course page (lesson,
   practice, diagnostic - real and preview alike): the sticky glass sidebar,
   its off-canvas mobile drawer, and the topbar that carries the hamburger
   toggle for it. Replaces 6 near-identical copies of this same structure
   (learn + preview, x lesson/practice/diagnostic) with one component, and
   is the one place the mobile drawer's open/close state needs to live,
   which is why this is a client component while everything it wraps
   (the MDX article, the practice library, etc.) stays server-rendered and
   is simply passed in as children. */
export function LearnShell({
  data,
  courseId,
  activeModuleId,
  basePath,
  courseLabel,
  children,
}: {
  data: CourseRailData;
  courseId: string;
  activeModuleId: number;
  basePath?: string;
  /** Text shown at the right of the topbar - course title, optionally with " · Module N". */
  courseLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`${styles.scope} flex min-h-screen bg-[#0d0f14] text-[#eeeee7]`}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[400] focus:rounded-lg focus:bg-[#8b7cf6] focus:px-3.5 focus:py-2 focus:text-[13px] focus:font-bold focus:text-[#120f24]">
        Skip to content
      </a>
      <button
        type="button"
        aria-label="Close course navigation"
        className={`${styles.railScrim} ${open ? styles.open : ""}`}
        onClick={() => setOpen(false)}
      />

      <div className={styles.courseshell}>
        <aside className={`${styles.courserail} ${open ? styles.open : ""}`} aria-label="Course navigation">
          <CourseRailClient data={data} courseId={courseId} activeModuleId={activeModuleId} basePath={basePath} />
        </aside>

        <div className={styles.coursemain} id="main-content">
          <div className={styles.topbar}>
            <div className={styles.topbarInner}>
              <button type="button" className={styles.railToggle} aria-label={open ? "Close course navigation" : "Open course navigation"} onClick={() => setOpen((o) => !o)}>
                {open ? <X size={16} /> : <Menu size={16} />}
              </button>
              <span className="font-[family-name:var(--font-course-serif)] text-[16px] font-extrabold tracking-[-0.02em]">
                ZENITH<b className="ml-0.5 rounded-[2px] bg-[#8b7cf6] px-1.5 py-px text-[#120f24]">LAB</b>
              </span>
              <span className="ml-auto hidden min-w-0 truncate font-[family-name:var(--font-course-mono)] text-[12px] uppercase tracking-[0.08em] text-[#676e7d] sm:block">
                {courseLabel}
              </span>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
