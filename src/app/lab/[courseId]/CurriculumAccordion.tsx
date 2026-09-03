import { Clock } from "lucide-react";
import { fraunces } from "@/lib/fonts";

type Module = { title: string; description: string };
type Stage = { label: string; title: string; moduleTitles: string[] };

// Was an accordion (title only, description hidden behind a click) — a
// prospective buyer skimming this page has no other way to judge how much
// is actually in the course, so hiding the one thing that proves it was
// working against the point of the page. Everything renders open, always;
// no client JS needed for a static list, so this is a plain server
// component now, not "use client".
function ModuleRow({ index, mod, minutes }: { index: number; mod: Module; minutes?: number }) {
  return (
    <li className="rounded-xl border px-4 py-3.5" style={{ borderColor: "var(--bd)", background: "var(--card)" }}>
      <div className="flex items-center gap-3">
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
          style={{
            background: "color-mix(in srgb, var(--accent) 16%, transparent)",
            color: "var(--accent)",
            fontFamily: "var(--font-course-mono), monospace",
          }}
        >
          {index}
        </span>
        <span
          className={`${fraunces.className} flex-1 text-sm font-semibold`}
          style={{ fontFamily: "var(--font-course-serif), serif" }}
        >
          {mod.title}
        </span>
        {typeof minutes === "number" && (
          <span
            className="flex flex-shrink-0 items-center gap-1 text-xs"
            style={{ color: "var(--mut2)", fontFamily: "var(--font-course-mono), monospace" }}
          >
            <Clock className="h-3 w-3" aria-hidden />
            {minutes}m
          </span>
        )}
      </div>
      <div className="mt-2 pl-[40px] text-sm leading-6" style={{ color: "var(--mut)" }}>
        {mod.description}
      </div>
    </li>
  );
}

export function CurriculumAccordion({
  modules,
  stages,
  moduleMinutes,
}: {
  modules: Module[];
  stages?: Stage[];
  moduleMinutes?: Record<string, number>;
}) {
  // Number modules sequentially through the curriculum array (0 =
  // Orientation when present) rather than by the in-app module id — the
  // in-app id can jump around (AISE inserts its prompt-engineering module
  // between 6 and 7 in stage order, so its real id is 14), which would be
  // confusing outside the app. "The Nth thing you'll do" stays honest and
  // matches the order these modules actually appear in.
  const indexOf = new Map(modules.map((m, i) => [m.title, i]));

  function renderRow(m: Module) {
    const i = indexOf.get(m.title) ?? 0;
    return <ModuleRow key={m.title} index={i} mod={m} minutes={moduleMinutes?.[m.title]} />;
  }

  if (!stages || stages.length === 0) {
    // No stage data for this course (shouldn't happen for a published
    // course, but degrade to the flat list rather than render nothing).
    return <ol className="grid gap-2.5">{modules.map(renderRow)}</ol>;
  }

  // Same grouping the real in-course sidebar (course-rail.js) shows: any
  // module not listed under a stage (Orientation) renders ungrouped above
  // the stages, exactly like the sidebar's own "0 Orientation" entry.
  const grouped = new Set(stages.flatMap((s) => s.moduleTitles));
  const ungrouped = modules.filter((m) => !grouped.has(m.title));

  return (
    <div className="grid gap-6">
      {ungrouped.length > 0 && <ol className="grid gap-2.5">{ungrouped.map(renderRow)}</ol>}
      {stages.map((stage) => {
        const stageModules = stage.moduleTitles
          .map((title) => modules.find((m) => m.title === title))
          .filter((m): m is Module => Boolean(m));
        if (stageModules.length === 0) return null;
        return (
          <div key={stage.label}>
            <div
              className="mb-2.5 text-xs font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--accent)", fontFamily: "var(--font-course-mono), monospace" }}
            >
              {stage.label} · {stage.title}
            </div>
            <ol className="grid gap-2.5">{stageModules.map(renderRow)}</ol>
          </div>
        );
      })}
    </div>
  );
}
