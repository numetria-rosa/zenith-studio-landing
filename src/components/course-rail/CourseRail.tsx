import Link from "next/link";
import { ChevronDown, Lock } from "lucide-react";
import type { CourseRailData } from "@/lib/course-rail-data";
import styles from "./course-rail.module.css";

/* The "react" render mode's sidebar content — same CourseRailData shape
   every static course's rail (course-rail-template.ts, string-templated
   HTML) already reads from, rendered as JSX using the same class-per-role
   structure and CSS custom properties (course-rail.module.css) as the 4
   static courses' zenith-lab.css, instead of a from-scratch Tailwind
   approximation. Renders only the rail's *inner* content — the
   <aside class="courserail"> wrapper itself lives in LearnShell, matching
   how the static courses' buildRailInnerHtml() only builds what goes
   inside the <aside> shell-splicing already provides. */
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
    if (status === "completed") return styles.done;
    if (status === "current") return styles.current;
    if (status === "locked") return styles.locked;
    return "";
  }

  function moduleRow(m: { id: number; file: string; title: string }) {
    const status = moduleStatus(m.id);
    const isActive = m.id === activeModuleId;
    const locked = status === "locked";
    return (
      <li key={m.id}>
        {locked ? (
          <span className={`${styles.railMod} ${styles.locked}`} aria-disabled="true" title="Unlocks after the previous module">
            <span className={`${styles.rmdot} ${dotClassFor(status)}`} aria-hidden />
            <span className={styles.rmtitle}>{m.title}</span>
            <span className={styles.rmlock} aria-hidden>
              <Lock size={12} />
            </span>
          </span>
        ) : (
          <Link
            href={`${base}/${m.file}`}
            aria-current={isActive ? "page" : undefined}
            className={`${styles.railMod} ${isActive ? styles.active : ""}`}
          >
            <span className={`${styles.rmdot} ${dotClassFor(status)}`} aria-hidden />
            <span className={styles.rmtitle}>{m.title}</span>
          </Link>
        )}
      </li>
    );
  }

  return (
    <>
      <div className={styles.railBrand}>Zenith Lab</div>
      <div className={styles.railTitle}>{data.title}</div>

      <div className={styles.railAccount}>
        <Link href="/lab/dashboard">&larr; Zenith Lab Dashboard</Link>
        <Link href="/profile">My Profile</Link>
      </div>

      <nav className={styles.railNav} aria-label="Course navigation">
        {data.navGroups.map((group) => (
          <details key={group.id} className={styles.railGroup}>
            <summary className={styles.railGroupSummary}>
              {group.label}
              <ChevronDown size={13} aria-hidden />
            </summary>
            <ul>
              {group.items.map(([file, label]) => (
                <li key={file}>
                  <Link href={`${base}/${file}`}>{label}</Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </nav>

      <div className={styles.railModlbl}>Modules</div>
      <div className={styles.railMods}>
        {data.hasModuleZero && (
          <ul>
            <li>
              <Link
                href={`${base}/orientation`}
                aria-current={activeModuleId === 0 ? "page" : undefined}
                className={`${styles.railMod} ${activeModuleId === 0 ? styles.active : ""}`}
              >
                <span className={styles.rmdot} style={{ background: "var(--amber)", borderColor: "var(--amber)" }} aria-hidden />
                <span className={styles.rmtitle}>Orientation</span>
              </Link>
            </li>
          </ul>
        )}

        {data.stages.map((stage) => (
          <div key={stage.label}>
            <div className={styles.railStage}>
              {stage.label} &middot; {stage.title}
            </div>
            <ul>
              {stage.modules.map((id) => {
                const m = data.modules.find((mod) => mod.id === id);
                return m ? moduleRow(m) : null;
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
