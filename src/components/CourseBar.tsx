import type { ReactNode } from "react";
import Link from "next/link";

/* The sticky top bar from courses/data-science/{syllabus,dashboard}.html —
   amber bottom border, "ZENITH" + amber-badge "LAB" logo, mono uppercase
   tag — reused here so the account pages read as the same product. `brand`
   defaults to "lab" for every existing caller (in-course pages, where that
   wordmark is correct); the shared account dashboard passes "studio" for a
   signed-in user who owns no course, since "ZENITH LAB" is a confusing,
   wrong-feeling brand for someone who only bought an AI Systems service and
   never touched the Lab. */
export function CourseBar({
  tag,
  right,
  brand = "lab",
}: {
  tag: string;
  right?: ReactNode;
  brand?: "lab" | "studio";
}) {
  return (
    <div className="sticky top-0 z-40 border-b-[3px] border-[#f0b429] bg-[#0d0f14]/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-[980px] items-center gap-3.5 px-6 py-3.5">
        <Link
          href="/"
          className="font-[family-name:var(--font-course-serif)] text-base font-extrabold tracking-[-0.02em] text-[#eeeee7]"
        >
          {brand === "lab" ? (
            <>
              ZENITH
              <span className="ml-0.5 rounded-[2px] bg-[#f0b429] px-1.5 py-px text-[#1a1200]">LAB</span>
            </>
          ) : (
            "ZENITH STUDIO"
          )}
        </Link>
        <div className="ml-auto flex items-center gap-5">
          <span className="font-[family-name:var(--font-course-mono)] text-xs uppercase tracking-[0.08em] text-[#676e7d]">
            {tag}
          </span>
          {right}
        </div>
      </div>
    </div>
  );
}
