import type { CSSProperties, ReactNode } from "react";
import { MobileDrawer } from "./MobileDrawer";
import { SidebarContent, type SidebarUser } from "./SidebarContent";

/** Sidebar (260px) + main column, shared by every course-app screen. Cyan is this surface's one glow colour. */
export function AppShell({
  currentModule,
  percent,
  user,
  children,
}: {
  currentModule: number;
  percent: number;
  user: SidebarUser;
  children: ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-screen bg-void font-sans text-frost antialiased [line-height:normal] [overflow:clip] print:block print:min-h-0 print:bg-white"
      style={{ "--focus": "#5CC8FF" } as CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[260px] -top-[320px] h-[900px] w-[900px] rounded-full print:hidden"
        style={{ background: "radial-gradient(circle, rgba(92,200,255,0.16), rgba(5,6,10,0) 62%)" }}
      />
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-[26px] overflow-y-auto border-r border-white/[0.08] bg-sidebar px-[18px] py-[26px] lg:flex print:hidden">
        <SidebarContent currentModule={currentModule} percent={percent} user={user} />
      </aside>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="px-5 pt-5 lg:hidden print:hidden">
          <MobileDrawer currentModule={currentModule} percent={percent} user={user} />
        </div>
        <main className="relative flex flex-1 flex-col gap-9 px-5 pb-14 pt-6 lg:px-14 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}
