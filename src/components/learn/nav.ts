import type { IconName } from "@/components/obsidian/Icon";

export const LEARN_BASE = "/lab/ai-engineering/learn";

export type NavKey =
  | "dashboard" | "syllabus" | "roadmap" | "cheat-sheets" | "python"
  | "quizzes" | "challenges" | "projects" | "final-assessment" | "portfolio" | "career";

export type NavItem = { key: NavKey; label: string; icon: IconName; href: (currentModule: number) => string };

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Learn",
    items: [
      { key: "dashboard", label: "Dashboard", icon: "home", href: () => LEARN_BASE },
      { key: "syllabus", label: "Syllabus", icon: "list", href: (m) => `${LEARN_BASE}/modules/${m}` },
      { key: "roadmap", label: "Learning Roadmap", icon: "map", href: () => `${LEARN_BASE}/roadmap` },
      { key: "cheat-sheets", label: "Cheat Sheets", icon: "sheet", href: () => `${LEARN_BASE}/cheat-sheets` },
      { key: "python", label: "Python Foundations", icon: "code", href: () => `${LEARN_BASE}/python` },
    ],
  },
  {
    label: "Practice",
    items: [
      { key: "quizzes", label: "Quiz Center", icon: "quiz", href: () => `${LEARN_BASE}/quizzes` },
      { key: "challenges", label: "Challenges", icon: "flag", href: () => `${LEARN_BASE}/challenges` },
    ],
  },
  { label: "Build", items: [{ key: "projects", label: "Projects", icon: "box", href: () => `${LEARN_BASE}/projects` }] },
  {
    label: "Evidence",
    items: [
      { key: "final-assessment", label: "Final Assessment", icon: "award", href: () => `${LEARN_BASE}/final-assessment` },
      { key: "portfolio", label: "My Portfolio", icon: "folder", href: () => `${LEARN_BASE}/portfolio` },
      { key: "career", label: "Career Path", icon: "path", href: () => `${LEARN_BASE}/career` },
    ],
  },
];

/** Which sidebar item a pathname belongs to. Module sub-pages light up the item for their content type. */
export function activeNavKey(pathname: string): NavKey | null {
  const rest = pathname.replace(LEARN_BASE, "").replace(/^\/|\/$/g, "");
  if (rest === "") return "dashboard";
  const [head, , third] = rest.split("/");
  if (head === "modules") {
    if (third === "quiz") return "quizzes";
    if (third === "project") return "projects";
    if (third === "cheat-sheet") return "cheat-sheets";
    return "syllabus";
  }
  return NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === head)?.key ?? null;
}
