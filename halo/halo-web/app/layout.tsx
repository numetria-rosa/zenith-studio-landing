import type { Metadata } from "next";
import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import styles from "@/components/shell.module.css";

export const metadata: Metadata = {
  title: "AI Team",
  description: "AI automation team for insurance agencies",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className={styles.shell}>
          <Sidebar />
          {children}
        </div>
      </body>
    </html>
  );
}
