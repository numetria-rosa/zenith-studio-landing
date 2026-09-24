import { notFound } from "next/navigation";
import { Sora, Manrope, JetBrains_Mono } from "next/font/google";
import { requireAdmin } from "@/lib/admin";
import { Sidebar } from "./_halo/Sidebar";
import tokens from "./_halo/tokens.module.css";
import shell from "./_halo/shell.module.css";

/* Client dashboard redesign, Phase 1 (visual pass, sample data - see
   sample-data.ts). Deliberately isolated at /lab/dashboard/preview rather
   than replacing the live /services/dashboard/[clientId] real
   customers use today, and admin-gated since it's an internal design
   review, not something a real client should stumble into before it's
   wired to their own data. Fonts and design tokens are scoped to
   .haloShell (tokens.module.css), never touching :root or <body>, so
   nothing here can leak into the rest of the site - same containment
   approach as the public/demos/*.html pages.

   PREVIEW_DASHBOARD_BYPASS lets you view this as a client would (no admin
   login) on your own machine: set PREVIEW_DASHBOARD_BYPASS=1 in your local
   .env.local (gitignored, never set on Vercel) and restart `next dev`. */

const sora = Sora({ subsets: ["latin"], weight: ["400", "600"], variable: "--halo-font-display" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--halo-font-body" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--halo-font-mono" });

export default async function DashboardPreviewLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin && process.env.PREVIEW_DASHBOARD_BYPASS !== "1") notFound();

  return (
    <div className={`${tokens.haloShell} ${sora.variable} ${manrope.variable} ${jetbrainsMono.variable}`}>
      <div className={shell.shell}>
        <Sidebar />
        {children}
      </div>
    </div>
  );
}
