import { notFound } from "next/navigation";
import localFont from "next/font/local";
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

// Self-hosted (OFL-1.1, @fontsource 5.3.0, latin): see src/lib/fraunces.ts for why not next/font/google.
const sora = localFont({ variable: "--halo-font-display", display: "swap", src: [
    { path: "../../../../fonts/sora/sora-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../../../fonts/sora/sora-latin-600-normal.woff2", weight: "600", style: "normal" },
  ] });
const manrope = localFont({ variable: "--halo-font-body", display: "swap", src: [
    { path: "../../../../fonts/manrope/manrope-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../../../fonts/manrope/manrope-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../../../fonts/manrope/manrope-latin-700-normal.woff2", weight: "700", style: "normal" },
  ] });
const jetbrainsMono = localFont({ variable: "--halo-font-mono", display: "swap", src: [
    { path: "../../../../fonts/jetbrains-mono/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../../../fonts/jetbrains-mono/jetbrains-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ] });

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
