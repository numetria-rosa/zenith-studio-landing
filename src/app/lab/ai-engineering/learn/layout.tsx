import type { Metadata } from "next";
import { AppShell } from "@/components/learn/AppShell";
import { LEARN_BASE } from "@/components/learn/nav";
import { getAllModules } from "@/lib/aie/content";
import { courseProgress, currentModuleNumber, getCompletedLessons } from "@/lib/aie/progress";
import { requireEnrollment } from "@/lib/require-enrollment";

export const metadata: Metadata = { title: "AI Engineering | Zenith Lab", robots: { index: false, follow: false } };

function initials(name: string) {
  return name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
}

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const { userId, name, email } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const [modules, done] = await Promise.all([getAllModules(), getCompletedLessons(userId)]);
  const displayName = name ?? email ?? "Student";

  return (
    <AppShell
      currentModule={currentModuleNumber(modules, done)}
      percent={courseProgress(modules, done).percent}
      user={{ name: displayName, initials: initials(displayName) }}
    >
      {children}
    </AppShell>
  );
}
