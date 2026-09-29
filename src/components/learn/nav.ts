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

export type FinalKey = "agents" | "clients" | "revenue" | "outreach" | "sell-plan";

/** The Final module dropdown: the five sellable agents and the kit for selling them. */
export const FINAL_ITEMS: { key: FinalKey; label: string; icon: IconName; href: string }[] = [
  { key: "agents", label: "Agents", icon: "grid", href: `${LEARN_BASE}/final/agents` },
  { key: "clients", label: "Clients", icon: "user", href: `${LEARN_BASE}/final/clients` },
  { key: "revenue", label: "Revenue", icon: "trend", href: `${LEARN_BASE}/final/revenue` },
  { key: "outreach", label: "Outreach", icon: "send", href: `${LEARN_BASE}/final/outreach` },
  { key: "sell-plan", label: "Sell plan", icon: "file", href: `${LEARN_BASE}/final/sell-plan` },
];

/** The Final module sub-item a pathname belongs to, or null outside the module. */
export function activeFinalKey(pathname: string): FinalKey | null {
  const rest = pathname.replace(LEARN_BASE, "").replace(/^\/|\/$/g, "").split("/");
  return rest[0] === "final" ? (FINAL_ITEMS.find((i) => i.key === rest[1])?.key ?? "agents") : null;
}

/** Which sidebar item a pathname belongs to. Module sub-pages light up the item for their content type. */
export function activeNavKey(pathname: string): NavKey | null {
  const rest = pathname.replace(LEARN_BASE, "").replace(/^\/|\/$/g, "");
  if (rest === "") return "dashboard";
  const [head, , third] = rest.split("/");
  if (head === "final") return null; // the Final module dropdown owns its own highlight
  if (head === "modules") {
    if (third === "quiz") return "quizzes";
    if (third === "project") return "projects";
    if (third === "cheat-sheet") return "cheat-sheets";
    return "syllabus";
  }
  return NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === head)?.key ?? null;
}
