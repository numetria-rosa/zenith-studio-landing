import Link from "next/link";
import type { CourseRailData } from "@/lib/course-rail-data";

/* The "react" render mode's sidebar: same CourseRailData shape every static
   course's rail (course-rail-template.ts, string-templated HTML) already
   reads from, rendered as JSX instead. Structurally mirrors the static
   courses' rail exactly: collapsible nav groups (Learn/Practice/etc.) above
   a module list grouped under "STAGE N · TITLE" headers, plus an optional
   Module 0 "Orientation" entry — not a simplified version of that pattern. */
export function CourseRail({
  data,
  courseId,
  activeModuleId,
  moduleStatus,
  basePath,
}: {
  data: CourseRailData;
  courseId: string;
  activeModuleId: number;
  moduleStatus: (moduleId: number) => "completed" | "current" | "upcoming" | "locked";
  /** Link prefix for each module, before "/[file]". Defaults to the real
      guarded route — only overridden by the unauthenticated local preview. */
  basePath?: string;
}) {
  const base = basePath ?? `/lab/${courseId}/learn`;

  function dotClassFor(status: ReturnType<typeof moduleStatus>) {
    if (status === "completed") return "bg-[#4ade95]";
    if (status === "current") return "bg-[#8b7cf6]";
    return "bg-[#333a4c]";
  }

  function moduleRow(m: { id: number; file: string; title: string }) {
    const status = moduleStatus(m.id);
    const isActive = m.id === activeModuleId;
    const locked = status === "locked";
    return (
      <li key={m.id}>
        {locked ? (
          <span
            className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-[#676e7d]"
            aria-disabled="true"
            title="Unlocks after the previous module"
          >
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotClassFor(status)}`} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{m.title}</span>
            <span className="i i-lock flex-shrink-0 text-[11px]" aria-hidden>
              🔒
            </span>
          </span>
        ) : (
          <Link
            href={`${base}/${m.file}`}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition ${
              isActive ? "bg-[#191d26] font-semibold text-[#eeeee7]" : "text-[#9aa0ae] hover:bg-[#151920] hover:text-[#eeeee7]"
            }`}
          >
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotClassFor(status)}`} aria-hidden />
            <span className="min-w-0 flex-1">{m.title}</span>
          </Link>
        )}
      </li>
    );
  }

  return (
    <nav
      aria-label="Course navigation"
      className="flex h-full w-full flex-col gap-1 overflow-y-auto border-r border-[#232838] bg-[#0a0c10] p-4"
    >
      <div className="mb-2 px-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#676e7d]">
        {data.title}
      </div>

      {data.navGroups.map((group) => (
        <details key={group.id} className="group border-b border-[#191d26]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-1 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9aa0ae] hover:text-[#eeeee7]">
            {group.label}
            <span className="text-[#676e7d] transition-transform group-open:rotate-180">▾</span>
          </summary>
          <ul className="flex flex-col gap-0.5 pb-2">
            {group.items.map(([file, label]) => (
              <li key={file}>
                <Link href={`${base}/${file}`} className="block rounded-lg px-3 py-1.5 text-[13px] text-[#9aa0ae] hover:bg-[#151920] hover:text-[#eeeee7]">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ))}

      <div className="mt-3 mb-1 px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#676e7d]">Modules</div>

      {data.hasModuleZero && (
        <ul className="mb-1 flex flex-col gap-0.5">
          <li>
            <Link
              href={`${base}/orientation`}
              aria-current={activeModuleId === 0 ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition ${
                activeModuleId === 0 ? "bg-[#191d26] font-semibold text-[#eeeee7]" : "text-[#9aa0ae] hover:bg-[#151920] hover:text-[#eeeee7]"
              }`}
            >
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#f0b429]" aria-hidden />
              Orientation
            </Link>
          </li>
        </ul>
      )}

      {data.stages.map((stage) => (
        <div key={stage.label} className="mb-1">
          <div className="px-1 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#4b5162]">
            {stage.label} · {stage.title}
          </div>
          <ul className="flex flex-col gap-0.5">
            {stage.modules.map((id) => {
              const m = data.modules.find((mod) => mod.id === id);
              return m ? moduleRow(m) : null;
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
