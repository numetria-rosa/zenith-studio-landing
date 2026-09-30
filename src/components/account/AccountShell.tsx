import type { CSSProperties, ReactNode } from "react";
import { AccountDrawer } from "./AccountDrawer";
import { AccountSidebar, type AccountUser } from "./AccountSidebar";

/** Student-space shell: 260px sidebar + main column, mirroring the course app shell. */
export function AccountShell({ user, signOut, children }: { user: AccountUser; signOut: () => Promise<void>; children: ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen bg-void font-sans text-frost antialiased [line-height:normal] [overflow:clip]"
      style={{ "--focus": "#5CC8FF" } as CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[260px] -top-[320px] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(92,200,255,0.16), rgba(5,6,10,0) 62%)" }}
      />
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-7 overflow-y-auto border-r border-white/[0.08] bg-sidebar px-[18px] py-[26px] lg:flex">
        <AccountSidebar user={user} signOut={signOut} />
      </aside>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="px-5 pt-5 lg:hidden">
          <AccountDrawer user={user} signOut={signOut} />
        </div>
        <main className="relative flex flex-1 flex-col gap-8 px-5 pb-14 pt-6 lg:px-14 lg:pb-14 lg:pt-12">{children}</main>
      </div>
    </div>
  );
}

/** Mono eyebrow + 52px H1 + Mist subtitle, shared by both screens. */
export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end lg:gap-8">
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-cyan">{eyebrow}</span>
        <h1 className="m-0 text-[36px] font-medium leading-[1.02] tracking-[-0.045em] lg:text-[52px]">{title}</h1>
        <p className="m-0 max-w-[620px] text-[17px] leading-[1.6] text-mist">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
